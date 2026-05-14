import { useEffect, useRef, useState } from 'react'
import { AlertCircle, BookOpen, Check, Cloud, Home, Loader2, Moon, RotateCcw, Share2, Sun } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { BrandMark } from '@/components/BrandMark'
import {
  EditorProvider,
  EditorViewBridge,
  useEditor,
} from '@/state/EditorContext'
import { MarkdownEditor } from '@/features/editor/MarkdownEditor'
import { CardPreview } from '@/features/preview/CardPreview'
import { BottomPanel } from '@/features/settings/BottomPanel'
import { DocsPage } from '@/pages/DocsPage'
import Landing from '@/pages/Landing/Landing'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { encodeShareUrl } from '@/lib/shareUrl'
import { cn } from '@/lib/utils'
import { trackEvent, trackPageView } from '@/lib/analytics'
import { AuthProvider, useAuth } from '@/state/AuthContext'
import { AuthDialog } from '@/features/auth/AuthDialog'
import { UserMenu } from '@/features/auth/UserMenu'
import { WorkspaceSyncProvider, useWorkspaceSync } from '@/state/WorkspaceSync'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const handler = () => setHash(window.location.hash)
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])
  return hash
}

function SaveIndicator() {
  const { user } = useAuth()
  const { savedAt } = useEditor()
  const { syncStatus } = useWorkspaceSync()

  if (user) {
    if (syncStatus === 'loading') {
      return (
        <span className="hidden items-center gap-1 text-xs text-(--muted-foreground) sm:flex">
          <Loader2 className="size-3 animate-spin" />
          加载云端…
        </span>
      )
    }
    if (syncStatus === 'syncing') {
      return (
        <span className="hidden items-center gap-1 text-xs text-(--muted-foreground) sm:flex">
          <Loader2 className="size-3 animate-spin" />
          同步中…
        </span>
      )
    }
    if (syncStatus === 'synced') {
      return (
        <span className="hidden items-center gap-1 text-xs text-(--muted-foreground) sm:flex">
          <Cloud className="size-3 text-green-500" />
          已同步
        </span>
      )
    }
    if (syncStatus === 'error') {
      return (
        <span className="hidden items-center gap-1 text-xs text-red-400 sm:flex">
          <AlertCircle className="size-3" />
          同步失败
        </span>
      )
    }
    return null
  }

  if (!savedAt) return null
  return (
    <span className="hidden items-center gap-1 text-xs text-(--muted-foreground) sm:flex">
      <Check className="size-3 text-green-500" />
      已自动保存
    </span>
  )
}

function useDocumentTitle() {
  const { state } = useEditor()
  useEffect(() => {
    const h1 = /^#\s+(.+)$/m.exec(state.markdown)?.[1]?.trim()
    document.title = h1 ? `${h1} — MD2Card` : 'MD2Card'
    return () => { document.title = 'MD2Card' }
  }, [state.markdown])
}

