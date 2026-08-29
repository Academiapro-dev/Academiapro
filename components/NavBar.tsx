"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// ---------------------------------------------------------------------------
// 🚨🚨 SEIZE LANGUES DEPUIS LE 29/08 — ET LA LISTE EST ICI, PAS AILLEURS.
//
// CE QUI A ETE MESURE CE JOUR-LA. Le selecteur affichait sept langues. On a
// d abord corrige components/LangueSwitcher.tsx, sans effet : CE FICHIER
// N EST PAS CELUI QUI COMMANDE LA BARRE. Le vrai selecteur est la liste
// d options plus bas, ecrite en dur.
//
// ⚠️ IL EXISTE DONC DEUX COMPOSANTS DE LANGUE DANS LE DEPOT. LangueSwitcher
// porte un contexte React et une liste ; NavBar porte SA PROPRE liste et son
// propre selecteur. C est CELLE DE NAVBAR qui s affiche. Modifier l autre ne
// change rien a ce que voit le visiteur.
//
// TROIS LISTES DOIVENT RESTER IDENTIQUES :
//   1. l objet T ci-dessous          (les libelles des menus)
//   2. la liste d options du select  (ce que le visiteur choisit)
//   3. LANGUES dans /api/traduire    (ce que la route sait traduire)
// Une langue presente dans l une et absente d une autre s affiche en
// francais, sans le moindre message d erreur.
//
// COMMENT LE RESTE DU SITE SE TRADUIT : les menus sont ecrits a la main
// ici, le reste passe par /api/traduire — chaque texte traduit LA PREMIERE
// FOIS qu un visiteur l affiche, puis range dans traductions_interface. La
// fois suivante il est lu depuis la base, sans appel ni cout.
// ---------------------------------------------------------------------------
const T = {
  fr: { formations: "Formations", seances: "Séances", blog: "Blog", tarifs: "Tarifs", contact: "Contact", connexion: "Se connecter", demarrer: "Démarrer", solutions: "Nos solutions", espacePro: "Espace pro" },
  en: { formations: "Courses", seances: "Sessions", blog: "Blog", tarifs: "Pricing", contact: "Contact", connexion: "Sign in", demarrer: "Get Started", solutions: "Our solutions", espacePro: "Pro area" },
  es: { formations: "Cursos", seances: "Sesiones", blog: "Blog", tarifs: "Precios", contact: "Contacto", connexion: "Iniciar sesión", demarrer: "Comenzar", solutions: "Soluciones", espacePro: "Área pro" },
  pt: { formations: "Cursos", seances: "Sessoes", blog: "Blog", tarifs: "Preços", contact: "Contato", connexion: "Entrar", demarrer: "Comecar", solutions: "Soluções", espacePro: "Área pro" },
  de: { formations: "Kurse", seances: "Sitzungen", blog: "Blog", tarifs: "Preise", contact: "Kontakt", connexion: "Anmelden", demarrer: "Loslegen", solutions: "Lösungen", espacePro: "Pro-Bereich" },
  ar: { formations: "الدورات", seances: "الجلسات", blog: "المدونة", tarifs: "الأسعار", contact: "اتصل", connexion: "تسجيل الدخول", demarrer: "ابدأ", solutions: "حلولنا", espacePro: "مساحة احترافية" },
  he: { formations: "קורסים", seances: "פגישות", blog: "בלוג", tarifs: "מחירים", contact: "צור קשר", connexion: "התחברות", demarrer: "התחל", solutions: "הפתרונות שלנו", espacePro: "אזור מקצועי" },
  it: { formations: "Corsi", seances: "Sessioni", blog: "Blog", tarifs: "Prezzi", contact: "Contatti", connexion: "Accedi", demarrer: "Inizia", solutions: "Le nostre soluzioni", espacePro: "Area pro" },
  nl: { formations: "Cursussen", seances: "Sessies", blog: "Blog", tarifs: "Tarieven", contact: "Contact", connexion: "Inloggen", demarrer: "Beginnen", solutions: "Onze oplossingen", espacePro: "Pro-ruimte" },
  ru: { formations: "Курсы", seances: "Занятия", blog: "Блог", tarifs: "Цены", contact: "Контакты", connexion: "Войти", demarrer: "Начать", solutions: "Наши решения", espacePro: "Проф. кабинет" },
  zh: { formations: "课程", seances: "辅导课", blog: "博客", tarifs: "价格", contact: "联系我们", connexion: "登录", demarrer: "开始", solutions: "我们的方案", espacePro: "专业版" },
  ja: { formations: "コース", seances: "セッション", blog: "ブログ", tarifs: "料金", contact: "お問い合わせ", connexion: "ログイン", demarrer: "はじめる", solutions: "ソリューション", espacePro: "プロ向け" },
  ko: { formations: "강좌", seances: "세션", blog: "블로그", tarifs: "요금", contact: "문의", connexion: "로그인", demarrer: "시작하기", solutions: "솔루션", espacePro: "프로 공간" },
  tr: { formations: "Kurslar", seances: "Seanslar", blog: "Blog", tarifs: "Fiyatlar", contact: "İletişim", connexion: "Giriş yap", demarrer: "Başla", solutions: "Çözümlerimiz", espacePro: "Pro alan" },
  pl: { formations: "Kursy", seances: "Sesje", blog: "Blog", tarifs: "Cennik", contact: "Kontakt", connexion: "Zaloguj się", demarrer: "Zacznij", solutions: "Nasze rozwiązania", espacePro: "Strefa pro" },
  el: { formations: "Μαθήματα", seances: "Συνεδρίες", blog: "Ιστολόγιο", tarifs: "Τιμές", contact: "Επικοινωνία", connexion: "Σύνδεση", demarrer: "Ξεκινήστε", solutions: "Οι λύσεις μας", espacePro: "Χώρος pro" },
};

