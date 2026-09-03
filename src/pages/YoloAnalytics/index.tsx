import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Box, Container, Stack } from '@mui/material'
import ActivityHeader from '../../components/ActivityHeader'
import type { DocSection } from '../../components/DocumentationModal'
import UrlInputCard from './components/UrlInputCard'
import VideoPanel from './components/VideoPanel'
import type { PanelStatus } from './components/VideoPanel'
import StatsPanel from './components/StatsPanel'
import { useYouTubePlayer } from './hooks/useYouTubePlayer'
import { analyzeUrl, fetchTimeline, findFrame, getJob } from './services/detectionService'
import type { ApiJob, Detection, Timeline } from './services/detectionService'
import { parseYouTubeId } from './utils/youtube'

const POLL_INTERVAL_MS = 800

const DOCS: DocSection[] = [
  {
    heading: 'Objetivo',
    body: 'Reconhecer pessoas e objetos em vídeos do YouTube e exibir as detecções sobrepostas ao player, sincronizadas com a reprodução, além de estatísticas agregadas por classe.',
  },
  {
    heading: 'Como foi construída',
    body: 'Frontend em React 19 + TypeScript + Material UI (página src/pages/YoloAnalytics). Backend em Python com FastAPI (pasta yolo-video-analytics/backend): download do vídeo com yt-dlp e inferência YOLO (Ultralytics, modelos yolo11n/yolov8n) sobre os frames com OpenCV, em CPU ou GPU.',
  },
  {
    heading: 'Como funciona',
    body: (
      <ol style={{ margin: 0, paddingLeft: 20 }}>
        <li>A URL colada vira um job assíncrono no backend.</li>
        <li>O vídeo é baixado em H.264 (até 720p, sem áudio).</li>
        <li>O modelo analisa os frames a 5 fps gerando a timeline (classe, confiança e posição das caixas).</li>
        <li>A timeline fica em cache — rever o mesmo vídeo é instantâneo.</li>
        <li>O player do YouTube reproduz o vídeo e as caixas são desenhadas conforme o tempo avança.</li>
      </ol>
    ),
  },
  {
    heading: 'Endpoints da API',
    body: (
      <ul style={{ margin: 0, paddingLeft: 20 }}>
        <li>POST /api/analyze — inicia a análise de um vídeo</li>
        <li>GET /api/jobs/&#123;id&#125; — status e progresso do job</li>
        <li>GET /api/jobs/&#123;id&#125;/timeline — timeline de detecções</li>
        <li>GET /api/health — verificação de saúde</li>
      </ul>
    ),
  },
]

export default function YoloAnalyticsPage() {
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
  const videoBoxRef = useRef<HTMLDivElement | null>(null)
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
      videoBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
      <ActivityHeader
        title="YOLO Video Analytics"
        subtitle="Reconhecimento de pessoas e objetos em vídeos do YouTube com YOLO11"
        docsSections={DOCS}
      />

      <Stack spacing={2}>
        <UrlInputCard
          onSubmit={handleSubmit}
          errorText={urlError}
          busy={busy}
          stopVisible={sessionActive && !busy}
          onStop={stopAnalysis}
        />

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
        <Box ref={videoBoxRef} sx={{ scrollMarginTop: 16 }}>
          <VideoPanel
            hostRef={hostRef}
            playerReady={playerReady}
            status={status}
            progress={progress}
            detections={detections}
          />
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
          <StatsPanel sessionActive={sessionActive} currentDetections={detections} />
        </Box>
      </Box>
    </Container>
  )
}
