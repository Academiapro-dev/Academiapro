import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import zlib from "zlib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 300;

// ═══════════════════════════════════════════════════════════════════════
// LES TABLES DE REFERENCE DE L URSSAF — 18/09/2026, version 3
//
// 🆕 VERSION 3 — LIRE UN VRAI FICHIER EXCEL
//
// Le fichier VMRR porte l extension .xlsx et c en est vraiment un : une
// archive compressee contenant du XML. La version 2 le lisait comme du
// texte, parce que le fichier transmis a Claude avait ete converti en
// chemin ; le fichier depose dans le bucket, lui, est le vrai (560 Ko
// contre 40 Ko). Resultat : zero ligne lue.
//
// ⛔ AUCUNE BIBLIOTHEQUE N A ETE AJOUTEE AU PROJET pour cela : Node sait
// decompresser (zlib), et un .xlsx n est qu un ZIP contenant du XML. Le
// lecteur tient dans ce fichier — voir `lireClasseur`.
//
// 🚨🚨 LE PIEGE DU POURCENTAGE
// Dans un tableur, « 0,15 % » est le plus souvent RANGE COMME 0,0015, avec
// un simple format d affichage en pourcentage. Lire la valeur brute
// donnerait donc un taux CENT FOIS TROP FAIBLE — et le versement mobilite
// serait sous-declare sans qu aucun message ne le signale.
// ⛔ ON NE DEVINE PAS : on lit `xl/styles.xml`, on regarde le format
// applique a la cellule, et on multiplie par cent uniquement quand ce
// format est un pourcentage.
//
// 🆕 VERSION 2, APRES LE PREMIER DEPOT DES FICHIERS — deux choses que le
// depot reel a montrees et que la version 1 n aurait pas supportees :
//
// 1. 🚨 iOS RENOMME LES FICHIERS AU TELECHARGEMENT. Les tirets bas
//    deviennent des points : `tableUrssaf_20260618.csv` arrive sous le nom
//    `tableUrssaf.20260618.csv`. La date se lit donc apres un point, un
//    tiret bas OU un tiret. ⛔ NE PAS EXIGER UN NOM EXACT : on ne maitrise
//    pas ce que l appareil fait du nom.
// 2. LES FICHIERS PEUVENT ETRE A LA RACINE DU BUCKET plutot que dans le
//    dossier. On cherche donc dans le dossier, puis a la racine.
//
//   ?action=essai        dit ce qu elle trouve dans le bucket, SANS ECRIRE
//   ?action=importer     importe les quatre tables
//   ?action=importer&quoi=ctp        une seule (organismes | ctp | vm | vmrr)
//   ?action=etat         ce qui est en base, par table
//
// 🚨 POURQUOI UNE ROUTE ET PAS DU SQL COLLE A LA MAIN
// 23 800 lignes au total. Et surtout : CES TABLES CHANGENT PLUSIEURS FOIS
// PAR AN — les taux transport ont ete mis a jour LE JOUR MEME ou on les a
// telecharges. Les ecrire en dur, c est se garantir de declarer un jour un
// taux perime. Cette route se rejoue a chaque mise a jour.
//
// LA SOURCE : https://fichierdirect.declaration.urssaf.fr/TablesReference.htm
// ⛔ CETTE PAGE REFUSE LA LECTURE AUTOMATIQUE. Les fichiers se telechargent
// a la main et se deposent dans le bucket. On ne devine JAMAIS l adresse
// d un fichier a partir de son nom : elle porte la date de mise a jour et
// change a chaque publication.
//
// OU : bucket `documents-signes`, dossier `referentiels-urssaf/`.
// ⚠️ PAS DE NOUVEAU BUCKET : celui-ci existe deja et sert deja aux DSN.
//
// ═══════════════════════════════════════════════════════════════════════
// 🚨 CE QUE LES FICHIERS ONT DE PIEGEUX — TOUT A ETE VERIFIE, RIEN DEDUIT
//
// 1. ENCODAGE. Les trois CSV sont en ISO 8859-1, separes par « ; », et
//    leurs valeurs sont entourees d apostrophes simples ('12345').
//    ⛔ LES LIRE EN UTF-8 DONNE DU CHARABIA.
//    Le fichier VMRR, lui, porte l extension .xlsx mais c est du TEXTE
//    TABULE EN UTF-8 : il commence par « ## Sheet: ». On reconnait donc le
//    format au contenu, pas a l extension.
//
// 2. DATES. Trois formats differents dans quatre fichiers :
//      CTP        JJ/MM/AAAA      et « // » veut dire « pas de fin »
//      transport  AAAAMMJJ
//      VMRR       un NOMBRE (46023) : le compte des jours d Excel, qui
//                 part du 30/12/1899. 46023 = 01/01/2026.
//
// 3. TAUX. « 15.45 » dans les CSV, mais « 0,15% » dans le VMRR.
//
// 4. 🚨 UNE COMMUNE PEUT AVOIR DEUX LIGNES A LA MEME DATE : l une porte le
//    taux de l autorite de transport, l autre celui du syndicat mixte.
//    76 communes sont dans ce cas. LE TAUX APPLICABLE EST LA SOMME.
//    ⛔ C est pour cela qu il n y a PAS de cle unique sur (commune, date)
//    dans urssaf_vm_communes : prendre la premiere ligne trouvee ferait
//    declarer un taux trop faible, sans aucun message d erreur.
//
// 5. LE FICHIER D HISTORIQUE CONTIENT TOUT. `histoCodesTypesCsv` porte les
//    6 374 lignes, dont les 825 en vigueur (celles dont la date de fin est
//    « // »). ⛔ IMPORTER AUSSI `codesTypesCsv` FERAIT DOUBLON.
//    On prend l historique s il est la, sinon le courant.
//
// ═══════════════════════════════════════════════════════════════════════
// COMMENT L IMPORT REMPLACE SANS TROU
//
// Chaque ligne porte la `source_date`, lue dans le NOM du fichier
// (tauxTransport_20260918.csv → 18/09/2026). On insere d abord toutes les
// lignes de la nouvelle livraison, PUIS on supprime celles des livraisons
// precedentes.
// ⚠️ DANS CET ORDRE, ET PAS L INVERSE : si l import s arrete au milieu,
// l ancienne version est toujours la et le calcul continue de tourner. Un
// nouvel import repare. Vider d abord laisserait la paie sans referentiel.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const BUCKET = "documents-signes";
const DOSSIER = "referentiels-urssaf";
const SOURCE = "https://fichierdirect.declaration.urssaf.fr/TablesReference.htm";

