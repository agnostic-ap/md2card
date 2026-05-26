import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditor } from '@/state/EditorContext'
import { getBackgroundPreset } from '@/themes/backgroundPresets'
import { getCardTheme } from '@/themes/cardThemes'
import { getLightOverlay } from '@/themes/lightOverlays'
import { CardFrame } from '@/features/preview/CardFrame'
import { splitMarkdown } from '@/features/preview/splitMarkdown'

export function CardPreview({
  cardRefs,
}: {
  cardRefs: MutableRefObject<(HTMLDivElement | null)[]>
}) {
  const { state, dispatch } = useEditor()
  const {
    markdown,
    cardThemeId,
    backgroundId,
    overlayId,
    splitMode,
    cardWidth,
    cardHeight,
    fontScale,
    hideOverflow,
    previewZoom,
    showPageNumbers,
    activeCardIndex,
    fgColor,
    headingColor,
    accentColor,
    pageNumberColor,
    fontFamily,
    watermark,
    logo,
  } = state

  const segments = useMemo(() => {
    if (!splitMode) return [markdown]
    const parts = splitMarkdown(markdown)
    return parts.length ? parts : [markdown]
  }, [markdown, splitMode])

  const theme = getCardTheme(cardThemeId)
  const bg = getBackgroundPreset(backgroundId)
  const overlay = getLightOverlay(overlayId)

  const multiCard = splitMode && segments.length > 1

  // Refs to the wrapper div of each card — used to scroll into view on nav click
  const cardWrapperRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  // Tracks last scroll-derived active index to suppress no-op dispatches
  const lastScrollActiveRef = useRef(activeCardIndex)

  // Auto-fit zoom: shrink the card on narrow viewports so it never overflows.
  // Layers on top of the user's previewZoom — we take the min so explicit zoom-out still wins.
  const [containerWidth, setContainerWidth] = useState(0)
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setContainerWidth(entry.contentRect.width)
    })
    ro.observe(el)
    setContainerWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  const SCROLL_PADDING = 32 // matches p-4 horizontal padding
  const availableWidth = Math.max(0, containerWidth - SCROLL_PADDING)
  const fitZoom = availableWidth > 0 && cardWidth > availableWidth
    ? availableWidth / cardWidth
    : 1
  const effectiveZoom = Math.min(previewZoom, fitZoom)

  useEffect(() => {
    lastScrollActiveRef.current = activeCardIndex
  }, [activeCardIndex])

  useEffect(() => {
    if (activeCardIndex >= segments.length) {
      dispatch({ type: 'setActiveCardIndex', payload: Math.max(0, segments.length - 1) })
    }
  }, [activeCardIndex, segments.length, dispatch])

  // Update active card index while the user scrolls the preview
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !multiCard) return
    const update = () => {
      const { top: cTop, bottom: cBottom } = container.getBoundingClientRect()
      const cMid = (cTop + cBottom) / 2
      let closest = 0
      let closestDist = Infinity
      cardWrapperRefs.current.forEach((el, i) => {
        if (!el) return
        const { top, bottom } = el.getBoundingClientRect()
        const dist = Math.abs((top + bottom) / 2 - cMid)
        if (dist < closestDist) { closestDist = dist; closest = i }
      })
      if (closest !== lastScrollActiveRef.current) {
        lastScrollActiveRef.current = closest
        dispatch({ type: 'setActiveCardIndex', payload: closest })
      }
    }
    container.addEventListener('scroll', update, { passive: true })
    return () => container.removeEventListener('scroll', update)
  }, [multiCard, dispatch])

  const handleActivate = useCallback(
    (index: number) => dispatch({ type: 'setActiveCardIndex', payload: index }),
    [dispatch],
  )

  const handleNavClick = useCallback(
    (index: number) => {
      dispatch({ type: 'setActiveCardIndex', payload: index })
      cardWrapperRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    },
    [dispatch],
  )

  return (
    <div
      className="app-panel flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="app-panel-titlebar border-b border-[var(--border)] px-4 py-2.5 text-xs font-medium text-[var(--muted-foreground)]">
        预览
        {multiCard ? ` · ${segments.length} 张卡片` : ''}
      </div>
      <div ref={scrollContainerRef} className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-(--surface-soft) p-4">
        {!markdown.trim() ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-(--muted-foreground)">
            <FileText className="size-10 opacity-30" />
            <p className="text-sm">在左侧编辑器输入内容，卡片预览将显示在这里</p>
          </div>
        ) : (
        <div className="flex w-full max-w-full flex-col items-center gap-8 py-4">
          {segments.map((chunk, i) => (
            <div
              key={i}
              ref={(el) => { cardWrapperRefs.current[i] = el }}
            >
              <CardFrame
                content={chunk}
                theme={theme}
                overlay={overlay}
                canvasStyle={bg.canvasStyle}
                fgColor={fgColor}
                headingColor={headingColor}
                accentColor={accentColor}
                pageNumberColor={pageNumberColor}
                fontFamily={fontFamily}
                watermark={watermark}
                logo={logo}
                width={cardWidth}
                height={cardHeight}
                fontScale={fontScale}
                hideOverflow={hideOverflow}
                previewZoom={effectiveZoom}
                pageIndex={i}
                pageTotal={segments.length}
                showPageNumbers={showPageNumbers}
                isActive={activeCardIndex === i}
                onActivate={handleActivate}
                exportRef={(el) => {
                  cardRefs.current[i] = el
                }}
              />
            </div>
          ))}
        </div>
        )}
      </div>

      {multiCard && (
        <div className="app-panel-titlebar flex shrink-0 items-center justify-center gap-1.5 border-t border-[var(--border)] px-3 py-2">
          {segments.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleNavClick(i)}
              aria-label={`跳到第 ${i + 1} 张`}
              className={cn(
                'flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-medium transition-colors',
                activeCardIndex === i
                  ? 'bg-(--accent-ui) text-white'
                  : 'bg-(--background) text-(--muted-foreground) hover:bg-(--accent-ui)/15 hover:text-(--accent-ui)',
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
