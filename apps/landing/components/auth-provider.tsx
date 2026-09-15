'use client'

// FRONTEND-ONLY: no backend/Firebase — see EXTRACTION_REPORT.md

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { logOut as mockLogOut } from '@/lib/firebase/auth'
import {
  readDemoSession,
  sessionToMockUser,
  subscribeDemoSession,
  type MockUser,
} from '@/lib/mock-auth-session'
import { analytics } from '@/lib/analytics'

type AuthContextValue = {
  user: MockUser | null
  loading: boolean
  isAuthenticated: boolean
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apply = (session: ReturnType<typeof readDemoSession>) => {
      if (session) {
        setUser(sessionToMockUser(session))
        void analytics.setUser(session.uid)
      } else {
        setUser(null)
        void analytics.clearUser()
      }
      setLoading(false)
    }

    apply(readDemoSession())
    return subscribeDemoSession(apply)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      logOut: async () => {
        await mockLogOut()
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
