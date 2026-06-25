import type { EditorView } from '@codemirror/view'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'
import type { WatermarkConfig } from '@/features/preview/CardWatermark'
import type { LogoConfig } from '@/features/preview/CardLogo'
import { decodeShareUrl } from '@/lib/shareUrl'
import defaultLogoSvg from '@/assets/logo-1.svg?raw'

const STORAGE_KEY = 'md2card_editor_state'
export const STORAGE_TS_KEY = 'md2card_editor_ts'
const AUTOSAVE_DELAY_MS = 1500

function loadSavedState(): EditorState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return { ...initialEditorState, ...(JSON.parse(raw) as Partial<EditorState>) }
  } catch {
    return null
  }
}

function loadFromShareUrl(): EditorState | null {
  try {
    const payload = decodeShareUrl()
    if (!payload) return null
    // Strip the ?s= param from the URL without reloading
    const url = new URL(window.location.href)
    url.searchParams.delete('s')
    window.history.replaceState(null, '', url.toString())
    return { ...initialEditorState, ...(payload as Partial<EditorState>) }
  } catch {
    return null
  }
}

export const DEFAULT_LOGO_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(defaultLogoSvg)}`

export const MDCARD_WATERMARK_PRESET: WatermarkConfig = {
  enabled: true,
  text: 'power by mdcard.cn',
  position: 'bottom-left',
  opacity: 0.42,
  fontSize: 12,
  color: null,
  rotate: 0,
}

export type AppThemeMode = 'light' | 'dark'

export type EditorState = {
  markdown: string
  cardThemeId: string
  appTheme: AppThemeMode
  cardWidth: number
  cardHeight: number
  lockRatio35: boolean
  fontScale: number
  backgroundId: string
  overlayId: string
  splitMode: boolean
  hideOverflow: boolean
  previewZoom: number
  showPageNumbers: boolean
  activeCardIndex: number
  /** Pixel ratio used for PNG export. 1 = 1x screen, 2 = retina, 3 = high-res. */
  exportScale: 1 | 2 | 3
  /** Override card body text color. null means inherit from theme. */
  fgColor: string | null
  /** Override heading (h1/h2/h3) color. null means inherit from theme. */
  headingColor: string | null
  /** Override card accent (bold / link / quote / decorations). null means inherit from theme. */
  accentColor: string | null
  /** Override the page number badge color. null means inherit from theme. */
  pageNumberColor: string | null
  /** Override both --body-font and --heading-font. null means inherit from theme. */
  fontFamily: string | null
  watermark: WatermarkConfig
  logo: LogoConfig
}

const XHS_WIDTH = 440
const XHS_HEIGHT = Math.round((XHS_WIDTH * 5) / 3)
const SQUARE_SIZE = XHS_WIDTH
const STORY_HEIGHT = Math.round((XHS_WIDTH * 16) / 9)

const defaultMarkdown = `# MD2Card 使用入门

> 把 Markdown 变成精美图片或 PDF，三步搞定

**粘贴文字 → 选主题 → 导出图片**，就这么简单。

---

## 文字格式

支持常见 Markdown 语法，也可以用工具栏或快捷键快速插入：

- **粗体** \`⌘B\` *斜体* \`⌘I\` \`行内代码\` \`⌘E\`
- ~~删除线~~ \`⌘⇧X\` <u>下划线</u> \`⌘⇧U\` <mark>高亮</mark> \`⌘⇧M\`
- 插入链接 \`⌘K\`，有选区时自动包成 \`[文字](url)\`

## 多卡片分页

在内容中单独写一行 \`===\` 即可拆成多张卡片。
在左侧控制面板开启「横线拆分多卡片」后生效。

===

# 导出与分享

## 导出格式

| 格式 | 说明 |
| --- | --- |
| PNG 单图 | 逐张高清导出，随处粘贴使用 |
| 全部打包 | 批量下载 ZIP，多张一次搞定 |
| A4 PDF | 双栏排版，适合做课件或资料 |

## 样式自定义

右下角控制面板可以调整：**主题配色** / **字体大小** /
**背景与叠加层** / **Logo 与水印** / **卡片尺寸**。

---

💡 **提示**：点击右上角「分享」可生成包含当前内容和样式的链接，
方便下次继续编辑或分享给他人。`

