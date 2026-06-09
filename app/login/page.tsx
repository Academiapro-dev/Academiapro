```tsx
// app/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoadingProvider("google");
    // TODO: implement Google OAuth
    await new Promise((r) => setTimeout(r, 1500));
    setLoadingProvider(null);
  };

  const handleAppleLogin = async () => {
    setLoadingProvider("apple");
    // TODO: implement Apple OAuth
    await new Promise((r) => setTimeout(r, 1500));
    setLoadingProvider(null);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: implement email/password auth
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ backgroundColor: "#050508" }}
    >
      {/* Ambient background glows */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #c8a96e, transparent)" }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-8 blur-[100px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #c8a96e, transparent)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5 blur-[150px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #7c6840, transparent)" }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(200,169,110,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,110,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-2xl border p-8 shadow-2xl backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
          borderColor: "rgba(200,169,110,0.2)",
          boxShadow:
            "0 0 60px rgba(200,169,110,0.08), 0 25px 50px rgba(0,0,0,0.6)",
        }}
      >
        {/* Top border glow */}
        <div
          className="absolute top-0 left-8 right-8 h-px rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(200,169,110,0.6), transparent)",
          }}
        />

        {/* Logo + Brand */}
        <div className="flex flex-col items-center mb-8">
          {/* Logo mark */}
          <div className="relative mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(200,169,110,0.2), rgba(200,169,110,0.05))",
                border: "1px solid rgba(200,169,110,0.35)",
                boxShadow: "0 0 30px rgba(200,169,110,0.15)",
              }}
            >
              {/* Academic cap SVG */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 4L2 11L16 18L30 11L16 4Z"
                  fill="url(#goldGrad1)"
                  stroke="rgba(200,169,110,0.6)"
                  strokeWidth="0.5"
                />
                <path
                  d="M8 14.5V22C8 22 11 26 16 26C21 26 24 22 24 22V14.5"
                  stroke="url(#goldGrad2)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="16" cy="11" r="2" fill="#c8a96e" opacity="0.9" />
                <path
                  d="M28 11V18"
                  stroke="url(#goldGrad2)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="goldGrad1"
                    x1="2"
                    y1="4"
                    x2="30"
                    y2="18"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#c8a96e" stopOpacity="0.9" />
                    <stop offset="1" stopColor="#e8d5a3" stopOpacity="0.7" />
                  </linearGradient>
                  <linearGradient
                    id="goldGrad2"
                    x1="8"
                    y1="11"
                    x2="28"
                    y2="26"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#c8a96e" />
                    <stop offset="1" stopColor="#a07840" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            {/* Pulse ring */}
            <div
              className="absolute inset-0 rounded-2xl animate-ping"
              style={{
                border: "1px solid rgba(200,169,110,0.3)",
                animationDuration: "3s",
              }}
            />
          </div>

          {/* Brand name */}
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Académ
            <span
              style={{
                background: "linear-gradient(135deg, #c8a96e, #e8d5a3)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              IA
            </span>{" "}
            <span className="text-white font-light tracking-widest text-lg">
              PRO
            </span>
          </h1>

          {/* Tagline */}
          <p
            className="mt-2 text-sm text-center leading-relaxed"
            style={{ color: "rgba(200,169,110,0.75)" }}
          >
            L&apos;intelligence artificielle au service{" "}
            <br className="hidden sm:block" />
            de votre excellence académique
          </p>
        </div>

        {/* Heading */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-white">
            Bon retour parmi nous ✦
          </h2>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Connectez-vous pour continuer votre parcours
          </p>
        </div>

        {/* Social Buttons */}
        <div className="space-y-3 mb-6">
          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingProvider !== null || isLoading}
            className="group relative w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.85)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.09)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(200,169,110,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(255,255,255,0.1)";
            }}
          >
            {loadingProvider === "google" ? (
              <LoadingSpinner />
            ) : (
              <GoogleIcon />
            )}
            <span>
              {loadingProvider === "google"
                ? "Connexion en cours..."
                : "Continuer avec Google"}
            </span>
          </button>

          {/* Apple */}
          <button
            onClick={handleAppleLogin}
            disabled={loadingProvider !== null || isLoading}
            className="group relative w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.85)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.09)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(200,169,110,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(255,255,255,0.1)";
            }}
          >
            {loadingProvider === "apple" ? (
              <LoadingSpinner />
            ) : (
              <AppleIcon />
            )}
            <span>
              {loadingProvider === "apple"
                ? "Connexion en cours..."
                : "Continuer avec Apple"}
            </span>
          </button>