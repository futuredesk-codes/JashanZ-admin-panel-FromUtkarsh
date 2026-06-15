import { Routes, Route, Navigate } from 'react-router-dom'

import AdminLoginPage   from './pages/admin/LoginPage'
import AdminDashboard   from './pages/admin/DashboardPage'
import AdminLayout      from './components/layout/AdminLayout'

import SupportLoginPage from './pages/support/LoginPage'
import SupportLayout    from './components/layout/SupportLayout'

import FinanceLoginPage from './pages/finance/LoginPage'
import FinanceLayout    from './components/layout/FinanceLayout'

import PlaceholderPage  from './pages/PlaceholderPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />

      {/* ── Admin Portal ── */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"     element={<AdminDashboard />} />
        <Route path="businesses"    element={<PlaceholderPage title="Business Management" />} />
        <Route path="customers"     element={<PlaceholderPage title="Customer Management" />} />
        <Route path="categories"    element={<PlaceholderPage title="Service Categories" />} />
        <Route path="support-users" element={<PlaceholderPage title="Support Users" />} />
        <Route path="finance-users" element={<PlaceholderPage title="Finance Users" />} />
        <Route path="roles"         element={<PlaceholderPage title="Roles & Permissions" />} />
        <Route path="reports"       element={<PlaceholderPage title="Reports" />} />
        <Route path="audit"         element={<PlaceholderPage title="Audit Logs" />} />
        <Route path="settings"      element={<PlaceholderPage title="Settings" />} />
      </Route>

      {/* ── Support Portal ── */}
      <Route path="/support/login" element={<SupportLoginPage />} />
      <Route path="/support" element={<SupportLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PlaceholderPage title="Support Dashboard" />} />
        <Route path="approvals" element={<PlaceholderPage title="Vendor Approvals" />} />
        <Route path="tickets"   element={<PlaceholderPage title="Ticket Management" />} />
        <Route path="circles"   element={<PlaceholderPage title="Event Circles" />} />
      </Route>

      {/* ── Finance Portal ── */}
      <Route path="/finance/login" element={<FinanceLoginPage />} />
      <Route path="/finance" element={<FinanceLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"   element={<PlaceholderPage title="Finance Dashboard" />} />
        <Route path="bookings"    element={<PlaceholderPage title="Booking Financials" />} />
        <Route path="commission"  element={<PlaceholderPage title="Commission Engine" />} />
        <Route path="recharge"    element={<PlaceholderPage title="Recharge Management" />} />
        <Route path="settlements" element={<PlaceholderPage title="Settlement Management" />} />
        <Route path="refunds"     element={<PlaceholderPage title="Refund Management" />} />
        <Route path="reports"     element={<PlaceholderPage title="Finance Reports" />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
