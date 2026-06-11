// app/api/mr-juridique/documents/generer/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// TYPES & INTERFACES
// ============================================================

type CategorieDocument =
  | "FORMATION"
  | "COMMERCIAL"
  | "JURIDIQUE"
  | "HOLDING"
  | "FISCAL"
  | "INPI";

type TypeDocument =
  // FORMATION
  | "contrat_formation"
  | "convention_entreprise"
  | "attestation_presence"
  | "certificat_formation"
  | "reglement_interieur"
  | "livret_accueil"
  // COMMERCIAL
  | "devis"
  | "bon_commande"
  | "facture"
  | "relance_impayes"
  | "mise_en_demeure"
  // JURIDIQUE
  | "nda_confidentialite"
  | "contrat_prestataire"
  | "contrat_formateur"
  | "cgv"
  | "mentions_legales"
  | "politique_confidentialite_rgpd"
  // HOLDING
  | "operating_agreement_llc"
  | "statuts_sas"
  | "pacte_actionnaires"
  | "convention_licence_marque"
  | "convention_services_tech"
  | "convention_management_fees"
  | "documentation_prix_transfert"
  // FISCAL
  | "declaration_tva"
  | "declaration_urssaf"
  | "acompte_is"
  | "declaration_ir"
  | "courrier_administration_fiscale"
  // INPI
  | "depot_marque_3_classes"
  | "renouvellement_marque"
  | "opposition_marque";

type NiveauSignature = "simple" | "avance" | "qualifie";

interface DocumentGenererRequest {
  type: TypeDocument;
  categorie: CategorieDocument;
  donnees: Record<string, unknown>;
  options?: {
    langue?: "fr" | "en";
    format?: "pdf" | "docx";
    signature_requise?: boolean;
    niveau_signature?: NiveauSignature;
    envoi_automatique?: boolean;
    destinataires?: string[];
  };
  metadata?: {
    client_id?: string;
    projet_id?: string;
    tags?: string[];
  };
}

interface DocumentGenereResponse {
  succes: boolean;
  document_id: string;
  numero_sequentiel: string;
  type: TypeDocument;
  categorie: CategorieDocument;
  contenu_genere: string;
  pdf_url?: string;
  pdf_base64?: string;
  statut: "genere" | "en_attente_signature" | "signe" | "envoye" | "archive";
  created_at: string;
  expires_at?: string;
  signature_config?: {
    niveau: NiveauSignature;
    yousign_procedure_id?: string;
  };
  erreur?: string;
}

// ============================================================
// PROMPTS CLAUDE PAR TYPE DE DOCUMENT
// ============================================================

