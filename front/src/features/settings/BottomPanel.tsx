import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Download, FileText, ImageIcon, RotateCcw, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { cn } from '@/lib/utils'
import { MDCARD_WATERMARK_PRESET, useEditor } from '@/state/EditorContext'
import { CARD_THEMES, getCardTheme } from '@/themes/cardThemes'
import { BACKGROUND_PRESETS } from '@/themes/backgroundPresets'
import { LIGHT_OVERLAYS } from '@/themes/lightOverlays'
import { FONT_PRESETS } from '@/themes/fontPresets'
import { splitMarkdown } from '@/features/preview/splitMarkdown'
import { trackEvent } from '@/lib/analytics'
import { exportNodeToPng } from '@/export/exportPng'
import { exportNodeToSvg } from '@/export/exportSvg'
import { downloadCardsAsPngZip } from '@/export/downloadZip'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SliderField } from '@/components/ui/slider-field'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MutableRefObject } from 'react'

type Props = {
  cardRefs: MutableRefObject<(HTMLDivElement | null)[]>
}

const DEFAULT_OPEN = new Set(['appearance', 'export'])

export function BottomPanel({ cardRefs }: Props) {
  const { state, dispatch } = useEditor()
  const [busyCount, setBusyCount] = useState(0)
  const busy = busyCount > 0
  const logoFileRef = useRef<HTMLInputElement | null>(null)
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(DEFAULT_OPEN))
  const [showManual, setShowManual] = useState(false)
  const isMdcardWatermarkActive =
    state.watermark.enabled &&
    state.watermark.text === MDCARD_WATERMARK_PRESET.text &&
    state.watermark.position === MDCARD_WATERMARK_PRESET.position

  const toggle = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件（PNG / JPG / SVG / WebP 等）')
      e.target.value = ''
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('图片超过 2MB，过大的图片会拖慢导出速度。')
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      dispatch({ type: 'patchLogo', payload: { dataUrl } })
    }
    reader.onerror = () => {
      toast.error('读取文件失败')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const segments = state.splitMode
    ? splitMarkdown(state.markdown)
    : [state.markdown]
  const effectiveSegments = segments.length ? segments : [state.markdown]
  const n = effectiveSegments.length

  const runExport = useCallback(async (fn: () => Promise<void>) => {
    setBusyCount((c) => c + 1)
    try {
      await fn()
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : '导出失败')
    } finally {
      setBusyCount((c) => c - 1)
    }
  }, [])

  const fileBaseName = (() => {
    const match = /^#\s+(.+)$/m.exec(state.markdown)
    if (!match) return 'card'
    return match[1]!.trim().replace(/[\\/:*?"<>|]/g, '').slice(0, 40) || 'card'
  })()

  const handleDownloadPng = () => {
    void runExport(async () => {
      const nodes = cardRefs.current.filter(Boolean) as HTMLElement[]
      if (nodes.length === 0) throw new Error('没有可导出的卡片')
      trackEvent('export_png', { cards: nodes.length })
      if (nodes.length === 1) {
        const dataUrl = await exportNodeToPng(nodes[0]!, state.exportScale)
        saveAs(dataUrl, `${fileBaseName}.png`)
        return
      }
      await downloadCardsAsPngZip(nodes, fileBaseName, state.exportScale)
    })
  }

  const handleDownloadSvg = () => {
    void runExport(async () => {
      const nodes = cardRefs.current.filter(Boolean) as HTMLElement[]
      if (nodes.length === 0) throw new Error('没有可导出的卡片')
      trackEvent('export_svg', { cards: nodes.length })
      if (nodes.length === 1) {
        const svg = await exportNodeToSvg(nodes[0]!)
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
        saveAs(blob, `${fileBaseName}.svg`)
        return
      }
      const zip = new JSZip()
      let i = 0
      for (const node of nodes) {
        i += 1
        const svg = await exportNodeToSvg(node)
        zip.file(`${fileBaseName}_${String(i).padStart(2, '0')}.svg`, svg)
      }
      const out = await zip.generateAsync({ type: 'blob' })
      saveAs(out, `${fileBaseName}.zip`)
    })
  }

  const handleDownloadPdf = () => {
    void runExport(async () => {
      const nodes = cardRefs.current.filter(Boolean) as HTMLElement[]
      if (nodes.length === 0) throw new Error('没有可导出的卡片')
      trackEvent('export_pdf', { cards: nodes.length })
      const { exportCardsToPdf } = await import('@/export/exportPdf')
      await exportCardsToPdf(
        nodes,
        state.cardWidth,
        state.cardHeight,
        state.exportScale,
        `${fileBaseName}.pdf`,
      )
    })
  }

  const handleDownloadA4Pdf = () => {
    void runExport(async () => {
      if (!state.markdown.trim()) throw new Error('没有可导出的内容')
      trackEvent('export_a4_pdf')
      const theme = getCardTheme(state.cardThemeId)
      const { exportMarkdownToA4Pdf } = await import('@/export/exportPdf')
      await exportMarkdownToA4Pdf(
        state.markdown,
        theme.variables as Record<string, string>,
        {
          fgColor: state.fgColor,
          headingColor: state.headingColor,
          accentColor: state.accentColor,
          fontFamily: state.fontFamily,
          fontScale: state.fontScale,
        },
        state.exportScale,
        `${fileBaseName}-a4.pdf`,
      )
    })
  }

  const handleDownloadMarkdown = () => {
    trackEvent('export_md')
    const blob = new Blob([state.markdown], { type: 'text/markdown;charset=utf-8' })
    saveAs(blob, `${fileBaseName}.md`)
  }

  return (
    <aside className="app-panel flex min-h-0 w-full shrink-0 flex-col overflow-hidden md:w-[340px]">
      <div className="app-panel-titlebar border-b border-(--border) px-4 py-2.5 text-sm font-medium text-(--foreground)">
        控制面板
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">

        {/* ── 外观 ── */}
        <PanelSection
          id="appearance"
          title="外观"
          open={openSections.has('appearance')}
          onToggle={() => toggle('appearance')}
        >
          {(() => {
            const themeVars = getCardTheme(state.cardThemeId).variables
            const fgFallback = themeVars['--card-fg'] as string
            const accentFallback = themeVars['--accent'] as string
            const mutedFallback = themeVars['--card-muted'] as string
            const hasColorOverride = state.fgColor != null || state.headingColor != null || state.accentColor != null || state.pageNumberColor != null
            return (
              <>
                {/* Theme swatches */}
                <div className="grid grid-cols-4 gap-1">
                  {CARD_THEMES.map((t) => {
                    const isActive = state.cardThemeId === t.id
                    const bg = t.variables['--card-bg'] as string
                    const accent = t.variables['--accent'] as string
                    const fg = t.variables['--card-fg'] as string
                    return (
                      <button
                        key={t.id}
                        type="button"
                        title={t.label}
                        onClick={() => dispatch({ type: 'setCardThemeId', payload: t.id })}
                        className={cn(
                          'flex flex-col items-center gap-0.5 overflow-hidden rounded-md border p-1 transition-all',
                          isActive
                            ? 'border-(--accent-ui) ring-1 ring-(--accent-ui)'
                            : 'border-(--border) hover:border-(--accent-ui)/60',
                        )}
                      >
                        <div
                          className="relative h-7 w-full overflow-hidden rounded-sm"
                          style={{ background: bg }}
                        >
                          <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
                          <span
                            className="absolute bottom-0.5 left-1 text-[8px] font-bold leading-none"
                            style={{ color: fg }}
                          >
                            Aa
                          </span>
                        </div>
                        <span
                          className={cn(
                            'w-full truncate text-center text-[9px] leading-tight',
                            isActive ? 'font-medium text-(--accent-ui)' : 'text-(--muted-foreground)',
                          )}
                        >
                          {t.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Fine-tune toggle */}
                <button
                  type="button"
                  onClick={() => setShowManual((v) => !v)}
                  className="flex w-full items-center gap-2 pt-1"
                >
                  <div className="h-px flex-1 bg-(--border)/60" />
                  <span className="flex items-center gap-1 text-[11px] text-(--muted-foreground) hover:text-(--foreground)">
                    细调
                    <ChevronDown className={cn('size-3 transition-transform duration-200', showManual && 'rotate-180')} />
                  </span>
                  <div className="h-px flex-1 bg-(--border)/60" />
                </button>

                <div
                  className="grid transition-[grid-template-rows] duration-200 ease-in-out"
                  style={{ gridTemplateRows: showManual ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-3 pt-1">

                      {/* Background + Overlay */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label>背景</Label>
                          <Select
                            value={state.backgroundId}
                            onValueChange={(v) => dispatch({ type: 'setBackgroundId', payload: v })}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {BACKGROUND_PRESETS.map((b) => (
                                <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>光影</Label>
                          <Select
                            value={state.overlayId}
                            onValueChange={(v) => dispatch({ type: 'setOverlayId', payload: v })}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {LIGHT_OVERLAYS.map((o) => (
                                <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Font family */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label>字体</Label>
                          {state.fontFamily != null && (
                            <button
                              type="button"
                              onClick={() => dispatch({ type: 'setFontFamily', payload: null })}
                              className="flex items-center gap-0.5 text-xs text-(--muted-foreground) hover:text-(--foreground)"
                            >
                              <RotateCcw className="size-3" />
                              跟随主题
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {FONT_PRESETS.map((fp) => {
                            const isActive = state.fontFamily === fp.fontFamily
                            return (
                              <button
                                key={fp.id}
                                type="button"
                                onClick={() =>
                                  dispatch({
                                    type: 'setFontFamily',
                                    payload: isActive ? null : fp.fontFamily,
                                  })
                                }
                                className={`flex flex-col items-center gap-0.5 rounded-md border px-1 py-1.5 text-center transition-colors ${
                                  isActive
                                    ? 'border-(--accent-ui) bg-(--accent-ui)/8 text-(--accent-ui)'
                                    : 'border-(--border) bg-(--card-shell) text-(--muted-foreground) hover:border-(--accent-ui)/50'
                                }`}
                              >
                                <span
                                  className="text-base font-semibold leading-none"
                                  style={{ fontFamily: fp.fontFamily }}
                                >
                                  {fp.sample}
                                </span>
                                <span className="text-[10px] leading-tight">{fp.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Font scale */}
                      <SliderField
                        label="字体大小"
                        value={state.fontScale}
                        min={0.75} max={1.35} step={0.05}
                        fmt={(v) => `${v.toFixed(2)}×`}
                        parse={(s) => { const n = parseFloat(s); return isNaN(n) ? null : Math.max(0.75, Math.min(1.35, n)) }}
                        presets={[0.9, 1.0, 1.15]}
                        onChange={(v) => dispatch({ type: 'setFontScale', payload: v })}
                      />

                      {/* Colors */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>颜色</Label>
                          {hasColorOverride && (
                            <button
                              type="button"
                              onClick={() => dispatch({ type: 'resetCardColors' })}
                              className="flex items-center gap-0.5 text-xs text-(--muted-foreground) hover:text-(--foreground)"
                            >
                              <RotateCcw className="size-3" />
                              跟随主题
                            </button>
                          )}
                        </div>
                        <ColorRow label="正文" fallback={fgFallback} value={state.fgColor} onChange={(v) => dispatch({ type: 'setFgColor', payload: v })} />
                        <ColorRow label="标题" fallback={fgFallback} value={state.headingColor} onChange={(v) => dispatch({ type: 'setHeadingColor', payload: v })} />
                        <ColorRow label="强调" fallback={accentFallback} value={state.accentColor} onChange={(v) => dispatch({ type: 'setAccentColor', payload: v })} />
                        <ColorRow label="页码" fallback={mutedFallback} value={state.pageNumberColor} onChange={(v) => dispatch({ type: 'setPageNumberColor', payload: v })} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )
          })()}
        </PanelSection>

        {/* ── 导出 ── */}
        <PanelSection
          id="export"
          title="导出"
          open={openSections.has('export')}
          onToggle={() => toggle('export')}
          accent
        >
          <div className="space-y-1">
            <Label>导出分辨率</Label>
            <div className="grid grid-cols-3 gap-1">
              {([1, 2, 3] as const).map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => dispatch({ type: 'setExportScale', payload: scale })}
                  className={cn(
                    'rounded-md border py-1.5 text-xs font-medium transition-colors',
                    state.exportScale === scale
                      ? 'border-(--accent-ui) bg-(--accent-ui)/10 text-(--accent-ui)'
                      : 'border-(--border) text-(--muted-foreground) hover:border-(--accent-ui)/50',
                  )}
                >
                  {scale}×{scale === 1 ? '（普通）' : scale === 2 ? '（推荐）' : '（高清）'}
                </button>
              ))}
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start gap-2"
            disabled={busy}
            onClick={handleDownloadPng}>
            <Download className="size-4" />
            下载 PNG{n > 1 ? '（ZIP）' : ''}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start gap-2"
            disabled={busy}
            onClick={handleDownloadPdf}>
            <FileText className="size-4" />
            卡片 PDF{n > 1 ? `（${n} 页）` : ''}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start gap-2"
            disabled={busy}
            onClick={handleDownloadA4Pdf}>
            <FileText className="size-4" />
            A4 文档 PDF{n > 1 ? `（${Math.ceil(n / 2)} 页）` : ''}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start gap-2"
            disabled={busy}
            onClick={handleDownloadSvg}>
            <ImageIcon className="size-4" />
            下载 SVG{n > 1 ? '（ZIP）' : ''}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleDownloadMarkdown}>
            <FileText className="size-4" />
            导出 Markdown 文本
          </Button>
          <p className="text-xs text-(--muted-foreground)">
            如果文中插入了{' '}
            <strong className="text-(--foreground)">网上别处的图片链接</strong>
            ，导出时这些图可能加载失败。最稳的做法是把图片先放到「图床」上再使用它给的链接。
          </p>
          <details className="group rounded-md border border-(--border)/70 px-2.5 py-1.5 text-xs text-(--muted-foreground) [&::-webkit-details-marker]:hidden [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer select-none items-center justify-between gap-2 font-medium text-(--foreground)/80 [&::-webkit-details-marker]:hidden">
              <span>为什么会失败？</span>
              <span className="text-(--muted-foreground) transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div className="mt-2 space-y-2 leading-relaxed">
              <p>
                <strong className="text-(--foreground)">「跨域」是浏览器的安全规则：</strong>
                网页不能随便读取「别的网站」上的图片内容。所以当我们要把卡片截成图时，那些远程图片在最终图里会变成空白。
              </p>
              <p>
                <strong className="text-(--foreground)">「图床」就是专门放图片的网站，</strong>
                上传后会给你一个稳定的图片链接，并允许其他网页读取。常见的有：
                <a
                  href="https://developer.qiniu.com/kodo/1233/console-quickstart"
                  target="_blank"
                  rel="noreferrer"
                  className="text-(--accent-ui) hover:underline">
                  七牛云
                </a>
                、
                <a
                  href="https://www.aliyun.com/product/oss"
                  target="_blank"
                  rel="noreferrer"
                  className="text-(--accent-ui) hover:underline">
                  阿里云 OSS
                </a>
                等。
              </p>
              <p className="text-(--foreground)/80">
                推荐流程：本地截图 / 图片 → 上传到图床 → 复制图床给的链接 →
                在编辑器里用{' '}
                <code className="rounded bg-(--border)/40 px-1">![描述](图片链接)</code>{' '}
                引用。
              </p>
            </div>
          </details>
        </PanelSection>

        {/* ── 布局与排版 ── */}
        <PanelSection
          id="size"
          title="布局与排版"
          open={openSections.has('size')}
          onToggle={() => toggle('size')}
        >
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="split">横线拆分多卡片</Label>
            <Switch
              id="split"
              checked={state.splitMode}
              onCheckedChange={(v) => dispatch({ type: 'setSplitMode', payload: v })}
            />
          </div>
          {state.splitMode && (
            <p className="text-xs text-(--muted-foreground)">
              单独一行的{' '}
              <code className="rounded bg-(--border)/50 px-1">===</code>{' '}
              作为分页线，每段生成一张卡片。
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="page">显示页码</Label>
            <Switch
              id="page"
              checked={state.showPageNumbers}
              onCheckedChange={(v) => dispatch({ type: 'setShowPageNumbers', payload: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="overflow">高度超出隐藏</Label>
            <Switch
              id="overflow"
              checked={state.hideOverflow}
              onCheckedChange={(v) => dispatch({ type: 'setHideOverflow', payload: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="lock">锁定 3:5</Label>
            <Switch
              id="lock"
              checked={state.lockRatio35}
              onCheckedChange={(v) => dispatch({ type: 'setLockRatio35', payload: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>宽</Label>
              <input
                type="number"
                className="flex h-9 w-full rounded-md border border-(--border) bg-transparent px-2 text-sm"
                value={state.cardWidth}
                onChange={(e) =>
                  dispatch({ type: 'setCardWidth', payload: Number(e.target.value) || 200 })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>高</Label>
              <input
                type="number"
                className="flex h-9 w-full rounded-md border border-(--border) bg-transparent px-2 text-sm"
                value={state.cardHeight}
                onChange={(e) =>
                  dispatch({ type: 'setCardHeight', payload: Number(e.target.value) || 200 })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => dispatch({ type: 'applyXhsPreset' })}>
              3:5 竖版
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => dispatch({ type: 'applySquarePreset' })}>
              1:1 方形
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => dispatch({ type: 'applyStoryPreset' })}>
              9:16 故事
            </Button>
          </div>
          <SliderField
            label="预览缩放"
            value={state.previewZoom}
            min={0.5} max={1} step={0.05}
            fmt={(v) => `${Math.round(v * 100)}%`}
            parse={(s) => { const n = parseFloat(s); return isNaN(n) ? null : Math.max(0.5, Math.min(1, n / 100)) }}
            presets={[0.7, 0.85, 1.0]}
            onChange={(v) => dispatch({ type: 'setPreviewZoom', payload: v })}
          />
        </PanelSection>

        {/* ── 署名（水印 + Logo） ── */}
        <PanelSection
          id="branding"
          title="署名"
          open={openSections.has('branding')}
          onToggle={() => toggle('branding')}
        >
          {/* 水印 */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">水印</span>
            <Switch
              id="watermark-enabled"
              checked={state.watermark.enabled}
              onCheckedChange={(v) =>
                dispatch({ type: 'patchWatermark', payload: { enabled: v } })
              }
            />
          </div>
          <div className="rounded-md border border-(--border)/70 bg-(--card-shell)/50 p-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <Label htmlFor="mdcard-watermark">mdcard.cn 水印</Label>
                <p className="text-xs leading-5 text-(--muted-foreground)">
                  导出图左下角显示 power by mdcard.cn。
                </p>
              </div>
              <Switch
                id="mdcard-watermark"
                checked={isMdcardWatermarkActive}
                onCheckedChange={(v) =>
                  dispatch({
                    type: 'patchWatermark',
                    payload: v ? MDCARD_WATERMARK_PRESET : { enabled: false },
                  })
                }
              />
            </div>
          </div>
          <div className={state.watermark.enabled ? 'space-y-3' : 'pointer-events-none space-y-3 opacity-50'}>
            <div className="space-y-1">
              <Label htmlFor="watermark-text">文字</Label>
              <input
                id="watermark-text"
                type="text"
                placeholder="@your_handle"
                className="flex h-9 w-full rounded-md border border-(--border) bg-transparent px-2 text-sm"
                value={state.watermark.text}
                onChange={(e) =>
                  dispatch({ type: 'patchWatermark', payload: { text: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>位置</Label>
              <Select
                value={state.watermark.position}
                onValueChange={(v) =>
                  dispatch({ type: 'patchWatermark', payload: { position: v as never } })
                }>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">右下</SelectItem>
                  <SelectItem value="bottom-left">左下</SelectItem>
                  <SelectItem value="top-right">右上</SelectItem>
                  <SelectItem value="top-left">左上</SelectItem>
                  <SelectItem value="center">居中</SelectItem>
                  <SelectItem value="tile">平铺</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ColorRow
              label="颜色"
              fallback="#1d4ed8"
              value={state.watermark.color}
              onChange={(v) => dispatch({ type: 'patchWatermark', payload: { color: v } })}
            />
            <SliderField
              label="不透明度"
              value={state.watermark.opacity}
              min={0.05} max={1} step={0.05}
              fmt={(v) => `${Math.round(v * 100)}%`}
              parse={(s) => { const n = parseFloat(s); return isNaN(n) ? null : Math.max(0.05, Math.min(1, n / 100)) }}
              presets={[0.1, 0.25, 0.5]}
              onChange={(v) => dispatch({ type: 'patchWatermark', payload: { opacity: v } })}
            />
            <SliderField
              label="字号"
              value={state.watermark.fontSize}
              min={10} max={48} step={1}
              fmt={(v) => `${Math.round(v)}px`}
              parse={(s) => { const n = parseInt(s); return isNaN(n) ? null : Math.max(10, Math.min(48, n)) }}
              presets={[12, 16, 24]}
              onChange={(v) => dispatch({ type: 'patchWatermark', payload: { fontSize: Math.round(v) } })}
            />
            <SliderField
              label="旋转"
              value={state.watermark.rotate}
              min={-90} max={90} step={5}
              fmt={(v) => `${Math.round(v)}°`}
              parse={(s) => { const n = parseInt(s); return isNaN(n) ? null : Math.max(-90, Math.min(90, n)) }}
              presets={[-30, 0, 30]}
              onChange={(v) => dispatch({ type: 'patchWatermark', payload: { rotate: Math.round(v) } })}
            />
            <p className="text-xs text-(--muted-foreground)">
              水印会随导出图一起渲染。颜色留空则跟随当前强调色。
            </p>
          </div>

          <div className="my-0.5 border-t border-(--border)/60" />

          {/* Logo */}
          <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">Logo / 头像</div>
          <input
            ref={logoFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
          <div className="flex items-center gap-3">
            {state.logo.dataUrl ? (
              <img
                src={state.logo.dataUrl}
                alt="logo preview"
                className="size-12 shrink-0 rounded-md border border-(--border) object-cover"
              />
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-dashed border-(--border) text-(--muted-foreground)">
                <ImageIcon className="size-5" />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="justify-start gap-2"
                onClick={() => logoFileRef.current?.click()}>
                <Upload className="size-4" />
                {state.logo.dataUrl ? '替换图片' : '上传图片'}
              </Button>
              {state.logo.dataUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 text-(--muted-foreground)"
                  onClick={() => dispatch({ type: 'patchLogo', payload: { dataUrl: null } })}>
                  <Trash2 className="size-4" />
                  移除
                </Button>
              )}
            </div>
          </div>
          <div className={state.logo.dataUrl ? 'space-y-3' : 'pointer-events-none space-y-3 opacity-50'}>
            <div className="space-y-1.5">
              <Label>位置</Label>
              <Select
                value={state.logo.position}
                onValueChange={(v) =>
                  dispatch({ type: 'patchLogo', payload: { position: v as never } })
                }>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-right">右上</SelectItem>
                  <SelectItem value="top-left">左上</SelectItem>
                  <SelectItem value="bottom-right">右下</SelectItem>
                  <SelectItem value="bottom-left">左下</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SliderField
              label="大小"
              value={state.logo.size}
              min={20} max={120} step={2}
              fmt={(v) => `${Math.round(v)}px`}
              parse={(s) => { const n = parseInt(s); return isNaN(n) ? null : Math.max(20, Math.min(120, n)) }}
              presets={[30, 40, 60]}
              onChange={(v) => dispatch({ type: 'patchLogo', payload: { size: Math.round(v) } })}
            />
            <SliderField
              label="圆角"
              value={state.logo.radius}
              min={0}
              max={Math.round(state.logo.size / 2)}
              step={1}
              fmt={(v) => v >= Math.round(state.logo.size / 2) ? '圆形' : `${Math.round(v)}px`}
              parse={(s) => {
                if (/圆/.test(s)) return Math.round(state.logo.size / 2)
                const n = parseInt(s)
                return isNaN(n) ? null : Math.max(0, Math.min(Math.round(state.logo.size / 2), n))
              }}
              onChange={(v) => dispatch({ type: 'patchLogo', payload: { radius: Math.round(v) } })}
            />
            <SliderField
              label="不透明度"
              value={state.logo.opacity}
              min={0.1} max={1} step={0.05}
              fmt={(v) => `${Math.round(v * 100)}%`}
              parse={(s) => { const n = parseFloat(s); return isNaN(n) ? null : Math.max(0.1, Math.min(1, n / 100)) }}
              presets={[0.5, 0.75, 1.0]}
              onChange={(v) => dispatch({ type: 'patchLogo', payload: { opacity: v } })}
            />
            <p className="text-xs text-(--muted-foreground)">
              建议使用方形 PNG / SVG，背景透明效果最好。圆角拉到最大变为圆形。
            </p>
          </div>
        </PanelSection>

      </div>
    </aside>
  )
}

type PanelSectionProps = {
  id: string
  title: string
  open: boolean
  onToggle: () => void
  accent?: boolean
  headerAction?: ReactNode
  children: ReactNode
}

function PanelSection({ id, title, open, onToggle, accent, headerAction, children }: PanelSectionProps) {
  return (
    <section
      className={cn(
        'rounded-md border bg-(--card-shell)/70',
        accent ? 'border-(--accent-ui)/40 bg-(--accent-ui)/5' : 'border-(--border)/80',
      )}
    >
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className="flex flex-1 items-center justify-between px-3 py-2.5 text-left text-sm font-medium text-(--foreground)"
        >
          {title}
          <ChevronDown
            className={cn(
              'ml-2 size-3.5 shrink-0 text-(--muted-foreground) transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>
        {headerAction && (
          <div
            className="pr-3"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {headerAction}
          </div>
        )}
      </div>
      <div
        id={id}
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-3 pb-3">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

type ColorRowProps = {
  label: string
  fallback: string
  value: string | null
  onChange: (v: string | null) => void
}

function ColorRow({ label, fallback, value, onChange }: ColorRowProps) {
  const isInherit = value == null
  const display = value ?? fallback
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <label
          className="relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-(--border)"
          style={{ background: display }}
          aria-label={`${label}：选择颜色`}>
          <input
            type="color"
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            value={display}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
        <input
          type="text"
          inputMode="text"
          spellCheck={false}
          placeholder="跟随主题"
          className="flex h-8 flex-1 rounded-md border border-(--border) bg-transparent px-2 font-mono text-xs text-(--foreground) placeholder:text-(--muted-foreground)"
          value={isInherit ? '' : value!}
          onChange={(e) => {
            const v = e.target.value.trim()
            onChange(v ? v : null)
          }}
        />
        {!isInherit && (
          <button
            type="button"
            onClick={() => onChange(null)}
            title="跟随主题"
            aria-label={`${label}：恢复跟随主题`}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-(--border) text-(--muted-foreground) transition-colors hover:bg-(--accent-ui)/15 hover:text-(--accent-ui)">
            <RotateCcw className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