export const initialEditorState: EditorState = {
  markdown: defaultMarkdown,
  cardThemeId: 'xhs-pro',
  appTheme: 'dark',
  cardWidth: XHS_WIDTH,
  cardHeight: XHS_HEIGHT,
  lockRatio35: true,
  fontScale: 1,
  backgroundId: 'none',
  overlayId: 'none',
  splitMode: true,
  hideOverflow: true,
  previewZoom: 1,
  showPageNumbers: true,
  activeCardIndex: 0,
  exportScale: 2,
  fgColor: null,
  headingColor: null,
  accentColor: null,
  pageNumberColor: null,
  fontFamily: null,
  watermark: { ...MDCARD_WATERMARK_PRESET, enabled: false },
  logo: {
    dataUrl: DEFAULT_LOGO_DATA_URL,
    position: 'top-right',
    size: 40,
    radius: 20,
    opacity: 1,
  },
}

export type EditorAction =
  | { type: 'loadCloud'; payload: Partial<EditorState> }
  | { type: 'setMarkdown'; payload: string }
  | { type: 'setCardThemeId'; payload: string }
  | { type: 'setAppTheme'; payload: AppThemeMode }
  | { type: 'setCardWidth'; payload: number }
  | { type: 'setCardHeight'; payload: number }
  | { type: 'setLockRatio35'; payload: boolean }
  | { type: 'setFontScale'; payload: number }
  | { type: 'setBackgroundId'; payload: string }
  | { type: 'setOverlayId'; payload: string }
  | { type: 'setSplitMode'; payload: boolean }
  | { type: 'setHideOverflow'; payload: boolean }
  | { type: 'setPreviewZoom'; payload: number }
  | { type: 'setShowPageNumbers'; payload: boolean }
  | { type: 'setActiveCardIndex'; payload: number }
  | { type: 'setExportScale'; payload: 1 | 2 | 3 }
  | { type: 'setFgColor'; payload: string | null }
  | { type: 'setHeadingColor'; payload: string | null }
  | { type: 'setAccentColor'; payload: string | null }
  | { type: 'setPageNumberColor'; payload: string | null }
  | { type: 'setFontFamily'; payload: string | null }
  | { type: 'resetCardColors' }
  | { type: 'patchWatermark'; payload: Partial<WatermarkConfig> }
  | { type: 'patchLogo'; payload: Partial<LogoConfig> }
  | { type: 'applyXhsPreset' }
  | { type: 'applySquarePreset' }
  | { type: 'applyStoryPreset' }
  | { type: 'resetToDefault' }

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'loadCloud':
      return { ...initialEditorState, ...state, ...action.payload, activeCardIndex: 0 }
    case 'setMarkdown':
      return { ...state, markdown: action.payload }
    case 'setCardThemeId':
      return { ...state, cardThemeId: action.payload }
    case 'setAppTheme':
      return { ...state, appTheme: action.payload }
    case 'setCardWidth': {
      const w = Math.max(200, Math.min(2000, action.payload))
      if (state.lockRatio35) {
        return {
          ...state,
          cardWidth: w,
          cardHeight: Math.round((w * 5) / 3),
        }
      }
      return { ...state, cardWidth: w }
    }
    case 'setCardHeight': {
      const h = Math.max(200, Math.min(4000, action.payload))
      if (state.lockRatio35) {
        const w = Math.round((h * 3) / 5)
        return { ...state, cardHeight: h, cardWidth: w }
      }
      return { ...state, cardHeight: h }
    }
    case 'setLockRatio35': {
      if (action.payload) {
        const h = Math.round((state.cardWidth * 5) / 3)
        return { ...state, lockRatio35: true, cardHeight: h }
      }
      return { ...state, lockRatio35: false }
    }
    case 'setFontScale':
      return { ...state, fontScale: action.payload }
    case 'setBackgroundId':
      return { ...state, backgroundId: action.payload }
    case 'setOverlayId':
      return { ...state, overlayId: action.payload }
    case 'setSplitMode':
      return { ...state, splitMode: action.payload, activeCardIndex: 0 }
    case 'setHideOverflow':
      return { ...state, hideOverflow: action.payload }
    case 'setPreviewZoom':
      return {
        ...state,
        previewZoom: Math.min(1, Math.max(0.5, action.payload)),
      }
    case 'setShowPageNumbers':
      return { ...state, showPageNumbers: action.payload }
    case 'setActiveCardIndex':
      return { ...state, activeCardIndex: action.payload }
    case 'setExportScale':
      return { ...state, exportScale: action.payload }
    case 'setFgColor':
      return { ...state, fgColor: action.payload }
    case 'setHeadingColor':
      return { ...state, headingColor: action.payload }
    case 'setAccentColor':
      return { ...state, accentColor: action.payload }
    case 'setPageNumberColor':
      return { ...state, pageNumberColor: action.payload }
    case 'setFontFamily':
      return { ...state, fontFamily: action.payload }
    case 'resetCardColors':
      return {
        ...state,
        fgColor: null,
        headingColor: null,
        accentColor: null,
        pageNumberColor: null,
      }
    case 'patchWatermark':
      return {
        ...state,
        watermark: { ...state.watermark, ...action.payload },
      }
    case 'patchLogo':
      return {
        ...state,
        logo: { ...state.logo, ...action.payload },
      }
    case 'applyXhsPreset':
      return { ...state, cardWidth: XHS_WIDTH, cardHeight: XHS_HEIGHT, lockRatio35: true }
    case 'applySquarePreset':
      return { ...state, cardWidth: SQUARE_SIZE, cardHeight: SQUARE_SIZE, lockRatio35: false }
    case 'applyStoryPreset':
      return { ...state, cardWidth: XHS_WIDTH, cardHeight: STORY_HEIGHT, lockRatio35: false }
    case 'resetToDefault':
      return initialEditorState
    default:
      return state
  }
}

