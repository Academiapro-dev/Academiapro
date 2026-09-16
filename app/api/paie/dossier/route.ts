import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// LA GESTION DE LA PAIE — 15/09/2026
//
// Une seule route pour tout ce qui n est pas le calcul : lister les
// contrats, ajouter un salarie, ouvrir un contrat, saisir les heures du
// mois, lister les bulletins.
//
// 🚨 LE CALCUL N EST PAS ICI. Il vit dans /api/paie/calculer, et nulle part
// ailleurs. Deux calculs a deux endroits finissent toujours par diverger —
// et sur un bulletin, diverger veut dire un redressement.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function propre(v: any): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t.length > 0 ? t : null;
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  let c: any = {};
  try { c = await req.json(); } catch { c = {}; }
  const action = String(c.action || "").trim();

  try {
    // ---- LISTER LES CONTRATS ----
    if (action === "contrats") {
      const { data, error } = await supabase
        .from("paie_contrats")
        .select("*, paie_salaries(nom, prenom)")
        .eq("statut", "actif")
        .order("date_debut", { ascending: false })
        .limit(200);

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

      // Les societes, pour le choix a la creation.
      const { data: societes } = await supabase
        .from("compta_societes")
        .select("id, tenant_id, raison_sociale, effectif, siret")
        .order("raison_sociale");

      return NextResponse.json({ success: true, contrats: data || [], societes: societes || [] });
    }

    // ---- CREER UN SALARIE ET SON CONTRAT ----
    //
    // ⚠️ LES DEUX SE CREENT ENSEMBLE : un salarie sans contrat n a aucun
    // usage, et laisser deux ecrans separes obligerait a revenir en arriere.
    if (action === "nouveau") {
      const societeId = propre(c.societe_id);
      if (!societeId) return NextResponse.json({ erreur: "choisir une societe" }, { status: 400 });

      const { data: soc } = await supabase
        .from("compta_societes").select("tenant_id").eq("id", societeId).maybeSingle();
      if (!soc) return NextResponse.json({ erreur: "societe introuvable" }, { status: 404 });

      const nom = propre(c.nom);
      const prenom = propre(c.prenom);
      if (!nom || !prenom) {
        return NextResponse.json({
          erreur: "le nom et le prenom du salarie sont obligatoires",
        }, { status: 400 });
      }

      const { data: sal, error: eSal } = await supabase
        .from("paie_salaries")
        .insert({
          tenant_id: soc.tenant_id, societe_id: societeId,
          nom: nom.toUpperCase(), prenom: prenom,
          sexe: propre(c.sexe), date_naissance: propre(c.date_naissance),
          numero_secu: propre(c.numero_secu),
          adresse: propre(c.adresse), code_postal: propre(c.code_postal),
          ville: propre(c.ville), email: propre(c.email),
        })
        .select().maybeSingle();

      if (eSal) return NextResponse.json({ erreur: eSal.message }, { status: 500 });

      const type = propre(c.type_contrat) || "mission";

      // 🚨 UN CONTRAT DE MISSION SANS ENTREPRISE UTILISATRICE NI MOTIF DE
      // RECOURS EST REQUALIFIABLE EN CDI par le conseil de prud hommes. On
      // refuse a la saisie plutot que de le signaler apres coup — meme
      // regle que l irrevocabilite des mandats immobiliers.
      if (type === "mission") {
        if (!propre(c.eu_raison_sociale)) {
          return NextResponse.json({
            erreur: "l entreprise utilisatrice est obligatoire sur un contrat de mission : "
              + "sans elle, le contrat est requalifiable en CDI.",
          }, { status: 400 });
        }
        if (!propre(c.motif_recours)) {
          return NextResponse.json({
            erreur: "le motif de recours est obligatoire. Les six motifs legaux : "
              + "remplacement d un salarie absent, accroissement temporaire d activite, "
              + "emploi saisonnier, usage constant, remplacement d un chef d entreprise, "
              + "complement de formation.",
          }, { status: 400 });
        }
      }

      const { data: ctr, error: eCtr } = await supabase
        .from("paie_contrats")
        .insert({
          tenant_id: soc.tenant_id, societe_id: societeId, salarie_id: sal.id,
          type_contrat: type,
          date_debut: propre(c.date_debut), date_fin: propre(c.date_fin),
          intitule_poste: propre(c.intitule_poste) || "A preciser",
          categorie: propre(c.categorie) || "non_cadre",
          idcc: c.idcc ? Number(c.idcc) : null,
          salaire_horaire: c.salaire_horaire ? Number(c.salaire_horaire) : null,
          salaire_mensuel: c.salaire_mensuel ? Number(c.salaire_mensuel) : null,
          duree_hebdo: c.duree_hebdo ? Number(c.duree_hebdo) : 35,
          eu_raison_sociale: propre(c.eu_raison_sociale),
          eu_siret: propre(c.eu_siret),
          eu_adresse: propre(c.eu_adresse),
          motif_recours: propre(c.motif_recours),
          motif_detail: propre(c.motif_detail),
          poste_chez_eu: propre(c.poste_chez_eu),
          ifm_due: c.ifm_due === false ? false : true,
        })
        .select().maybeSingle();

      if (eCtr) return NextResponse.json({ erreur: eCtr.message }, { status: 500 });

      return NextResponse.json({
        success: true, contrat_id: ctr.id,
        message: prenom + " " + nom.toUpperCase() + " est enregistre avec son contrat.",
      });
    }

    // ---- LES ELEMENTS D UN MOIS ----
    if (action === "elements") {
      const { data, error } = await supabase
        .from("paie_elements")
        .select("*")
        .eq("contrat_id", propre(c.contrat_id))
        .eq("periode", propre(c.periode))
        .order("cree_le");

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      return NextResponse.json({ success: true, elements: data || [] });
    }

    // ---- AJOUTER UN ELEMENT ----
    if (action === "ajouter_element") {
      const contratId = propre(c.contrat_id);
      const periode = propre(c.periode);
      if (!contratId || !periode) {
        return NextResponse.json({ erreur: "contrat et periode obligatoires" }, { status: 400 });
      }

      const { data: ctr } = await supabase
        .from("paie_contrats").select("tenant_id, societe_id")
        .eq("id", contratId).maybeSingle();
      if (!ctr) return NextResponse.json({ erreur: "contrat introuvable" }, { status: 404 });

      // ⚠️ LE MONTANT SE CALCULE quand quantite et taux sont donnes : on ne
      // fait pas taper ce que la machine sait faire.
      let montant = c.montant ? Number(c.montant) : 0;
      const q = c.quantite ? Number(c.quantite) : null;
      const t = c.taux ? Number(c.taux) : null;
      if (!montant && q !== null && t !== null) montant = Math.round(q * t * 100) / 100;

      const { error } = await supabase.from("paie_elements").insert({
        tenant_id: ctr.tenant_id, societe_id: ctr.societe_id,
        contrat_id: contratId, periode: periode,
        type_element: propre(c.type_element) || "prime",
        libelle: propre(c.libelle) || "Element",
        quantite: q, taux: t, montant: montant,
        soumis_cotisations: c.soumis_cotisations === false ? false : true,
      });

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Element ajoute." });
    }

    // ---- SUPPRIMER UN ELEMENT ----
    //
    // ⚠️ UN ELEMENT SE SUPPRIME TANT QUE LE BULLETIN N EST PAS EMIS. Apres,
    // c est un bulletin rectificatif qu il faut.
    if (action === "supprimer_element") {
      const { error } = await supabase
        .from("paie_elements").delete().eq("id", propre(c.id));
      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Element retire." });
    }

    // ---- LES BULLETINS D UN CONTRAT ----
    if (action === "bulletins") {
      const { data, error } = await supabase
        .from("paie_bulletins")
        .select("id, numero, periode, brut, net_a_payer, cout_employeur, statut, chemin_pdf, emis_le")
        .eq("contrat_id", propre(c.contrat_id))
        .order("periode", { ascending: false });

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      return NextResponse.json({ success: true, bulletins: data || [] });
    }

    // ---- OUVRIR UN BULLETIN ----
    if (action === "voir_bulletin") {
      const { data: b } = await supabase
        .from("paie_bulletins").select("chemin_pdf")
        .eq("id", propre(c.id)).maybeSingle();

      if (!b || !b.chemin_pdf) {
        return NextResponse.json({ erreur: "aucun PDF pour ce bulletin" }, { status: 404 });
      }

      const { data: signe } = await supabase.storage
        .from("documents-signes").createSignedUrl(b.chemin_pdf, 3600);

      if (!signe) return NextResponse.json({ erreur: "lien impossible" }, { status: 500 });
      return NextResponse.json({ success: true, url: signe.signedUrl });
    }

    // ---- EMETTRE UN BULLETIN ----
    //
    // 🚨 C EST LE POINT DE NON-RETOUR. Un bulletin emis ne se modifie plus,
    // ne repasse jamais en brouillon, et ne se supprime pas. Il se corrige
    // par un rectificatif. Meme regle que les mandats immobiliers.
    if (action === "emettre") {
      const { data: b } = await supabase
        .from("paie_bulletins").select("id, numero, statut")
        .eq("id", propre(c.id)).maybeSingle();

      if (!b) return NextResponse.json({ erreur: "bulletin introuvable" }, { status: 404 });
      if (b.statut === "emis") {
        return NextResponse.json({
          erreur: "le bulletin " + b.numero + " est deja emis. Pour le corriger, "
            + "il faut etablir un bulletin rectificatif.",
        }, { status: 400 });
      }

      const { error } = await supabase
        .from("paie_bulletins")
        .update({ statut: "emis", emis_le: new Date().toISOString() })
        .eq("id", b.id)
        .eq("statut", "brouillon");

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

      // ═══════════════════════════════════════════════════════════════
      // 🚨 L ACQUISITION DES CONGES SE POSE ICI, A L EMISSION — PAS AU
      // CALCUL.
      //
      // POURQUOI : le calcul peut etre relance dix fois avant que le
      // bulletin soit juste. Si l acquisition etait posee a chaque calcul,
      // le salarie aurait dix fois ses droits. L emission, elle, n arrive
      // qu une fois : c est le seul moment sur.
      //
      // ⚠️ SEUL LE CDI EST CONCERNE : sur une mission ou un CDD, les conges
      // sont compenses par l ICCP, pas acquis.
      // ⚠️ ON VERIFIE QU IL N Y A PAS DEJA UNE ACQUISITION POUR CE MOIS :
      // un bulletin rectificatif ne doit pas redonner les jours.
      // ═══════════════════════════════════════════════════════════════
      let congesPoses = false;

      const { data: bull } = await supabase
        .from("paie_bulletins")
        .select("periode, tenant_id, societe_id, contrat_id, paie_contrats(type_contrat)")
        .eq("id", b.id)
        .maybeSingle();

      if (bull && bull.paie_contrats
          && (bull.paie_contrats as any).type_contrat === "cdi") {

        const p = String(bull.periode);
        const annee = Number(p.slice(0, 4));
        const mois = Number(p.slice(5, 7));
        const debutRef = (mois >= 6 ? annee : annee - 1) + "-06-01";

        const { data: deja } = await supabase
          .from("paie_conges")
          .select("id")
          .eq("contrat_id", bull.contrat_id)
          .eq("periode", p)
          .eq("type_mouvement", "acquisition")
          .maybeSingle();

        if (!deja) {
          // 🚨 2,5 JOURS OUVRABLES PAR MOIS TRAVAILLE. Sur une annee
          // complete : 30 jours ouvrables, soit cinq semaines.
          const { error: eConges } = await supabase.from("paie_conges").insert({
            tenant_id: bull.tenant_id,
            societe_id: bull.societe_id,
            contrat_id: bull.contrat_id,
            periode_ref: debutRef,
            unite: "ouvrables",
            periode: p,
            type_mouvement: "acquisition",
            jours: 2.5,
            bulletin_id: b.id,
            notes: "Acquisition automatique a l emission du bulletin " + b.numero,
          });
          // ⚠️ L ERREUR EST REMONTEE, pas avalee : des droits a conges qui
          // ne s inscrivent pas se decouvrent des mois plus tard.
          if (!eConges) congesPoses = true;
        }
      }

      return NextResponse.json({
        success: true,
        conges_acquis: congesPoses ? 2.5 : 0,
        message: "Bulletin " + b.numero + " emis. Il ne peut plus etre modifie."
          + (congesPoses ? " 2,5 jours de conges ont ete acquis." : ""),
      });
    }

    return NextResponse.json({ erreur: "action inconnue : " + action }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ erreur: String(e) }, { status: 500 });
  }
}
