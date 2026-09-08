import { createContext, useContext, useState, useCallback } from 'react'
import { AUTH_STORAGE_KEY } from '../api/client'

const AdminAuthContext = createContext(null)

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AdminAuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth)

  // data: { token, username, role }
  const login = useCallback((data) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data))
    setAuth(data)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setAuth(null)
  }, [])

  return (
    <AdminAuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

// useAdminAuth is imported alongside AdminAuthProvider from this same file
// across the app; splitting it into its own file would mean updating every
// one of those import sites for a fast-refresh-only concern, not a
// correctness one.
// eslint-disable-next-line react-refresh/only-export-components
export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