type EditorContextValue = {
  state: EditorState
  dispatch: Dispatch<EditorAction>
  /** Timestamp of last successful auto-save. null before first save. */
  savedAt: Date | null
  /** Wipe localStorage and reset to factory defaults. */
  resetToDefault: () => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => loadFromShareUrl() ?? loadSavedState() ?? initialEditorState,
  )
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        localStorage.setItem(STORAGE_TS_KEY, Date.now().toString())
        setSavedAt(new Date())
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          import('sonner').then(({ toast }) =>
            toast.warning('本地存储空间不足，草稿未能保存。可尝试移除自定义 Logo 后重试。'),
          )
        }
      }
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timerRef.current)
  }, [state])

  const resetToDefault = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    dispatch({ type: 'resetToDefault' })
  }, [])

  const value = useMemo(
    () => ({ state, dispatch, savedAt, resetToDefault }),
    [resetToDefault, state, savedAt],
  )
  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  )
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used within EditorProvider')
  return ctx
}

type EditorViewBridgeValue = {
  view: EditorView | null
  setView: (v: EditorView | null) => void
}

const EditorViewContext = createContext<EditorViewBridgeValue | null>(null)

export function EditorViewBridge({ children }: { children: ReactNode }) {
  const [view, setView] = useState<EditorView | null>(null)
  const value = useMemo(() => ({ view, setView }), [view])
  return (
    <EditorViewContext.Provider value={value}>
      {children}
    </EditorViewContext.Provider>
  )
}

export function useEditorViewBridge() {
  const ctx = useContext(EditorViewContext)
  if (!ctx)
    throw new Error('useEditorViewBridge must be used within EditorViewBridge')
  return ctx
}
