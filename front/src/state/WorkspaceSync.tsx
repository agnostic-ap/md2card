import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuth, getAuthHeader } from '@/state/AuthContext'
import { useEditor, STORAGE_TS_KEY } from '@/state/EditorContext'
import type { EditorState } from '@/state/EditorContext'
import type { ManagedTemplate } from '@/features/ai/types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''
const PUSH_DELAY_MS = 5000

export type SyncStatus = 'idle' | 'loading' | 'syncing' | 'synced' | 'error'

type WorkspaceSyncContextValue = {
  syncStatus: SyncStatus
  /** null = not yet loaded from cloud; array = cloud copy (may be empty) */
  cloudTemplates: ManagedTemplate[] | null
  pushTemplates: (templates: ManagedTemplate[]) => void
}

const WorkspaceSyncContext = createContext<WorkspaceSyncContextValue | null>(null)

export function WorkspaceSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { state, dispatch } = useEditor()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [readyUserId, setReadyUserId] = useState<string | null>(null)
  const [cloudTemplates, setCloudTemplates] = useState<ManagedTemplate[] | null>(null)
  const pushTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  // Pending template update to include in the next debounced push
  const pendingTemplatesRef = useRef<ManagedTemplate[] | null>(null)

  // Load cloud workspace when user logs in
  useEffect(() => {
    if (!user) {
      setReadyUserId(null)
      setCloudTemplates(null)
      setSyncStatus('idle')
      return
    }
    if (readyUserId === user.id) return

    setSyncStatus('loading')
    let cancelled = false

    fetch(`${API_BASE}/api/workspace`, { headers: getAuthHeader() })
      .then((r) => r.json())
      .then(({ workspace }: {
        workspace: {
          editorState: EditorState | null
          aiTemplates: ManagedTemplate[] | null
          updatedAt: string
        } | null
      }) => {
        if (cancelled) return
        const cloudState = workspace?.editorState
        const cloudTs = workspace?.updatedAt ? new Date(workspace.updatedAt).getTime() : 0
        const localTs = parseInt(localStorage.getItem(STORAGE_TS_KEY) ?? '0', 10)

        if (cloudState && cloudTs > localTs) {
          dispatch({ type: 'loadCloud', payload: cloudState })
        }
        if (workspace?.aiTemplates?.length) {
          setCloudTemplates(workspace.aiTemplates)
        } else {
          setCloudTemplates([])
        }
        setSyncStatus('synced')
        setReadyUserId(user.id)
      })
      .catch(() => {
        if (cancelled) return
        setCloudTemplates([])
        setSyncStatus('error')
        setReadyUserId(user.id)
      })

    return () => { cancelled = true }
  }, [user, dispatch, readyUserId])

  // Debounced push to cloud after initial load completes
  useEffect(() => {
    if (!user || readyUserId !== user.id) return

    clearTimeout(pushTimerRef.current)
    setSyncStatus('syncing')

    const templates = pendingTemplatesRef.current

    pushTimerRef.current = setTimeout(() => {
      const body: Record<string, unknown> = { editorState: state }
      if (templates !== null) {
        body.aiTemplates = templates
        pendingTemplatesRef.current = null
      }
      fetch(`${API_BASE}/api/workspace`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(body),
      })
        .then((r) => setSyncStatus(r.ok ? 'synced' : 'error'))
        .catch(() => setSyncStatus('error'))
    }, PUSH_DELAY_MS)

    return () => clearTimeout(pushTimerRef.current)
  }, [state, user, readyUserId])

  useEffect(() => () => clearTimeout(pushTimerRef.current), [])

  const pushTemplates = useCallback((templates: ManagedTemplate[]) => {
    if (!user || readyUserId !== user.id) return
    // Store for the next debounced flush; also update local cloud copy
    pendingTemplatesRef.current = templates
    setCloudTemplates(templates)
    // Trigger the push effect by setting status (the state dep won't fire here)
    // We rely on the next state change to flush, OR call directly after a brief delay
    clearTimeout(pushTimerRef.current)
    setSyncStatus('syncing')
    pushTimerRef.current = setTimeout(() => {
      fetch(`${API_BASE}/api/workspace`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ aiTemplates: templates }),
      })
        .then((r) => setSyncStatus(r.ok ? 'synced' : 'error'))
        .catch(() => setSyncStatus('error'))
    }, PUSH_DELAY_MS)
  }, [user, readyUserId])

  const value = useMemo(
    () => ({ syncStatus, cloudTemplates, pushTemplates }),
    [syncStatus, cloudTemplates, pushTemplates],
  )

  return (
    <WorkspaceSyncContext.Provider value={value}>
      {children}
    </WorkspaceSyncContext.Provider>
  )
}

export function useWorkspaceSync() {
  const ctx = useContext(WorkspaceSyncContext)
  if (!ctx) throw new Error('useWorkspaceSync must be used within WorkspaceSyncProvider')
  return ctx
}
