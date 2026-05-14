import { useEffect, useRef, useState } from 'react'
import { BookText, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEditorViewBridge } from '@/state/EditorContext'
import { appendToDoc } from '@/features/editor/markdownInsert'
import { SNIPPETS, type Snippet } from '@/features/editor/snippets'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'md2card_snippets'

function loadSnippets(): Snippet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Snippet[]
  } catch {
    return SNIPPETS
  }
  return SNIPPETS
}

type EditTarget = { type: 'new' } | { type: 'edit'; snippet: Snippet }

export function SnippetMenu() {
  const { view } = useEditorViewBridge()
  const [open, setOpen] = useState(false)
  const [managing, setManaging] = useState(false)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [formLabel, setFormLabel] = useState('')
  const [formContent, setFormContent] = useState('')
  const [snippets, setSnippets] = useState<Snippet[]>(loadSnippets)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets))
  }, [snippets])

  useEffect(() => {
    if (!open) return
    const onMouse = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setManaging(false)
        setEditTarget(null)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (editTarget) { setEditTarget(null); return }
      if (managing) { setManaging(false); return }
      setOpen(false)
    }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, managing, editTarget])

  const handlePick = (content: string) => {
    if (view) appendToDoc(view, content)
    setOpen(false)
  }

  const startEdit = (target: EditTarget) => {
    setEditTarget(target)
    setFormLabel(target.type === 'edit' ? target.snippet.label : '')
    setFormContent(target.type === 'edit' ? target.snippet.content : '')
  }

  const handleSave = () => {
    const label = formLabel.trim()
    const content = formContent.trim()
    if (!label || !content) return
    if (editTarget?.type === 'new') {
      setSnippets(prev => [...prev, { id: `user-${crypto.randomUUID()}`, label, content }])
    } else if (editTarget?.type === 'edit') {
      const id = editTarget.snippet.id
      setSnippets(prev => prev.map(s => s.id === id ? { ...s, label, content } : s))
    }
    setEditTarget(null)
  }

  const handleDelete = (id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 px-2 text-xs"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen(v => !v)
          setManaging(false)
          setEditTarget(null)
        }}
      >
        <BookText className="size-3.5" />
        常用文案
        <ChevronDown className={`size-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+4px)] z-30 w-80 overflow-hidden rounded-md border border-(--border) bg-(--card-shell) shadow-lg"
        >
          {/* header */}
          <div className="flex items-center justify-between border-b border-(--border) px-3 py-2">
            {managing ? (
              <button
                type="button"
                className="text-[11px] text-(--muted-foreground) hover:text-(--foreground)"
                onClick={() => { setManaging(false); setEditTarget(null) }}
              >
                ← 返回
              </button>
            ) : (
              <span className="text-[11px] font-medium uppercase tracking-wider text-(--muted-foreground)">
                常用文案 · 点击追加到文末
              </span>
            )}
            {!managing && (
              <button
                type="button"
                title="管理文案"
                className="rounded p-0.5 text-(--muted-foreground) hover:bg-(--border)/40 hover:text-(--foreground)"
                onClick={() => setManaging(true)}
              >
                <Pencil className="size-3.5" />
              </button>
            )}
          </div>

          {/* edit / new form */}
          {editTarget && (
            <div className="space-y-2 border-b border-(--border) p-3">
              <input
                autoFocus
                type="text"
                placeholder="标题"
                value={formLabel}
                onChange={e => setFormLabel(e.target.value)}
                className="w-full rounded-md border border-(--border) bg-(--background) px-2.5 py-1.5 text-sm text-(--foreground) outline-none focus:border-(--accent-ui)"
              />
              <textarea
                placeholder="内容（支持 Markdown）"
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-md border border-(--border) bg-(--background) px-2.5 py-1.5 font-mono text-xs leading-relaxed text-(--foreground) outline-none focus:border-(--accent-ui)"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline" size="sm"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setEditTarget(null)}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  disabled={!formLabel.trim() || !formContent.trim()}
                  onClick={handleSave}
                >
                  保存
                </Button>
              </div>
            </div>
          )}

          {/* snippet list */}
          <ul className="max-h-72 overflow-y-auto py-1">
            {snippets.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-(--muted-foreground)">
                还没有文案，点击下方新增
              </li>
            )}
            {snippets.map(s => (
              <li key={s.id} className="flex items-center gap-1 px-1">
                <button
                  type="button"
                  className={cn(
                    'flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded px-2 py-2 text-left transition-colors',
                    managing
                      ? 'cursor-default'
                      : 'hover:bg-(--accent-ui)/10',
                  )}
                  onClick={() => !managing && handlePick(s.content)}
                >
                  <span className="text-sm font-medium text-(--foreground)">{s.label}</span>
                  {!managing && s.preview && (
                    <span className="line-clamp-1 text-xs text-(--muted-foreground)">{s.preview}</span>
                  )}
                </button>
                {managing && !editTarget && (
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      title="编辑"
                      className="rounded p-1 text-(--muted-foreground) hover:bg-(--border)/40 hover:text-(--foreground)"
                      onClick={() => startEdit({ type: 'edit', snippet: s })}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="删除"
                      className="rounded p-1 text-(--muted-foreground) hover:bg-red-500/10 hover:text-red-500"
                      onClick={() => handleDelete(s.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* add button (manage mode only) */}
          {managing && !editTarget && (
            <div className="border-t border-(--border) p-2">
              <button
                type="button"
                className="flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-sm text-(--accent-ui) hover:bg-(--accent-ui)/10"
                onClick={() => startEdit({ type: 'new' })}
              >
                <Plus className="size-4" />
                新增文案
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