// Les lots d insertion. 15 577 lignes pour les taux transport : par 500,
// cela fait 32 appels, largement dans les 300 secondes de la route.
const LOT = 500;

function reponse(corps: any, statut: number) {
  return NextResponse.json(corps, {
    status: statut,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function autorise(req: NextRequest): boolean {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
}

// ---------------------------------------------------------------------
// LIRE LES VALEURS
// ---------------------------------------------------------------------

// Les CSV de l URSSAF entourent leurs valeurs d apostrophes simples.
function nettoyer(v: string): string {
  return String(v || "").trim().replace(/^'/, "").replace(/'$/, "").trim();
}

// « 15.45 » · « 0,15% » · « » → nombre ou null.
function nombre(v: string): number | null {
  const t = nettoyer(v).replace("%", "").replace(",", ".").trim();
  if (!t) return null;
  const n = Number(t);
  return isNaN(n) ? null : n;
}

// JJ/MM/AAAA. « // » et « » veulent dire « pas de date ».
function dateFr(v: string): string | null {
  const t = nettoyer(v);
  const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? m[3] + "-" + m[2] + "-" + m[1] : null;
}

// AAAAMMJJ.
function dateCompacte(v: string): string | null {
  const t = nettoyer(v);
  const m = t.match(/^(\d{4})(\d{2})(\d{2})$/);
  return m ? m[1] + "-" + m[2] + "-" + m[3] : null;
}

// Le compte des jours d Excel : 1 = 01/01/1900, avec le decalage historique
// du 29/02/1900 qui n a jamais existe. L origine effective est donc le
// 30/12/1899.
function dateExcel(v: string): string | null {
  const n = Number(nettoyer(v));
  if (!n || isNaN(n) || n < 20000 || n > 80000) return null;
  const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
  const p = (x: number) => String(x).padStart(2, "0");
  return d.getUTCFullYear() + "-" + p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate());
}

// La date de publication, lue dans le NOM du fichier : elle date la
// livraison et sert a effacer la precedente.
// ⚠️ tauxVMRR-01012026.xlsx porte JJMMAAAA, les CSV portent AAAAMMJJ.
function dateDuNom(nom: string): string | null {
  // AAAAMMJJ apres un point, un tiret bas ou un tiret — voir l en-tete :
  // iOS remplace les tirets bas par des points.
  const a = nom.match(/[._-](\d{4})(\d{2})(\d{2})(?=[._-])/);
  if (a) {
    const mois = Number(a[2]);
    const jour = Number(a[3]);
    if (mois >= 1 && mois <= 12 && jour >= 1 && jour <= 31) {
      return a[1] + "-" + a[2] + "-" + a[3];
    }
  }
  // JJMMAAAA — la forme du fichier VMRR (tauxVMRR-01012026.xlsx).
  const b = nom.match(/[._-](\d{2})(\d{2})(\d{4})(?=[._-])/);
  if (b) {
    const jour = Number(b[1]);
    const mois = Number(b[2]);
    if (mois >= 1 && mois <= 12 && jour >= 1 && jour <= 31) {
      return b[3] + "-" + b[2] + "-" + b[1];
    }
  }
  return null;
}

// Un CSV de l URSSAF : ISO 8859-1, separateur « ; », premiere ligne = titres.
function lignesCsv(octets: Buffer): string[][] {
  const texte = new TextDecoder("iso-8859-1").decode(octets);
  const sortie: string[][] = [];
  for (const ligne of texte.split(/\r?\n/)) {
    if (!ligne.trim()) continue;
    sortie.push(ligne.split(";"));
  }
  return sortie;
}

// ---------------------------------------------------------------------
// LIRE UN CLASSEUR .xlsx SANS BIBLIOTHEQUE
//
// Un .xlsx est une archive ZIP. On y cherche trois pieces :
//   xl/worksheets/sheet1.xml  les cellules
//   xl/sharedStrings.xml      le texte, range a part et reference par
//                             numero (t="s")
//   xl/styles.xml             les formats, pour reconnaitre un pourcentage
// ---------------------------------------------------------------------

// Parcourt les entrees du ZIP et rend le contenu de celles qui nous
// interessent. On lit les en-tetes locaux, un par un.
function ouvrirZip(octets: Buffer): Record<string, string> {
  const sortie: Record<string, string> = {};
  let i = 0;
  while (i + 30 <= octets.length) {
    if (octets.readUInt32LE(i) !== 0x04034b50) break;   // « PK\x03\x04 »
    const methode = octets.readUInt16LE(i + 8);
    let compresse = octets.readUInt32LE(i + 18);
    let brut = octets.readUInt32LE(i + 22);
    const tailleNom = octets.readUInt16LE(i + 26);
    const tailleExtra = octets.readUInt16LE(i + 28);
    const nom = octets.slice(i + 30, i + 30 + tailleNom).toString("utf8");
    const debut = i + 30 + tailleNom + tailleExtra;

    // ⚠️ Quand le bit 3 est pose, les tailles ne sont PAS dans l en-tete :
    // elles suivent les donnees. On retrouve alors la fin en cherchant
    // l en-tete suivant.
    const drapeaux = octets.readUInt16LE(i + 6);
    if ((drapeaux & 0x08) !== 0 && compresse === 0) {
      let j = debut;
      while (j + 4 <= octets.length && octets.readUInt32LE(j) !== 0x08074b50) j++;
      compresse = j - debut;
      brut = 0;
    }

    const donnees = octets.slice(debut, debut + compresse);
    if (nom === "xl/worksheets/sheet1.xml" || nom === "xl/sharedStrings.xml"
      || nom === "xl/styles.xml") {
      try {
        sortie[nom] = methode === 0
          ? donnees.toString("utf8")
          : zlib.inflateRawSync(donnees).toString("utf8");
      } catch {
        // Une piece illisible n empeche pas de lire les autres.
      }
    }

    i = debut + compresse + ((drapeaux & 0x08) !== 0 ? 16 : 0);
    if (compresse === 0 && brut === 0 && (drapeaux & 0x08) === 0) i = debut;
  }
  return sortie;
}

function sansEchappement(v: string): string {
  return v.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

// Le texte est range a part : chaque <si> est une chaine, eventuellement
// coupee en plusieurs <t> quand elle porte plusieurs mises en forme.
function lireChaines(xml: string): string[] {
  const sortie: string[] = [];
  const blocs = xml.match(/<si>[\s\S]*?<\/si>/g) || [];
  for (const b of blocs) {
    let t = "";
    const morceaux = b.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
    for (const m of morceaux) {
      const v = m.match(/<t[^>]*>([\s\S]*?)<\/t>/);
      if (v) t += v[1];
    }
    sortie.push(sansEchappement(t));
  }
  return sortie;
}

// 🚨 QUELS STYLES SONT DES POURCENTAGES.
// Les formats 9 (« 0% ») et 10 (« 0.00% ») sont predefinis ; les autres
// sont declares dans <numFmts> et reconnus au caractere « % ».
function stylesEnPourcent(xml: string): Record<number, boolean> {
  const pourcent: Record<number, boolean> = { 9: true, 10: true };
  const perso = xml.match(/<numFmt[^>]*\/>/g) || [];
  for (const f of perso) {
    const id = f.match(/numFmtId="(\d+)"/);
    const code = f.match(/formatCode="([^"]*)"/);
    if (id && code && sansEchappement(code[1]).indexOf("%") >= 0) {
      pourcent[Number(id[1])] = true;
    }
  }

  const sortie: Record<number, boolean> = {};
  const bloc = xml.match(/<cellXfs[^>]*>[\s\S]*?<\/cellXfs>/);
  if (!bloc) return sortie;
  const xfs = bloc[0].match(/<xf[^>]*>/g) || [];
  for (let i = 0; i < xfs.length; i++) {
    const id = xfs[i].match(/numFmtId="(\d+)"/);
    if (id && pourcent[Number(id[1])]) sortie[i] = true;
  }
  return sortie;
}

// La colonne d une cellule : « B12 » → 1 (A = 0).
function colonneDe(ref: string): number {
  const m = String(ref || "").match(/^([A-Z]+)/);
  if (!m) return -1;
  let n = 0;
  for (const c of m[1]) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

// Rend les lignes du classeur, chaque cellule deja convertie en texte.
// ⚠️ UNE CELLULE VIDE N APPARAIT PAS DANS LE XML : on remplit les trous,
// sinon les colonnes se decalent et on lit un code postal comme un taux.
function lireClasseur(octets: Buffer): string[][] {
  const pieces = ouvrirZip(octets);
  const feuille = pieces["xl/worksheets/sheet1.xml"];
  if (!feuille) return [];

  const chaines = pieces["xl/sharedStrings.xml"] ? lireChaines(pieces["xl/sharedStrings.xml"]) : [];
  const pourcent = pieces["xl/styles.xml"] ? stylesEnPourcent(pieces["xl/styles.xml"]) : {};

  const sortie: string[][] = [];
  const lignes = feuille.match(/<row[^>]*>[\s\S]*?<\/row>/g) || [];

  for (const ligne of lignes) {
    const cellules: string[] = [];
    const brutes = ligne.match(/<c[^>]*(?:\/>|>[\s\S]*?<\/c>)/g) || [];
    for (const c of brutes) {
      const ref = c.match(/r="([A-Z]+\d+)"/);
      const colonne = ref ? colonneDe(ref[1]) : cellules.length;
      while (cellules.length < colonne) cellules.push("");

      const type = c.match(/t="([^"]*)"/);
      const style = c.match(/s="(\d+)"/);
      const valeur = c.match(/<v>([\s\S]*?)<\/v>/);
      const texte = c.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/);

      let v = "";
      if (type && type[1] === "s" && valeur) {
        v = chaines[Number(valeur[1])] || "";
      } else if (type && type[1] === "inlineStr" && texte) {
        v = sansEchappement(texte[1]);
      } else if (valeur) {
        v = sansEchappement(valeur[1]);
        // 🚨 LE POURCENTAGE : 0,0015 affiche « 0,15 % ». On remet le taux
        // a l echelle de ce que l URSSAF publie.
        if (style && pourcent[Number(style[1])]) {
          const n = Number(v);
          if (!isNaN(n)) v = String(n * 100);
        }
      }
      cellules.push(v);
    }
    sortie.push(cellules);
  }
  return sortie;
}

// Le fichier VMRR : UTF-8, tabulations, une ligne « ## Sheet: » en tete.
function lignesTabulees(octets: Buffer): string[][] {
  const texte = new TextDecoder("utf-8").decode(octets);
  const sortie: string[][] = [];
  for (const ligne of texte.split(/\r?\n/)) {
    if (!ligne.trim()) continue;
    if (ligne.indexOf("## Sheet:") === 0) continue;
    sortie.push(ligne.split("\t"));
  }
  return sortie;
}

// ---------------------------------------------------------------------
// LE BUCKET
// ---------------------------------------------------------------------

type Trouve = { nom: string; chemin: string; taille: number; source_date: string | null };

async function listerUn(prefixe: string): Promise<Trouve[]> {
  const { data, error } = await supabase.storage.from(BUCKET)
    .list(prefixe, { limit: 200 });
  if (error || !data) return [];
  return data
    .filter(function (f: any) {
      // Un dossier n a pas de metadata : on ne garde que les fichiers.
      return f.name && f.name.indexOf(".") > 0 && f.metadata;
    })
    .map(function (f: any) {
      return {
        nom: f.name,
        chemin: prefixe ? prefixe + "/" + f.name : f.name,
        taille: (f.metadata && f.metadata.size) || 0,
        source_date: dateDuNom(f.name),
      };
    });
}

// 🆕 On regarde d abord dans le dossier, puis a la racine du bucket : les
// fichiers deposes a la main atterrissent souvent a la racine.
async function listerFichiers(): Promise<Trouve[]> {
  const dedans = await listerUn(DOSSIER);
  const racine = await listerUn("");
  const vus: Record<string, boolean> = {};
  const sortie: Trouve[] = [];
  for (const f of dedans.concat(racine)) {
    if (vus[f.nom]) continue;
    vus[f.nom] = true;
    sortie.push(f);
  }
  return sortie;
}

// On reconnait chaque table au DEBUT du nom, pas au nom entier : il porte
// la date de mise a jour, qui change a chaque publication.
function chercher(fichiers: Trouve[], debut: string): Trouve | null {
  const bas = debut.toLowerCase();
  for (const f of fichiers) {
    if (f.nom.toLowerCase().indexOf(bas) === 0) return f;
  }
  return null;
}

async function telecharger(chemin: string): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(chemin);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

// ---------------------------------------------------------------------
// INSERER PAR LOTS, PUIS EFFACER L ANCIENNE LIVRAISON
// ---------------------------------------------------------------------
async function remplir(
  table: string, lignes: any[], sourceDate: string
): Promise<{ inseres: number; effaces: number; erreur: string | null }> {

  let inseres = 0;
  for (let i = 0; i < lignes.length; i += LOT) {
    const lot = lignes.slice(i, i + LOT);
    const { error } = await supabase.from(table).insert(lot);
    if (error) {
      // ⚠️ ON S ARRETE ET ON N EFFACE RIEN : l ancienne livraison reste
      // en place, donc le calcul continue de tourner.
      return { inseres: inseres, effaces: 0, erreur: error.message };
    }
    inseres += lot.length;
  }

  const { error: eDel, count } = await supabase.from(table)
    .delete({ count: "exact" }).neq("source_date", sourceDate);

  return {
    inseres: inseres,
    effaces: eDel ? 0 : (count || 0),
    erreur: eDel ? "nettoyage des anciennes lignes impossible : " + eDel.message : null,
  };
}

// ---------------------------------------------------------------------
// LES QUATRE LECTURES
// ---------------------------------------------------------------------

// SIRET;Codification;Numéro National Emetteur;Dénomination;Adresse 1;
// Adresse 2;Code postal;Ville;
function lireOrganismes(octets: Buffer, sourceDate: string): any[] {
  const lignes = lignesCsv(octets);
  const sortie: any[] = [];
  for (let i = 1; i < lignes.length; i++) {
    const l = lignes[i];
    const codification = nettoyer(l[1] || "");
    if (!codification) continue;
    sortie.push({
      codification: codification,
      siret: nettoyer(l[0] || "") || null,
      numero_national_emetteur: nettoyer(l[2] || "") || null,
      denomination: nettoyer(l[3] || "") || codification,
      adresse1: nettoyer(l[4] || "") || null,
      adresse2: nettoyer(l[5] || "") || null,
      code_postal: nettoyer(l[6] || "") || null,
      ville: nettoyer(l[7] || "") || null,
      source_url: SOURCE,
      source_date: sourceDate,
      maj_le: new Date().toISOString(),
    });
  }
  return sortie;
}

// Code;Libellé;Libellé court;Format;Taux plafonné;Taux déplafonné;
// Taux AT;Date d'effet;[Date de fin;]Spécificité;
// ⚠️ DEUX FICHIERS, DEUX LARGEURS : l historique a une colonne de plus.
// On la reconnait a l en-tete, on ne la suppose pas.
function lireCtp(octets: Buffer, sourceDate: string): any[] {
  const lignes = lignesCsv(octets);
  const titres = (lignes[0] || []).map(function (t) { return t.toLowerCase(); });
  const avecFin = titres.some(function (t) { return t.indexOf("date de fin") >= 0; });

  const sortie: any[] = [];
  const vus: Record<string, boolean> = {};

  for (let i = 1; i < lignes.length; i++) {
    const l = lignes[i];
    const code = nettoyer(l[0] || "");
    const effet = dateFr(l[7] || "");
    if (!code || !effet) continue;

    // ⚠️ LA CLE (code, date d effet) EST UNIQUE EN BASE : un doublon dans
    // le fichier ferait echouer tout le lot. On garde la premiere.
    const cle = code + "|" + effet;
    if (vus[cle]) continue;
    vus[cle] = true;

    sortie.push({
      code: code,
      libelle: nettoyer(l[1] || "") || code,
      libelle_court: nettoyer(l[2] || "") || null,
      format: nettoyer(l[3] || "") || null,
      taux_plafonne: nombre(l[4] || ""),
      taux_deplafonne: nombre(l[5] || ""),
      taux_at: nombre(l[6] || ""),
      date_effet: effet,
      date_fin: avecFin ? dateFr(l[8] || "") : null,
      specificite: nettoyer((avecFin ? l[9] : l[8]) || "") || null,
      source_url: SOURCE,
      source_date: sourceDate,
      maj_le: new Date().toISOString(),
    });
  }
  return sortie;
}

// Code commune;Libellé;Taux AOT;Taux syndicat mixte;Date effet;
// Codes postaux afférents;
// 🚨 PAS DE DEDOUBLONNAGE ICI : deux lignes a la meme date sont normales
// et leurs taux s additionnent. Voir l en-tete du fichier.
function lireTransport(octets: Buffer, sourceDate: string): any[] {
  const lignes = lignesCsv(octets);
  const sortie: any[] = [];
  for (let i = 1; i < lignes.length; i++) {
    const l = lignes[i];
    const insee = nettoyer(l[0] || "");
    const effet = dateCompacte(l[4] || "");
    if (!insee || !effet) continue;

    // Les codes postaux occupent toutes les colonnes restantes.
    const postaux: string[] = [];
    for (let c = 5; c < l.length; c++) {
      const p = nettoyer(l[c] || "");
      if (p) postaux.push(p);
    }

    sortie.push({
      code_insee: insee,
      libelle: nettoyer(l[1] || "") || null,
      taux_aot: nombre(l[2] || "") || 0,
      taux_syndicat: nombre(l[3] || "") || 0,
      date_effet: effet,
      codes_postaux: postaux.length ? postaux.join(",") : null,
      source_url: SOURCE,
      source_date: sourceDate,
      maj_le: new Date().toISOString(),
    });
  }
  return sortie;
}

// Communes concernées / Code commune INSEE / code partenaire / Taux VMRR /
// Date de début d'effet / Date de fin d'effet
function lireVmrr(octets: Buffer, sourceDate: string): any[] {
  // 🆕 ON RECONNAIT LE FORMAT AU CONTENU, PAS A L EXTENSION : un vrai
  // classeur commence par « PK ». Le meme fichier peut arriver en texte
  // tabule selon la maniere dont il a ete telecharge.
  const estClasseur = octets.length > 4 && octets[0] === 0x50 && octets[1] === 0x4b;
  const lignes = estClasseur ? lireClasseur(octets) : lignesTabulees(octets);
  const sortie: any[] = [];
  const vus: Record<string, boolean> = {};

  for (let i = 1; i < lignes.length; i++) {
    const l = lignes[i];
    const insee = nettoyer(l[1] || "");
    const effet = dateExcel(l[4] || "") || dateFr(l[4] || "") || dateCompacte(l[4] || "");
    if (!insee || !effet) continue;

    const cle = insee + "|" + effet;
    if (vus[cle]) continue;
    vus[cle] = true;

    sortie.push({
      code_insee: insee,
      commune: nettoyer(l[0] || "") || null,
      code_partenaire: nettoyer(l[2] || "") || null,
      taux: nombre(l[3] || "") || 0,
      date_effet: effet,
      date_fin: dateExcel(l[5] || "") || dateFr(l[5] || "") || null,
      source_url: SOURCE,
      source_date: sourceDate,
      maj_le: new Date().toISOString(),
    });
  }
  return sortie;
}

// ---------------------------------------------------------------------
// LE CATALOGUE : quel fichier, quelle table, quelle lecture
// ---------------------------------------------------------------------
const TABLES = [
  {
    quoi: "organismes",
    table: "urssaf_organismes",
    debut: "tableUrssaf",
    libelle: "Table des Urssaf",
    lire: lireOrganismes,
  },
  {
    // ⚠️ L HISTORIQUE D ABORD : il contient aussi les codes en vigueur.
    quoi: "ctp",
    table: "urssaf_ctp",
    debut: "histoCodesTypesCsv",
    replis: "codesTypesCsv",
    libelle: "Codes types de personnel (avec historique)",
    lire: lireCtp,
  },
  {
    quoi: "vm",
    table: "urssaf_vm_communes",
    debut: "tauxTransport",
    libelle: "Taux du versement mobilité par commune",
    lire: lireTransport,
  },
  {
    quoi: "vmrr",
    table: "urssaf_vm_regional",
    debut: "tauxVMRR",
    libelle: "Versement mobilité régional et rural",
    lire: lireVmrr,
  },
];

// ═══════════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  if (!autorise(req)) return reponse({ erreur: "non autorise" }, 401);

  const p = req.nextUrl.searchParams;
  const action = String(p.get("action") || "");

  // ---- ETAT : ce qui est en base ----
  if (action === "etat") {
    const etat: any = {};
    for (const t of TABLES) {
      const { count, error } = await supabase.from(t.table)
        .select("id", { count: "exact", head: true });
      const { data: une } = await supabase.from(t.table)
        .select("source_date").limit(1).maybeSingle();
      etat[t.quoi] = error
        ? { table: t.table, erreur: error.message }
        : { table: t.table, lignes: count || 0, livraison: une ? une.source_date : null };
    }
    return reponse({ route: "urssaf/tables", version: 3, etat: etat }, 200);
  }

  // ---- ESSAI : ce qu on trouve dans le bucket, SANS RIEN ECRIRE ----
  if (action === "essai") {
    const fichiers = await listerFichiers();
    const vus: any[] = [];
    const manquants: string[] = [];

    for (const t of TABLES) {
      let f = chercher(fichiers, t.debut);
      let replis = false;
      if (!f && t.replis) { f = chercher(fichiers, t.replis); replis = !!f; }

      if (!f) {
        manquants.push(t.libelle + " (nom commençant par « " + t.debut + " »)");
        continue;
      }

      // On lit le fichier pour de vrai, mais on n ecrit rien : c est le
      // seul moyen de savoir si l encodage et les dates sont bien lus
      // AVANT de toucher a la base.
      const octets = await telecharger(f.chemin);
      let compte = 0;
      let apercu: any = null;
      let souci: string | null = null;

      if (!octets) {
        souci = "téléchargement impossible";
      } else {
        try {
          const lignes = t.lire(octets, f.source_date || "2026-01-01");
          compte = lignes.length;
          apercu = lignes[0] || null;
          if (compte === 0) souci = "aucune ligne lue : encodage ou séparateur inattendu";
        } catch (e: any) {
          souci = "lecture impossible : " + String((e && e.message) || e);
        }
      }

      vus.push({
        quoi: t.quoi,
        fichier: f.chemin,
        octets: f.taille,
        livraison: f.source_date,
        replis_sur_le_fichier_courant: replis || undefined,
        lignes_lues: compte,
        premiere_ligne: apercu,
        souci: souci,
      });
    }

    return reponse({
      route: "urssaf/tables",
      version: 3,
      bucket: BUCKET + " (dossier « " + DOSSIER + " » ou racine)",
      fichiers_dans_le_dossier: fichiers.map(function (f) { return f.nom; }),
      tables: vus,
      manquants: manquants,
      verdict: manquants.length === 0 && vus.every(function (v) { return !v.souci; })
        ? "Les quatre fichiers sont lisibles. L'import peut être lancé."
        : "Il manque des fichiers, ou l'un d'eux ne se lit pas : voir ci-dessus.",
    }, 200);
  }

  // ---- IMPORTER ----
  if (action === "importer") {
    const quoi = String(p.get("quoi") || "");
    const fichiers = await listerFichiers();
    const resultats: any[] = [];

    for (const t of TABLES) {
      if (quoi && quoi !== t.quoi) continue;

      let f = chercher(fichiers, t.debut);
      if (!f && t.replis) f = chercher(fichiers, t.replis);
      if (!f) {
        resultats.push({ quoi: t.quoi, fait: false,
          erreur: "fichier absent du bucket (nom commençant par « " + t.debut + " »)" });
        continue;
      }
      if (!f.source_date) {
        resultats.push({ quoi: t.quoi, fait: false,
          erreur: "la date de publication ne se lit pas dans le nom « " + f.nom
            + " » : elle date la livraison et sert à effacer la précédente." });
        continue;
      }

      const octets = await telecharger(f.chemin);
      if (!octets) {
        resultats.push({ quoi: t.quoi, fait: false, erreur: "téléchargement impossible" });
        continue;
      }

      let lignes: any[] = [];
      try {
        lignes = t.lire(octets, f.source_date);
      } catch (e: any) {
        resultats.push({ quoi: t.quoi, fait: false,
          erreur: "lecture impossible : " + String((e && e.message) || e) });
        continue;
      }

      if (lignes.length === 0) {
        // ⛔ ON N EFFACE JAMAIS SUR UN FICHIER VIDE : ce serait vider la
        // table a cause d un encodage mal lu.
        resultats.push({ quoi: t.quoi, fait: false,
          erreur: "aucune ligne lue : rien n'a été touché en base." });
        continue;
      }

      // Une livraison deja importee ne se refait pas : on le dit.
      const { count: dejaLa } = await supabase.from(t.table)
        .select("id", { count: "exact", head: true }).eq("source_date", f.source_date);

      if ((dejaLa || 0) > 0 && p.get("refaire") !== "oui") {
        resultats.push({
          quoi: t.quoi, fait: false, fichier: f.chemin, livraison: f.source_date,
          erreur: "Cette livraison est déjà en base (" + dejaLa + " lignes). "
            + "Pour la réimporter malgré tout, ajouter &refaire=oui.",
        });
        continue;
      }

      if ((dejaLa || 0) > 0) {
        await supabase.from(t.table).delete().eq("source_date", f.source_date);
      }

      const r = await remplir(t.table, lignes, f.source_date);
      resultats.push({
        quoi: t.quoi,
        fait: !r.erreur,
        fichier: f.chemin,
        livraison: f.source_date,
        lignes_lues: lignes.length,
        lignes_inserees: r.inseres,
        anciennes_effacees: r.effaces,
        erreur: r.erreur,
      });
    }

    if (resultats.length === 0) {
      return reponse({ erreur: "« quoi » inconnu : organismes | ctp | vm | vmrr" }, 400);
    }

    return reponse({
      route: "urssaf/tables",
      version: 3,
      success: resultats.every(function (r) { return r.fait; }),
      resultats: resultats,
    }, 200);
  }

  return reponse({
    route: "urssaf/tables",
    version: 3,
    ou_deposer_les_fichiers: BUCKET + "/" + DOSSIER,
    source: SOURCE,
    actions: {
      essai: "?action=essai — lit les fichiers sans rien écrire",
      importer: "?action=importer (les quatre) ou &quoi=organismes|ctp|vm|vmrr",
      refaire: "&refaire=oui — réimporte une livraison déjà en base",
      etat: "?action=etat",
    },
    rappel: "Changer &v=… à chaque rappel : Safari garde les réponses.",
  }, 200);
}
