"use client";
import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// SEIZE LANGUES DEPUIS LE 30/08 — LE TROISIEME ENDROIT.
//
// CE QUI A ETE MESURE. Apres la correction de NavBar et de /api/traduire
// le 29/08, les neuf nouvelles langues restaient en francais. La cause
// etait ICI : cette page porte SON PROPRE objet T, ecrit en dur, qui ne
// contenait que sept langues. Sa fonction t() retombe sur le francais pour
// toute langue absente — sans erreur, comme toujours.
//
// C est le TROISIEME endroit qui declare une liste de langues, apres
// LangueSwitcher et NavBar. QUATRE LISTES DOIVENT DESORMAIS RESTER
// ALIGNEES : l objet T de NavBar, le selecteur de NavBar, LANGUES dans
// /api/traduire, et l objet T ci-dessous.
//
// ⚠️ AVANT DE CONCLURE QU UNE LANGUE NE MARCHE PAS, CHERCHER S IL EXISTE
// UN ENIEME OBJET T DANS UNE AUTRE PAGE. Il y en avait un deuxieme, puis
// un troisieme.
//
// LE BANDEAU DES STATISTIQUES DIT DES CHIFFRES VRAIS — 30/08. La ligne
// stat2 (« Competences validees », les ateliers SK) annoncait « 100+ » en
// dur, alors que le catalogue en compte 20. Le chiffre se lit desormais en
// base, depuis le champ ateliers que /api/nombre-formations renvoie deja :
// il montera tout seul a mesure que le catalogue grandit. AUCUNE
// STATISTIQUE INVENTEE, c est la regle de relecture commerciale.
//
// LE BANDEAU FONDATEUR EST DYNAMIQUE ET TRADUIT — 30/08. L ancien texte,
// ecrit en dur et en francais seulement, promettait « -10% a vie » : le
// « a vie » n avait jamais ete decide par Jacques, il est RETIRE. Les
// marqueurs {PCT} et {PLACES} se remplissent depuis textes_site
// (remise_fondateurs_pct, remise_fondateurs_places) dans TOUTES les
// langues. ⚠️ remise_fondateurs_places est un COMPTEUR DE PLACES
// RESTANTES, pas un total : la formulation doit dire « places restantes ».
//
// LE SUR-TITRE est lui aussi traduit dans les seize langues.
// ---------------------------------------------------------------------------
const T = {
  fr: {
    sur_titre: "LA PLATEFORME DE FORMATION IA",
    bandeau_texte: "Offre Fondateur : -{PCT}% pour les {PLACES} places restantes — Réserver ma place",
    hero_titre: "Formez-vous avec votre agent IA personnel",
    hero_sub: "{NB} formations avec certificat AcadeMIA Pro · Agent IA 24h/24 · Séances d accompagnement",
    btn_formations: "Voir les formations",
    btn_ebook: "E-book gratuit",
    btn_demarrer: "Demarrer",
    stat1: "Formations",
    stat2: "Compétences validées",
    stat3: "Accompagnants IA",
    stat4: "Retractation",
    nav_formations: "Formations", nav_séances: "Séances", nav_packs: "Packs", nav_competences: "Compétences", nav_blog: "Blog", nav_contact: "Contact",
    footer_desc: "La plateforme de formation propulsee par l IA. {NB} formations avec certificat AcadeMIA Pro.",
    voir_formation: "Voir la formation", voir_tout: "Voir les {NB} formations", nos_formations: "Nos formations phares",
    nos_formations_sub: "Certificat AcadeMIA Pro · Retractation 14 jours",
    badge_carte: "Certificat AcadeMIA",
  },
  en: {
    sur_titre: "THE AI TRAINING PLATFORM",
    bandeau_texte: "Founder Offer: -{PCT}% for the {PLACES} remaining seats — Reserve my seat",
    hero_titre: "Train with your personal AI agent",
    hero_sub: "{NB} courses with AcadeMIA Pro certificate · AI Agent 24/7 · Support sessions",
    btn_formations: "View courses", btn_ebook: "Free e-book", btn_demarrer: "Get Started",
    stat1: "Courses", stat2: "Validated skills", stat3: "AI Guides", stat4: "Withdrawal period",
    nav_formations: "Courses", nav_séances: "Sessions", nav_packs: "Packs", nav_competences: "Skills", nav_blog: "Blog", nav_contact: "Contact",
    footer_desc: "The AI-powered training platform. {NB} courses with AcadeMIA Pro certificate.",
    voir_formation: "View course", voir_tout: "View all {NB} courses", nos_formations: "Our featured courses",
    nos_formations_sub: "AcadeMIA Pro Certificate · 14-day withdrawal period",
    badge_carte: "AcadeMIA Certificate",
  },
  es: {
    sur_titre: "LA PLATAFORMA DE FORMACIÓN IA",
    bandeau_texte: "Oferta Fundador: -{PCT}% para las {PLACES} plazas restantes — Reservar mi plaza",
    hero_titre: "Formese con su agente IA personal",
    hero_sub: "{NB} cursos con certificado AcadeMIA Pro · Agente IA 24h · Sesiones de acompanamiento",
    btn_formations: "Ver cursos", btn_ebook: "E-book gratis", btn_demarrer: "Comenzar",
    stat1: "Cursos", stat2: "Habilidades validadas", stat3: "Guias IA", stat4: "Derecho de desistimiento",
    nav_formations: "Cursos", nav_séances: "Sesiones", nav_packs: "Packs", nav_competences: "Habilidades", nav_blog: "Blog", nav_contact: "Contacto",
    footer_desc: "La plataforma de formacion impulsada por IA. {NB} cursos con certificado AcadeMIA Pro.",
    voir_formation: "Ver curso", voir_tout: "Ver los {NB} cursos", nos_formations: "Nuestros cursos destacados",
    nos_formations_sub: "Certificado AcadeMIA Pro · Desistimiento 14 dias",
    badge_carte: "Certificado AcadeMIA",
  },
  pt: {
    sur_titre: "A PLATAFORMA DE FORMAÇÃO IA",
    bandeau_texte: "Oferta Fundador: -{PCT}% para as {PLACES} vagas restantes — Reservar minha vaga",
    hero_titre: "Forme-se com seu agente IA pessoal",
    hero_sub: "{NB} cursos com certificado AcadeMIA Pro · Agente IA 24h · Sessoes de acompanhamento",
    btn_formations: "Ver cursos", btn_ebook: "E-book gratuito", btn_demarrer: "Comecar",
    stat1: "Cursos", stat2: "Competencias validadas", stat3: "Guias IA", stat4: "Direito de arrependimento",
    nav_formations: "Cursos", nav_séances: "Sessoes", nav_packs: "Packs", nav_competences: "Competencias", nav_blog: "Blog", nav_contact: "Contato",
    footer_desc: "A plataforma de formacao impulsionada por IA. {NB} cursos com certificado AcadeMIA Pro.",
    voir_formation: "Ver curso", voir_tout: "Ver os {NB} cursos", nos_formations: "Nossos cursos em destaque",
    nos_formations_sub: "Certificado AcadeMIA Pro · Direito de arrependimento 14 dias",
    badge_carte: "Certificado AcadeMIA",
  },
  de: {
    sur_titre: "DIE KI-WEITERBILDUNGSPLATTFORM",
    bandeau_texte: "Gründer-Angebot: -{PCT}% für die {PLACES} verbleibenden Plätze — Platz reservieren",
    hero_titre: "Weiterbilden mit Ihrem personlichen KI-Agenten",
    hero_sub: "{NB} Kurse mit AcadeMIA Pro Zertifikat · KI-Agent 24h · Begleitsitzungen",
    btn_formations: "Kurse ansehen", btn_ebook: "Kostenloses E-Book", btn_demarrer: "Loslegen",
    stat1: "Kurse", stat2: "Validierte Kompetenzen", stat3: "KI-Begleiter", stat4: "Widerrufsrecht",
    nav_formations: "Kurse", nav_séances: "Sitzungen", nav_packs: "Pakete", nav_competences: "Kompetenzen", nav_blog: "Blog", nav_contact: "Kontakt",
    footer_desc: "Die KI-gestutzte Weiterbildungsplattform. {NB} Kurse mit AcadeMIA Pro Zertifikat.",
    voir_formation: "Kurs ansehen", voir_tout: "Alle {NB} Kurse ansehen", nos_formations: "Unsere Top-Kurse",
    nos_formations_sub: "AcadeMIA Pro Zertifikat · 14 Tage Widerrufsrecht",
    badge_carte: "AcadeMIA Zertifikat",
  },
  ar: {
    sur_titre: "منصة التدريب بالذكاء الاصطناعي",
    bandeau_texte: "عرض المؤسسين: خصم {PCT}% للمقاعد الـ{PLACES} المتبقية — احجز مكاني",
    hero_titre: "تدرب مع وكيل الذكاء الاصطناعي الشخصي",
    hero_sub: "{NB} دورة بشهادة AcadeMIA Pro · وكيل ذكاء اصطناعي 24/24 · جلسات مرافقة",
    btn_formations: "عرض الدورات", btn_ebook: "كتاب مجاني", btn_demarrer: "ابدأ",
    stat1: "دورات", stat2: "مهارات معتمدة", stat3: "مرافقون AI", stat4: "حق الانسحاب",
    nav_formations: "الدورات", nav_séances: "الجلسات", nav_packs: "الباقات", nav_competences: "المهارات", nav_blog: "المدونة", nav_contact: "اتصل",
    footer_desc: "منصة التدريب المدعومة بالذكاء الاصطناعي. {NB} دورة بشهادة AcadeMIA Pro.",
    voir_formation: "عرض الدورة", voir_tout: "عرض جميع الدورات {NB}", nos_formations: "دوراتنا المميزة",
    nos_formations_sub: "شهادة AcadeMIA Pro · حق الانسحاب 14 يوماً",
    badge_carte: "شهادة AcadeMIA",
  },
  he: {
    sur_titre: "פלטפורמת ההכשרה בבינה מלאכותית",
    bandeau_texte: "מבצע מייסדים: {PCT}%- עבור {PLACES} המקומות שנותרו — שמור את מקומי",
    hero_titre: "התאמנו עם סוכן הבינה המלאכותית האישי שלכם",
    hero_sub: "{NB} קורסים עם תעודת AcadeMIA Pro · סוכן AI 24/7 · מפגשי ליווי",
    btn_formations: "צפה בקורסים", btn_ebook: "ספר אלקטרוני חינם", btn_demarrer: "התחל",
    stat1: "קורסים", stat2: "מיומנויות מאושרות", stat3: "מלווי AI", stat4: "זכות ביטול",
    nav_formations: "קורסים", nav_séances: "מפגשים", nav_packs: "חבילות", nav_competences: "מיומנויות", nav_blog: "בלוג", nav_contact: "צור קשר",
    footer_desc: "פלטפורמת הכשרה מופעלת בינה מלאכותית. {NB} קורסים עם תעודת AcadeMIA Pro.",
    voir_formation: "צפה בקורס", voir_tout: "צפה בכל {NB} הקורסים", nos_formations: "הקורסים המובילים שלנו",
    nos_formations_sub: "תעודת AcadémIA Pro · זכות ביטול 14 יום",
    badge_carte: "תעודת AcadeMIA",
  },
  it: {
    sur_titre: "LA PIATTAFORMA DI FORMAZIONE IA",
    bandeau_texte: "Offerta Fondatore: -{PCT}% per i {PLACES} posti rimasti — Prenota il mio posto",
    hero_titre: "Formati con il tuo agente IA personale",
    hero_sub: "{NB} corsi con certificato AcadeMIA Pro · Agente IA 24h/24 · Sessioni di accompagnamento",
    btn_formations: "Vedi i corsi", btn_ebook: "E-book gratuito", btn_demarrer: "Inizia",
    stat1: "Corsi", stat2: "Competenze convalidate", stat3: "Guide IA", stat4: "Diritto di recesso",
    nav_formations: "Corsi", nav_séances: "Sessioni", nav_packs: "Pacchetti", nav_competences: "Competenze", nav_blog: "Blog", nav_contact: "Contatti",
    footer_desc: "La piattaforma di formazione basata sull'IA. {NB} corsi con certificato AcadeMIA Pro.",
    voir_formation: "Vedi il corso", voir_tout: "Vedi tutti i {NB} corsi", nos_formations: "I nostri corsi in evidenza",
    nos_formations_sub: "Certificato AcadeMIA Pro · Recesso entro 14 giorni",
    badge_carte: "Certificato AcadeMIA",
  },
  nl: {
    sur_titre: "HET AI-OPLEIDINGSPLATFORM",
    bandeau_texte: "Oprichtersaanbod: -{PCT}% voor de {PLACES} resterende plaatsen — Mijn plaats reserveren",
    hero_titre: "Leer met uw persoonlijke AI-agent",
    hero_sub: "{NB} cursussen met AcadeMIA Pro certificaat · AI-agent 24/7 · Begeleidingssessies",
    btn_formations: "Bekijk cursussen", btn_ebook: "Gratis e-book", btn_demarrer: "Beginnen",
    stat1: "Cursussen", stat2: "Gevalideerde vaardigheden", stat3: "AI-begeleiders", stat4: "Herroepingsrecht",
    nav_formations: "Cursussen", nav_séances: "Sessies", nav_packs: "Pakketten", nav_competences: "Vaardigheden", nav_blog: "Blog", nav_contact: "Contact",
    footer_desc: "Het opleidingsplatform aangedreven door AI. {NB} cursussen met AcadeMIA Pro certificaat.",
    voir_formation: "Bekijk de cursus", voir_tout: "Bekijk alle {NB} cursussen", nos_formations: "Onze topcursussen",
    nos_formations_sub: "AcadeMIA Pro certificaat · 14 dagen herroepingsrecht",
    badge_carte: "AcadeMIA certificaat",
  },
  ru: {
    sur_titre: "ПЛАТФОРМА ОБУЧЕНИЯ С ИИ",
    bandeau_texte: "Предложение основателя: -{PCT}% на оставшиеся {PLACES} мест — Забронировать место",
    hero_titre: "Учитесь с вашим персональным ИИ-агентом",
    hero_sub: "{NB} курсов с сертификатом AcadeMIA Pro · ИИ-агент 24/7 · Сопровождающие занятия",
    btn_formations: "Смотреть курсы", btn_ebook: "Бесплатная книга", btn_demarrer: "Начать",
    stat1: "Курсы", stat2: "Подтверждённые навыки", stat3: "ИИ-наставники", stat4: "Право на возврат",
    nav_formations: "Курсы", nav_séances: "Занятия", nav_packs: "Пакеты", nav_competences: "Навыки", nav_blog: "Блог", nav_contact: "Контакты",
    footer_desc: "Платформа обучения на основе ИИ. {NB} курсов с сертификатом AcadeMIA Pro.",
    voir_formation: "Смотреть курс", voir_tout: "Смотреть все {NB} курсов", nos_formations: "Наши ведущие курсы",
    nos_formations_sub: "Сертификат AcadeMIA Pro · Возврат в течение 14 дней",
    badge_carte: "Сертификат AcadeMIA",
  },
  zh: {
    sur_titre: "AI培训平台",
    bandeau_texte: "创始会员优惠：剩余 {PLACES} 个名额享 {PCT}% 折扣 — 预留名额",
    hero_titre: "与您的专属AI导师一起学习",
    hero_sub: "{NB} 门课程，附AcadeMIA Pro证书 · AI导师全天候在线 · 辅导课程",
    btn_formations: "查看课程", btn_ebook: "免费电子书", btn_demarrer: "开始",
    stat1: "课程", stat2: "已验证技能", stat3: "AI导师", stat4: "退款期限",
    nav_formations: "课程", nav_séances: "辅导课", nav_packs: "套餐", nav_competences: "技能", nav_blog: "博客", nav_contact: "联系我们",
    footer_desc: "AI驱动的培训平台。{NB} 门课程，附AcadeMIA Pro证书。",
    voir_formation: "查看课程", voir_tout: "查看全部 {NB} 门课程", nos_formations: "精选课程",
    nos_formations_sub: "AcadeMIA Pro证书 · 14天退款保障",
    badge_carte: "AcadeMIA证书",
  },
  ja: {
    sur_titre: "AI研修プラットフォーム",
    bandeau_texte: "創設メンバー特典：残り{PLACES}席、{PCT}%オフ — 席を予約する",
    hero_titre: "あなた専属のAIエージェントと学ぶ",
    hero_sub: "{NB} コース、AcadeMIA Pro修了証付き · AIエージェント24時間対応 · 伴走セッション",
    btn_formations: "コースを見る", btn_ebook: "無料電子書籍", btn_demarrer: "はじめる",
    stat1: "コース", stat2: "認定スキル", stat3: "AIガイド", stat4: "返金期間",
    nav_formations: "コース", nav_séances: "セッション", nav_packs: "パック", nav_competences: "スキル", nav_blog: "ブログ", nav_contact: "お問い合わせ",
    footer_desc: "AIを活用した研修プラットフォーム。{NB} コース、AcadeMIA Pro修了証付き。",
    voir_formation: "コースを見る", voir_tout: "全 {NB} コースを見る", nos_formations: "注目のコース",
    nos_formations_sub: "AcadeMIA Pro修了証 · 14日間の返金保証",
    badge_carte: "AcadeMIA修了証",
  },
  ko: {
    sur_titre: "AI 교육 플랫폼",
    bandeau_texte: "창립 멤버 혜택: 남은 {PLACES}자리 {PCT}% 할인 — 자리 예약하기",
    hero_titre: "나만의 AI 에이전트와 함께 배우세요",
    hero_sub: "AcadeMIA Pro 수료증이 있는 {NB}개 강좌 · AI 에이전트 연중무휴 · 동반 세션",
    btn_formations: "강좌 보기", btn_ebook: "무료 전자책", btn_demarrer: "시작하기",
    stat1: "강좌", stat2: "검증된 역량", stat3: "AI 가이드", stat4: "환불 기간",
    nav_formations: "강좌", nav_séances: "세션", nav_packs: "패키지", nav_competences: "역량", nav_blog: "블로그", nav_contact: "문의",
    footer_desc: "AI 기반 교육 플랫폼. AcadeMIA Pro 수료증이 있는 {NB}개 강좌.",
    voir_formation: "강좌 보기", voir_tout: "{NB}개 강좌 모두 보기", nos_formations: "추천 강좌",
    nos_formations_sub: "AcadeMIA Pro 수료증 · 14일 환불 보장",
    badge_carte: "AcadeMIA 수료증",
  },
  tr: {
    sur_titre: "YAPAY ZEKA EĞİTİM PLATFORMU",
    bandeau_texte: "Kurucu Teklifi: kalan {PLACES} yer için -%{PCT} — Yerimi ayırt",
    hero_titre: "Kişisel yapay zeka ajanınızla öğrenin",
    hero_sub: "AcadeMIA Pro sertifikalı {NB} kurs · 7/24 yapay zeka ajanı · Eşlik seansları",
    btn_formations: "Kursları gör", btn_ebook: "Ücretsiz e-kitap", btn_demarrer: "Başla",
    stat1: "Kurslar", stat2: "Onaylanmış beceriler", stat3: "YZ rehberleri", stat4: "Cayma hakkı",
    nav_formations: "Kurslar", nav_séances: "Seanslar", nav_packs: "Paketler", nav_competences: "Beceriler", nav_blog: "Blog", nav_contact: "İletişim",
    footer_desc: "Yapay zeka destekli eğitim platformu. AcadeMIA Pro sertifikalı {NB} kurs.",
    voir_formation: "Kursu gör", voir_tout: "Tüm {NB} kursu gör", nos_formations: "Öne çıkan kurslarımız",
    nos_formations_sub: "AcadeMIA Pro sertifikası · 14 gün cayma hakkı",
    badge_carte: "AcadeMIA sertifikası",
  },
  pl: {
    sur_titre: "PLATFORMA SZKOLENIOWA AI",
    bandeau_texte: "Oferta Założycielska: -{PCT}% na {PLACES} pozostałych miejsc — Rezerwuję miejsce",
    hero_titre: "Ucz się z osobistym agentem AI",
    hero_sub: "{NB} kursów z certyfikatem AcadeMIA Pro · Agent AI 24/7 · Sesje towarzyszące",
    btn_formations: "Zobacz kursy", btn_ebook: "Darmowy e-book", btn_demarrer: "Zacznij",
    stat1: "Kursy", stat2: "Potwierdzone umiejętności", stat3: "Przewodnicy AI", stat4: "Prawo odstąpienia",
    nav_formations: "Kursy", nav_séances: "Sesje", nav_packs: "Pakiety", nav_competences: "Umiejętności", nav_blog: "Blog", nav_contact: "Kontakt",
    footer_desc: "Platforma szkoleniowa oparta na AI. {NB} kursów z certyfikatem AcadeMIA Pro.",
    voir_formation: "Zobacz kurs", voir_tout: "Zobacz wszystkie {NB} kursów", nos_formations: "Nasze polecane kursy",
    nos_formations_sub: "Certyfikat AcadeMIA Pro · 14 dni na odstąpienie",
    badge_carte: "Certyfikat AcadeMIA",
  },
  el: {
    sur_titre: "Η ΠΛΑΤΦΟΡΜΑ ΕΚΠΑΙΔΕΥΣΗΣ ΤΝ",
    bandeau_texte: "Προσφορά Ιδρυτών: -{PCT}% για τις {PLACES} θέσεις που απομένουν — Κράτηση θέσης",
    hero_titre: "Εκπαιδευτείτε με τον προσωπικό σας πράκτορα ΤΝ",
    hero_sub: "{NB} μαθήματα με πιστοποιητικό AcadeMIA Pro · Πράκτορας ΤΝ 24/7 · Συνεδρίες υποστήριξης",
    btn_formations: "Δείτε τα μαθήματα", btn_ebook: "Δωρεάν e-book", btn_demarrer: "Ξεκινήστε",
    stat1: "Μαθήματα", stat2: "Επικυρωμένες δεξιότητες", stat3: "Οδηγοί ΤΝ", stat4: "Δικαίωμα υπαναχώρησης",
    nav_formations: "Μαθήματα", nav_séances: "Συνεδρίες", nav_packs: "Πακέτα", nav_competences: "Δεξιότητες", nav_blog: "Ιστολόγιο", nav_contact: "Επικοινωνία",
    footer_desc: "Η πλατφόρμα εκπαίδευσης με τεχνητή νοημοσύνη. {NB} μαθήματα με πιστοποιητικό AcadeMIA Pro.",
    voir_formation: "Δείτε το μάθημα", voir_tout: "Δείτε και τα {NB} μαθήματα", nos_formations: "Τα κορυφαία μαθήματά μας",
    nos_formations_sub: "Πιστοποιητικό AcadeMIA Pro · Υπαναχώρηση 14 ημερών",
    badge_carte: "Πιστοποιητικό AcadeMIA",
  },
};

