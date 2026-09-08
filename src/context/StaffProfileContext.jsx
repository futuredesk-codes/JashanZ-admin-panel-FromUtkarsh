import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getMyStaffProfile } from '../api/staff'

const StaffProfileContext = createContext(null)

/**
 * Fetches the current portal session's own staff profile once per token and
 * shares it between that portal's header chip and its profile page. Mirrors
 * PermissionsProvider's shape.
 */
export function StaffProfileProvider({ authToken, children }) {
  const [state, setState] = useState({ profile: null, loading: true })

  const reload = useCallback(() => {
    getMyStaffProfile()
      .then((d) => setState({ profile: d.profile ?? null, loading: false }))
      .catch(() => setState({ profile: null, loading: false }))
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!authToken) {
        setState({ profile: null, loading: false })
        return
      }
      setState((s) => ({ ...s, loading: true }))
      try {
        const data = await getMyStaffProfile()
        if (!cancelled) setState({ profile: data.profile ?? null, loading: false })
      } catch {
        if (!cancelled) setState({ profile: null, loading: false })
      }
    })()
    return () => { cancelled = true }
  }, [authToken])

  return <StaffProfileContext.Provider value={{ ...state, reload }}>{children}</StaffProfileContext.Provider>
}

// useStaffProfile is imported alongside StaffProfileProvider across the app;
// splitting it out is a fast-refresh-only concern, not a correctness one.
// eslint-disable-next-line react-refresh/only-export-components
export function useStaffProfile() {
  return useContext(StaffProfileContext) ?? { profile: null, loading: false, reload: () => {} }
}
