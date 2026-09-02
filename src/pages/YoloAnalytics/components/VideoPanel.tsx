import type { RefObject } from 'react'
import { Box, Chip, CircularProgress, LinearProgress, Typography } from '@mui/material'
import SmartDisplayOutlinedIcon from '@mui/icons-material/SmartDisplayOutlined'
import type { Detection } from '../services/detectionService'
import DetectionOverlay from './DetectionOverlay'

export type PanelStatus = 'idle' | 'downloading' | 'analyzing' | 'running' | 'paused'

interface Props {
  hostRef: RefObject<HTMLDivElement | null>
  playerReady: boolean
  status: PanelStatus
  progress: number
  detections: Detection[]
}

const STATUS_LABELS: Record<Exclude<PanelStatus, 'idle' | 'paused'>, string> = {
  downloading: 'Baixando vídeo do YouTube…',
  analyzing: 'Detectando com YOLO…',
  running: 'Analisando em tempo real',
}

export default function VideoPanel({ hostRef, playerReady, status, progress, detections }: Props) {
  const processing = status === 'downloading' || status === 'analyzing'

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        bgcolor: '#000',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box ref={hostRef} sx={{ position: 'absolute', inset: 0 }} />

      {status === 'idle' && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            color: 'text.secondary',
          }}
        >
          <SmartDisplayOutlinedIcon sx={{ fontSize: 64 }} />
          <Typography variant="body1">
            Cole um link do YouTube acima para começar a análise
          </Typography>
        </Box>
      )}

      {status !== 'idle' && !playerReady && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      )}

      {status !== 'idle' && playerReady && (
        <>
          <DetectionOverlay detections={detections} active={status === 'running'} />
          {(status === 'downloading' || status === 'analyzing') && (
            <Chip
              sx={{ position: 'absolute', top: 12, left: 12, zIndex: 3 }}
              color="warning"
              icon={<CircularProgress size={14} color="inherit" />}
              label={`${STATUS_LABELS[status]} ${Math.round(progress)}%`}
              size="small"
            />
          )}
          {status === 'running' && (
            <Chip
              sx={{ position: 'absolute', top: 12, left: 12, zIndex: 3 }}
              color="success"
              label={STATUS_LABELS.running}
              size="small"
              icon={
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'currentColor',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.25 },
                    },
                    animation: 'pulse 1.6s ease-in-out infinite',
                  }}
                />
              }
            />
          )}
          {status === 'paused' && (
            <Chip
              sx={{ position: 'absolute', top: 12, left: 12, zIndex: 3 }}
              color="default"
              label="Detecções pausadas — vídeo pausado"
              size="small"
            />
          )}
          {processing && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3 }}
            />
          )}
        </>
      )}
    </Box>
  )
}
