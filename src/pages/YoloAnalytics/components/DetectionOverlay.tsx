import { useEffect, useRef } from 'react'
import type { Detection } from '../services/detectionService'
import { labelColor, translateLabel } from '../utils/labels'

interface Props {
  detections: Detection[]
  active: boolean
}

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function traceRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  const r = Math.min(radius, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawDetection(
  ctx: CanvasRenderingContext2D,
  detection: Detection,
  canvasWidth: number,
  canvasHeight: number,
  active: boolean,
) {
  const color = labelColor(detection.label)
  const alpha = active ? 0.95 : 0.45
  const [nx, ny, nw, nh] = detection.bbox
  const x = nx * canvasWidth
  const y = ny * canvasHeight
  const bw = nw * canvasWidth
  const bh = nh * canvasHeight
  if (bw < 6 || bh < 6) return

  const lineWidth = Math.min(Math.max(canvasWidth / 480, 1.5), 3)
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = withAlpha(color, alpha)
  ctx.fillStyle = withAlpha(color, active ? 0.08 : 0.04)
  traceRoundRect(ctx, x, y, bw, bh, lineWidth * 4)
  ctx.fill()
  ctx.stroke()

  const fontSize = Math.min(Math.max(canvasWidth / 56, 10), 15)
  const text = `${translateLabel(detection.label)} ${Math.round(detection.confidence * 100)}%`
  ctx.font = `bold ${fontSize}px Roboto, system-ui, sans-serif`
  const chipWidth = ctx.measureText(text).width + fontSize * 1.1
  const chipHeight = fontSize + fontSize * 0.7

  let chipY = y - chipHeight - fontSize * 0.35
  if (chipY < 0) chipY = y + bh + fontSize * 0.35
  const chipX = Math.min(Math.max(x, 4), canvasWidth - chipWidth - 4)

  ctx.fillStyle = withAlpha(color, alpha)
  traceRoundRect(ctx, chipX, chipY, chipWidth, chipHeight, chipHeight * 0.32)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, chipX + fontSize * 0.55, chipY + chipHeight / 2 + 1)
}

export default function DetectionOverlay({ detections, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const width = parent.clientWidth
      const height = parent.clientHeight
      if (width === 0 || height === 0) return

      const targetWidth = Math.round(width * dpr)
      const targetHeight = Math.round(height * dpr)
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth
        canvas.height = targetHeight
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      for (const detection of detections) {
        drawDetection(ctx, detection, width, height, active)
      }
    }

    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [detections, active])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  )
}
