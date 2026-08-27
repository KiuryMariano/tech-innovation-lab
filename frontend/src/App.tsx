import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, Container, Stack, Typography } from '@mui/material'
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong'
import StopIcon from '@mui/icons-material/Stop'
import UrlInputCard from './components/UrlInputCard'
import VideoPanel from './components/VideoPanel'
import type { PanelStatus } from './components/VideoPanel'
import StatsPanel from './components/StatsPanel'
import { useYouTubePlayer } from './hooks/useYouTubePlayer'
import { analyzeUrl, fetchTimeline, findFrame, getJob } from './services/detectionService'
import type { ApiJob, Detection, Timeline } from './services/detectionService'
import { parseYouTubeId } from './utils/youtube'

const POLL_INTERVAL_MS = 800

export default function App() {
  const [urlError, setUrlError] = useState<string | null>(null)
  const [jobError, setJobError] = useState<string | null>(null)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [job, setJob] = useState<ApiJob | null>(null)
  const [timeline, setTimeline] = useState<Timeline | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [playerPlaying, setPlayerPlaying] = useState(false)
  const [everPlayed, setEverPlayed] = useState(false)

  const hostRef = useRef<HTMLDivElement | null>(null)
  const lastFrameTRef = useRef<number>(Number.NaN)

  const { ready: playerReady, getTime } = useYouTubePlayer(hostRef, videoId, {
    onPlayingChange: (playing) => {
      setPlayerPlaying(playing)
      if (playing) setEverPlayed(true)
    },
    onError: setPlayerError,
  })

  // Sondagem periódica do job até concluir; erros chegam pelo mesmo caminho.
  useEffect(() => {
    if (!job || job.phase === 'done') return
    let cancelled = false
    const id = setTimeout(() => {
      if (cancelled) return
      if (job.phase === 'error') {
        setJobError(job.error ?? 'Falha na análise.')
        setJob(null)
        return
      }
      getJob(job.jobId)
        .then((updated) => {
          if (!cancelled) setJob(updated)
        })
        .catch(() => {
          if (!cancelled) {
            setJob({ ...job, phase: 'error', error: 'Backend indisponível.' })
          }
        })
    }, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [job])

  // Timeline disponível assim que a análise termina.
  useEffect(() => {
    if (job?.phase !== 'done' || timeline) return
    let cancelled = false
    fetchTimeline(job.jobId)
      .then((result) => {
        if (!cancelled) setTimeline(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setJobError(err instanceof Error ? err.message : 'Falha ao carregar detecções.')
          setJob(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [job, timeline])

  // Caixas sincronizadas com o instante atual do player.
  useEffect(() => {
    if (!timeline || !playerReady) return
    const interval = setInterval(() => {
      const frame = findFrame(timeline.frames, getTime() * 1000)
      if (frame) {
        if (frame.t !== lastFrameTRef.current) {
          lastFrameTRef.current = frame.t
          setDetections(frame.d)
        }
      } else if (!Number.isNaN(lastFrameTRef.current)) {
        lastFrameTRef.current = Number.NaN
        setDetections([])
      }
    }, 110)
    return () => clearInterval(interval)
  }, [timeline, playerReady, getTime])

  const handleSubmit = useCallback(
    (rawUrl: string) => {
      const id = parseYouTubeId(rawUrl)
      if (!id) {
        setUrlError('URL inválida. Cole um link do YouTube (ex.: https://www.youtube.com/watch?v=…).')
        return
      }
      setUrlError(null)
      setJobError(null)
      setPlayerError(null)
      setTimeline(null)
      setJob(null)
      setDetections([])
      lastFrameTRef.current = Number.NaN
      if (id !== videoId) {
        setEverPlayed(false)
        setPlayerPlaying(false)
        setVideoId(id)
      }
      analyzeUrl(`https://www.youtube.com/watch?v=${id}`)
        .then(setJob)
        .catch((err: unknown) => {
          setJobError(err instanceof Error ? err.message : 'Falha ao iniciar análise.')
        })
    },
    [videoId],
  )

  const stopAnalysis = () => {
    setJob(null)
    setTimeline(null)
    setDetections([])
    lastFrameTRef.current = Number.NaN
  }

  const busy = job !== null && job.phase !== 'done' && job.phase !== 'error'
  const sessionActive = job !== null || timeline !== null

  const status: PanelStatus = (() => {
    if (!sessionActive) return 'idle'
    if (job?.phase === 'downloading') return 'downloading'
    if (job?.phase === 'analyzing') return 'analyzing'
    if (!timeline) return 'analyzing'
    return everPlayed && !playerPlaying ? 'paused' : 'running'
  })()
  const progress = busy ? (job?.progress ?? 0) : 100

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={0.5} sx={{ textAlign: 'center', alignItems: 'center', mb: 3 }}>
        <CenterFocusStrongIcon color="primary" sx={{ fontSize: 44 }} />
        <Typography variant="h4" component="h1" sx={{ typography: { xs: 'h4', md: 'h5' } }}>
          YOLO Video Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Reconhecimento de pessoas e objetos em vídeos do YouTube com YOLO11
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <UrlInputCard onSubmit={handleSubmit} errorText={urlError} busy={busy} />

        {(jobError || playerError) && (
          <Alert
            severity={jobError ? 'error' : 'warning'}
            onClose={() => {
              setJobError(null)
              setPlayerError(null)
            }}
          >
            {jobError ?? playerError}
          </Alert>
        )}
      </Stack>

      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(280px, 20rem)' },
          alignItems: 'start',
        }}
      >
        <Box>
          <VideoPanel
            hostRef={hostRef}
            playerReady={playerReady}
            status={status}
            progress={progress}
            detections={detections}
          />
          {sessionActive && !busy && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<StopIcon />}
                onClick={stopAnalysis}
              >
                Parar análise
              </Button>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            position: { xs: 'static', md: 'sticky' },
            top: 24,
            maxHeight: { xs: 'none', md: 'calc(100dvh - 48px)' },
            overflowY: 'auto',
            pr: 0.5,
          }}
        >
          <StatsPanel
            counts={timeline?.counts ?? {}}
            detRate={timeline?.analysisFps ?? 0}
            model={timeline?.model ?? ''}
            truncated={timeline?.truncated ?? false}
            sessionActive={sessionActive}
            currentDetections={detections}
          />
        </Box>
      </Box>
    </Container>
  )
}
