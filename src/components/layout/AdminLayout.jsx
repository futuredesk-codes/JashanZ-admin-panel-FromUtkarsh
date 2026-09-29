import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { PermissionsProvider } from '../../context/PermissionsContext'
import { StaffProfileProvider } from '../../context/StaffProfileContext'
import '../../admin-theme.css'

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { auth } = useAdminAuth()

  return (
    <PermissionsProvider authToken={auth?.token}>
      <StaffProfileProvider authToken={auth?.token}>
      <div className="jz-admin flex h-screen overflow-hidden">
        <AdminSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:ml-[250px] overflow-hidden">
          <AdminHeader onMenuClick={() => setDrawerOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      </StaffProfileProvider>
    </PermissionsProvider>
  )
}
