'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface UseAgentMemoryOptions {
  agentId: string
  sessionLabel?: string
  autoSaveInterval?: number
}

export function useAgentMemory({
  agentId,
  sessionLabel,
  autoSaveInterval = 5 * 60 * 1000
}: UseAgentMemoryOptions) {
  const [sessionId] = useState(() => `${agentId}_${Date.now()}`)
  const [conversation, setConversation] = useState<Message[]>([])
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const conversationRef = useRef(conversation)

  useEffect(() => {
    conversationRef.current = conversation
  }, [conversation])

  const saveMemory = useCallback(async (label?: string) => {
    if (conversationRef.current.length === 0) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/memory/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          session_id: sessionId,
          session_label: label || sessionLabel || `Session ${new Date().toLocaleDateString('fr-FR')}`,
          conversation: conversationRef.current,
          context_summary: `${conversationRef.current.length} messages`,
          key_decisions: []
        })
      })
      const result = await res.json()
      if (result.success) {
        setLastSaved(new Date().toLocaleTimeString('fr-FR'))
      }
    } catch (e) {
      console.error('Erreur save memory:', e)
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

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: Message = { role, content, timestamp: Date.now() }
    setConversation(prev => [...prev, message])
  }, [])

  const restoreSession = useCallback((messages: Message[]) => {
    setConversation(messages)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => saveMemory(), autoSaveInterval)
    return () => clearInterval(timer)
  }, [saveMemory, autoSaveInterval])

  return {
    conversation,
    addMessage,
    saveMemory,
    loadMemories,
    restoreSession,
    lastSaved,
    isSaving,
    sessionId
  }
}