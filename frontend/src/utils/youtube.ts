export function parseYouTubeId(raw: string): string | null {
  const input = raw.trim()
  if (!input) return null
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input

  const patterns = [
    /youtube\.com\/watch\?(?:[^#]*&)?v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/live\/([A-Za-z0-9_-]{11})/,
  ]
  const match = patterns.map((pattern) => input.match(pattern)).find(Boolean)
  return match ? match[1] : null
}
