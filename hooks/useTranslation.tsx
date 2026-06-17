"use client";
import { useState, useEffect } from "react";

const TRANSLATIONS: Record<string, any> = {
  fr: {
    nav: { formations: "Formations", seances: "Séances", packs: "Packs", competences: "Compétences", blog: "Blog", contact: "Contact", demarrer: "Démarrer" },
    home: { hero_titre: "Formez-vous avec votre agent IA personnel", hero_sub: "235 formations certifiantes · Agent IA 24h/24 · Séances thérapeutiques", btn_formations: "Voir les formations", btn_ebook: "E-book gratuit", stat1: "Formations certifiantes", stat2: "Compétences validées", stat3: "Thérapeutes IA", stat4: "Garantie satisfait" },
    catalogue: { titre: "Catalogue AcadémIA Pro", rechercher: "Rechercher une formation...", resultats: "résultats", chargement: "Chargement...", aucune: "Aucune formation trouvée", formations: "formations disponibles", tous: "Tous" },
    seances: { titre: "Séances Thérapeutiques", sous_titre: "Choisissez votre thérapeute · Disponible maintenant · 24h/24", commencer: "Commencer la séance", changer: "Changer de thérapeute", envoyer: "Envoyer", placeholder: "Parlez à", disponible: "En direct", avertissement: "Ces séances sont des simulations IA à des fins de bien-être. En cas de crise, contactez le 15 ou le 3114." },
    formation: { elearning: "E-Learning", elearning_sub: "Asynchrone · À votre rythme", coach: "Coach IA 24h/24", coach_sub: "Questions par chat · Immédiat", classe: "Classe Virtuelle", classe_sub: "Live · Mardis et Jeudis 20h", objectifs: "Objectifs", prerequis: "Prérequis", public_cible: "Public cible", programme: "Programme complet", acheter: "Acheter", pret: "Prêt à commencer ?", acces: "Accès immédiat · Agent IA 24h/24 · Garantie 30 jours", coach_btn: "Accéder au Coach IA", classe_btn: "Rejoindre une Classe Live", niveau: "Niveau" },
    inscription: { titre: "Rejoignez la Liste Prioritaire", sous_titre: "Soyez parmi les premiers à accéder à AcadémIA Pro", nom: "Votre nom", email: "Votre email", btn: "Rejoindre la liste", merci: "Merci ! Vous êtes sur la liste." },
    blog: { titre: "Blog AcadémIA Pro", sous_titre: "Articles sur l IA, la formation et le bien-être", lire: "Lire →", bientot: "Bientôt" },
    footer: { desc: "La plateforme de formation propulsée par l IA. 235 formations certifiantes.", copyright: "© 2026 AcadémIA Pro · Certification AcadémIA Pro · Tous droits réservés" },
    dashboard: { titre: "Mon Espace Apprenant", bienvenue: "Bienvenue", mes_formations: "Mes formations", progression: "Ma progression", certificats: "Mes certificats", coach: "Coach IA", deconnexion: "Déconnexion" }
  },
  en: {
    nav: { formations: "Courses", seances: "Sessions", packs: "Packs", competences: "Skills", blog: "Blog", contact: "Contact", demarrer: "Get Started" },
    home: { hero_titre: "Learn with your personal AI agent", hero_sub: "235 certified courses · AI tutor 24/7 · Therapeutic sessions", btn_formations: "View courses", btn_ebook: "Free e-book", stat1: "Certified courses", stat2: "Validated skills", stat3: "AI Therapists", stat4: "Satisfaction guarantee" },
    catalogue: { titre: "AcadémIA Pro Catalog", rechercher: "Search for a course...", resultats: "results", chargement: "Loading...", aucune: "No course found", formations: "courses available", tous: "All" },
    seances: { titre: "Therapeutic Sessions", sous_titre: "Choose your therapist · Available now · 24/7", commencer: "Start session", changer: "Change therapist", envoyer: "Send", placeholder: "Talk to", disponible: "Live", avertissement: "These sessions are AI simulations for wellness purposes. In case of crisis, contact emergency services." },
    formation: { elearning: "E-Learning", elearning_sub: "Asynchronous · At your own pace", coach: "AI Coach 24/7", coach_sub: "Chat questions · Instant", classe: "Virtual Class", classe_sub: "Live · Tuesdays and Thursdays 8pm", objectifs: "Objectives", prerequis: "Prerequisites", public_cible: "Target audience", programme: "Full program", acheter: "Buy now", pret: "Ready to start?", acces: "Immediate access · AI Agent 24/7 · 30-day guarantee", coach_btn: "Access AI Coach", classe_btn: "Join a Live Class", niveau: "Level" },
    inscription: { titre: "Join the Priority List", sous_titre: "Be among the first to access AcadémIA Pro", nom: "Your name", email: "Your email", btn: "Join the list", merci: "Thank you! You are on the list." },
    blog: { titre: "AcadémIA Pro Blog", sous_titre: "Articles on AI, training and wellness", lire: "Read →", bientot: "Coming soon" },
    footer: { desc: "The AI-powered training platform. 235 certified courses.", copyright: "© 2026 AcadémIA Pro · AcadémIA Pro Certification · All rights reserved" },
    dashboard: { titre: "My Learning Space", bienvenue: "Welcome", mes_formations: "My courses", progression: "My progress", certificats: "My certificates", coach: "AI Coach", deconnexion: "Sign out" }
  },
  es: {
    nav: { formations: "Cursos", seances: "Sesiones", packs: "Packs", competences: "Habilidades", blog: "Blog", contact: "Contacto", demarrer: "Comenzar" },
    home: { hero_titre: "Fórmese con su agente IA personal", hero_sub: "235 cursos certificados · Tutor IA 24h · Sesiones terapéuticas", btn_formations: "Ver cursos", btn_ebook: "E-book gratis", stat1: "Cursos certificados", stat2: "Habilidades validadas", stat3: "Terapeutas IA", stat4: "Garantía satisfacción" },
    catalogue: { titre: "Catálogo AcadémIA Pro", rechercher: "Buscar un curso...", resultats: "resultados", chargement: "Cargando...", aucune: "No se encontró ningún curso", formations: "cursos disponibles", tous: "Todos" },
    seances: { titre: "Sesiones Terapéuticas", sous_titre: "Elija su terapeuta · Disponible ahora · 24h/24", commencer: "Iniciar sesión", changer: "Cambiar terapeuta", envoyer: "Enviar", placeholder: "Hablar con", disponible: "En directo", avertissement: "Estas sesiones son simulaciones IA para el bienestar. En caso de crisis contacte servicios de emergencia." },
    formation: { elearning: "E-Learning", elearning_sub: "Asíncrono · A su ritmo", coach: "Coach IA 24h/24", coach_sub: "Preguntas por chat · Inmediato", classe: "Clase Virtual", classe_sub: "En vivo · Martes y Jueves 20h", objectifs: "Objetivos", prerequis: "Requisitos", public_cible: "Público objetivo", programme: "Programa completo", acheter: "Comprar", pret: "¿Listo para empezar?", acces: "Acceso inmediato · Agente IA 24/7 · Garantía 30 días", coach_btn: "Acceder al Coach IA", classe_btn: "Unirse a una Clase", niveau: "Nivel" },
    inscription: { titre: "Únase a la Lista Prioritaria", sous_titre: "Sea de los primeros en acceder a AcadémIA Pro", nom: "Su nombre", email: "Su email", btn: "Unirse a la lista", merci: "¡Gracias! Está en la lista." },
    blog: { titre: "Blog AcadémIA Pro", sous_titre: "Artículos sobre IA, formación y bienestar", lire: "Leer →", bientot: "Próximamente" },
    footer: { desc: "La plataforma de formación impulsada por IA. 235 cursos certificados.", copyright: "© 2026 AcadémIA Pro · Certificación AcadémIA Pro · Todos los derechos reservados" },
    dashboard: { titre: "Mi Espacio de Aprendizaje", bienvenue: "Bienvenido", mes_formations: "Mis cursos", progression: "Mi progreso", certificats: "Mis certificados", coach: "Coach IA", deconnexion: "Cerrar sesión" }
  },
  ar: {
    nav: { formations: "الدورات", seances: "الجلسات", packs: "الباقات", competences: "المهارات", blog: "المدونة", contact: "اتصل", demarrer: "ابدأ" },
    home: { hero_titre: "تدرب مع وكيل الذكاء الاصطناعي الشخصي", hero_sub: "235 دورة معتمدة · مدرس ذكاء اصطناعي · جلسات علاجية", btn_formations: "عرض الدورات", btn_ebook: "كتاب مجاني", stat1: "دورات معتمدة", stat2: "مهارات معتمدة", stat3: "معالجون AI", stat4: "ضمان الرضا" },
    catalogue: { titre: "كتالوج AcadémIA Pro", rechercher: "ابحث عن دورة...", resultats: "نتائج", chargement: "جار التحميل...", aucune: "لم يتم العثور على دورة", formations: "دورات متاحة", tous: "الكل" },
    seances: { titre: "الجلسات العلاجية", sous_titre: "اختر معالجك · متاح الآن · 24/7", commencer: "بدء الجلسة", changer: "تغيير المعالج", envoyer: "إرسال", placeholder: "تحدث مع", disponible: "مباشر", avertissement: "هذه الجلسات محاكاة ذكاء اصطناعي لأغراض العافية. في حالة الأزمة اتصل بخدمات الطوارئ." },
    formation: { elearning: "التعلم الإلكتروني", elearning_sub: "غير متزامن · بالسرعة الخاصة بك", coach: "مدرب AI 24/7", coach_sub: "أسئلة عبر الدردشة · فوري", classe: "الفصل الافتراضي", classe_sub: "مباشر · الثلاثاء والخميس 8م", objectifs: "الأهداف", prerequis: "المتطلبات", public_cible: "الجمهور المستهدف", programme: "البرنامج الكامل", acheter: "شراء", pret: "مستعد للبدء؟", acces: "وصول فوري · وكيل AI 24/7 · ضمان 30 يوم", coach_btn: "الوصول إلى المدرب", classe_btn: "الانضمام إلى فصل", niveau: "المستوى" },
    inscription: { titre: "انضم إلى قائمة الأولوية", sous_titre: "كن من أوائل الوصول إلى AcadémIA Pro", nom: "اسمك", email: "بريدك الإلكتروني", btn: "الانضمام إلى القائمة", merci: "شكراً! أنت في القائمة." },
    blog: { titre: "مدونة AcadémIA Pro", sous_titre: "مقالات عن الذكاء الاصطناعي والتدريب والعافية", lire: "اقرأ →", bientot: "قريباً" },
    footer: { desc: "منصة التدريب المدعومة بالذكاء الاصطناعي. 235 دورة معتمدة.", copyright: "© 2026 AcadémIA Pro · شهادة AcadémIA Pro · جميع الحقوق محفوظة" },
    dashboard: { titre: "مساحة التعلم الخاصة بي", bienvenue: "مرحباً", mes_formations: "دوراتي", progression: "تقدمي", certificats: "شهاداتي", coach: "مدرب AI", deconnexion: "تسجيل الخروج" }
  },
  he: {
    nav: { formations: "קורסים", seances: "פגישות", packs: "חבילות", competences: "כישורים", blog: "בלוג", contact: "צור קשר", demarrer: "התחל" },
    home: { hero_titre: "התאמן עם סוכן הבינה המלאכותית האישי שלך", hero_sub: "235 קורסים מוסמכים · מדריך AI 24/7 · פגישות טיפוליות", btn_formations: "צפה בקורסים", btn_ebook: "ספר חינמי", stat1: "קורסים מוסמכים", stat2: "כישורים מאומתים", stat3: "מטפלים AI", stat4: "ערובת שביעות רצון" },
    catalogue: { titre: "קטלוג AcadémIA Pro", rechercher: "חפש קורס...", resultats: "תוצאות", chargement: "טוען...", aucune: "לא נמצא קורס", formations: "קורסים זמינים", tous: "הכל" },
    seances: { titre: "פגישות טיפוליות", sous_titre: "בחר את המטפל שלך · זמין עכשיו · 24/7", commencer: "התחל פגישה", changer: "שנה מטפל", envoyer: "שלח", placeholder: "דבר עם", disponible: "חי", avertissement: "פגישות אלו הן סימולציות AI לצרכי רווחה. במקרה של משבר פנה לשירותי חירום." },
    formation: { elearning: "למידה אלקטרונית", elearning_sub: "אסינכרוני · בקצב שלך", coach: "מדריך AI 24/7", coach_sub: "שאלות בצ'אט · מיידי", classe: "כיתה וירטואלית", classe_sub: "ישיר · שלישי וחמישי 20:00", objectifs: "מטרות", prerequis: "דרישות קדם", public_cible: "קהל יעד", programme: "תוכנית מלאה", acheter: "לקנות", pret: "מוכן להתחיל?", acces: "גישה מיידית · סוכן AI 24/7 · ערובה 30 יום", coach_btn: "גישה למדריך AI", classe_btn: "הצטרף לכיתה חיה", niveau: "רמה" },
    inscription: { titre: "הצטרף לרשימת העדיפות", sous_titre: "היה מהראשונים לגשת ל AcadémIA Pro", nom: "שמך", email: "האימייל שלך", btn: "הצטרף לרשימה", merci: "תודה! אתה ברשימה." },
    blog: { titre: "בלוג AcadémIA Pro", sous_titre: "מאמרים על AI, הכשרה ורווחה", lire: "קרא →", bientot: "בקרוב" },
    footer: { desc: "פלטפורמת ההכשרה המופעלת על ידי AI. 235 קורסים מוסמכים.", copyright: "© 2026 AcadémIA Pro · הסמכת AcadémIA Pro · כל הזכויות שמורות" },
    dashboard: { titre: "מרחב הלמידה שלי", bienvenue: "ברוך הבא", mes_formations: "הקורסים שלי", progression: "ההתקדמות שלי", certificats: "האישורים שלי", coach: "מדריך AI", deconnexion: "התנתק" }
  }
};

export function getLangue(): string {
  if (typeof window === "undefined") return "fr";
  const p = new URLSearchParams(window.location.search);
  return p.get("lang") || localStorage.getItem("langue") || "fr";
}

export function useTranslation(section: string) {
  const [langue, setLangue] = useState(getLangue);

  useEffect(() => {
    const saved = getLangue();
    setLangue(saved);
  }, []);

  const t = (cle: string): string => {
    return TRANSLATIONS[langue]?.[section]?.[cle] 
      || TRANSLATIONS["fr"]?.[section]?.[cle] 
      || cle;
  };

  return { t, langue, setLangue };
}

export default TRANSLATIONS;
