import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "../components/NavBar";
import CookieBanner from "../components/CookieBanner";

export const metadata: Metadata = {
  title: "AcadémIA Pro — Formation Professionnelle par l IA",
  description: "263 formations certifiantes propulsées par l'IA · Agent IA tuteur 24h/24 · Séances thérapeutiques · Classes virtuelles live",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "AcadémIA Pro" },
  openGraph: { title: "AcadémIA Pro", description: "Plateforme de formation professionnelle 100% IA", type: "website", locale: "fr_FR" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#c8a96e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var lang = localStorage.getItem("langue") || "fr";
              var rtl = lang === "he" || lang === "ar";
              document.documentElement.setAttribute("dir", rtl ? "rtl" : "ltr");
              document.documentElement.setAttribute("lang", lang);
            } catch(e) {}
          })();
        `}} />
      </head>
      <body style={{ margin: 0, background: "#050508", color: "#fff", fontFamily: "Georgia, serif" }}>
        <NavBar />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
