'use client';

import { useState } from 'react';

interface MemoryButtonProps {
  agentId: string;
  onMemoryLoaded: (memory: string) => void;
}

export default function MemoryButton({ agentId, onMemoryLoaded }: MemoryButtonProps) {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const chargerMemoire = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/memory?agent=${agentId}`);
      const data = await response.json();
      
      if (data.success && data.memory) {
        onMemoryLoaded(data.memory);
        setLoaded(true);
        setTimeout(() => setLoaded(false), 3000);
      }
    } catch (error) {
      console.error('Erreur chargement mémoire:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={chargerMemoire}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: loaded ? '#2d5a27' : '#1a1a1a',
        border: `1px solid ${loaded ? '#4CAF50' : '#c8a96e'}`,
        borderRadius: '8px',
        padding: '8px 16px',
        color: loaded ? '#4CAF50' : '#c8a96e',
        fontSize: '13px',
        fontWeight: 'bold',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.3s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? '⏳' : loaded ? '✅' : '🧠'}
      {loading ? 'Chargement...' : loaded ? 'Mémoire restaurée !' : 'MÉMOIRE'}
    </button>
  );
}