export interface StoredImage {
  id: number
  filename: string
  content_type: string
  size: number
  uploaded_at: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    const detail: unknown = await response
      .json()
      .then((body) => body.detail)
      .catch(() => null)
    throw new Error(typeof detail === 'string' ? detail : 'Erro na comunicação com o servidor.')
  }
  return response.json()
}

export function uploadImage(file: File): Promise<{ id: number; filename: string; size: number }> {
  const body = new FormData()
  body.append('file', file)
  return request('/api/images', { method: 'POST', body })
}

export function listImages(): Promise<StoredImage[]> {
  return request('/api/images')
}

export function previewUrl(id: number): string {
  return `/api/images/${id}/preview`
}
