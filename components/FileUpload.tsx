'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kpxrbwsbhmggoajtxzqn.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface FileUploadProps {
  agentId: string
  onUploadComplete?: (fileName: string) => void
}

export default function FileUpload({ agentId, onUploadComplete }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowed.includes(file.type)) {
      setUploadError('Format non supporte — PDF, JPEG ou PNG uniquement')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Fichier trop volumineux — 10MB maximum')
      return
    }

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `${agentId}/${timestamp}_${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('agent_documents')
        .upload(storagePath, file, { contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = await supabase.storage
        .from('agent_documents')
        .createSignedUrl(storagePath, 365 * 24 * 60 * 60)

      if (urlData?.signedUrl) {
        await supabase.from('agent_documents').insert({
          agent_id: agentId,
          file_name: file.name,
          file_type: file.type,
          file_url: urlData.signedUrl,
          storage_path: storagePath,
          description: file.name
        })
      }

      setUploadSuccess(file.name + ' sauvegarde !')
      onUploadComplete?.(file.name)
      setTimeout(() => setUploadSuccess(null), 3000)

    } catch (err) {
      setUploadError('Erreur upload — reessayez')
    }

    setIsUploading(false)
  }, [agentId, onUploadComplete])

  return (
    <div className="w-full space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        style={{
          padding: '8px 14px',
          background: 'rgba(200,169,110,0.15)',
          color: '#c8a96e',
          border: '1px solid rgba(200,169,110,0.3)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '13px'
        }}
      >
        {isUploading ? '⏳ Sauvegarde...' : '💾 Sauvegarder document'}
      </button>

      {uploadSuccess && (
        <p style={{ color: '#00c800', fontSize: '12px' }}>✅ {uploadSuccess}</p>
      )}
      {uploadError && (
        <p style={{ color: '#ff4444', fontSize: '12px' }}>❌ {uploadError}</p>
      )}
    </div>
  )
}
