import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useEditor, useEditorViewBridge } from '@/state/EditorContext'
import { splitMarkdown } from '@/features/preview/splitMarkdown'
import { lightEditorTheme } from '@/editor/editorTheme'
import { markdownShortcutsExtension } from '@/editor/markdownShortcuts'
import { MarkdownToolbar } from '@/features/editor/MarkdownToolbar'
import { cn } from '@/lib/utils'

const IMAGE_SIZE_WARN = 500 * 1024

const imagePasteExtension = EditorView.domEventHandlers({
  paste(event, view) {
    const files = event.clipboardData?.files
    if (!files?.length) return false
    const imageFile = Array.from(files).find((f) => f.type.startsWith('image/'))
    if (!imageFile) return false
    event.preventDefault()
    if (imageFile.size > IMAGE_SIZE_WARN) {
      toast.warning('图片较大，嵌入后会增加文件体积，建议使用图床链接代替')
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      view.dispatch(view.state.replaceSelection(`![图片](${dataUrl})`))
    }
    reader.readAsDataURL(imageFile)
    return true
  },
})

export function MarkdownEditor() {
  const { state, dispatch } = useEditor()
  const { view, setView } = useEditorViewBridge()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [localStats, setLocalStats] = useState(() => ({
    chars: state.markdown.replace(/\s/g, '').length,
    lines: state.markdown ? state.markdown.split('\n').length : 0,
    cards: splitMarkdown(state.markdown).length,
  }))

  const extensions = useMemo(
    () => [markdown(), imagePasteExtension, markdownShortcutsExtension],
    [],
  )
  const themeExt = state.appTheme === 'dark' ? oneDark : lightEditorTheme

  // Push external state changes (reset, share-URL load) into the uncontrolled editor.
  // Compare against the editor's actual content to avoid spurious updates during typing.
  useEffect(() => {
    if (!view) return
    if (view.state.doc.toString() === state.markdown) return
    if (timerRef.current) clearTimeout(timerRef.current)
    queueMicrotask(() => {
      setLocalStats({
        chars: state.markdown.replace(/\s/g, '').length,
        lines: state.markdown ? state.markdown.split('\n').length : 0,
        cards: splitMarkdown(state.markdown).length,
      })
    })
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: state.markdown },
    })
  }, [state.markdown, view])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const handleChange = useCallback(
    (v: string) => {
      setLocalStats({
        chars: v.replace(/\s/g, '').length,
        lines: v ? v.split('\n').length : 0,
        cards: splitMarkdown(v).length,
      })
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'setMarkdown', payload: v })
      }, 150)
    },
    [dispatch],
  )

  return (
    <div
      className={cn(
        'app-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
      )}
    >
      <MarkdownToolbar />
      <div className="flex min-h-[280px] flex-1 flex-col overflow-hidden md:min-h-0">
        <CodeMirror
          defaultValue={state.markdown}
          height="100%"
          className="h-full min-h-0 flex-1"
          theme={themeExt}
          extensions={extensions}
          onChange={handleChange}
          onCreateEditor={(v) => setView(v)}
        />
      </div>
      <div className="app-panel-titlebar flex shrink-0 items-center gap-3 border-t border-[var(--border)] px-3 py-1.5 text-[11px] text-[var(--muted-foreground)]">
        {!state.splitMode && /^={3,}\s*$/m.test(state.markdown) && (
          <button
            type="button"
            className="mr-auto rounded border border-amber-500/30 bg-amber-500/8 px-1.5 py-0.5 text-amber-600 transition-colors hover:bg-amber-500/15 dark:text-amber-400"
            onClick={() => dispatch({ type: 'setSplitMode', payload: true })}
          >
            检测到 === 分页线，点击启用多卡片模式
          </button>
        )}
        {state.splitMode && localStats.cards > 1 && (
          <span className="ml-auto text-(--accent-ui)">{localStats.cards} 张卡片</span>
        )}
        <span className={state.splitMode && localStats.cards > 1 ? '' : 'ml-auto'}>{localStats.chars} 字</span>
        <span>{localStats.lines} 行</span>
      </div>
    </div>
  )
}
