export type StylePack = {
  id: string
  label: string
  /** Preview gradient shown in the swatch */
  previewGradient: string
  themeId: string
  backgroundId: string
  overlayId: string
}

export const STYLE_PACKS: StylePack[] = [
  {
    id: 'xhs-standard',
    label: '经典',
    previewGradient: 'linear-gradient(135deg, #fff 0%, #dbeafe 100%)',
    themeId: 'xhs-pro',
    backgroundId: 'none',
    overlayId: 'none',
  },
  {
    id: 'dark-tech',
    label: '暗黑极客',
    previewGradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
    themeId: 'dark-tech',
    backgroundId: 'soft-grid',
    overlayId: 'scanlines',
  },
  {
    id: 'glass-aurora',
    label: '玻璃极光',
    previewGradient: 'linear-gradient(135deg, #312e81 0%, #6366f1 60%, #818cf8 100%)',
    themeId: 'glass',
    backgroundId: 'gradient-purple',
    overlayId: 'soft-glow',
  },
  {
    id: 'cyber-neon',
    label: '赛博霓虹',
    previewGradient: 'linear-gradient(135deg, #09090b 0%, #1a0533 50%, #3b0764 100%)',
    themeId: 'neon',
    backgroundId: 'dots',
    overlayId: 'grain',
  },
  {
    id: 'ocean-deep',
    label: '深海律动',
    previewGradient: 'linear-gradient(180deg, #0c4a6e 0%, #082f49 100%)',
    themeId: 'ocean',
    backgroundId: 'gradient-ocean',
    overlayId: 'vignette',
  },
  {
    id: 'sakura-dream',
    label: '樱花粉梦',
    previewGradient: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
    themeId: 'sakura',
    backgroundId: 'light-shell',
    overlayId: 'soft-glow',
  },
  {
    id: 'mint-fresh',
    label: '薄荷清新',
    previewGradient: 'linear-gradient(160deg, #ecfdf5 0%, #d1fae5 100%)',
    themeId: 'mint-fresh',
    backgroundId: 'mint-mist',
    overlayId: 'none',
  },
  {
    id: 'coffee-warm',
    label: '温暖咖啡',
    previewGradient: 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%)',
    themeId: 'coffee',
    backgroundId: 'paper-texture',
    overlayId: 'grain',
  },
  {
    id: 'newspaper',
    label: '学术报纸',
    previewGradient: 'linear-gradient(135deg, #fafafa 0%, #e5e7eb 100%)',
    themeId: 'newspaper',
    backgroundId: 'light-shell',
    overlayId: 'none',
  },
]

export function matchStylePack(
  themeId: string,
  backgroundId: string,
  overlayId: string,
): StylePack | null {
  return (
    STYLE_PACKS.find(
      (p) =>
        p.themeId === themeId &&
        p.backgroundId === backgroundId &&
        p.overlayId === overlayId,
    ) ?? null
  )
}
