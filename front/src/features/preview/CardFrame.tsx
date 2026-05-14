import { memo, useCallback, useRef, useState, type CSSProperties, type RefCallback } from 'react'
import { Copy, Download } from 'lucide-react'
import { toast } from 'sonner'
import { saveAs } from 'file-saver'
import type { CardTheme } from '@/themes/cardThemes'
import type { LightOverlayPreset } from '@/themes/lightOverlays'
import { MarkdownCardBody } from '@/features/preview/MarkdownCardBody'
import { CardWatermark, type WatermarkConfig } from '@/features/preview/CardWatermark'
import { CardLogo, type LogoConfig } from '@/features/preview/CardLogo'
import { exportNodeToPng } from '@/export/exportPng'
import { copyCardPngToClipboard } from '@/export/copyToClipboard'
import { cn } from '@/lib/utils'

type Props = {
  content: string
  theme: CardTheme
  overlay: LightOverlayPreset
  canvasStyle?: CSSProperties
  fgColor?: string | null
  headingColor?: string | null
  accentColor?: string | null
  pageNumberColor?: string | null
  fontFamily?: string | null
  watermark?: WatermarkConfig
  logo?: LogoConfig
  width: number
  height: number
  fontScale: number
  hideOverflow: boolean
  previewZoom: number
  pageIndex?: number
  pageTotal?: number
  showPageNumbers: boolean
  exportRef?: RefCallback<HTMLDivElement | null>
  isActive?: boolean
  onActivate?: (index: number) => void
}

