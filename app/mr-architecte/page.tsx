'use client';
import { useState, useEffect, useRef } from "react";

export default function MrArchitectePage() {
  const { saveMemory, restoreSession, lastSaved, isSaving } = useAgentMemory({
    agentId: "architecte",
    sessionLabel: "Session Architecte"
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [historique, setHistorique] = useState<{role: string, content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { saveMemory, loadMemories, restoreSession, lastSaved, isSaving } = useAgentMemory({
    agentId: "architecte",
    sessionLabel: "Session Architecte"
  });

  useEffect(() => {
    const code = localStorage.getItem("admin_code");
    if (code === "JAC2024") {
      setIsAdmin(true);
    }
    setChecking(false);
  }, []);

  const envoyer = async () => {
    if (!message.trim() || loading) return;
    const nouveauMessage = { role: "user", content: message };
    const nouvelHistorique = [...historique, nouveauMessage];
    setHistorique(nouvelHistorique);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/cam-architecte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, historique })
      });
      const data = await res.json();
      setHistorique([...nouvelHistorique, { role: "assistant", content: data.reponse || "Erreur de réponse" }]);
    } catch (e) {
      setHistorique([...nouvelHistorique, { role: "assistant", content: "❌ Erreur de connexion" }]);
    }
    setLoading(false);
  };

  if (checking) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Vérification...</div>;

  if (!isAdmin) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-700 w-full max-w-md">
        <h1 className="text-white text-2xl font-bold mb-6 text-center">🏗️ Architecte — Accès Restreint</h1>
        <input
          type="password"
          placeholder="Code secret..."
          className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600 mb-4"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = (e.target as HTMLInputElement).value;
              if (val === "JAC2024") {
                localStorage.setItem("admin_code", val);
                setIsAdmin(true);
              }
            }
          }}
        />
        <p className="text-gray-500 text-sm text-center">Accès réservé à Jacques</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      
      {/* Header */}
      <div className="border-b border-gray-800 p-4 flex items-center gap-3">
        <span className="text-3xl">🏗️</span>
        <div>
          <h1 className="text-white font-bold text-lg">Architecte — Bras Droit de CAM</h1>
          <p className="text-gray-400 text-sm">Architecture technique AcademiA Pro</p>
        </div>
      </div>

      {/* Historique */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {historique.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-4xl mb-3">🏗️</p>
            <p className="text-lg font-medium text-gray-400">Bonjour Jacques</p>
            <p className="text-sm mt-2">Je suis l'Architecte — posez-moi vos questions techniques</p>
          </div>
        )}
        {historique.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === "user"
                ? "bg-violet-600 text-white"
                : "bg-gray-800 text-gray-100 border border-gray-700"
            }`}>
              {msg.role === "assistant" && <span className="text-xs text-gray-400 block mb-1">🏗️ Architecte</span>}
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl">
              <span className="text-gray-400 text-sm">🏗️ Architecte réfléchit...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4 flex gap-3">
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); }}}
          placeholder="Posez votre question à l'Architecte..."
          className="flex-1 bg-gray-800 text-white p-3 rounded-xl border border-gray-700 resize-none focus:outline-none focus:border-violet-500"
          rows={2}
        />
        <button
          onClick={envoyer}
          disabled={loading || !message.trim()}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 rounded-xl font-medium transition-colors"
        >
          {loading ? "..." : "Envoyer"}
        </button>
      </div>

      {/* Bouton Mémoire */}
      <MemoryButton
        agentId="architecte"
        onRestore={restoreSession}
        onSaveNow={saveMemory}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />
    </div>
  
      <MemoryButton
        agentId="architecte"
        onRestore={restoreSession}
        onSaveNow={saveMemory}
        lastSaved={lastSaved}
        isSaving={isSaving}
      />
    );
}