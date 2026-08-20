import { Navigate } from 'react-router-dom'

/**
 * Redirects to `redirectTo` unless `auth` is an authenticated session with an
 * allowed role. `auth` comes from whichever portal's auth context the caller
 * is guarding (Admin/Finance/Support each have their own).
 */
export default function ProtectedRoute({ auth, roles, redirectTo, children }) {
  if (!auth?.token || !roles.includes(auth.role)) return <Navigate to={redirectTo} replace />
  return children
}