// LA LISTE DU SELECTEUR. Elle suit exactement l ordre de l objet T.
//
// L ORDRE N EST PAS ALPHABETIQUE. Les sept premieres sont celles dont les
// fiches de formation sont deja traduites en base (formations_traductions) :
// elles rendent une experience complete des le premier clic. Les neuf
// autres traduisent l interface, les fiches suivront.
const LANGUES = [
  { code: "fr", drapeau: "🇫🇷", label: "FR" },
  { code: "en", drapeau: "🇬🇧", label: "EN" },
  { code: "es", drapeau: "🇪🇸", label: "ES" },
  { code: "pt", drapeau: "🇧🇷", label: "PT" },
  { code: "de", drapeau: "🇩🇪", label: "DE" },
  { code: "ar", drapeau: "🇸🇦", label: "AR" },
  { code: "he", drapeau: "🇮🇱", label: "HE" },
  { code: "it", drapeau: "🇮🇹", label: "IT" },
  { code: "nl", drapeau: "🇳🇱", label: "NL" },
  { code: "ru", drapeau: "🇷🇺", label: "RU" },
  { code: "zh", drapeau: "🇨🇳", label: "ZH" },
  { code: "ja", drapeau: "🇯🇵", label: "JA" },
  { code: "ko", drapeau: "🇰🇷", label: "KO" },
  { code: "tr", drapeau: "🇹🇷", label: "TR" },
  { code: "pl", drapeau: "🇵🇱", label: "PL" },
  { code: "el", drapeau: "🇬🇷", label: "EL" },
];

// Les langues qui s ecrivent de droite a gauche.
//
// VERIFIE LE 29/08 SUR L ARABE : la mise en page bascule deja correctement,
// logo a droite, menu inverse, boutons a gauche. On pose neanmoins
// l attribut sur la balise html plutot que de laisser le navigateur le
// deduire caractere par caractere.
const DROITE_A_GAUCHE = ["ar", "he"];

// LE MENU DEROULANT DES SOLUTIONS METIER.
//
// Chaque entree mene a SA PROPRE PAGE VITRINE, publique et redigee pour
// etre trouvee dans un moteur de recherche. L outil, lui, reste derriere la
// session : c est « Espace pro » qui y mene.
//
// LA DISTINCTION EST DEMANDEE PAR JACQUES : « CRM » et « LMS » decrivent le
// produit a qui ne le connait pas ; « Espace pro » ouvre la porte a qui est
// deja client. Sans elle, un visiteur pouvait croire que la page reservee
// etait tout ce qui existait.
const SOLUTIONS = [
  { nom: "Pour les organismes de formation", href: "/pack" },
  { nom: "Mr. Qualiopi", href: "/qualiopi" },
  { nom: "Le CRM", href: "/crm" },
  { nom: "La plateforme d'apprentissage (LMS)", href: "/plateforme-apprentissage" },
  { nom: "Mr. Comptable", href: "/comptable" },
];

