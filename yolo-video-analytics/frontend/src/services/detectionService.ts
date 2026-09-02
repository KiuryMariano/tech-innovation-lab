export interface Detection {
  label: string
  confidence: number
  bbox: [number, number, number, number]
}

export interface TimelineFrame {
  t: number
  d: Detection[]
}

export interface Timeline {
  model: string
  analysisFps: number
  durationSec: number
  frameSize: [number, number]
  truncated: boolean
  counts: Record<string, number>
  frames: TimelineFrame[]
}

export type JobPhase = 'queued' | 'downloading' | 'analyzing' | 'done' | 'error'

export interface ApiJob {
  jobId: string
  videoId: string
  phase: JobPhase
  progress: number
  model?: string | null
  durationSec?: number | null
  detRate?: number | null
  cached?: boolean
  error?: string | null
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    let detail = `Erro HTTP ${response.status}`
    try {
      const body = await response.json()
      if (body?.detail) detail = String(body.detail)
    } catch {
      // corpo sem JSON — mantemos a mensagem genérica.
    }
    throw new Error(detail)
  }
  return response.json() as Promise<T>
}

export function analyzeUrl(url: string): Promise<ApiJob> {
  return request<ApiJob>('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
}

export function getJob(jobId: string): Promise<ApiJob> {
  return request<ApiJob>(`/api/jobs/${jobId}`)
}

export function fetchTimeline(jobId: string): Promise<Timeline> {
  return request<Timeline>(`/api/jobs/${jobId}/timeline`)
}

const FRAME_TOLERANCE_MS = 200

export function findFrame(frames: TimelineFrame[], timeMs: number): TimelineFrame | null {
  if (frames.length === 0) return null
  let low = 0
  let high = frames.length - 1
  let best: TimelineFrame | null = null
  while (low <= high) {
    const mid = (low + high) >> 1
    if (frames[mid].t <= timeMs) {
      best = frames[mid]
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  if (!best || timeMs - best.t > FRAME_TOLERANCE_MS) return null
  return best
}