function CardFrameInner({
  content,
  theme,
  overlay,
  canvasStyle,
  fgColor,
  headingColor,
  accentColor,
  pageNumberColor,
  fontFamily,
  watermark,
  logo,
  width,
  height,
  fontScale,
  hideOverflow,
  previewZoom,
  pageIndex,
  pageTotal,
  showPageNumbers,
  exportRef,
  isActive,
  onActivate,
}: Props) {
  const showBadge =
    showPageNumbers && pageIndex != null && pageTotal != null && pageTotal > 0

  const localRef = useRef<HTMLDivElement | null>(null)
  const [busy, setBusy] = useState<null | 'png' | 'copy'>(null)

  const setRef: RefCallback<HTMLDivElement | null> = useCallback(
    (el) => {
      localRef.current = el
      exportRef?.(el)
    },
    [exportRef],
  )

  const fileBaseName =
    pageIndex != null && pageTotal != null && pageTotal > 1
      ? `card_${String(pageIndex + 1).padStart(2, '0')}`
      : 'card'

  const runAction = async (
    kind: 'png' | 'copy',
    fn: (el: HTMLElement) => Promise<void>,
  ) => {
    const el = localRef.current
    if (!el) return
    setBusy(kind)
    try {
      await fn(el)
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : '操作失败')
    } finally {
      setBusy(null)
    }
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    void runAction('png', async (el) => {
      const dataUrl = await exportNodeToPng(el)
      saveAs(dataUrl, `${fileBaseName}.png`)
    })
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    void runAction('copy', async (el) => {
      await copyCardPngToClipboard(el)
      toast.success('已复制到剪贴板')
    })
  }

  return (
    <div
      className="flex items-start gap-3"
      onClick={() => onActivate?.(pageIndex ?? 0)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onActivate?.(pageIndex ?? 0)
      }}
      role={onActivate ? 'button' : undefined}
      tabIndex={onActivate ? 0 : undefined}
    >
      <div
        className="origin-top-left transition-[transform]"
        style={{
          transform: `scale(${previewZoom})`,
          width: width * previewZoom,
          height: height * previewZoom,
        }}
      >
        <div
          ref={setRef}
          className={cn(
            'card-export-root relative box-border',
            theme.cardClassName,
            isActive && 'ring-2 ring-[var(--accent-ui)] ring-offset-2 ring-offset-[var(--background)]',
          )}
          style={{
            ...(theme.variables as CSSProperties),
            ...(fgColor ? { ['--card-fg' as string]: fgColor } : {}),
            ...(headingColor
              ? { ['--heading-color' as string]: headingColor }
              : {}),
            ...(accentColor
              ? { ['--accent' as string]: accentColor }
              : {}),
            ...(fontFamily
              ? {
                  ['--body-font' as string]: fontFamily,
                  ['--heading-font' as string]: fontFamily,
                }
              : {}),
            width,
            height,
            // Never mix `background` shorthand with `background-*` longhands —
            // the two forms interact unpredictably during React style diffing.
            // If canvasStyle supplies its own background values, use only those;
            // otherwise fall back to the theme's bg color via the shorthand.
            ...(canvasStyle && Object.keys(canvasStyle).length > 0
              ? canvasStyle
              : { background: theme.variables['--card-bg'] as string }),
            color: fgColor ?? theme.variables['--card-fg'],
            borderRadius: theme.variables['--card-radius'],
            boxShadow: theme.variables['--card-shadow'],
            ['--font-scale' as string]: String(fontScale),
            overflow: hideOverflow ? 'hidden' : 'auto',
          }}
        >
          {overlay.id !== 'none' && (
            <div
              className={cn(
                'pointer-events-none absolute inset-0 z-10 rounded-[inherit]',
                overlay.overlayClassName,
              )}
              style={overlay.overlayStyle}
              aria-hidden
            />
          )}
          <div
            className={cn(
              'relative z-0 box-border h-full p-5',
              !hideOverflow && 'overflow-y-auto',
            )}
          >
            <MarkdownCardBody content={content} />
          </div>
          {watermark && (
            <CardWatermark
              config={watermark}
              fallbackColor={accentColor ?? theme.variables['--accent']}
            />
          )}
          {logo && <CardLogo config={logo} />}
          {showBadge && (
            <div
              className="pointer-events-none absolute bottom-2 right-3 z-20 rounded-full bg-(--card-fg)/10 px-2 py-0.5 text-[10px] font-medium"
              style={{
                color: pageNumberColor ?? theme.variables['--card-muted'],
              }}
            >
              {pageIndex! + 1} / {pageTotal}
            </div>
          )}
        </div>
      </div>

      <div
        className="flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          disabled={busy != null}
          onClick={handleDownload}
          title={busy === 'png' ? '下载中…' : '下载这张'}
          aria-label="下载这张卡片"
          className="inline-flex size-9 items-center justify-center rounded-md border border-(--border) bg-(--card-shell) text-(--foreground) transition-colors hover:bg-(--accent-ui)/15 hover:text-(--accent-ui) disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="size-4" />
        </button>
        <button
          type="button"
          disabled={busy != null}
          onClick={handleCopy}
          title={busy === 'copy' ? '复制中…' : '复制这张'}
          aria-label="复制这张卡片"
          className="inline-flex size-9 items-center justify-center rounded-md border border-(--border) bg-(--card-shell) text-(--foreground) transition-colors hover:bg-(--accent-ui)/15 hover:text-(--accent-ui) disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Copy className="size-4" />
        </button>
      </div>
    </div>
  )
}

// Custom comparator: skip re-render when only unstable callback refs changed.
// onActivate and exportRef always do the same thing for a given card index,
// so ignoring them is safe and eliminates re-renders on every parent update.
export const CardFrame = memo(CardFrameInner, (prev, next) =>
  prev.content === next.content &&
  prev.theme === next.theme &&
  prev.overlay === next.overlay &&
  prev.canvasStyle === next.canvasStyle &&
  prev.fgColor === next.fgColor &&
  prev.headingColor === next.headingColor &&
  prev.accentColor === next.accentColor &&
  prev.pageNumberColor === next.pageNumberColor &&
  prev.fontFamily === next.fontFamily &&
  prev.watermark === next.watermark &&
  prev.logo === next.logo &&
  prev.width === next.width &&
  prev.height === next.height &&
  prev.fontScale === next.fontScale &&
  prev.hideOverflow === next.hideOverflow &&
  prev.previewZoom === next.previewZoom &&
  prev.pageIndex === next.pageIndex &&
  prev.pageTotal === next.pageTotal &&
  prev.showPageNumbers === next.showPageNumbers &&
  prev.isActive === next.isActive
)
