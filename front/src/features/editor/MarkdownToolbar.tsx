import {
  Bold,
  Code2,
  Heading1,
  Highlighter,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Table2,
  Underline,
} from 'lucide-react'
import { useEditorViewBridge } from '@/state/EditorContext'
import {
  insertAtCursor,
  insertLinesAround,
  wrapSelection,
} from '@/features/editor/markdownInsert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SnippetMenu } from '@/features/editor/SnippetMenu'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const btn = 'h-8 w-8 shrink-0 p-0'

export function MarkdownToolbar() {
  const { view } = useEditorViewBridge()

  const run = (fn: () => void) => {
    if (!view) return
    fn()
  }

  return (
    <div
      className={cn(
        'app-panel-titlebar flex flex-wrap items-center gap-0.5 border-b border-[var(--border)] px-2 py-1.5',
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btn}
        title="标题 #"
        aria-label="标题 #"
        onClick={() =>
          run(() => insertAtCursor(view!, '# '))
        }
      >
        <Heading1 className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btn}
        title="粗体 ⌘B"
        aria-label="粗体 ⌘B"
        onClick={() => run(() => wrapSelection(view!, '**', '**'))}
      >
        <Bold className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btn}
        title="斜体 ⌘I"
        aria-label="斜体 ⌘I"
        onClick={() => run(() => wrapSelection(view!, '*', '*'))}
      >
        <Italic className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btn}
        title="删除线 ⌘⇧X"
        aria-label="删除线 ⌘⇧X"
        onClick={() => run(() => wrapSelection(view!, '~~', '~~'))}
      >
        <Strikethrough className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btn}
        title="下划线 ⌘⇧U"
        aria-label="下划线 ⌘⇧U"
        onClick={() => run(() => wrapSelection(view!, '<u>', '</u>'))}
      >
        <Underline className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btn}
        title="高亮 ⌘⇧M"
        aria-label="高亮 ⌘⇧M"
        onClick={() => run(() => wrapSelection(view!, '<mark>', '</mark>'))}
      >
        <Highlighter className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btn}
        title="链接 ⌘K"
        aria-label="链接 ⌘K"
        onClick={() =>
          run(() => insertAtCursor(view!, '[链接文字](https://)'))
        }
      >
        <Link2 className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btn}
        title="图片"
        aria-label="图片"
        onClick={() =>
          run(() => insertAtCursor(view!, '![描述](https://)'))
        }
      >
        <ImageIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btn}
        title="代码块 ⌘E"
        aria-label="代码块 ⌘E"
        onClick={() =>
          run(() =>
            insertAtCursor(
              view!,
              '```\n代码\n```\n',
            ),
          )
        }
      >
        <Code2 className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btn}
        title="引用块"
        aria-label="引用块"
        onClick={() =>
          run(() => insertLinesAround(view!, '> ', ''))
        }
      >
        <Quote className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btn}
        title="无序列表"
        aria-label="无序列表"
        onClick={() =>
          run(() => insertLinesAround(view!, '- ', '列表项'))
        }
      >
        <List className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btn}
        title="有序列表"
        aria-label="有序列表"
        onClick={() =>
          run(() => insertLinesAround(view!, '1. ', '列表项'))
        }
      >
        <ListOrdered className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btn}
        title="表格"
        aria-label="表格"
        onClick={() =>
          run(() =>
            insertAtCursor(
              view!,
              '| 列 A | 列 B |\n| --- | --- |\n| 1 | 2 |\n',
            ),
          )
        }
      >
        <Table2 className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btn}
        title="分割线 / 分页线"
        aria-label="分割线 / 分页线"
        onClick={() => run(() => insertAtCursor(view!, '\n===\n'))}
      >
        <Minus className="size-4" />
      </Button>
      <div className="ml-auto flex items-center gap-1.5 pl-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-sm"
          onClick={() =>
            toast('AI 生成功能需要登录', {
              description: '前往 mdcard.cn 注册账号后使用',
              action: { label: '去官网', onClick: () => window.open('https://mdcard.cn', '_blank') },
            })
          }
        >
          <Sparkles className="size-3.5" />
          <span className="hidden sm:inline">AI 生成</span>
        </Button>
        <SnippetMenu />
      </div>
    </div>
  )
}
