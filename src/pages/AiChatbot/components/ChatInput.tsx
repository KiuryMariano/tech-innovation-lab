import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import { Box, IconButton, InputBase, Paper, Typography } from '@mui/material'
import { useState } from 'react'
import { scrollbarSx } from '../scrollbarSx'

interface ChatInputProps {
  disabled: boolean
  onSend: (text: string) => void
}

export default function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [text, setText] = useState('')

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pb: 3, pt: 1 }}>
      <Box sx={{ maxWidth: 768, mx: 'auto' }}>
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            pl: 2.5,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
          }}
        >
          <InputBase
            autoFocus
            multiline
            maxRows={8}
            placeholder="Pergunte algo…"
            value={text}
            disabled={disabled}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit()
              }
            }}
            sx={[{ flex: 1, py: 1 }, scrollbarSx]}
          />
          <IconButton
            onClick={submit}
            disabled={!text.trim() || disabled}
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': { bgcolor: 'action.selected', color: 'text.disabled' },
            }}
          >
            <ArrowUpwardIcon fontSize="small" />
          </IconButton>
        </Paper>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 1 }}
        >
          A IA pode cometer erros. Verifique as informações importantes.
        </Typography>
      </Box>
    </Box>
  )
}
