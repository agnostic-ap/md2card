import type { CSSProperties } from 'react'

export type LogoPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export type LogoConfig = {
  /** base64 data URL of the uploaded image, or null if not set */
  dataUrl: string | null
  position: LogoPosition
  /** px */
  size: number
  /** px; use size/2 for a perfect circle */
  radius: number
  /** 0..1 */
  opacity: number
}

type Props = {
  config: LogoConfig
}

export function CardLogo({ config }: Props) {
  if (!config.dataUrl) return null

  const inset = positionToInset(config.position)
  const style: CSSProperties = {
    width: config.size,
    height: config.size,
    borderRadius: config.radius,
    opacity: config.opacity,
    objectFit: 'cover',
    ...inset,
  }

  return (
    <img
      src={config.dataUrl}
      alt=""
      aria-hidden
      className="pointer-events-none absolute z-20 select-none"
      style={style}
      crossOrigin="anonymous"
    />
  )
}

function positionToInset(p: LogoPosition): CSSProperties {
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
  }
}
