import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { PermissionsProvider } from '../../context/PermissionsContext'

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { auth } = useAdminAuth()

  return (
    <PermissionsProvider authToken={auth?.token}>
      <div className="flex h-screen bg-canvas overflow-hidden">
        <AdminSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:ml-60 overflow-hidden">
          <AdminHeader onMenuClick={() => setDrawerOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </PermissionsProvider>
  )
}
