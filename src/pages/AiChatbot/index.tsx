import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Box, Typography } from '@mui/material'
import type { DocSection } from '../../components/DocumentationModal'
import ChatInput from './components/ChatInput'
import ChatMessages from './components/ChatMessages'
import ChatSidebar from './components/ChatSidebar'
import { scrollbarSx } from './scrollbarSx'
import {
  deleteConversation,
  fetchMessages,
  listConversations,
  renameConversation,
  sendMessage,
} from './services/chatService'
import type { ChatMessage, Conversation } from './services/chatService'

const DOCS: DocSection[] = [
  {
    heading: 'Objetivo',
    body: 'Um chatbot com várias conversas, no estilo de interfaces de IA conhecidas: a lista de conversas fica no menu à esquerda, persistida em banco de dados SQLite, e as respostas vêm de uma IA real via API GLM da Z.AI.',
  },
  {
    heading: 'Como foi construída',
    body: 'Backend em Python com FastAPI (pasta ai-chatbot/backend). O banco (backend/chat.db) usa SQLite puro, sem ORM: a tabela conversations guarda título e datas, e a tabela messages guarda cada troca (papel, texto, data) ligada à conversa. As respostas da IA vêm do proxy para a API da Z.AI, com a chave guardada no arquivo .env do backend. Frontend em React 19 + TypeScript + Material UI (página src/pages/AiChatbot), com o proxy do Vite direcionando /api/chat para a porta 8002.',
  },
  {
    heading: 'Como funciona',
    body: (
      <ol style={{ margin: 0, paddingLeft: 20 }}>
        <li>O botão Nova conversa limpa a seleção; a conversa só nasce no banco quando você envia a primeira mensagem.</li>
        <li>O título da conversa é a própria primeira mensagem (limitada a 60 caracteres).</li>
        <li>Ao enviar uma mensagem, o backend salva no SQLite, monta o histórico completo da conversa e repassa para a API da Z.AI.</li>
        <li>A resposta da IA é gravada no banco e exibida como uma nova mensagem do assistente.</li>
        <li>Ao clicar em uma conversa na lista, o histórico é recarregado do banco — nada se perde ao recarregar a página.</li>
        <li>No menu "…" de cada conversa é possível renomear (com confirmação de entrada) ou apagar (com confirmação antes de remover); as mensagens vão junto, pelo cascade do banco.</li>
      </ol>
    ),
  },
  {
    heading: 'Endpoints da API',
    body: (
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li>GET /api/chat/conversations — lista as conversas (mais recentes primeiro)</li>
        <li>GET /api/chat/conversations/&#123;id&#125;/messages — mensagens de uma conversa</li>
        <li>POST /api/chat/messages — envia a mensagem, salva e responde com a resposta da IA</li>
        <li>PATCH /api/chat/conversations/&#123;id&#125; — renomeia a conversa</li>
        <li>DELETE /api/chat/conversations/&#123;id&#125; — apaga a conversa e suas mensagens</li>
        <li>GET /api/health — verificação de saúde</li>
      </ul>
    ),
  },
]

export default function AiChatbotPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = scrollRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messages, sending])

  const loadConversation = useCallback((conversationId: number) => {
    fetchMessages(conversationId)
      .then(setMessages)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Falha ao carregar a conversa.')
      })
  }, [])

  const refreshConversations = useCallback(
    () =>
      listConversations()
        .then((list) => {
          setConversations(list)
          return list
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Falha ao carregar as conversas.')
          return [] as Conversation[]
        }),
    [],
  )

  const selectFirst = useCallback(
    (list: Conversation[]) => {
      if (list.length > 0) {
        setActiveId(list[0].id)
        loadConversation(list[0].id)
      } else {
        setActiveId(null)
        setMessages([])
      }
    },
    [loadConversation],
  )

  useEffect(() => {
    refreshConversations().then(selectFirst)
  }, [refreshConversations, selectFirst])

  const handleSelect = useCallback(
    (conversationId: number) => {
      setActiveId(conversationId)
      setError(null)
      loadConversation(conversationId)
    },
    [loadConversation],
  )

  const handleNew = useCallback(() => {
    setActiveId(null)
    setMessages([])
    setError(null)
  }, [])

  const handleSend = useCallback(
    (text: string) => {
      const userMessage: ChatMessage = { role: 'user', content: text }
      setMessages((previous) => [...previous, userMessage])
      setSending(true)
      setError(null)
      sendMessage(activeId, text)
        .then((response) => {
          setMessages((previous) => [...previous, { role: 'assistant', content: response.reply }])
          setActiveId(response.conversationId)
          refreshConversations()
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Falha ao conversar com a IA.')
        })
        .finally(() => setSending(false))
    },
    [activeId, refreshConversations],
  )

  const handleRename = useCallback(
    (conversationId: number, title: string) => {
      renameConversation(conversationId, title)
        .then(() => refreshConversations())
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Falha ao renomear a conversa.')
        })
    },
    [refreshConversations],
  )

  const handleDelete = useCallback(
    (conversationId: number) => {
      const wasActive = conversationId === activeId
      deleteConversation(conversationId)
        .then(() => refreshConversations())
        .then((list) => {
          if (wasActive) selectFirst(list)
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Falha ao apagar a conversa.')
        })
    },
    [activeId, refreshConversations, selectFirst],
  )

  const activeTitle = conversations.find((conversation) => conversation.id === activeId)?.title

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
        onNew={handleNew}
        docsSections={DOCS}
        onRename={handleRename}
        onDelete={handleDelete}
      />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, py: 1.5, textAlign: 'center' }}>
          <Typography variant="body1" noWrap sx={{ fontWeight: 600 }}>
            {activeTitle ?? 'Nova conversa'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mx: { xs: 2, md: 3 }, mt: 2 }}>
            {error}
          </Alert>
        )}

        <Box ref={scrollRef} sx={[{ flex: 1, overflowY: 'auto', minHeight: 0 }, scrollbarSx]}>
          <ChatMessages messages={messages} sending={sending} />
        </Box>

        <ChatInput disabled={sending} onSend={handleSend} />
      </Box>
    </Box>
  )
}
