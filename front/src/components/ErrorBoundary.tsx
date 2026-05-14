import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-(--background) p-8 text-(--foreground)">
          <AlertTriangle className="size-12 text-red-500" />
          <h1 className="text-xl font-semibold">页面出了点问题</h1>
          <p className="max-w-sm text-center text-sm text-(--muted-foreground)">
            {error.message || '未知错误'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="inline-flex items-center gap-2 rounded-md border border-(--border) px-4 py-2 text-sm transition-colors hover:bg-(--background)"
          >
            <RefreshCw className="size-4" />
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
