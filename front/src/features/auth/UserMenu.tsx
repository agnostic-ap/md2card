import { useEffect, useRef, useState } from 'react'
import { LogIn, LogOut, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/state/AuthContext'

type UserMenuProps = {
  onSignIn: () => void
}

export function UserMenu({ onSignIn }: UserMenuProps) {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={onSignIn}>
        <LogIn className="size-4" />
        登录
      </Button>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-(--border) bg-(--card-shell) px-2 py-1 transition-colors hover:border-(--accent-ui)/30"
      >
        <div className="flex size-7 items-center justify-center rounded-md bg-cyan-500/12 text-cyan-600">
          <UserRound className="size-4" />
        </div>
        <div className="hidden min-w-0 leading-tight sm:block">
          <p className="max-w-28 truncate text-xs font-medium">{user.name}</p>
          <p className="text-[10px] uppercase text-(--muted-foreground)">{user.plan}</p>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[200px] rounded-lg border border-(--border) bg-(--background) p-1 shadow-lg">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-(--foreground)">{user.name}</p>
            <p className="text-xs text-(--muted-foreground)">{user.email}</p>
            <span className="mt-1 inline-block rounded-full border border-(--border) px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-(--muted-foreground)">
              {user.plan}
            </span>
          </div>
          <div className="my-0.5 border-t border-(--border)" />
          <button
            type="button"
            onClick={() => { setOpen(false); void signOut() }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-(--muted-foreground) transition-colors hover:bg-(--surface-wash) hover:text-(--foreground)"
          >
            <LogOut className="size-3.5" />
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}