function AppLayout() {
  useDocumentTitle()
  const { state, dispatch, resetToDefault } = useEditor()
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [dialog, setDialog] = useState<'share' | 'reset' | null>(null)
  const [authOpen, setAuthOpen] = useState(false)

  function handleShareConfirm() {
    setDialog(null)
    const url = encodeShareUrl(state)
    trackEvent('share_link_created')
    navigator.clipboard.writeText(url).then(
      () => toast.success('分享链接已复制'),
      () => toast.error('复制失败，请手动复制地址栏链接'),
    )
  }

  function handleResetConfirm() {
    setDialog(null)
    resetToDefault()
  }

  return (
    <div
      className={cn(
        'flex h-dvh flex-col overflow-hidden bg-(--background) text-(--foreground)',
        state.appTheme === 'dark' && 'dark',
      )}>
      <header className="app-chrome-header sticky top-0 z-20 shrink-0">
        <div className="flex w-full items-center gap-6 px-3 py-3 md:px-5">
          <a
            href="#/"
            className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
            aria-label="MD2Card 首页">
            <BrandMark />
            <span className="text-[15px] font-semibold tracking-tight text-(--foreground)">
              MD2Card
            </span>
          </a>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <SaveIndicator />
            <a
              href="#/"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border) bg-(--card-shell)/70 px-2.5 text-sm text-(--muted-foreground) transition-colors hover:border-(--accent-ui)/30 hover:bg-(--surface-wash) hover:text-(--foreground)"
            >
              <Home className="size-3.5" />
              <span className="hidden sm:inline">官网</span>
            </a>
            <a
              href="#/docs"
              className="hidden h-8 items-center gap-1.5 rounded-md border border-(--border) bg-(--card-shell)/70 px-2.5 text-sm text-(--muted-foreground) transition-colors hover:border-(--accent-ui)/30 hover:bg-(--surface-wash) hover:text-(--foreground) sm:inline-flex"
            >
              <BookOpen className="size-3.5" />
              文档
            </a>
            <button
              type="button"
              title={
                state.appTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'
              }
              onClick={() =>
                dispatch({
                  type: 'setAppTheme',
                  payload: state.appTheme === 'dark' ? 'light' : 'dark',
                })
              }
              className="inline-flex size-8 items-center justify-center rounded-md border border-(--border) bg-(--card-shell)/70 text-(--muted-foreground) transition-colors hover:border-(--accent-ui)/30 hover:bg-(--surface-wash) hover:text-(--foreground)">
              {state.appTheme === 'dark' ? (
                <Sun className="size-3.5" />
              ) : (
                <Moon className="size-3.5" />
              )}
            </button>
            <button
              type="button"
              title="恢复默认设置（清除已保存的草稿和配置）"
              onClick={() => setDialog('reset')}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border) bg-(--card-shell)/70 px-2.5 text-sm text-(--muted-foreground) transition-colors hover:border-(--accent-ui)/30 hover:bg-(--surface-wash) hover:text-(--foreground)">
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">重置</span>
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--accent-ui)/25 bg-(--accent-ui)/10 px-3 text-sm font-medium text-(--accent-ui) transition-colors hover:bg-(--accent-ui)/15"
              onClick={() => setDialog('share')}>
              <Share2 className="size-3.5" />
              <span className="hidden sm:inline">分享</span>
            </button>
            <UserMenu onSignIn={() => setAuthOpen(true)} />
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-3 bg-[radial-gradient(circle_at_18%_8%,rgba(255,92,40,0.06),transparent_34%),radial-gradient(circle_at_82%_92%,rgba(232,179,58,0.05),transparent_42%)] p-3 md:flex-row md:gap-4 md:p-5">
        <MarkdownEditor />
        <CardPreview cardRefs={cardRefs} />
        <BottomPanel cardRefs={cardRefs} />
      </main>

      <Dialog
        open={dialog === 'share'}
        onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认生成分享链接</DialogTitle>
            <DialogDescription className="pt-1">
              分享链接包含当前卡片的全部内容和样式设置，任何拿到链接的人都可以查看。确认要生成吗？
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDialog(null)}>
              取消
            </Button>
            <Button size="sm" onClick={handleShareConfirm}>
              生成并复制
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === 'reset'}
        onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认重置</DialogTitle>
            <DialogDescription className="pt-1">
              将清除所有内容和配置，恢复到默认状态。此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDialog(null)}>
              取消
            </Button>
            <Button size="sm" onClick={handleResetConfirm}>
              确认重置
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AuthDialog
        open={authOpen}
        defaultMode="signin"
        onOpenChange={setAuthOpen}
      />
    </div>
  )
}

function AppRouter() {
  const hash = useHash()

  useEffect(() => {
    trackPageView(hash || '#/')
  }, [hash])

  if (hash === '#/docs') return <DocsPage />
  if (hash === '#/app') return <AppLayout />
  // VITE_LANDING_ENABLED=true to show the landing page (hosted service).
  // Default (unset / false): go straight to the editor for self-hosted deployments.
  if (import.meta.env.VITE_LANDING_ENABLED === 'true') return <Landing />
  return <AppLayout />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <EditorProvider>
          <WorkspaceSyncProvider>
            <EditorViewBridge>
              <AppRouter />
              <AppToaster />
            </EditorViewBridge>
          </WorkspaceSyncProvider>
        </EditorProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

function AppToaster() {
  const { state } = useEditor()
  return <Toaster theme={state.appTheme} richColors position="bottom-right" />
}
