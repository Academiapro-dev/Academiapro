"use client";
import { useState } from "react";

export default function EbookPage() {
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [metier, setMetier] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (prenom && email && metier) {
      setSubmitted(true);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#050508",
      fontFamily: "'Segoe UI', Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      position: "relative",
      overflow: "hidden"
    }}>

      <div style={{
        position: "absolute",
        top: "-200px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "800px",
        height: "800px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      <div style={{
        position: "absolute",
        bottom: "-300px",
        right: "-200px",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,169,110,0.05) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "rgba(200,169,110,0.12)",
        border: "1px solid rgba(200,169,110,0.3)",
        borderRadius: "50px",
        padding: "6px 18px",
        marginBottom: "32px"
      }}>
        <span style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: "#c8a96e",
          display: "inline-block",
          boxShadow: "0 0 8px rgba(200,169,110,0.8)"
        }} />
        <span style={{
          color: "#c8a96e",
          fontSize: "13px",
          fontWeight: "600",
          letterSpacing: "1px",
          textTransform: "uppercase"
        }}>
          Gratuit — Édition 2026
        </span>
      </div>

      <div style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: "60px",
        maxWidth: "1100px",
        width: "100%",
        flexWrap: "wrap",
        justifyContent: "center"
      }}>

        <div style={{
          flex: "1",
          minWidth: "320px",
          maxWidth: "520px"
        }}>

          <div style={{
            position: "relative",
            width: "220px",
            height: "290px",
            marginBottom: "40px",
            filter: "drop-shadow(0 20px 60px rgba(200,169,110,0.3))"
          }}>
            <div style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              width: "220px",
              height: "290px",
              borderRadius: "8px",
              backgroundColor: "rgba(200,169,110,0.15)",
              border: "1px solid rgba(200,169,110,0.2)"
            }} />
            <div style={{
              position: "absolute",
              top: "6px",
              left: "6px",
              width: "220px",
              height: "290px",
              borderRadius: "8px",
              backgroundColor: "rgba(200,169,110,0.2)",
              border: "1px solid rgba(200,169,110,0.25)"
            }} />
            <div style={{
              position: "relative",
              width: "220px",
              height: "290px",
              borderRadius: "8px",
              background: "linear-gradient(145deg, #1a1508 0%, #0d0d0d 40%, #0a0805 100%)",
              border: "1px solid rgba(200,169,110,0.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              boxSizing: "border-box"
            }}>
              <div style={{
                width: "50px",
                height: "2px",
                backgroundColor: "#c8a96e",
                marginBottom: "20px",
                opacity: "0.6"
              }} />
              <div style={{
                fontSize: "11px",
                color: "#c8a96e",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: "16px",
                opacity: "0.8"
              }}>
                Guide Officiel
              </div>
              <div style={{
                fontSize: "26px",
                fontWeight: "800",
                color: "#ffffff",
                textAlign: "center",
                lineHeight: "1.2",
                marginBottom: "8px"
              }}>
                Claude IA
              </div>
              <div style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#c8a96e",
                textAlign: "center",
                lineHeight: "1.2",
                marginBottom: "20px"
              }}>
                2026
              </div>
              <div style={{
                width: "40px",
                height: "1px",
                backgroundColor: "#c8a96e",
                opacity: "0.4",
                marginBottom: "16px"
              }} />
              <div style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "1px",
                textTransform: "uppercase"
              }}>
                50 Pages
              </div>
              <div style={{
                position: "absolute",
                bottom: "0",
                left: "0",
                right: "0",
                height: "4px",
                background: "linear-gradient(90deg, #c8a96e, #f0d898, #c8a96e)",
                borderBottomLeftRadius: "8px",
                borderBottomRightRadius: "8px"
              }} />
            </div>
          </div>

          <h1 style={{
            fontSize: "42px",
            fontWeight: "800",
            color: "#ffffff",
            lineHeight: "1.15",
            margin: "0 0 20px 0"
          }}>
            Maîtrisez{" "}
            <span style={{
              color: "#c8a96e",
              position: "relative"
            }}>
              Claude IA
            </span>
            {" "}en 2026
          </h1>

          <p style={{
            fontSize: "18px",
            color: "rgba(255,255,255,0.6)",
            lineHeight: "1.7",
            margin: "0 0 32px 0"
          }}>
            Le guide complet de 50 pages pour exploiter tout le potentiel de l'IA la plus avancée du marché. Prompts, stratégies, cas d'usage réels.
          </p>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            marginBottom: "36px"
          }}>
            {[
              "50 prompts experts prêts à l'emploi",
              "Techniques avancées de raisonnement",
              "Automatiser votre workflow professionnel",
              "Cas d'usage par secteur d'activité",
              "Mises à jour 2026 incluses"
            ].map(function(item, index) {
              return (
                <div key={index} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <div style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #c8a96e, #f0d898)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: "0"
                  }}>
                    <span style={{
                      color: "#050508",
                      fontSize: "11px",
                      fontWeight: "900"
                    }}>✓</span>
                  </div>
                  <span style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: "15px"
                  }}>
                    {item}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "16px 20px",
            backgroundColor: "rgba(200,169,110,0.06)",
            border: "1px solid rgba(200,169,110,0.15)",
            borderRadius: "12px"
          }}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}>
              <span style={{
                fontSize: "28px",
                fontWeight: "800",
                color: "#c8a96e",
                lineHeight: "1"
              }}>
                1 247
              </span>
              <span style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginTop: "2px"
              }}>
                téléchargements
              </span>
            </div>
            <div style={{
              width: "1px",
              height: "40px",
              backgroundColor: "rgba(200,169,110,0.2)"
            }} />
            <div style={{
              display: "flex",
              flexDirection: "column"
            }}>
              <div style={{
                display: "flex",
                gap: "3px",
                marginBottom: "6px"
              }}>
                {[1,2,3,4,5].map(function(s) {
                  return (
                    <span key={s} style={{
                      color: "#c8a96e",
                      fontSize: "14px"
                    }}>★</span>
                  );
                })}
              </div>
              <span style={{
                fontSize: "13px",
                color: "rgba(255,255,255,0.5)"
              }}>
                Note moyenne 4.9/5
              </span>
            </div>
          </div>

        </div>

        <div style={{
          flex: "1",
          minWidth: "320px",
          maxWidth: "440px"
        }}>

          {!submitted ? (
            <div style={{
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(200,169,110,0.2)",
              borderRadius: "20px",
              padding: "40px",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{
                position: "absolute",
                top: "0",
                left: "0",
                right: "0",
                height: "3px",
                background: "linear-gradient(90deg, transparent, #c8a96e, transparent)"
              }} />

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px"
              }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(200,169,110,0.2), rgba(200,169,110,0.05))",
                  border: "1px solid rgba(200,169,110,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px"
                }}>
                  📘
                </div>
                <div>
                  <div style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#ffffff"
                  }}>
                    Recevoir le guide
                  </div>
                  <div style={{
                    fontSize: "13px",
                    color: "#c8a96e"
                  }}>
                    Accès immédiat — 100% gratuit
                  </div>
                </div>
              </div>

              <p style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.45)",
                margin: "0 0 28px 0",
                lineHeight: "1.5"
              }}>
                Rejoignez 1 247 professionnels qui utilisent déjà Claude IA à son plein potentiel.
              </p>

              <form onSubmit={handleSubmit} style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.5)",
                    letterSpacing: "1px",
                    textTransform: "uppercase"
                  }}>
                    Prénom
                  </label>
                  <input
                    type="text"
                    placeholder="Votre prénom"
                    value={prenom}
                    onChange={function(e) { setPrenom(e.target.value); }}
                    required
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(200,169,110,0.2)",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      fontSize: "15px",
                      color: "#ffffff",
                      outline: "none",
                      transition: "border-color 0.2s",
                      fontFamily: "inherit"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.5)",
                    letterSpacing: "1px",
                    textTransform: "uppercase"
                  }}>
                    Adresse email
                  </label>
                  <input
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={function(e) { setEmail(e.target.value); }}
                    required
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border