/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const TOKEN_KEY = 'md2card.token'
const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export type AppUser = {
  id: string
  name: string
  email: string
  plan: 'free' | 'pro'
  createdAt: string
}

type AuthContextValue = {
  user: AppUser | null
  loading: boolean
  signIn: (payload: SignInPayload) => Promise<AppUser>
  signUp: (payload: SignUpPayload) => Promise<AppUser>
  signOut: () => Promise<void>
}

type SignInPayload = {
  email: string
  password: string
}

type SignUpPayload = {
  name: string
  email: string
  password: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  const data = await res.json()
  if (!res.ok) throw new Error((data as { message?: string }).message ?? '请求失败')
  return data as T
}

export function getAuthHeader(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    apiFetch<{ user: AppUser }>('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ user }) => setUser(user))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback(async ({ email, password }: SignInPayload) => {
    const { user, token } = await apiFetch<{ user: AppUser; token: string }>(
      '/api/auth/signin',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    )
    setToken(token)
    setUser(user)
    return user
  }, [])

  const signUp = useCallback(async ({ name, email, password }: SignUpPayload) => {
    const { user, token } = await apiFetch<{ user: AppUser; token: string }>(
      '/api/auth/signup',
      { method: 'POST', body: JSON.stringify({ name, email, password }) },
    )
    setToken(token)
    setUser(user)
    return user
  }, [])

  const signOut = useCallback(async () => {
    const token = getToken()
    clearToken()
    setUser(null)
    if (token) {
      apiFetch('/api/session', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [loading, signIn, signOut, signUp, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
