import { Box, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material'
import type { Detection } from '../services/detectionService'
import { labelColor, translateLabel } from '../utils/labels'

interface Props {
  sessionActive: boolean
  currentDetections: Detection[]
}

export default function StatsPanel({ sessionActive, currentDetections }: Props) {
  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">No momento do vídeo</Typography>
          <Divider sx={{ my: 2 }} />
          {currentDetections.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {sessionActive
                ? 'Nada detectado neste instante.'
                : 'Inicie uma análise para ver as detecções aqui.'}
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
