import { createClient } from '@/lib/supabase/client'

export interface UploadedDocument {
  id: string
  agent_id: string
  file_name: string
  file_type: string
  file_url: string
  storage_path: string
  description?: string
  tags?: string[]
  created_at: string
}

export const uploadManager = {

  async uploadFile(
    file: File,
    agentId: string,
    description?: string
  ): Promise<UploadedDocument | null> {
    const supabase = createClient()
    
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${agentId}/${timestamp}_${safeName}`
    
    const { error: uploadError } = await supabase.storage
      .from('agent_documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false
      })
    
    if (uploadError) {
      console.error('Erreur upload Storage:', uploadError)
      return null
    }
    
    const { data: urlData } = await supabase.storage
      .from('agent_documents')
      .createSignedUrl(storagePath, 365 * 24 * 60 * 60)
    
    if (!urlData?.signedUrl) return null
    
    const { data, error: dbError } = await supabase
      .from('agent_documents')
      .insert({
        agent_id: agentId,
        file_name: file.name,
        file_type: file.type,
        file_url: urlData.signedUrl,
        storage_path: storagePath,
        description: description || ''
      })
      .select()
      .single()
    
    if (dbError) return null
    return data
  },

  async getDocuments(agentId?: string): Promise<UploadedDocument[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('agent_documents')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (agentId) query = query.eq('agent_id', agentId)
    
    const { data, error } = await query
    if (error) return []
    return data || []
  },

  async searchDocuments(searchTerm: string): Promise<UploadedDocument[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('agent_documents')
      .select('*')
      .or(`file_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
    
    if (error) return []
    return data || []
  },

  async deleteDocument(id: string, storagePath: string): Promise<boolean> {
    const supabase = createClient()
    
    await supabase.storage
      .from('agent_documents')
      .remove([storagePath])
    
    const { error } = await supabase
      .from('agent_documents')
      .delete()
      .eq('id', id)
    
    return !error
  },

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  },

  getFileIcon(fileType: string): string {
    if (fileType === 'application/pdf') return '📄'
    if (fileType.startsWith('image/')) return '🖼️'
    return '📎'
  }
}
