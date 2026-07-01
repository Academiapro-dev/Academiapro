"use client";
import { useState, useRef, useEffect } from "react";

export default function SessionAudioPage({ params }: { params: { specialite: string } }) {
  const therapeute = params.specialite.replace(/\s+/g, "-").toLowerCase();
  const nomAffiche = params.specialite.replace(/-/g, " ");

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [tempsRestant, setTempsRestant] = useState(2700);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (tempsRestant <= 0) return;
    const timer = setInterval(() => {
      setTempsRestant((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [tempsRestant]);

  function formatTemps(secondes: number) {
    const min = Math.floor(secondes / 60);
    const sec = secondes % 60;
    return min + ":" + (sec < 10 ? "0" : "") + sec;
  }

  async function envoyerMessage(texte: string) {
    if (!texte.trim() || loading || tempsRestant <= 0) return;

    const nouveauMessage = { role: "user", content: texte };
    const historiqueComplet = [...messages, nouveauMessage];
    setMessages(historiqueComplet);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/visio/seance-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: texte,
          therapeute: therapeute,
          historique: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages([...historiqueComplet, { role: "assistant", content: data.texte, audio: data.audio }]);
        if (data.audio && audioRef.current) {
          audioRef.current.src = data.audio;
          audioRef.current.play();
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function demarrerMicro() {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n est pas disponible sur ce navigateur");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setEnregistrement(true);
    recognition.onend = () => setEnregistrement(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      envoyerMessage(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function arreterMicro() {
    recognitionRef.current?.stop();
    setEnregistrement(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "30px 20px" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "2px", margin: "0 0 4px" }}>SEANCE EN COURS</p>
            <h1 style={{ fontSize: "22px", margin: "0", textTransform: "capitalize" }}>{nomAffiche}</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: tempsRestant < 120 ? "#e74c3c" : "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0" }}>{formatTemps(tempsRestant)}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: "0" }}>temps restant</p>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", minHeight: "400px", maxHeight: "55vh", overflowY: "auto", padding: "20px", marginBottom: "20px" }}>
          {messages.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", textAlign: "center", marginTop: "40px" }}>
              Ecrivez ou parlez pour commencer votre seance
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: "16px", textAlign: m.role === "user" ? "right" : "left" }}>
              <div style={{
                display: "inline-block", maxWidth: "80%", padding: "12px 16px", borderRadius: "12px",
                background: m.role === "user" ? "#c8a96e" : "rgba(255,255,255,0.06)",
                color: m.role === "user" ? "#050508" : "#fff", fontSize: "14px", lineHeight: "1.6", textAlign: "left"
              }}>
                {m.content}
                {m.audio && (
                  <button onClick={() => { if (audioRef.current) { audioRef.current.src = m.audio; audioRef.current.play(); } }}
                    style={{ display: "block", marginTop: "8px", background: "none", border: "1px solid rgba(200,169,110,0.4)", color: "#c8a96e", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}>
                    🔊 Reecouter
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>Votre therapeute reflechit...</p>}
          <div ref={chatEndRef} />
        </div>

        <audio ref={audioRef} style={{ display: "none" }} />

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && envoyerMessage(input)}
            placeholder="Ecrivez votre message..."
            disabled={tempsRestant <= 0}
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", padding: "14px", color: "#fff", fontSize: "14px" }}
          />
          <button
            onClick={enregistrement ? arreterMicro : demarrerMicro}
            disabled={tempsRestant <= 0}
            style={{
              background: enregistrement ? "#e74c3c" : "rgba(200,169,110,0.15)",
              border: "1px solid " + (enregistrement ? "#e74c3c" : "rgba(200,169,110,0.4)"),
              borderRadius: "10px", padding: "14px 18px", color: enregistrement ? "#fff" : "#c8a96e", fontSize: "18px", cursor: "pointer"
            }}>
            {enregistrement ? "⏹" : "🎤"}
          </button>
          <button
            onClick={() => envoyerMessage(input)}
            disabled={tempsRestant <= 0 || loading}
            style={{ background: "linear-gradient(135deg, #c8a96e, #a07840)", border: "none", borderRadius: "10px", padding: "14px 20px", color: "#050508", fontWeight: "bold", fontSize: "14px", cursor: "pointer" }}>
            Envoyer
          </button>
        </div>

        {tempsRestant <= 0 && (
          <p style={{ textAlign: "center", color: "#e74c3c", fontSize: "14px", marginTop: "16px" }}>
            Votre seance est terminee. Rechargez du temps pour continuer.
          </p>
        )}
      </div>
    </div>
  );
}