// 🚨 L ESPACE COMPTABLE PORTE DEUX ADRESSES — 25/08.
//
// /admin/comptable est l adresse VISIBLE, celle que lit un cabinet dans sa
// barre. /admin/compliance est le dossier REEL, ou vivent les trente
// ecrans. Le middleware reecrit la premiere vers la seconde.
//
// ⚠️ LES DEUX DOIVENT FIGURER ICI. Cette liste decide de l affichage de la
// barre comptable : si l alias en etait absent, un cabinet arrivant par
// /admin/comptable verrait la barre de la vitrine AcadeMIA Pro sur son
// espace de travail — exactement ce qu on cherche a eviter.
//
// LES LIENS CI-DESSOUS POINTENT TOUS VERS L ALIAS : un cabinet qui navigue
// ne doit jamais voir « compliance » reapparaitre dans son adresse.
const ESPACE_COMPTABLE = "/admin/comptable";

const CHEMINS_COMPTABLE = [
  "/admin/comptable",
  "/admin/compliance",
  "/admin/mr-comptable",
];

// LES PAGES PUBLIQUES DE MRCOMPTABLE.FR.
//
// Elles portent DEJA leur propre en-tete. Tester le chemin ne suffit pas :
// le middleware sert /comptable/tenue sous mrcomptable.fr/tenue, et le
// chemin vu ici est alors « /tenue ». On teste donc le DOMAINE.
const PAGES_PUBLIQUES_COMPTABLE = [
  "/",
  "/inscription",
  "/facture-electronique",
  "/rapprochement-bancaire",
  "/lecture-des-pieces",
  "/tenue",
  "/declarations",
  "/relance-justificatifs",
  "/blog",
  "/contact",
  "/cgv",
  "/mentions",
];

const LOGO_COMPTABLE = "/IMG_4100.jpeg";

function estComptable(chemin) {
  for (const p of CHEMINS_COMPTABLE) {
    if (chemin === p || chemin.indexOf(p + "/") === 0) return true;
  }
  return false;
}

function estPagePubliqueComptable(chemin) {
  for (const p of PAGES_PUBLIQUES_COMPTABLE) {
    if (chemin === p) return true;
    if (p !== "/" && chemin.indexOf(p + "/") === 0) return true;
  }
  return false;
}

