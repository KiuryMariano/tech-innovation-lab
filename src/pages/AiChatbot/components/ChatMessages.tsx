import SmartToyIcon from '@mui/icons-material/SmartToy'
import { Avatar, Box, CircularProgress, Typography } from '@mui/material'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import type { ReactNode } from 'react'
import type { ChatMessage } from '../services/chatService'

interface ChatMessagesProps {
  messages: ChatMessage[]
  sending: boolean
}

const remarkPlugins = [remarkGfm]

const heading =
  (variant: 'h6' | 'subtitle1' | 'subtitle2') =>
  ({ children }: { children?: ReactNode }) => (
    <Typography
      variant={variant}
      sx={{ mt: 2, mb: 1, fontWeight: 600, '&:first-of-type': { mt: 0 } }}
    >
      {children}
    </Typography>
  )

const list =
  (tag: 'ul' | 'ol') =>
  ({ children }: { children?: ReactNode }) => (
    <Box component={tag} sx={{ pl: 3.5, my: 1 }}>
      {children}
    </Box>
  )

const tableCell =
  (tag: 'th' | 'td', header: boolean) =>
  ({ children }: { children?: ReactNode }) => (
    <Box
      component={tag}
      sx={{
        border: 1,
        borderColor: 'divider',
        px: 1.5,
        py: 0.75,
        ...(header && { textAlign: 'left', fontWeight: 600 }),
      }}
    >
      {children}
    </Box>
  )

const markdownComponents: Components = {
  p: ({ children }) => (
    <Typography variant="body1" sx={{ my: 1, '&:first-of-type': { mt: 0 } }}>
      {children}
    </Typography>
  ),
  h1: heading('h6'),
  h2: heading('h6'),
  h3: heading('subtitle1'),
  h4: heading('subtitle1'),
  h5: heading('subtitle2'),
  h6: heading('subtitle2'),
  ul: list('ul'),
  ol: list('ol'),
  li: ({ children }) => (
    <Box component="li" sx={{ typography: 'body1', mb: 0.5 }}>
      {children}
    </Box>
  ),
  a: ({ children, href }) => (
    <Box
      component="a"
      href={href}
      target="_blank"
      rel="noreferrer"
      sx={{ color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
    >
      {children}
    </Box>
  ),
  blockquote: ({ children }) => (
    <Box
      component="blockquote"
      sx={{ borderLeft: 3, borderColor: 'divider', pl: 2, my: 1.5, color: 'text.secondary' }}
    >
      {children}
    </Box>
  ),
  pre: ({ children }) => (
    <Box
      component="pre"
      sx={{
        bgcolor: 'background.default',
        borderRadius: 2,
        p: 2,
        my: 1.5,
        overflowX: 'auto',
        fontSize: 14,
        lineHeight: 1.6,
        '& code': { bgcolor: 'transparent', px: 0, py: 0, borderRadius: 0 },
      }}
    >
      {children}
    </Box>
  ),
  code: ({ children, className }) => (
    <Box
      component="code"
      className={className}
      sx={{
        fontFamily: 'Menlo, Consolas, monospace',
        fontSize: '0.9em',
        bgcolor: 'background.default',
        px: 0.75,
        py: 0.25,
        borderRadius: 1,
      }}
    >
      {children}
    </Box>
  ),
  table: ({ children }) => (
    <Box
      component="table"
      sx={{ display: 'block', overflowX: 'auto', my: 1.5, borderCollapse: 'collapse', fontSize: 14 }}
    >
      {children}
    </Box>
  ),
  th: tableCell('th', true),
  td: tableCell('td', false),
  hr: () => <Box component="hr" sx={{ border: 'none', borderTop: 1, borderColor: 'divider', my: 2 }} />,
}

function AssistantAvatar() {
  return (
    <Avatar
      sx={{ width: 30, height: 30, bgcolor: 'primary.main', color: 'primary.contrastText' }}
    >
      <SmartToyIcon sx={{ fontSize: 18 }} />
    </Avatar>
  )
}

export default function ChatMessages({ messages, sending }: ChatMessagesProps) {
  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 4 }}>
      {messages.length === 0 && !sending && (
        <Box sx={{ textAlign: 'center', mt: { xs: 6, md: 10 } }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Como posso ajudar?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Envie uma mensagem para começar a conversar.
          </Typography>
        </Box>
      )}
      <Box sx={{ maxWidth: 768, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {messages.map((message, index) =>
          message.role === 'user' ? (
            <Box key={message.id ?? index} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Typography
                variant="body1"
                sx={{
                  bgcolor: 'background.default',
                  px: 2.5,
                  py: 1.5,
                  borderRadius: '18px',
                  maxWidth: '85%',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {message.content}
              </Typography>
            </Box>
          ) : (
            <Box key={message.id ?? index} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <AssistantAvatar />
              <Box sx={{ minWidth: 0, pt: 0.25 }}>
                <Markdown remarkPlugins={remarkPlugins} components={markdownComponents}>
                  {message.content}
                </Markdown>
              </Box>
            </Box>
          ),
        )}
        {sending && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <AssistantAvatar />
            <CircularProgress size={16} sx={{ ml: 0.5 }} />
          </Box>
        )}
      </Box>
    </Box>
  )
}
