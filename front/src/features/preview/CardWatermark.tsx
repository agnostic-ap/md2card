import type { CSSProperties } from 'react'

export type WatermarkPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'
  | 'tile'

export type WatermarkConfig = {
  enabled: boolean
  text: string
  position: WatermarkPosition
  /** 0..1 */
  opacity: number
  /** px */
  fontSize: number
  /** null means inherit accent */
  color: string | null
  /** degrees */
  rotate: number
}

type Props = {
  config: WatermarkConfig
  /** Resolved fallback color (the card's accent). */
  fallbackColor: string
}

export function CardWatermark({ config, fallbackColor }: Props) {
  if (!config.enabled) return null
  const text = config.text.trim()
  if (!text) return null

  const color = config.color ?? fallbackColor

  if (config.position === 'tile') {
    const cellW = Math.max(160, text.length * config.fontSize * 0.9 + 80)
    const cellH = Math.max(110, config.fontSize * 6)
    const dataUrl = buildTileSvgDataUrl({
      text,
      color,
      opacity: config.opacity,
      fontSize: config.fontSize,
      rotate: config.rotate,
      cellW,
      cellH,
    })
    return (
      <div
        className="pointer-events-none absolute inset-0 z-10 select-none rounded-[inherit]"
        style={{
          backgroundImage: dataUrl,
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
        }}
        aria-hidden
      />
    )
  }

  const inset = positionToInset(config.position)
  const style: CSSProperties = {
    color,
    opacity: config.opacity,
    fontSize: config.fontSize,
    fontWeight: 500,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
    transform: config.rotate ? `rotate(${config.rotate}deg)` : undefined,
    transformOrigin: 'center',
    ...inset,
  }

  return (
    <div
      className="pointer-events-none absolute z-10 select-none"
      style={style}
      aria-hidden
    >
      {text}
    </div>
  )
}

function positionToInset(p: Exclude<WatermarkPosition, 'tile'>): CSSProperties {
  const pad = 14
  switch (p) {
    case 'top-left':
      return { top: pad, left: pad }
    case 'top-right':
      return { top: pad, right: pad }
    case 'bottom-left':
      return { bottom: pad, left: pad }
    case 'bottom-right':
      return { bottom: pad, right: pad }
    case 'center':
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildTileSvgDataUrl({
  text,
  color,
  opacity,
  fontSize,
  rotate,
  cellW,
  cellH,
}: {
  text: string
  color: string
  opacity: number
  fontSize: number
  rotate: number
  cellW: number
  cellH: number
}): string {
  const cx = cellW / 2
  const cy = cellH / 2
  const safeText = escapeXml(text)
  const safeColor = escapeXml(color)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cellW}" height="${cellH}" viewBox="0 0 ${cellW} ${cellH}"><text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif" font-size="${fontSize}" font-weight="500" fill="${safeColor}" fill-opacity="${opacity}" transform="rotate(${rotate} ${cx} ${cy})">${safeText}</text></svg>`
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
}
