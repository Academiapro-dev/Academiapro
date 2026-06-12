import React from "react";
"use client";
import { useState } from "react";

export default function AgentChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour ! Je suis votre agent IA AcadémIA Pro. Comment puis-je vous aider ?" }
  ]);
  const [input, setInput] = useState("");

  const envoyer = async () => {
    if (!input.trim()) return;
    const nouveauxMessages = [...messages, { role: "user", content: input }];
    setMessages(nouveauxMessages);
    setInput("");
    setMessages([...nouveauxMessages, { role: "assistant", content: "Je traite votre demande..." }]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "500px", background: "#1a1a2e", borderRadius: "12px", overflow: "hidden" }}>
      <div style={{ background: "#050508", padding: "16px", borderBottom: "1px solid #c8a96e" }}>
        <h3 style={{ color: "#c8a96e", margin: 0, fontSize: "16px" }}>Agent IA AcadémIA Pro</h3>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", background: msg.role === "user" ? "#c8a96e" : "#050508", color: msg.role === "user" ? "#050508" : "#fff", padding: "10px 14px", borderRadius: "12px", maxWidth: "80%", fontSize: "14px" }}>
            {msg.content}
          </div>
        ))}
      </div>
      <div style={{ padding: "12px", borderTop: "1px solid rgba(200,169,110,0.3)", display: "flex", gap: "8px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && envoyer()}
          placeholder="Votre message..."
          style={{ flex: 1, background: "#050508", border: "1px solid #c8a96e", borderRadius: "8px", padding: "10px", color: "#fff", fontSize: "14px" }}
        />
        <button onClick={envoyer} style={{ background: "#c8a96e", color: "#050508", border: "none", borderRadius: "8px", padding: "10px 16px", fontWeight: "bold", cursor: "pointer" }}>
          Envoyer
        </button>
      </div>
    </div>
  );
}