export default function HomePage() {
  const [nbFormations, setNbFormations] = useState(0);
  const [nbAteliers, setNbAteliers] = useState(0);
  const [dyn, setDyn] = useState({});

  useEffect(() => {
    fetch("/api/nombre-formations").then(r => r.json()).then(d => {
      if (d.success) {
        setNbFormations(d.total);
        setNbAteliers(d.ateliers || 0);
      }
    }).catch(() => {});
    fetch("/api/textes").then(r => r.json()).then(d => { if (d && d.ok && d.textes) setDyn(d.textes); }).catch(() => {});
  }, []);

  const [langue, setLangue] = useState("fr");

  useEffect(() => {
    const saved = localStorage.getItem("langue") || "fr";
    setLangue(saved);
  }, []);

  // LES CHIFFRES SE LISENT EN BASE, JAMAIS EN DUR.
  // {NB} = formations actives, {PCT} et {PLACES} = offre fondateur depuis
  // textes_site. On n affiche rien tant que la base n a pas repondu : un
  // blanc vaut mieux qu un chiffre faux. {PCT} et {PLACES} se remplissent
  // dans TOUTES les langues, seuls les textes sont traduits a la main.
  const t = (cle) => {
    const base = (langue === "fr" && dyn[cle]) ? dyn[cle] : (T[langue]?.[cle] || T["fr"][cle] || cle);
    return String(base)
      .replace("{NB}", nbFormations ? String(nbFormations) : "")
      .replace("{PCT}", dyn["remise_fondateurs_pct"] ? String(dyn["remise_fondateurs_pct"]) : "")
      .replace("{PLACES}", dyn["remise_fondateurs_places"] ? String(dyn["remise_fondateurs_places"]) : "");
  };

  function changerLangue(l) {
    localStorage.setItem("langue", l);
    setLangue(l);
    window.location.reload();
  }

  // AUCUN EN-TETE ICI. La barre de navigation vit dans components/NavBar,
  // servie par le layout sur toutes les pages. Le 14 aout, une seconde barre
  // a ete ajoutee ici par erreur : les deux se sont affichees l une sous
  // l autre. Chercher avant de creer, y compris pour un en-tete.

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", direction: langue === "he" || langue === "ar" ? "rtl" : "ltr" }}>
      <a href="/lancement" data-bandeau-fondateur style={{display:"block",textAlign:"center",padding:"10px 16px",background:"linear-gradient(90deg,#a07840,#c8a96e,#a07840)",color:"#050508",fontWeight:"bold",fontSize:"14px",textDecoration:"none"}}>{t("bandeau_texte")}</a>

      <section style={{ padding: "100px 40px", textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "15px", letterSpacing: "4px", margin: "0 0 24px" }}>{t("sur_titre")}</p>
        <h1 style={{ fontSize: "52px", fontWeight: "bold", margin: "0 0 24px", lineHeight: "1.2" }}>{t("hero_titre")}</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px", margin: "0 0 40px", lineHeight: "1.7" }}>{t("hero_sub")}</p>
              <video controls autoPlay muted loop playsInline style={{ width: "100%", maxWidth: "480px", borderRadius: "16px", border: "1px solid rgba(200,169,110,0.3)", marginBottom: "32px" }}>
                <source src="https://kpxrbwsbhmggoajtxzqn.supabase.co/storage/v1/object/public/videos_marketing/camille_moreau_video1.mp4" type="video/mp4" />
              </video>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/catalogue" style={{ background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", padding: "16px 36px", borderRadius: "10px", textDecoration: "none", fontSize: "16px", fontWeight: "bold" }}>{t("btn_formations")}</a>
          <a href="/lead-magnets/ebook" style={{ background: "transparent", color: "#c8a96e", padding: "16px 36px", borderRadius: "10px", textDecoration: "none", fontSize: "16px", border: "1px solid #c8a96e" }}>{t("btn_ebook")}</a>
        </div>
      </section>

      <section style={{ background: "#1a1a2e", padding: "60px 40px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px", textAlign: "center" }}>
          {[{ nb: nbFormations ? String(nbFormations) : "…", label: t("stat1") }, { nb: nbAteliers ? String(nbAteliers) : "…", label: t("stat2") }, { nb: "5", label: t("stat3") }, { nb: "14j", label: t("stat4") }].map((s) => (
            <div key={s.label}>
              <p style={{ color: "#c8a96e", fontSize: "40px", fontWeight: "bold", margin: "0 0 8px" }}>{s.nb}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CE QUE NOUS VENDONS AUX PROFESSIONNELS. Cette section n existait
          pas : la vitrine ne montrait que le catalogue grand public, alors
          que le pack organisme se vend 390 EUR par mois. */}
      <section style={{ padding: "80px 40px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "44px" }}>
          <p style={{ color: "#c8a96e", fontSize: "15px", letterSpacing: "3px", margin: "0 0 12px" }}>POUR LES PROFESSIONNELS</p>
          <h2 style={{ fontSize: "36px", margin: "0 0 12px" }}>Nos solutions métier</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px" }}>
            Organismes de formation, cabinets comptables, équipes commerciales.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
          {[
            { titre: "Pack organisme", sous: "Le catalogue, la plateforme et l'administratif sous votre marque.", href: "/pack" },
            { titre: "Mr. Qualiopi", sous: "Les 32 indicateurs, vos preuves, votre dossier d'audit.", href: "/qualiopi" },
            { titre: "Le CRM", sous: "Vos prospects suivis, analysés et relancés.", href: "/espace-prive?p=crm" },
            { titre: "Plateforme d'apprentissage (LMS)", sous: "Vos formations, vos stagiaires, vos attestations.", href: "/espace-prive?p=lms" },
          ].map((s) => (
            <a
              key={s.titre}
              href={s.href}
              style={{ background: "#1a1a2e", borderRadius: "12px", padding: "26px 24px", border: "1px solid rgba(200,169,110,0.3)", textDecoration: "none", display: "block" }}
            >
              <h3 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 10px" }}>{s.titre}</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14.5px", lineHeight: "1.7", margin: 0 }}>{s.sous}</p>
            </a>
          ))}
        </div>
      </section>

      <section style={{ padding: "80px 40px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "15px", letterSpacing: "3px", margin: "0 0 12px" }}>CATALOGUE</p>
          <h2 style={{ fontSize: "36px", margin: "0 0 12px" }}>{t("nos_formations")}</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px" }}>{t("nos_formations_sub")}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {[
            { code: "F128", titre: "Expert Claude et IA Generative", prix: "690€", cat: "IA" },
            { code: "F129", titre: "No-Code et Automatisation IA", prix: "790€", cat: "IA" },
            { code: "F130", titre: "Apps Natives avec IA", prix: "990€", cat: "IA" },
            { code: "F235", titre: "Marketing Digital x IA", prix: "890€", cat: "Marketing" },
            { code: "F001", titre: "Management et Leadership", prix: "490€", cat: "Business" },
            { code: "F003", titre: "Gestion du Stress et Bien-etre", prix: "390€", cat: "Bien-etre" },
          ].map((f) => (
            <div key={f.code} style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "#c8a96e", fontSize: "14px" }}>{f.code}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>{f.cat}</span>
              </div>
              <h3 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px", lineHeight: "1.4" }}>{f.titre}</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold" }}>{f.prix}</span>
                <span style={{ background: "#050508", color: "#c8a96e", padding: "3px 10px", borderRadius: "12px", fontSize: "13px" }}>{t("badge_carte")}</span>
              </div>
              <a href={"/formation/" + f.code.toLowerCase()} style={{ display: "block", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: "bold", textAlign: "center", textDecoration: "none" }}>{t("voir_formation")}</a>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <a href="/catalogue" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "15px", border: "1px solid #c8a96e", padding: "12px 32px", borderRadius: "8px" }}>{t("voir_tout")}</a>
        </div>
      </section>

      <footer style={{ background: "#050508", borderTop: "1px solid rgba(200,169,110,0.2)", padding: "60px 40px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px", marginBottom: "40px" }}>
          <div>
            <h3 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 16px" }}>AcadémIA Pro</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: "1.7", margin: "0" }}>{t("footer_desc")}</p>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px" }}>{t("nav_formations")}</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/catalogue" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Catalogue complet</a>
              <a href="/catalogue" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Nos packs</a>
              <a href="/tarifs" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Tarifs</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px" }}>Professionnels</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/pack" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Pack organisme</a>
              <a href="/qualiopi" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Mr. Qualiopi</a>
              <a href="/espace-prive?p=crm" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Le CRM</a>
              <a href="/espace-prive?p=lms" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Plateforme d apprentissage (LMS)</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px" }}>{t("nav_séances")}</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/seances" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Toutes les specialites</a>
              <a href="/abonnements" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Abonnements</a>
              <a href="/classe-virtuelle" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Classes virtuelles</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px" }}>Ressources</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/blog" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>{t("nav_blog")}</a>
              <a href="/faq" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>FAQ</a>
              <a href="/communaute" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Communaute</a>
              <a href="/a-propos" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>A propos</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px" }}>Legal</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/cgv" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>CGV</a>
              <a href="/politique-confidentialite" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Confidentialite</a>
              <a href="/mentions-legales" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Mentions legales</a>
              <a href="/garantie" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Droit de retractation</a>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(200,169,110,0.1)", paddingTop: "24px", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "15px", margin: "0" }}>© 2026 AcadémIA Pro · Certificat AcadémIA Pro · Tous droits reserves</p>
        </div>
      </footer>

    </div>
  );
}
