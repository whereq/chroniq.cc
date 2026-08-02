import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import keycloak from './keycloak'

interface AuthContextValue {
  isAuthenticated: boolean
  ready: boolean
  token: string | undefined
  username: string | undefined
  displayName: string | undefined
  roles: string[]
  isAdmin: boolean
  login: () => void
  register: () => void
  logout: () => void
}

function extractRoles(parsed: Record<string, unknown> | undefined): string[] {
  const realmAccess = parsed?.['realm_access'] as { roles?: string[] } | undefined
  return realmAccess?.roles ?? []
}

function buildDisplayName(
  parsed: Record<string, unknown> | undefined,
  username: string | undefined,
): string | undefined {
  const first = (parsed?.['given_name'] as string | undefined)?.trim()
  const last = (parsed?.['family_name'] as string | undefined)?.trim()
  const full = [first, last].filter(Boolean).join(' ')
  return full || username
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | undefined>()
  const [username, setUsername] = useState<string | undefined>()
  const [displayName, setDisplayName] = useState<string | undefined>()
  const [roles, setRoles] = useState<string[]>([])
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    // Guard against React 18 StrictMode double-invoke.
    if (initialized.current) return
    initialized.current = true

    keycloak
      .init({ onLoad: 'check-sso', pkceMethod: 'S256', checkLoginIframe: false })
      .then((authenticated) => {
        setIsAuthenticated(authenticated)
        if (authenticated) {
          const u = keycloak.tokenParsed?.['preferred_username'] as string | undefined
          setToken(keycloak.token)
          setUsername(u)
          setDisplayName(buildDisplayName(keycloak.tokenParsed, u))
          setRoles(extractRoles(keycloak.tokenParsed))
        }
      })
      .catch(() => setIsAuthenticated(false))
      .finally(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    refreshTimer.current = setInterval(async () => {
      try {
        const refreshed = await keycloak.updateToken(30)
        if (refreshed) {
          setToken(keycloak.token)
          setRoles(extractRoles(keycloak.tokenParsed))
        }
      } catch {
        setIsAuthenticated(false)
        setToken(undefined)
      }
    }, 60_000)
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current)
    }
  }, [isAuthenticated])

  const value: AuthContextValue = {
    isAuthenticated,
    ready,
    token,
    username,
    displayName,
    roles,
    isAdmin: roles.includes('ch-admin'),
    login: () => keycloak.login(),
    register: () => keycloak.register(),
    logout: () => keycloak.logout({ redirectUri: window.location.origin }),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
