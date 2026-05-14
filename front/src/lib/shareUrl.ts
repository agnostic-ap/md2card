import LZString from 'lz-string'

export type SharePayload = {
  markdown: string
  cardThemeId: string
  backgroundId: string
  overlayId: string
  fontFamily: string | null
  fgColor: string | null
  headingColor: string | null
  accentColor: string | null
  splitMode: boolean
  showPageNumbers: boolean
  watermark: {
    enabled: boolean
    text: string
    position: string
    opacity: number
    fontSize: number
    color: string | null
    rotate: number
  }
}

const PARAM = 's'

export function encodeShareUrl(payload: SharePayload): string {
  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload))
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set(PARAM, compressed)
  return url.toString()
}

export function decodeShareUrl(): SharePayload | null {
  try {
    const raw = new URLSearchParams(window.location.search).get(PARAM)
    if (!raw) return null
    const json = LZString.decompressFromEncodedURIComponent(raw)
    if (!json) return null
    return JSON.parse(json) as SharePayload
  } catch {
    return null
  }
}