const PROMPTS_DOCUMENTS: Record<TypeDocument, string> = {
  // FORMATION
  contrat_formation: `Tu es un juriste expert en droit de la formation professionnelle française.
Génère un contrat de formation professionnelle complet et conforme à la loi du 5 septembre 2018 
"Pour la liberté de choisir son avenir professionnel" et aux articles L6353-1 et suivants du Code du travail.
Le contrat doit inclure : identification des parties, objet de la formation, programme détaillé, 
durée et calendrier, modalités pédagogiques, prix et modalités de paiement, conditions de résiliation,
droits et obligations des parties, attestation de fin de formation.`,

  convention_entreprise: `Tu es un juriste spécialisé en formation professionnelle.
Génère une convention de formation professionnelle conforme à l'article L6353-1 du Code du travail
entre un organisme de formation et une entreprise. Inclure : SIRET des parties, objet, 
programme de formation, durée, modalités d'évaluation, financement OPCO si applicable,
clause de dédit-formation, conditions de report/annulation.`,

  attestation_presence: `Tu es un expert en documentation de formation.
Génère une attestation de présence officielle pour une session de formation.
Inclure : nom/prénom stagiaire, raison sociale organisme, intitulé formation, dates, 
durée en heures, signature formateur, cachet organisme, mention légale Article L6353-1.`,

  certificat_formation: `Tu es un expert en certification professionnelle.
Génère un certificat de formation professionnelle avec : identification du bénéficiaire,
programme suivi, compétences acquises, évaluation finale, date de délivrance,
numéro de certificat, signature direction, conformité Qualiopi si applicable.`,

  reglement_interieur: `Tu es un juriste expert en droit de la formation.
Génère un règlement intérieur d'organisme de formation conforme à l'article L6352-3 du Code du travail.
Inclure : représentation des stagiaires, discipline, hygiène et sécurité, 
sanctions disciplinaires, droits des stagiaires, réclamations, procédures d'urgence.`,

  livret_accueil: `Tu es un expert en ingénierie pédagogique.
Génère un livret d'accueil stagiaire complet incluant : présentation de l'organisme,
règles de vie, planning de formation, ressources disponibles, contacts utiles,
évaluation de la formation, suite du parcours, informations pratiques.`,

  // COMMERCIAL
  devis: `Tu es un expert en rédaction commerciale et droit des contrats.
Génère un devis professionnel conforme aux obligations légales françaises incluant :
numéro de devis, date de validité (30 jours), identification complète des parties,
description détaillée des prestations, prix HT/TTC, TVA applicable, conditions de paiement,
délais d'exécution, conditions générales de vente résumées, mention acceptation.`,

  bon_commande: `Tu es un expert en droit commercial français.
Génère un bon de commande professionnel avec : numéro BC, date, références parties,
description précise des produits/services commandés, quantités, prix unitaires HT/TTC,
TVA, total, conditions de livraison, conditions de paiement, signatures obligatoires.`,

  facture: `Tu es un expert-comptable et juriste fiscal.
Génère une facture conforme aux articles 289 et 289 bis du CGI incluant :
numéro séquentiel unique, date d'émission, date de livraison/prestation, 
identification complète parties (SIRET, TVA intracommunautaire), description détaillée,
prix HT, taux et montant TVA, prix TTC, conditions de paiement, pénalités de retard 
(taux BCE + 10%), indemnité forfaitaire recouvrement 40€, mention auto-liquidation si applicable.`,

  relance_impayes: `Tu es un juriste spécialisé en recouvrement de créances.
Génère une lettre de relance amiable pour impayé incluant : référence facture impayée,
montant dû, date d'échéance dépassée, calcul pénalités de retard, indemnité forfaitaire 40€,
délai de règlement accordé (8 jours), coordonnées bancaires, avertissement procédure judiciaire,
ton professionnel mais ferme.`,

  mise_en_demeure: `Tu es un avocat spécialisé en droit des affaires.
Génère une mise en demeure formelle avant action judiciaire avec : identification précise créance,
montant total réclamé (capital + intérêts + frais), mise en demeure de régler sous 8 jours,
mention voies de recours (injonction de payer, référé provision, procédure au fond),
envoi par LRAR, réserve de tous droits, conformité article 1344 du Code civil.`,

  // JURIDIQUE
  nda_confidentialite: `Tu es un avocat expert en propriété intellectuelle et contrats.
Génère un accord de confidentialité (NDA) bilatéral complet conforme au droit français incluant :
définition précise des informations confidentielles, obligations de confidentialité,
durée de l'accord (3-5 ans recommandé), exceptions à la confidentialité, 
propriété intellectuelle, retour des documents, clause pénale, juridiction compétente (Paris),
conformité RGPD pour les données personnelles partagées.`,

  contrat_prestataire: `Tu es un juriste expert en droit des contrats commerciaux.
Génère un contrat de prestation de services complet incluant : objet précis de la mission,
obligations du prestataire, obligations du client, calendrier et livrables, 
prix et modalités de paiement, propriété intellectuelle des livrables, clause de non-concurrence,
responsabilité et assurance, résiliation, force majeure, clause de confidentialité,
loi applicable (droit français), juridiction (TGI Paris).`,

  contrat_formateur: `Tu es un juriste spécialisé en droit de la formation et du travail.
Génère un contrat de formateur vacataire/indépendant conforme au droit français incluant :
qualification du formateur, modules confiés, tarif horaire/journalier, 
obligations pédagogiques, propriété des supports, clause de non-débauchage,
conformité qualification CPS/SIRET, obligations déclaratives, assurance RC Pro.`,

  cgv: `Tu es un avocat expert en droit de la consommation et B2B.
Génère des Conditions Générales de Vente complètes et conformes aux articles L441-1 et suivants 
du Code de commerce incluant : champ d'application, commandes, prix, paiement, livraison,
transfert de propriété et des risques, garanties légales et contractuelles, 
droit de rétractation (si B2C), responsabilité, force majeure, propriété intellectuelle,
données personnelles (RGPD), résolution des litiges, médiation de la consommation,
droit applicable, nullité partielle.`,

  mentions_legales: `Tu es un juriste expert en droit du numérique (LCEN).
Génère des mentions légales complètes conformes à la loi n°2004-575 du 21 juin 2004 (LCEN)
incluant : éditeur du site (personne physique/morale, SIRET, RCS, capital social),
directeur de publication, hébergeur, propriété intellectuelle, limitation de responsabilité,
cookies et traceurs (RGPD), liens hypertextes, droit applicable, juridiction.`,

  politique_confidentialite_rgpd: `Tu es un délégué à la protection des données (DPO) expert.
Génère une politique de confidentialité complète et conforme au RGPD (Règlement UE 2016/679)
et à la loi Informatique et Libertés modifiée incluant : responsable de traitement, 
finalités et bases légales, catégories de données, durées de conservation,
destinataires et transferts hors UE, droits des personnes (accès, rectification, effacement,
portabilité, opposition, limitation), cookies, DPO contact, CNIL réclamation,
mise à jour de la politique.`,

  // HOLDING
  operating_agreement_llc: `Tu es un avocat américain et français expert en droit des sociétés international.
Génère un Operating Agreement LLC conforme au droit de l'État du Delaware incluant :
formation et duration, membres et pourcentages de participation, capital contributions,
allocations et distributions, management (member-managed vs manager-managed),
voting rights, transfer restrictions, buy-sell provisions, dissolution procedures,
tax elections (disregarded entity/partnership/S-Corp/C-Corp), 
confidentiality, governing law (Delaware).`,

  statuts_sas: `Tu es un avocat expert en droit des sociétés français.
Génère des statuts de SAS (Société par Actions Simplifiée) complets conformes aux articles 
L227-1 et suivants du Code de commerce incluant : dénomination, objet social, siège, durée (99 ans),
capital social, actions et cessions, direction (Président, DG), assemblées générales,
décisions collectives, commissaires aux comptes si applicable, exercice social,
affectation des résultats, dissolution/liquidation, clauses d'agrément et de préemption.`,

  pacte_actionnaires: `Tu es un avocat M&A expert en structuration actionnariale.
Génère un pacte d'actionnaires complet pour une SAS incluant : parties et définitions,
gouvernance et droits de vote, information des actionnaires, clauses de préemption,
droit de suite (tag-along), droit d'entraînement (drag-along), clause de ratchet,
anti-dilution, sortie des actionnaires (IPO, trade sale), non-concurrence post-sortie,
confidentialité, durée et résiliation, arbitrage (CCI Paris).`,

  convention_licence_marque: `Tu es un juriste expert en propriété intellectuelle et droit des marques.
Génère une convention de licence de marque conforme au Code de la propriété intellectuelle
incluant : définition de la marque licenciée (numéro INPI), territoire, durée,
exclusivité/non-exclusivité, produits/services couverts, redevances (royalties),
contrôle qualité, obligations du licencié, rapports d'activité, fin de licence,
transmission à des tiers, action en contrefaçon.`,

  convention_services_tech: `Tu es un juriste expert en droit des technologies et SaaS.
Génère une convention de services technologiques entre entités d'un groupe incluant :
description précise des services IT/SaaS fournis, SLA (disponibilité 99.9%, support),
tarification et refacturation (prix de pleine concurrence), propriété intellectuelle,
protection des données (DPA RGPD), sécurité et confidentialité, durée et renouvellement,
résiliation et transition, responsabilité et assurance.`,

  convention_management_fees: `Tu es un avocat fiscaliste expert en prix de transfert et droit des sociétés.
Génère une convention de management fees conforme aux exigences fiscales françaises
(article 39 CGI, doctrine administrative) incluant : liste détaillée des services rendus
(direction générale, finance, RH, juridique, IT, commercial), méthode de prix de transfert
(cost plus recommandé), pourcentage de refacturation justifié, facturation mensuelle,
documentation justificative, conformité OCDE, clause de révision prix.`,

  documentation_prix_transfert: `Tu es un expert en prix de transfert et fisc