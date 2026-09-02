import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

interface YTPlayer {
  destroy(): void
  getCurrentTime(): number
}

interface YTPlayerConfig {
  videoId: string
  playerVars: Record<string, number | string>
  events: {
    onReady?: () => void
    onStateChange?: (event: { data: number }) => void
    onError?: (event: { data: number }) => void
  }
}

interface YTApi {
  Player: new (element: HTMLElement, config: YTPlayerConfig) => YTPlayer
}

declare global {
  interface Window {
    YT?: YTApi
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YTApi> | null = null

function loadIframeApi(): Promise<YTApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previous?.()
        resolve(window.YT as YTApi)
      }
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    })
  }
  return apiPromise
}

const PLAYING_STATE = 1

const ERROR_MESSAGES: Record<number, string> = {
  2: 'ID do vídeo inválido.',
  5: 'Erro no player do YouTube.',
  100: 'Vídeo não encontrado ou removido.',
  101: 'O proprietário não permite reprodução incorporada.',
  150: 'O proprietário não permite reprodução incorporada.',
}

interface Options {
  onPlayingChange: (playing: boolean) => void
  onError: (message: string) => void
}

export interface YouTubePlayerHandle {
  ready: boolean
  getTime: () => number
}

export function useYouTubePlayer(
  containerRef: RefObject<HTMLDivElement | null>,
  videoId: string | null,
  options: Options,
): YouTubePlayerHandle {
  const [ready, setReady] = useState(false)
  const playerRef = useRef<YTPlayer | null>(null)
  const playingCbRef = useRef(options.onPlayingChange)
  const errorCbRef = useRef(options.onError)

  useEffect(() => {
    playingCbRef.current = options.onPlayingChange
    errorCbRef.current = options.onError
  })

  useEffect(() => {
    const container = containerRef.current
    if (!videoId || !container) return

    let disposed = false
    let player: YTPlayer | null = null
    const host = document.createElement('div')
    host.style.width = '100%'
    host.style.height = '100%'
    container.appendChild(host)

    loadIframeApi().then((api) => {
      if (disposed) return
      player = new api.Player(host, {
        videoId,
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3 },
        events: {
          onReady: () => {
            if (!disposed) setReady(true)
          },
          onStateChange: (event) => {
            if (!disposed) playingCbRef.current(event.data === PLAYING_STATE)
          },
          onError: (event) => {
            if (!disposed) {
              errorCbRef.current(ERROR_MESSAGES[event.data] ?? 'Falha ao carregar o vídeo.')
            }
          },
        },
      })
      playerRef.current = player
    })

    return () => {
      disposed = true
      try {
        playerRef.current?.destroy()
      } catch {
        // O player pode já ter sido descartado pelo próprio YouTube.
      }
      playerRef.current = null
      setReady(false)
    }
  }, [containerRef, videoId])

  const getTime = useCallback(() => playerRef.current?.getCurrentTime() ?? 0, [])

  return { ready, getTime }
}
