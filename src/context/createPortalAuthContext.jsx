import { createContext, useContext, useState, useCallback } from 'react'

/**
 * Builds an independent {Provider, useAuth} pair backed by its own localStorage
 * key, so separate portals (Admin/Finance/Support) sharing this one app never
 * clash — logging into one doesn't log the others out, even across tabs.
 */
export function createPortalAuthContext(storageKey) {
  const Ctx = createContext(null)

  function readStoredAuth() {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  function Provider({ children }) {
    const [auth, setAuth] = useState(readStoredAuth)

    // data: { token, username, role }
    const login = useCallback((data) => {
      localStorage.setItem(storageKey, JSON.stringify(data))
      setAuth(data)
    }, [])

    const logout = useCallback(() => {
      localStorage.removeItem(storageKey)
      setAuth(null)
    }, [])

    return <Ctx.Provider value={{ auth, login, logout }}>{children}</Ctx.Provider>
  }

  function useAuth() {
    const ctx = useContext(Ctx)
    if (!ctx) throw new Error('useAuth must be used within its matching Provider')
    return ctx
  }

  return { Provider, useAuth }
}
