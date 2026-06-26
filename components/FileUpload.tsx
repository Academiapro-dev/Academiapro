'use client'

import { useState, useRef, useCallback } from 'react'
import { uploadManager, UploadedDocument } from '@/lib/uploadManager'

interface FileUploadProps {
  agentId: string
  onUploadComplete?: (doc: UploadedDocument) => void
}

export default function FileUpload({ agentId, onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [description, setDescription] = useState('')
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

    const doc = await uploadManager.uploadFile(
      file,
      agentId,
      description || file.name
    )

    setIsUploading(false)

    if (doc) {
      setUploadSuccess('Sauvegarde reussie : ' + file.name)
      setDescription('')
      onUploadComplete?.(doc)
      setTimeout(() => setUploadSuccess(null), 3000)
    } else {
      setUploadError('Erreur upload — reessayez')
    }
  }, [agentId, description, onUploadComplete])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="w-full space-y-3">
      <input
        type="text"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description du document (optionnel)"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
      />

      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={[
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
          isDragging ? 'border-violet-500 bg-violet-900/20' : 'border-gray-600 hover:border-violet-500 hover:bg-gray-800/50',
          isUploading ? 'opacity-50 pointer-events-none' : ''
        ].join(' ')}
      >
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

        {isUploading ? (
          <div className="space-y-2">
            <div className="text-2xl">⏳</div>
            <p className="text-gray-400 text-sm">Upload en cours...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-3xl">📎</div>
            <p className="text-white text-sm font-medium">Deposez votre document ici</p>
            <p className="text-gray-500 text-xs">PDF, JPEG, PNG — 10MB max</p>
          </div>
        )}
      </div>

      {uploadSuccess && (
        <div className="bg-green-900/50 border border-green-600 rounded-lg px-4 py-2">
          <p className="text-green-400 text-sm">{uploadSuccess}</p>
        </div>
      )}
      {uploadError && (
        <div className="bg-red-900/50 border border-red-600 rounded-lg px-4 py-2">
          <p className="text-red-400 text-sm">{uploadError}</p>
        </div>
      )}
    </div>
  )
}
