"use client";
import { useState, useEffect } from "react";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler as any);
    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);

  async function installer() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }

  if (!showBanner) return null;

  return (
    <div style={{
      position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)",
      background: "linear-gradient(135deg,#1a1a2e,#0d0d25)",
      border: "1px solid #c8a96e", borderRadius: "12px", padding: "15px 20px",
      display: "flex", alignItems: "center", gap: "15px", zIndex: 9999,
      boxShadow: "0 10px 40px rgba(0,0,0,0.5)", maxWidth: "380px", width: "90%"
    }}>
      <div style={{ fontSize: "35px" }}>📱</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "14px" }}>Installer AcadémIA Pro</div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>Acces rapide depuis votre ecran d accueil</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <button onClick={installer}
          style={{ padding: "7px 14px", background: "#c8a96e", color: "#050508", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}>
          Installer
        </button>
        <button onClick={() => setShowBanner(false)}
          style={{ padding: "5px 14px", background: "none", color: "rgba(255,255,255,0.4)", border: "none", cursor: "pointer", fontSize: "11px" }}>
          Plus tard
        </button>
      </div>
    </div>
  );
}
