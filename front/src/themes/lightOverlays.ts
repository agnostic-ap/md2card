import type { CSSProperties } from 'react'

export type LightOverlayPreset = {
  id: string
  label: string
  /** Pseudo-overlay on top of the card (pointer-events none) */
  overlayStyle?: CSSProperties
  overlayClassName?: string
}

export const LIGHT_OVERLAYS: LightOverlayPreset[] = [
  { id: 'none', label: '无光影' },
  {
    id: 'vignette',
    label: '暗角',
    overlayStyle: {
      background:
        'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.2) 100%)',
    },
  },
  {
    id: 'soft-glow',
    label: '柔光',
    overlayStyle: {
      background:
        'radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.15) 0%, transparent 55%)',
    },
  },
  {
    id: 'window-blind',
    label: '百叶窗影',
    overlayClassName: 'opacity-30',
    overlayStyle: {
      backgroundImage: `repeating-linear-gradient(
        90deg,
        transparent,
        transparent 18px,
        rgba(0,0,0,0.12) 18px,
        rgba(0,0,0,0.12) 22px
      )`,
      mixBlendMode: 'multiply',
    },
  },
  {
    id: 'leaf',
    label: '叶影',
    overlayStyle: {
      opacity: 0.35,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath fill='%23000' opacity='0.15' d='M10 60c20-25 45-40 60-55-15 20-35 40-60 55z'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      mixBlendMode: 'multiply',
    },
  },
  {
    id: 'grain',
    label: '胶片颗粒',
    overlayStyle: {
      opacity: 0.12,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
      mixBlendMode: 'overlay',
    },
  },
  {
    id: 'scanlines',
    label: '扫描线',
    overlayStyle: {
      opacity: 0.08,
      backgroundImage:
        'repeating-linear-gradient(0deg, rgba(0,0,0,0.35), rgba(0,0,0,0.35) 1px, transparent 1px, transparent 3px)',
      mixBlendMode: 'multiply',
    },
  },
]

export function getLightOverlay(id: string): LightOverlayPreset {
  return LIGHT_OVERLAYS.find((o) => o.id === id) ?? LIGHT_OVERLAYS[0]!
}
