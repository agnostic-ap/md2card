import type { CSSProperties } from 'react'

export type BackgroundPreset = {
  id: string
  label: string
  /** Applied to the canvas behind the card */
  canvasStyle: CSSProperties
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'none',
    label: '无背景（用主题底色）',
    canvasStyle: {},
  },
  {
    id: 'soft-grid',
    label: '淡网格',
    canvasStyle: {
      backgroundColor: '#16161f',
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
      `,
      backgroundSize: '24px 24px',
    },
  },
  {
    id: 'dots',
    label: '点阵',
    canvasStyle: {
      backgroundColor: '#14141c',
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
      backgroundSize: '18px 18px',
    },
  },
  {
    id: 'gradient-purple',
    label: '紫粉渐变',
    canvasStyle: {
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)',
    },
  },
  {
    id: 'gradient-ocean',
    label: '海蓝渐变',
    canvasStyle: {
      background: 'linear-gradient(180deg, #0c4a6e 0%, #082f49 100%)',
    },
  },
  {
    id: 'gradient-sunset',
    label: '落日渐变',
    canvasStyle: {
      background: 'linear-gradient(135deg, #431407 0%, #9a3412 50%, #c2410c 100%)',
    },
  },
  {
    id: 'noise',
    label: '噪点纹理',
    canvasStyle: {
      backgroundColor: '#15151d',
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E")`,
    },
  },
  {
    id: 'paper-texture',
    label: '纸张纤维',
    canvasStyle: {
      backgroundColor: '#1c1917',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23p)' opacity='0.15'/%3E%3C/svg%3E")`,
    },
  },
  {
    id: 'light-shell',
    label: '浅色工作台',
    canvasStyle: {
      background: 'linear-gradient(180deg, #f4f4f5 0%, #e4e4e7 100%)',
    },
  },
  {
    id: 'mint-mist',
    label: '薄荷雾',
    canvasStyle: {
      background: 'linear-gradient(160deg, #ecfdf5 0%, #d1fae5 100%)',
    },
  },
]

export function getBackgroundPreset(id: string): BackgroundPreset {
  return BACKGROUND_PRESETS.find((b) => b.id === id) ?? BACKGROUND_PRESETS[0]!
}
