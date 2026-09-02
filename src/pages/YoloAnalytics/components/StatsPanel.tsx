import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import type { Detection } from '../services/detectionService'
import { labelColor, translateLabel } from '../utils/labels'

interface Props {
  counts: Record<string, number>
  detRate: number
  model: string
  truncated: boolean
  sessionActive: boolean
  currentDetections: Detection[]
}

function StatTile({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <Box
      sx={{
        p: 1.25,
        textAlign: 'center',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        bgcolor: 'rgba(255,255,255,0.03)',
      }}
    >
      <Typography variant="h5" sx={{ color }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
    </Box>
  )
}

export default function StatsPanel({
  counts,
  detRate,
  model,
  truncated,
  sessionActive,
  currentDetections,
}: Props) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const personTotal = counts['person'] ?? 0
  const objectTotal = entries.reduce(
    (sum, [label, count]) => (label === 'person' ? sum : sum + count),
    0,
  )

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">Totais do vídeo analisado</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1, mt: 2 }}>
            <StatTile title="Pessoas" value={personTotal.toLocaleString('pt-BR')} color="#f43f5e" />
            <StatTile title="Objetos" value={objectTotal.toLocaleString('pt-BR')} color="#38bdf8" />
            <StatTile title="Análises/s" value={detRate ? detRate.toFixed(1) : '--'} color="#a78bfa" />
          </Box>
          {sessionActive && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }} color="text.secondary">
              modelo: {model}
              {truncated && ' · só os primeiros 240 s foram analisados'}
            </Typography>
          )}
          <Divider sx={{ my: 2 }} />
          {entries.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {sessionActive
                ? 'Coletando as primeiras detecções…'
                : 'Inicie uma análise para ver os resultados aqui.'}
            </Typography>
          ) : (
            entries.map(([label, count]) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: labelColor(label), flexShrink: 0 }} />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {translateLabel(label)}
                </Typography>
                <Chip size="small" label={count.toLocaleString('pt-BR')} />
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">No momento do vídeo</Typography>
          <Divider sx={{ my: 2 }} />
          {currentDetections.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nada detectado neste instante.
            </Typography>
          ) : (
            [...currentDetections]
              .sort((a, b) => b.confidence - a.confidence)
              .slice(0, 10)
              .map((det, index) => (
                <Box key={`${det.label}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: labelColor(det.label),
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2">{translateLabel(det.label)}</Typography>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${Math.round(det.confidence * 100)}%`}
                    sx={{ ml: 'auto' }}
                  />
                </Box>
              ))
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}
