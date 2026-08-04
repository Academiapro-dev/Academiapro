"use client";
import { useState, useEffect, useRef } from "react";
import {
  LiveKitRoom,
  VideoConference,
  formatChatMessageLinks,
} from "@livekit/components-react";
import "@livekit/components-styles";

// Le nom affiche sous l avatar est celui que les stagiaires attendent.
const styleSalle = `
  .lk-participant-name[title^="liveavatar"] {
    visibility: hidden;
    position: relative;
  }
  .lk-participant-name[title^="liveavatar"]::after {
    content: "Formateur AcadémIA";
    visibility: visible;
    position: absolute;
    left: 0;
  }
`;

export default function SalleDeClasse({ params }: { params: { id: string } }) {
  const seanceId = params.id;

  const [salle, setSalle] = useState("");
  const [jeton, setJeton] = useState("");
  const [moi, setMoi] = useState<any>(null);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);
  const sorti = useRef(false);

  useEffect(function () {
    entrer();

    function auDepart() {
      sortir();
    }

    window.addEventListener("beforeunload", auDepart);
    window.addEventListener("pagehide", auDepart);

    return function () {
      window.removeEventListener("beforeunload", auDepart);
      window.removeEventListener("pagehide", auDepart);
      sortir();
    };
  }, []);

  // MASQUAGE DE LA TUILE DU CERVEAU. L agent qui raisonne n a pas d image :
  // sa tuile est vide. On ne masque QUE les tuiles sans video dont le nom
  // commence par "agent" — l avatar, lui, a une video et reste visible.
  useEffect(function () {
    if (!jeton) return;

    function cacherAgent() {
      const tuiles = document.querySelectorAll(".lk-participant-tile");
      tuiles.forEach(function (t: any) {
        const video = t.querySelector("video");
        const aUneImage = video && video.videoWidth > 0;
        if (aUneImage) return;

        const etiquette = t.querySelector(".lk-participant-name");
        const nom = ((etiquette && (etiquette.getAttribute("title") || etiquette.textContent)) || "")
          .trim()
          .toLowerCase();

        if (nom.indexOf("agent") === 0) {
          t.style.display = "none";
        }
      });
    }

    const minuteur = setInterval(cacherAgent, 1500);
    cacherAgent();
    return function () { clearInterval(minuteur); };
  }, [jeton]);

  function suffixe(sep: string) {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? sep + "tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function entrer() {
    setErreur("");
    try {
      const rm = await fetch("/api/moi");
      const dm = await rm.json();
      if (dm.connecte) setMoi(dm);

      // 1. Le pointage d entree. Il part avant toute video : la preuve
      // d assiduite ne depend pas du bon fonctionnement de l image.
      const r = await fetch("/api/organisme/seance" + suffixe("?"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seance_id: seanceId, action: "entrer" }),
      });
      const data = await r.json();

      if (!data.ok || !data.salle) {
        setErreur(data.erreur || "Entree impossible.");
        setChargement(false);
        return;
      }

      setSalle(data.salle);

      // 2. Le badge d entree dans la salle, delivre par notre serveur.
      const identite = (dm && dm.email ? dm.email : "participant").split("@")[0];

      const rj = await fetch(
        "/api/classe-token?session=" + encodeURIComponent(data.salle) +
        "&identite=" + encodeURIComponent(identite)
      );

      if (!rj.ok) {
        setErreur("La salle n a pas pu s ouvrir. Reessayez dans un instant.");
        setChargement(false);
        return;
      }

      const dj = await rj.json();
      if (dj.token) setJeton(dj.token);
      else setErreur(dj.erreur || "La salle n a pas pu s ouvrir.");
    } catch (e: any) {
      setErreur("Entree impossible : " + String(e));
    }
    setChargement(false);
  }

  // Le pointage de sortie doit partir meme si l onglet se ferme : on utilise
  // sendBeacon, concu pour cela, avec un repli sur fetch.
  function sortir() {
    if (sorti.current) return;
    sorti.current = true;

    const corps = JSON.stringify({ seance_id: seanceId, action: "sortir" });
    const url = "/api/organisme/seance" + suffixe("?");

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([corps], { type: "application/json" }));
        return;
      }
    } catch (e) {}

    try {
      fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: corps,
        keepalive: true,
      });
    } catch (e) {}
  }

  const CADRE: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
  };

  if (chargement) {
    return (
      <div style={{ ...CADRE, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#c8a96e", fontSize: "17px" }}>Entree dans la classe...</p>
      </div>
    );
  }

  if (erreur || !salle || !jeton) {
    return (
      <div style={{ ...CADRE, padding: "44px 20px" }}>
        <div style={{ maxWidth: "660px", margin: "0 auto" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
            CLASSE VIRTUELLE
          </p>
          <h1 style={{ color: "#fff", fontSize: "24px", margin: "0 0 12px" }}>
            Vous ne pouvez pas entrer
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", lineHeight: "1.75", marginTop: 0 }}>
            {erreur || "Cette salle n est pas accessible pour le moment."}
          </p>
          <a
            href={"/organisme/seances" + suffixe("?")}
            style={{ display: "inline-block", marginTop: "18px", background: "#c8a96e", color: "#050508", padding: "13px 26px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "15px" }}
          >
            Retour aux seances
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...CADRE, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "12px 20px", borderBottom: "1px solid rgba(200,169,110,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <p style={{ color: "#c8a96e", fontSize: "11px", letterSpacing: "2px", margin: "0 0 2px" }}>
            CLASSE VIRTUELLE · PRESENCE ENREGISTREE
          </p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: 0 }}>
            {moi ? moi.email : ""}
          </p>
        </div>

        <a
          href={"/organisme/seances" + suffixe("?")}
          onClick={sortir}
          style={{ color: "#c8a96e", fontSize: "13px", textDecoration: "none", border: "1px solid rgba(200,169,110,0.45)", padding: "8px 18px", borderRadius: "20px" }}
        >
          Quitter la classe
        </a>
      </div>

      <div style={{ flex: 1, minHeight: "78vh" }}>
        <LiveKitRoom
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          token={jeton}
          connect={true}
          audio={false}
          video={false}
          data-lk-theme="default"
          style={{ height: "100%", background: "#111" }}
        >
          <style>{styleSalle}</style>
          <VideoConference chatMessageFormatter={formatChatMessageLinks} />
        </LiveKitRoom>
      </div>

      <div style={{ padding: "10px 20px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(200,169,110,0.2)" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0, lineHeight: "1.6" }}>
          Votre micro et votre camera sont fermes a l entree : ouvrez-les quand le
          formateur vous donne la parole. Vos questions ecrites passent par le chat.
          Votre heure d entree et votre heure de sortie sont enregistrees : elles
          tiennent lieu de feuille d emargement.
        </p>
      </div>
    </div>
  );
}
