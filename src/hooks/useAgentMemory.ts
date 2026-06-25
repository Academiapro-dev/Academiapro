'use client'

import { useState, useCallback } from 'react'

interface UseAgentMemoryOptions {
  agentId: string
  sessionLabel?: string
}

export function useAgentMemory({ agentId, sessionLabel }: UseAgentMemoryOptions) {
  const [sessionId] = useState(() => `${agentId}_${Date.now()}`)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const saveMemory = useCallback(async (historique: any[]) => {
    if (!historique || historique.length === 0) return
    setIsSaving(true)
    try {
      const conversation = historique.map(m => ({
        role: m.role,
        content: m.text || m.content || "",
        text: m.text || m.content || ""
      }))
      const res = await fetch('/api/memory/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          session_id: sessionId,
          session_label: sessionLabel || `Session ${new Date().toLocaleDateString('fr-FR')}`,
          conversation,
          context_summary: `${historique.length} messages`,
          key_decisions: []
        })
      })
      const result = await res.json()
      if (result.success) {
        setLastSaved(new Date().toLocaleTimeString('fr-FR'))
      }
    } catch (e) {
      console.error('Erreur save:', e)
    }
    setIsSaving(false)
  }, [agentId, sessionId, sessionLabel])

  const loadMemories = useCallback(async () => {
    try {
      const res = await fetch(`/api/memory/load?agent_id=${agentId}`)
      const result = await res.json()
      return result.success ? result.data : []
    } catch {
      return []
    }
  }, [agentId])

  return { saveMemory, loadMemories, lastSaved, isSaving }
}