import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

/** Redirects to `redirectTo` unless the current session is authenticated with an allowed role. */
export default function ProtectedRoute({ roles, redirectTo, children }) {
  const { auth } = useAdminAuth()
  if (!auth?.token || !roles.includes(auth.role)) return <Navigate to={redirectTo} replace />
  return children
}
