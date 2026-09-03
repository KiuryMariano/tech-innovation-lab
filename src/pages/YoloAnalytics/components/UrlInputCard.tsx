import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, TextField, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import StopIcon from '@mui/icons-material/Stop'

interface IExampleVideo {
  label: string
  url: string
}

const EXAMPLE_VIDEOS: IExampleVideo[] = [
  { label: 'Reel', url: 'https://www.youtube.com/shorts/YaGfNy_X6Q8' },
  { label: 'Vídeo geral', url: 'https://www.youtube.com/watch?v=vb1Mu8cRGKA' },
  { label: 'Vídeo longo padrão', url: 'https://www.youtube.com/watch?v=Tl9Skg6r308' },
]

interface Props {
  onSubmit: (url: string) => void
  errorText: string | null
  busy: boolean
  stopVisible?: boolean
  onStop?: () => void
}

export default function UrlInputCard({ onSubmit, errorText, busy, stopVisible, onStop }: Props) {
  const [input, setInput] = useState('')

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!busy) onSubmit(input)
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">Link do vídeo</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Cole a URL de um vídeo do YouTube para iniciar a detecção com YOLO.
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            size="small"
            disabled={busy}
            placeholder="https://www.youtube.com/watch?v=…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            error={errorText !== null}
            sx={{ flex: 1, minWidth: 220 }}
            slotProps={{
              input: {
                'aria-label': 'URL do YouTube',
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<SearchIcon />}
            disabled={busy}
            sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {busy ? 'Processando…' : 'Analisar'}
          </Button>
          {stopVisible && onStop && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<StopIcon />}
              onClick={onStop}
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Parar análise
            </Button>
          )}
        </Box>
        {errorText && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorText}
          </Alert>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            Exemplos rápidos:
          </Typography>
          {EXAMPLE_VIDEOS.map((example) => (
            <Chip
              key={example.url}
              label={example.label}
              size="small"
              clickable={!busy}
              disabled={busy}
              onClick={() => onSubmit(example.url)}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}
