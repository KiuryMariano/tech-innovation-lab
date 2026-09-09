export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id?: number
  role: ChatRole
  content: string
  created_at?: string
}

export interface Conversation {
  id: number
  title: string
  created_at: string
  updated_at: string
}

export interface ChatApiResponse {
  conversationId: number
  reply: string
  model: string
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

export function listConversations(): Promise<Conversation[]> {
  return request('/api/chat/conversations')
}

export function fetchMessages(conversationId: number): Promise<ChatMessage[]> {
  return request(`/api/chat/conversations/${conversationId}/messages`)
}

export function renameConversation(conversationId: number, title: string): Promise<unknown> {
  return request(`/api/chat/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
}

export function deleteConversation(conversationId: number): Promise<unknown> {
  return request(`/api/chat/conversations/${conversationId}`, { method: 'DELETE' })
}

export function sendMessage(
  conversationId: number | null,
  content: string,
): Promise<ChatApiResponse> {
  return request<ChatApiResponse>('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, content }),
  })
}
