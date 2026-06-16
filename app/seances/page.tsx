"use client";
import { useState } from "react";

const THERAPEUTES = [
  {
    id: "psychologue",
    nom: "Dr. Sophie Martin",
    specialite: "Psychologue Clinicienne — TCC",
    description: "Spécialisée en thérapies cognitives et comportementales. Anxiété, dépression, phobies, burn-out.",
    icon: "🧠",
    prompt: "Tu es Dr. Sophie Martin, psychologue clinicienne spécialisée en TCC (Thérapies Cognitives et Comportementales). Tu as 15 ans d expérience. Tu accueilles le patient avec bienveillance, tu l écoutes activement, tu poses des questions ouvertes pour comprendre sa situation. Tu utilises les techniques TCC : identification des pensées automatiques, restructuration cognitive, exposition progressive. Tu ne fais jamais de diagnostic médical. Tu t adaptes a la langue du patient et reponds toujours dans sa langue."
  },
  {
    id: "psychanalyste",
    nom: "Dr. Michel Dreyfus",
    specialite: "Psychanalyste",
    description: "Approche psychanalytique profonde. Exploration de l inconscient, des schémas répétitifs et des blocages.",
    icon: "🛋️",
    prompt: "Tu es Dr. Michel Dreyfus, psychanalyste avec 20 ans d expérience. Tu utilises l approche psychanalytique : écoute libre, associations libres, exploration de l inconscient. Tu poses des questions profondes sur l enfance, les relations, les rêves. Tu aides le patient à prendre conscience de ses schémas répétitifs. Tu es neutre, bienveillant, et tu laisses le patient parler. Tu ne donnes pas de conseils directs mais tu guides vers la prise de conscience. Tu reponds toujours dans la langue du patient."
  },
  {
    id: "hypnotherapeute",
    nom: "Dr. Isabelle Laurent",
    specialite: "Hypnothérapeute Ericksonienne",
    description: "Hypnose ericksonienne pour anxiété, phobies, addictions, confiance en soi et gestion du stress.",
    icon: "🌀",
    prompt: "Tu es Dr. Isabelle Laurent, hypnothérapeute certifiée en hypnose ericksonienne. Tu utilises des métaphores, des suggestions indirectes, un langage hypnotique doux. Tu guides le patient vers un état de relaxation profonde. Tu travailles sur les ressources internes du patient. Tu utilises des techniques comme la dissociation, l ancrage, la régression. Tu parles avec un rythme lent et apaisant. Tu reponds toujours dans la langue du patient."
  },
  {
    id: "coach-pnl",
    nom: "Marc Benoist",
    specialite: "Coach PNL — Maître Praticien",
    description: "Programmation Neuro-Linguistique pour reprogrammer les schémas limitants et atteindre vos objectifs.",
    icon: "🎯",
    prompt: "Tu es Marc Benoist, Maître Praticien PNL avec 12 ans d expérience. Tu utilises les techniques PNL : recadrage, ancrage, ligne du temps, submodalités, modélisation. Tu identifies les croyances limitantes du patient et l aides à les transformer. Tu es dynamique, orienté solutions et résultats. Tu poses des questions puissantes et précises. Tu travailles sur les objectifs concrets et les ressources du patient. Tu reponds toujours dans la langue du patient."
  },
  {
    id: "coach-vie",
    nom: "Sarah Dubois",
    specialite: "Coach de Vie — Certifiée ICF",
    description: "Coaching de vie orienté objectifs. Confiance en soi, transitions de vie, équilibre pro/perso.",
    icon: "✨",
    prompt: "Tu es Sarah Dubois, coach de vie certifiée ICF avec 10 ans d expérience. Tu utilises le modèle GROW (Goal, Reality, Options, Will). Tu poses des questions puissantes et ouvertes. Tu aides le patient à clarifier ses objectifs, identifier ses ressources et créer un plan d action concret. Tu es positive, encourageante et orientée vers l avenir. Tu ne donnes pas de conseils mais tu guides le patient vers ses propres solutions. Tu reponds toujours dans la langue du patient."
  },
];


