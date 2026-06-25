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

  const openPanel = useCallback(async () => {
    setIsOpen(true)
    setLoading(true)
    try {
      const res = await fetch(`/api/memory/load?agent_id=${agentId}`)
      const result = await res.json()
      setMemories(result.success ? result.data : [])
    } catch {
      setMemories([])
    }
    setLoading(false)
  }, [agentId])

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

  return (
    <>
      <button
        onClick={openPanel}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold px-4 py-3 rounded-full shadow-lg transition-all duration-200"
      >
        <span className="text-lg">🧠</span>
        <span className="text-sm">Mémoire</span>
        {isSaving && <span className="text-xs opacity-70">💾</span>}
      </button>

      {lastSaved && (
        <div className="fixed bottom-20 right-6 z-40 text-xs text-gray-400">
          Sauvegardé à {lastSaved}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div>
                <h2 className="text-white font-bold text-lg">🧠 Mémoire — {agentId}</h2>
                <p className="text-gray-400 text-sm mt-0.5">{memories.length} session(s) sauvegardée(s)</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <div className="flex gap-2 p-4 border-b border-gray-700">
              <button
                onClick={() => { onSaveNow(); setTimeout(openPanel, 500) }}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
              >
                💾 Sauvegarder maintenant
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {loading ? (
                <div className="text-center text-gray-400 py-8">Chargement...</div>
              ) : memories.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-4xl mb-3">📭</p>
                  <p>Aucune session sauvegardée</p>
                </div>
              ) : (
                memories.map((memory, index) => (
                  <div key={memory.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${restored === memory.id ? 'bg-green-900/50 border-green-500' : index === 0 ? 'bg-violet-900/30 border-violet-600/50' : 'bg-gray-800/50 border-gray-700'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {index === 0 && <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full">Dernière</span>}
                        <span className="text-white text-sm font-medium truncate">{memory.session_label}</span>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">🕐 {formatDate(memory.updated_at)} • {memory.conversation?.length || 0} messages</p>
                    </div>
                    <button
                      onClick={() => handleRestore(memory)}
                      className={`ml-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${restored === memory.id ? 'bg-green-500 text-white' : 'bg-gray-700 hover:bg-violet-600 text-gray-300 hover:text-white'}`}
                    >
                      {restored === memory.id ? '✅' : '↩️ Restaurer'}
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-700">
              <p className="text-gray-500 text-xs text-center">⏱️ Sauvegarde auto toutes les 5 min</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}