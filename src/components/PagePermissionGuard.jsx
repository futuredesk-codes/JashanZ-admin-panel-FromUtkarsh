import { usePermissions } from '../context/PermissionsContext'

/** Blocks a routed page when the logged-in role lacks READ on `pageId`. Backend enforces the real restriction on every request either way — this just avoids showing a page that will 403 on load. */
export default function PagePermissionGuard({ pageId, children }) {
  const { can, loading } = usePermissions()

  if (loading) return null

  if (!can(pageId, 'READ')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-black text-slate-800">Access Restricted</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">You don't have permission to view this page. Ask a Super Admin to grant access from the Manage option on your account.</p>
      </div>
    )
  }

  return children
}
