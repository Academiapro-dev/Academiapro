'use client'

import { useState, useCallback } from 'react'

interface Memory {
  id: string
  session_id: string
  session_label: string
  conversation: any[]
  context_summary: string
  updated_at: string
}

interface MemoryButtonProps {
  agentId: string
  onRestore: (conversation: any[]) => void
  onSaveNow: () => void
  lastSaved?: string | null
  isSaving?: boolean
}

export default function MemoryButton({
  agentId,
  onRestore,
  onSaveNow,
  lastSaved,
  isSaving
}: MemoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(false)
  const [restored, setRestored] = useState<string | null>(null)
  const [voirTout, setVoirTout] = useState(false)
  const [saveOk, setSaveOk] = useState(false)

  const openPanel = useCallback(async () => {
    setIsOpen(true)
    setLoading(true)
    setVoirTout(false)
    try {
      const res = await fetch(`/api/memory/load?agent_id=${agentId}`)
      const result = await res.json()
      setMemories(result.success ? result.data : [])
    } catch {
      setMemories([])
    }
    setLoading(false)
  }, [agentId])

  const handleSave = useCallback(() => {
    onSaveNow()
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 2000)
  }, [onSaveNow])

  const handleRestore = useCallback((memory: Memory) => {
    onRestore(memory.conversation)
    setRestored(memory.id)
    setTimeout(() => {
      setRestored(null)
      setIsOpen(false)
    }, 1500)
  }, [onRestore])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const memoriesAffichees = voirTout ? memories : memories.slice(0, 5)

  return (
    <>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "6px 14px",
            background: saveOk ? "#00c800" : "rgba(139,92,246,0.2)",
            color: saveOk ? "#fff" : "#a78bfa",
            border: "1px solid " + (saveOk ? "#00c800" : "rgba(139,92,246,0.4)"),
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
            transition: "all 0.2s"
          }}
        >
          {saveOk ? "✅ Sauvegardé !" : isSaving ? "⏳ Sauvegarde..." : "💾 Sauvegarder"}
        </button>
        <button
          onClick={openPanel}
          style={{
            padding: "6px 14px",
            background: "rgba(139,92,246,0.2)",
            color: "#a78bfa",
            border: "1px solid rgba(139,92,246,0.4)",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold"
          }}
        >
          📂 Restaurer
        </button>
        {lastSaved && (
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>
            {lastSaved}
          </span>
        )}
      </div>

      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setIsOpen(false)} />
          <div style={{ position: "relative", background: "#111827", border: "1px solid #374151", borderRadius: "16px", width: "100%", maxWidth: "500px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px", borderBottom: "1px solid #374151" }}>
              <div>
                <h2 style={{ color: "#fff", fontWeight: "bold", fontSize: "18px", margin: 0 }}>🧠 Mémoire — {agentId}</h2>
                <p style={{ color: "#9ca3af", fontSize: "13px", margin: "4px 0 0" }}>{memories.length} session(s) sauvegardée(s)</p>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ color: "#9ca3af", background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {loading ? (
                <div style={{ textAlign: "center", color: "#9ca3af", padding: "32px" }}>Chargement...</div>
              ) : memories.length === 0 ? (
                <div style={{ textAlign: "center", color: "#6b7280", padding: "32px" }}>
                  <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📭</p>
                  <p>Aucune session sauvegardée</p>
                </div>
              ) : (
                <>
                  {memoriesAffichees.map((memory, index) => (
                    <div key={memory.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "12px", border: "1px solid " + (restored === memory.id ? "#22c55e" : index === 0 ? "rgba(139,92,246,0.5)" : "#374151"), background: restored === memory.id ? "rgba(34,197,94,0.1)" : index === 0 ? "rgba(139,92,246,0.15)" : "rgba(31,41,55,0.5)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {index === 0 && <span style={{ fontSize: "10px", background: "#7c3aed", color: "#fff", padding: "2px 8px", borderRadius: "20px" }}>Dernière</span>}
                          <span style={{ color: "#fff", fontSize: "14px", fontWeight: "500" }}>{memory.session_label}</span>
                        </div>
                        <p style={{ color: "#9ca3af", fontSize: "11px", margin: "4px 0 0" }}>🕐 {formatDate(memory.updated_at)} · {memory.conversation?.length || 0} messages</p>
                      </div>
                      <button
                        onClick={() => handleRestore(memory)}
                        style={{ marginLeft: "12px", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "500", border: "none", cursor: "pointer", background: restored === memory.id ? "#22c55e" : "#374151", color: restored === memory.id ? "#fff" : "#d1d5db" }}
                      >
                        {restored === memory.id ? "✅" : "↩️ Restaurer"}
                      </button>
                    </div>
                  ))}
                  {memories.length > 5 && !voirTout && (
                    <button
                      onClick={() => setVoirTout(true)}
                      style={{ width: "100%", padding: "10px", background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}
                    >
                      Voir les {memories.length - 5} sessions précédentes
                    </button>
                  )}
                </>
              )}
            </div>
            <div style={{ padding: "16px", borderTop: "1px solid #374151" }}>
              <p style={{ color: "#6b7280", fontSize: "11px", textAlign: "center", margin: 0 }}>⏱️ Sauvegarde auto toutes les 5 min</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