export default function NavBar() {
  const [langue, setLangue] = useState("fr");
  const [hote, setHote] = useState("");
  const chemin = usePathname() || "";

  useEffect(() => {
    const saved = localStorage.getItem("langue") || "fr";
    setLangue(saved);
    appliquerSens(saved);
    setHote(window.location.hostname.toLowerCase());
  }, []);

  // Le sens d ecriture se pose sur la balise html, la ou le navigateur
  // l attend.
  function appliquerSens(l) {
    if (typeof document === "undefined") return;
    const rtl = DROITE_A_GAUCHE.indexOf(l) >= 0;
    document.documentElement.setAttribute("dir", rtl ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", l);
  }

  function changerLangue(l) {
    localStorage.setItem("langue", l);
    setLangue(l);
    appliquerSens(l);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", l);
    window.location.href = url.toString();
  }

  const t = (cle) => T[langue]?.[cle] || T["fr"][cle] || cle;

  const surMrComptable = hote.indexOf("mrcomptable.fr") >= 0;

  if (chemin.indexOf("/of/") === 0) return null;
  if (chemin === "/comptable" || chemin.indexOf("/comptable/") === 0) return null;
  if (surMrComptable && estPagePubliqueComptable(chemin)) return null;

  const barre = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 40px",
    background: "rgba(5,5,8,0.95)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(200,169,110,0.15)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  };

  const lienMarque = {
    color: "#c8a96e",
    fontFamily: "Georgia,serif",
    fontSize: "20px",
    fontWeight: "bold",
    textDecoration: "none",
  };

  const lienMenu = {
    color: "rgba(255,255,255,0.7)",
    textDecoration: "none",
    fontSize: "14px",
    whiteSpace: "nowrap",
  };

  // ---- Espace de travail comptable ---------------------------------------
  if (estComptable(chemin) || surMrComptable) {
    return (
      <header style={{ ...barre, padding: "0 30px", background: "#000" }}>
        <a
          href={ESPACE_COMPTABLE + "/tableau-de-bord"}
          style={{ display: "block", textDecoration: "none", flexShrink: 0, overflow: "hidden", lineHeight: 0 }}
        >
          <img
            src={LOGO_COMPTABLE}
            alt="Mr. Comptable"
            style={{
              width: "400px",
              maxWidth: "40vw",
              height: "auto",
              display: "block",
              margin: "-4px",
              clipPath: "inset(4px)",
            }}
          />
        </a>
        <nav style={{ display: "flex", gap: "18px", flexWrap: "wrap", justifyContent: "center" }}>
          <a href={ESPACE_COMPTABLE + "/tableau-de-bord"} style={lienMenu}>Tableau de bord</a>
          <a href={ESPACE_COMPTABLE + "/societes"} style={lienMenu}>Mes dossiers</a>
          <a href={ESPACE_COMPTABLE + "/saisie"} style={lienMenu}>Saisie</a>
          <a href={ESPACE_COMPTABLE + "/pieces"} style={lienMenu}>Pièces</a>
          <a href={ESPACE_COMPTABLE + "/acces-clients"} style={lienMenu}>Espaces clients</a>
          <a href={ESPACE_COMPTABLE + "/tva"} style={lienMenu}>TVA</a>
          <a href={ESPACE_COMPTABLE + "/teledec"} style={lienMenu}>Télétransmissions</a>
        </nav>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
          <a href={ESPACE_COMPTABLE + "/ma-societe"} style={{ color: "#c8a96e", border: "1px solid rgba(200,169,110,0.45)", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" }}>
            Mon cabinet
          </a>
        </div>
      </header>
    );
  }

  // ---- Vitrine AcadéMIA Pro ---------------------------------------------
  return (
    <header style={barre}>
      <a href="/" style={lienMarque}>
        AcadémIA Pro
      </a>
      <nav style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
        <a href={"/catalogue?lang=" + langue} style={lienMenu}>{t("formations")}</a>
        <a href={"/seances?lang=" + langue} style={lienMenu}>{t("seances")}</a>
        <a href="/blog" style={lienMenu}>{t("blog")}</a>
        <a href="/tarifs" style={lienMenu}>{t("tarifs")}</a>
        <a href="/contact" style={lienMenu}>{t("contact")}</a>

        {/* Le menu deroulant est en CSS pur — details et summary — pour ne
            dependre d aucun etat : il fonctionne meme si le JavaScript
            n a pas encore ete charge. */}
        <details style={{ position: "relative" }}>
          <summary style={{ ...lienMenu, color: "#c8a96e", cursor: "pointer", listStyle: "none", fontWeight: "bold" }}>
            {t("solutions")} ▾
          </summary>
          <div style={{
            position: "absolute",
            top: "26px",
            left: 0,
            background: "#0d0d16",
            border: "1px solid rgba(200,169,110,0.3)",
            borderRadius: "10px",
            padding: "10px 0",
            minWidth: "290px",
            zIndex: 100,
          }}>
            {SOLUTIONS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                style={{ display: "block", padding: "9px 20px", color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: "14.5px", whiteSpace: "nowrap" }}
              >
                {s.nom}
              </a>
            ))}
          </div>
        </details>

        <a href="/espace-prive" style={lienMenu}>{t("espacePro")}</a>
        <a href="/admin" style={{ ...lienMenu, color: "#c8a96e", fontWeight: "bold" }}>Admin</a>
      </nav>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        {/* 🚨 LE SELECTEUR SE CONSTRUIT DEPUIS LA LISTE, il n est plus ecrit
            en dur. Ajouter une langue se fait donc en UN SEUL endroit ici —
            plus le tableau T juste au-dessus, et la route /api/traduire. */}
        <select
          value={langue}
          onChange={e => changerLangue(e.target.value)}
          style={{ background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.4)", color: "#c8a96e", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}
        >
          {LANGUES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.drapeau} {l.label}
            </option>
          ))}
        </select>
        <a href="/connexion" style={{ color: "#c8a96e", border: "1px solid rgba(200,169,110,0.45)", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" }}>
          {t("connexion")}
        </a>
        <a href="/login" style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", color: "#050508", padding: "8px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" }}>
          {t("demarrer")}
        </a>
      </div>
    </header>
  );
}
