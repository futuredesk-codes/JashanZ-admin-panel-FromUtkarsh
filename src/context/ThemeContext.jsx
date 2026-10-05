import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'jz-staff-theme'
const ThemeContext = createContext(null)

function readStoredTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'light' || raw === 'dark' ? raw : 'dark'
  } catch {
    return 'dark'
  }
}

// Shared across Admin + Support (+ Finance/AdManager, if they adopt it later)
// — one preference for whoever is using this browser, not per-portal, since
// nothing about "light vs dark" is portal-specific.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Private window / storage disabled — theme still works for this
      // session, it just won't persist across reloads.
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// useTheme is imported alongside ThemeProvider from this same file across the
// app; splitting it into its own file would mean updating every one of those
// import sites for a fast-refresh-only concern, not a correctness one.
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