const T: Record<string, Record<string, string>> = {
  fr: {
    titre: t("titre"),
    sous_titre: t("sous_titre"),
    commencer: t("commencer"),
    quitter: "Quitter",
    envoyer: t("envoyer"),
    placeholder: "Parlez a",
    disponible: t("disponible"),
    bientot: t("bientot"),
    avertissement: t("avertissement"),
    changer: "Changer de therapeute",
    participants: "participants",
  },
  en: {
    titre: "Therapeutic Sessions",
    sous_titre: "Choose your therapist · Available now · 24/7",
    commencer: "Start session",
    quitter: "Leave",
    envoyer: "Send",
    placeholder: "Talk to",
    disponible: "Live",
    bientot: "HeyGen coming soon",
    avertissement: "These sessions are AI simulations for wellness purposes. In case of crisis, contact emergency services.",
    changer: "Change therapist",
    participants: "participants",
  },
  es: {
    titre: "Sesiones Terapeuticas",
    sous_titre: "Elija su terapeuta · Disponible ahora · 24h/24",
    commencer: "Iniciar sesion",
    quitter: "Salir",
    envoyer: "Enviar",
    placeholder: "Hablar con",
    disponible: "En directo",
    bientot: "HeyGen proximamente",
    avertissement: "Estas sesiones son simulaciones IA para el bienestar. En caso de crisis contacte servicios de emergencia.",
    changer: "Cambiar terapeuta",
    participants: "participantes",
  },
  ar: {
    titre: "الجلسات العلاجية",
    sous_titre: "اختر معالجك · متاح الان · 24/7",
    commencer: "بدء الجلسة",
    quitter: "مغادرة",
    envoyer: "إرسال",
    placeholder: "تحدث مع",
    disponible: "مباشر",
    bientot: "HeyGen قريبا",
    avertissement: "هذه الجلسات محاكاة ذكاء اصطناعي لاغراض العافية. في حالة الازمة اتصل بخدمات الطوارئ.",
    changer: "تغيير المعالج",
    participants: "مشاركون",
  },
  he: {
    titre: "פגישות טיפוליות",
    sous_titre: "בחר את המטפל שלך · זמין עכשיו · 24/7",
    commencer: "התחל פגישה",
    quitter: "עזוב",
    envoyer: "שלח",
    placeholder: "דבר עם",
    disponible: "חי",
    bientot: "HeyGen בקרוב",
    avertissement: "פגישות אלו הן סימולציות AI לצרכי רווחה. במקרה של משבר פנה לשירותי חירום.",
    changer: "שנה מטפל",
    participants: "משתתפים",
  },
};

export default function SeancesPage() {
  const [langue, setLangue] = useState(() => {
    if (typeof window === "undefined") return "fr";
    const p = new URLSearchParams(window.location.search);
    return p.get("lang") || localStorage.getItem("langue") || "fr";
  });
  const t = (cle: string) => T[langue]?.[cle] || T["fr"][cle] || cle;

  const [selected, setSelected] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{role: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);

  async function envoyerMessage() {
    if (!message.trim() || !selected) return;
    const userMsg = message;
    setMessage("");
    setChat(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/agents/therapeutique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          therapeute: selected,
          historique: chat
        }),
      });
      const data = await res.json();
      setChat(prev => [...prev, { role: "agent", text: data.reply }]);
    } catch (e) {
      setChat(prev => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    }
    setLoading(false);
  }

  if (selected) {
    return (
      <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "20px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <button onClick={() => { setSelected(null); setChat([]); }} style={{ background: "none", border: "1px solid rgba(200,169,110,0.3)", color: "#c8a96e", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", marginBottom: "20px" }}>
            ← Changer de thérapeute
          </button>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div style={{ fontSize: "50px", marginBottom: "10px" }}>{selected.icon}</div>
            <h2 style={{ color: "#c8a96e", fontFamily: "Georgia,serif" }}>{selected.nom}</h2>
            <p style={{ color: "rgba(255,255,255,0.6)" }}>{selected.specialite}</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px", minHeight: "350px", maxHeight: "450px", overflowY: "auto", marginBottom: "15px" }}>
            {chat.length === 0 && (
              <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "120px" }}>
                Bonjour · Je suis {selected.nom}. Comment puis-je vous aider aujourd hui ?
              </p>
            )}
            {chat.map((msg, i) => (
              <div key={i} style={{ marginBottom: "15px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  background: msg.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.08)",
                  color: msg.role === "user" ? "#050508" : "#fff",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  maxWidth: "80%",
                  lineHeight: "1.7"
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ color: "#c8a96e", textAlign: "center" }}>{selected.nom} est en train de répondre...</div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder={`{t("placeholder")} à ${selected.nom}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && envoyerMessage()}
              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
            />
            <button
              onClick={envoyerMessage}
              disabled={loading}
              style={{ padding: "12px 24px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
            >
              Envoyer
            </button>
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textAlign: "center", marginTop: "15px" }}>
            ⚠️ {t("avertissement")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", padding: "40px" }}>
      <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", textAlign: "center", marginBottom: "10px" }}>
        Séances Thérapeutiques
      </h1>
      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", marginBottom: "40px" }}>
        Choisissez votre thérapeute · Disponible maintenant · 24h/24
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", maxWidth: "1000px", margin: "0 auto" }}>
        {THERAPEUTES.map((t) => (
          <div
            key={t.id}
            onClick={() => { setSelected(t); setChat([]); }}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "25px", cursor: "pointer", transition: "all 0.2s" }}
          >
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>{t.icon}</div>
            <h3 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", marginBottom: "5px" }}>{t.nom}</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "10px" }}>{t.specialite}</p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: "1.6" }}>{t.description}</p>
            <button style={{ marginTop: "15px", width: "100%", padding: "10px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              Commencer la séance
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
