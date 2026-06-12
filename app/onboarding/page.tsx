"use client";
import { useState } from "react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [age, setAge] = useState("");
  const [objectif, setObjectif] = useState("");
  const [niveau, setNiveau] = useState("");
  const [recommandation, setRecommandation] = useState("");

  const totalSteps = 5;
  const progressPercent = ((step - 1) / (totalSteps - 1)) * 100;

  function handleNext() {
    if (step < totalSteps) setStep(step + 1);
  }

  function handlePrev() {
    if (step > 1) setStep(step - 1);
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#050508",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif",
      padding: "20px"
    }}>

      <div style={{
        width: "100%",
        maxWidth: "560px"
      }}>

        <div style={{
          textAlign: "center",
          marginBottom: "12px"
        }}>
          <span style={{
            color: "#c8a96e",
            fontSize: "13px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            fontWeight: "600"
          }}>
            Étape {step} sur {totalSteps}
          </span>
        </div>

        <div style={{
          width: "100%",
          height: "4px",
          backgroundColor: "#1a1a2e",
          borderRadius: "999px",
          marginBottom: "40px",
          overflow: "hidden"
        }}>
          <div style={{
            height: "100%",
            width: progressPercent + "%",
            background: "linear-gradient(90deg, #c8a96e, #e8c98e)",
            borderRadius: "999px",
            transition: "width 0.5s ease"
          }} />
        </div>

        <div style={{
          backgroundColor: "#0d0d18",
          border: "1px solid #1e1e35",
          borderRadius: "20px",
          padding: "48px 40px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)"
        }}>

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #c8a96e22, #c8a96e44)",
                  border: "1px solid #c8a96e55",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px auto",
                  fontSize: "28px"
                }}>
                  👋
                </div>
                <h1 style={{
                  color: "#ffffff",
                  fontSize: "26px",
                  fontWeight: "700",
                  margin: "0 0 10px 0",
                  letterSpacing: "-0.5px"
                }}>
                  Bienvenue
                </h1>
                <p style={{
                  color: "#6b6b8a",
                  fontSize: "15px",
                  margin: "0",
                  lineHeight: "1.6"
                }}>
                  Nous sommes ravis de vous accueillir. Ce parcours rapide personnalisera votre expérience.
                </p>
              </div>

              <div style={{
                backgroundColor: "#0a0a14",
                border: "1px solid #c8a96e22",
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ color: "#c8a96e", fontSize: "18px" }}>✦</div>
                  <span style={{ color: "#9090aa", fontSize: "14px" }}>Créez votre profil personnel</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ color: "#c8a96e", fontSize: "18px" }}>✦</div>
                  <span style={{ color: "#9090aa", fontSize: "14px" }}>Définissez vos objectifs</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ color: "#c8a96e", fontSize: "18px" }}>✦</div>
                  <span style={{ color: "#9090aa", fontSize: "14px" }}>Recevez des recommandations sur mesure</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ color: "#c8a96e", fontSize: "18px" }}>✦</div>
                  <span style={{ color: "#9090aa", fontSize: "14px" }}>Accédez à votre tableau de bord</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #c8a96e22, #c8a96e44)",
                  border: "1px solid #c8a96e55",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px auto",
                  fontSize: "28px"
                }}>
                  👤
                </div>
                <h2 style={{
                  color: "#ffffff",
                  fontSize: "24px",
                  fontWeight: "700",
                  margin: "0 0 8px 0"
                }}>
                  Votre Profil
                </h2>
                <p style={{
                  color: "#6b6b8a",
                  fontSize: "14px",
                  margin: "0"
                }}>
                  Dites-nous qui vous êtes
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", fontWeight: "600" }}>
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={prenom}
                    onChange={function(e) { setPrenom(e.target.value); }}
                    placeholder="Votre prénom"
                    style={{
                      backgroundColor: "#0a0a14",
                      border: "1px solid #1e1e35",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      color: "#ffffff",
                      fontSize: "15px",
                      outline: "none",
                      transition: "border-color 0.2s"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", fontWeight: "600" }}>
                    Nom
                  </label>
                  <input
                    type="text"
                    value={nom}
                    onChange={function(e) { setNom(e.target.value); }}
                    placeholder="Votre nom de famille"
                    style={{
                      backgroundColor: "#0a0a14",
                      border: "1px solid #1e1e35",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      color: "#ffffff",
                      fontSize: "15px",
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", fontWeight: "600" }}>
                    Âge
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={function(e) { setAge(e.target.value); }}
                    placeholder="Votre âge"
                    style={{
                      backgroundColor: "#0a0a14",
                      border: "1px solid #1e1e35",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      color: "#ffffff",
                      fontSize: "15px",
                      outline: "none"
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #c8a96e22, #c8a96e44)",
                  border: "1px solid #c8a96e55",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px auto",
                  fontSize: "28px"
                }}>
                  🎯
                </div>
                <h2 style={{
                  color: "#ffffff",
                  fontSize: "24px",
                  fontWeight: "700",
                  margin: "0 0 8px 0"
                }}>
                  Vos Objectifs
                </h2>
                <p style={{
                  color: "#6b6b8a",
                  fontSize: "14px",
                  margin: "0"
                }}>
                  Que souhaitez-vous accomplir ?
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {["Développer mes compétences", "Augmenter ma productivité", "Explorer de nouveaux domaines", "Atteindre mes objectifs financiers"].map(function(item) {
                  return (
                    <div
                      key={item}
                      onClick={function() { setObjectif(item); }}
                      style={{
                        backgroundColor: objectif === item ? "#c8a96e15" : "#0a0a14",
                        border: objectif === item ? "1px solid #c8a96e" : "1px solid #1e1e35",
                        borderRadius: "12px",
                        padding: "16px 18px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.2s"
                      }}
                    >
                      <span style={{
                        color: objectif === item ? "#c8a96e" : "#9090aa",
                        fontSize: "14px",
                        fontWeight: objectif === item ? "600" : "400"
                      }}>
                        {item}
                      </span>
                      {objectif === item && (
                        <div style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "#c8a96e",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          color: "#050508",
                          fontWeight: "800"
                        }}>
                          ✓
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #c8a96e22, #c8a96e44)",
                  border: "1px solid #c8a96e55",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px auto",
                  fontSize: "28px"
                }}>
                  ✨
                </div>
                <h2 style={{
                  color: "#ffffff",
                  fontSize: "24px",
                  fontWeight: "700",
                  margin: "0 0 8px 0"
                }}>
                  Recommandations
                </h2>
                <p style={{
                  color: "#6b6b8a",
                  fontSize: "14px",
                  margin: "0"
                }}>
                  Choisissez votre niveau d'expérience
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { id: "debutant", label: "Débutant", desc: "Je commence tout juste", icon: "🌱" },
                  { id: "intermediaire", label: "Intermédiaire", desc: "J'ai quelques bases solides", icon: "🔥" },
                  { id: "avance", label: "Avancé", desc: "Je maîtrise bien le sujet", icon: "⚡" }
                ].map(function(item) {
                  return (
                    <div
                      key={item.id}
                      onClick={function() { setNiveau(item.id); }}
                      style={{
                        backgroundColor: niveau === item.id ? "#c8a96e15" : "#0a0a14",
                        border: niveau === item.id ? "1px solid #c8a96e" : "1px solid #1e1e35",
                        borderRadius: "12px",
                        padding: "16px 18px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        transition: "all 0.2s"