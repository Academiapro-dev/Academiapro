# Mr. Compliance — Cartographie cas × documents

**Version 1 — 26/07/2026 — Document de travail.**
Triple usage : (1) dossier à faire valider par le fiscaliste, (2) argumentaire
de vente, (3) cahier des charges du moteur de qualification du cas.

**Périmètre v1 :** dirigeant résident fiscal français, structure unipersonnelle
américaine (SMLLC, type LLC Wyoming/Delaware). Convention fiscale couverte :
**France–USA uniquement**. Pour tout autre pays ou toute autre convention :
« consultez un fiscaliste » — affiché tel quel dans le produit.

---

## 1. Le questionnaire de qualification (les questions que le moteur pose)

| # | Question | Réponses possibles |
|---|----------|--------------------|
| Q1 | Résidence fiscale du dirigeant | France (v1) / autre (hors périmètre) |
| Q2 | Pays de la structure | USA (v1) / autre (hors périmètre) |
| Q3 | Forme de la structure | SMLLC disregarded (v1) / LLC multi-membres / Corporation (v2) |
| Q4 | Un impôt a-t-il été EFFECTIVEMENT PAYÉ aux États-Unis ? (source US / ECI) | oui / non |
| Q5 | Le dirigeant a-t-il perçu personnellement des sommes ? | non / remboursement de compte courant / distributions |
| Q6 | Compte(s) bancaires à l'étranger ? | oui / non |
| Q7 | Détention ≥ 10 % d'une entité étrangère ? | oui (quasi systématique) |
| Q8 | Ventes B2C à des particuliers de l'UE ? | non / en direct / via merchant of record |
| Q9 | Qualification française de la structure (LE point fiscaliste) | transparente / opaque–siège en France / non tranchée |
| Q10 | Salariés ou rémunération versée ? | non (vigilance dormante) / oui (URSSAF s'active) |

---

## 2. Le socle américain — identique pour tous les cas SMLLC

- Form 5472 + Form 1120 pro forma — fax ou courrier, jamais électronique.
  Printemps N+1. Pénalité 25 000 $.
- Form 7004 — extension de délai le cas échéant.
- W-8BEN-E — sur demande des payeurs américains.
- Annual Report de l'État (Wyoming : 60 $ min, mois anniversaire).
- FinCEN BOI — statut réglementaire mouvant, à vérifier à chaque échéance.
- Form 1040-NR — UNIQUEMENT si la personne perçoit des revenus de source US
  (déclencheur = Q4/Q5, jamais la nationalité des clients).

---

## 3. Les cas types côté français

### Cas A — Transparente, aucun impôt US, aucune somme perçue
(le cas de Jacques aujourd'hui — le cas d'entrée de la plupart des clients)

- 3916 (+ case 8UU) : comptes étrangers — pénalité 1 500 €/compte/an
- 3916-bis : structure détenue ≥ 10 % — pénalité min. 750 €
- 2042-C-PRO : si transparence retenue, bénéfice imputé, imposé AU RÉEL
  (pas de régime micro)
- 2047 : NON. Aucun impôt payé à l'étranger = aucune double imposition à
  réparer. Le dire est un argument de vente.
- Comptabilité de GESTION : P&L + bilan simplifié (déjà produits par le module)

### Cas B — Transparente + impôt effectivement payé aux USA
= Cas A + Form 1040-NR (US) + formulaire 2047 (FR), convention France–USA
(méthode du crédit d'impôt). C'est LE cas cible du générateur 2047.
Déclencheur : has_us_source_income = true ET impôt US payé — jamais la simple
clientèle américaine (services rendus depuis la France = source française).

### Cas C — Siège de direction effective en France (art. 209 I et 4 B CGI)
(le « pire scénario » — critère de FAIT : structure dirigée depuis la France
par son unique associé résident)

- 2065 + liasse 2033-A à G : la structure devient imposable à l'IS —
  télétransmission obligatoire (EDI-TDFC)
- FEC + livre journal + grand livre : comptabilité normée, conservation 10 ans
- CFE (et CVAE selon CA) : à confirmer par le fiscaliste
- 3916 / 3916-bis : demeurent
- 2042 + éventuel 2777 pour les distributions (structure réputée établie)

→ Frontière Mr. Compliance / Mr. Comptable — et le moteur comptable construit
le 25-26/07 (écritures, FEC, chiffres de liasse) couvre déjà la sortie.

### Cas D — Sommes perçues personnellement (s'ajoute à A, B ou C)
- Remboursement de compte courant : non imposable (dette remboursée), à
  condition que la qualification de prêt tienne (convention écrite, traçabilité)
- Distributions : revenus mobiliers → 2047 + 2042 (structure étrangère) ou
  circuit français si Cas C. Ordre optimal : rembourser le compte courant
  d'abord, distribuer ensuite.

### Cas E — TVA sur ventes B2C européennes (s'ajoute à tous)
- En direct : inscription OSS obligatoire AVANT la première vente UE (TVA du
  pays du client dès le premier euro, aucun seuil hors UE). Piège : l'OSS
  non-Union exige de n'avoir AUCUN établissement dans l'UE — s'y inscrire en
  dirigeant depuis la France peut fournir soi-même la preuve d'un
  établissement français.
- Via merchant of record (Lemon Squeezy, Paddle…) : le MoR collecte et reverse
  la TVA — pas d'OSS. Mais il ne règle en rien la qualification (Q9).

---

## 4. Tableau récapitulatif cas × documents

| Document | Cas A | Cas B | Cas C | D distrib. | E B2C direct |
|----------|:-:|:-:|:-:|:-:|:-:|
| 5472 + 1120 pro forma (US) | X | X | X | X | X |
| Annual Report État (US) | X | X | X | X | X |
| 1040-NR (US) | — | X | selon revenus | selon nature | — |
| 3916 / 8UU | X | X | X | X | X |
| 3916-bis | X | X | X | X | X |
| 2042-C-PRO | X (si transparence) | X | — | — | — |
| 2047 | — | X | — | X | — |
| 2065 + 2033 + FEC | — | — | X | — | — |
| CFE / CVAE | — | — | X | — | — |
| 2777 | — | — | possible | possible (Cas C) | — |
| OSS trimestriel | — | — | — | — | X |

---

## 5. Règles de déclenchement à graver dans le moteur (les pièges)

1. Le 2047 ne se déclenche que sur impôt EFFECTIVEMENT PAYÉ à l'étranger.
   Jamais sur la nationalité des clients. Un 2047 à tort = du faux avec assurance.
2. Transparence et siège de direction effective = deux scénarios distincts,
   deux fondements, deux jeux de documents. Le produit dit LEQUEL s'applique.
3. La qualification (Q9) n'est jamais décidée par le logiciel. Le moteur
   présente les deux branches, drapeau qualification_validee_par_fiscaliste.
4. Le merchant of record éteint l'OSS, pas la question du siège.
5. Conventions : couverture affichée et limitée (FR-USA v1, Israël candidat
   v2). Trois méthodes existent selon les conventions — se tromper fausse tout.
6. Aucun impôt payé ≠ rien à déclarer. Le Cas A ne paie rien mais déclare
   beaucoup (3916, 3916-bis, 5472). Message commercial central.

---

## 6. L'argumentaire de vente

- La SÉLECTIVITÉ est le produit : « ce formulaire ne vous concerne pas, et
  voici pourquoi » vaut plus qu'une pile de formulaires générés en masse.
- Le questionnaire de qualification EST l'onboarding : dix questions, et le
  client voit sa carte personnelle d'obligations, échéances et pénalités.
- Honnêteté sur les limites = crédibilité : conventions affichées,
  qualification renvoyée au fiscaliste, garde-fous visibles.

## 7. Questions ouvertes pour le fiscaliste

1. Qualification de la SMLLC en droit français : transparente ou opaque ?
   Critères de bascule ?
2. Si transparence : modalités exactes de déclaration du bénéfice imputé
   (2042-C-PRO seul ? déclaration de résultat associée ? BIC/BNC ?)
3. Si siège de direction effective : CFE/CVAE ? Point de départ ?
4. 3916 cadre 3.2 : titulaire en propre ou procuration pour le membre unique ?
5. Méthode conventionnelle FR-US par catégorie de revenus (générateur 2047).
6. Effet du départ en Israël en cours d'exercice sur chacun des cas.

Rien de ce document n'est un avis fiscal. Chaque règle du moteur portera sa
source et son drapeau de validation.
