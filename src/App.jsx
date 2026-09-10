import { Routes, Route, Navigate } from "react-router-dom";

import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import {
  FinanceAuthProvider,
  useFinanceAuth,
} from "./context/FinanceAuthContext";
import {
  SupportAuthProvider,
  useSupportAuth,
} from "./context/SupportAuthContext";
import {
  AdManagerAuthProvider,
  useAdManagerAuth,
} from "./context/AdManagerAuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PagePermissionGuard from "./components/PagePermissionGuard";

import AdminLoginPage from "./pages/admin/LoginPage";
import AdminDashboard from "./pages/admin/DashboardPage";
import AdminLayout from "./components/layout/AdminLayout";

import SupportLoginPage from "./pages/support/LoginPage";
import SupportLayout from "./components/layout/SupportLayout";
import SupportDashboardPage from "./pages/support/DashboardPage";
import SupportTicketsPage from "./pages/support/TicketsPage";
import SupportVendorApprovalsPage from "./pages/support/VendorApprovalsPage";
import SupportAdReviewPage from "./pages/support/AdReviewPage";

import FinanceLoginPage from "./pages/finance/LoginPage";
import FinanceDashboardPage from "./pages/finance/DashboardPage";
import VendorPaymentsPage from "./pages/finance/VendorPaymentsPage";
import BookingPaymentsPage from "./pages/finance/BookingPaymentsPage";
import PayoutsPage from "./pages/finance/PayoutsPage";
import FinanceCommissionsPage from "./pages/finance/CommissionsPage";
import FinanceRefundsPage from "./pages/finance/RefundsPage";
import FinanceReportsPage from "./pages/finance/ReportsPage";
import RechargeManagementPage from "./pages/finance/RechargeManagementPage";
import FinanceLayout from "./components/layout/FinanceLayout";

import AdManagerLoginPage from "./pages/admanager/LoginPage";
import AdManagerLayout from "./components/layout/AdManagerLayout";
import AdManagerDashboardPage from "./pages/admanager/DashboardPage";
import AdManagerProfilePage from "./pages/admanager/ProfilePage";
import AdManagerCreateAdPage from "./pages/admanager/CreateAdPage";
import AdManagerWalletPage from "./pages/admanager/WalletPage";
import AdManagerAdHistoryPage from "./pages/admanager/AdHistoryPage";
import AdManagerSupportPage from "./pages/admanager/SupportPage";
import AdManagerPreviewPage from "./pages/admanager/PreviewPage";

import PlaceholderPage from "./pages/PlaceholderPage";
import StaffProfilePage from "./pages/StaffProfilePage";

import BusinessesPage from "./pages/admin/BusinessesPage";
import CreatorsPage from "./pages/admin/CreatorsPage";
import CustomersPage from "./pages/admin/CustomersPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import CirclesPage from "./pages/admin/CirclesPage";
import FinancePage from "./pages/admin/FinancePage";
import SupportUsersPage from "./pages/admin/SupportUsersPage";
import FinanceUsersPage from "./pages/admin/FinanceUsersPage";
import AdManagerUsersPage from "./pages/admin/AdManagerUsersPage";
import ReportsPage from "./pages/admin/ReportsPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

const FINANCE_ROLES = ["FINANCE_ADMIN", "FINANCE_STAFF", "SUPER_ADMIN"];
const SUPPORT_ROLES = ["SUPPORT_LEAD", "SUPPORT_AGENT", "SUPER_ADMIN", "ADMIN"];
const ADMANAGER_ROLES = ["ADMANAGER"];


function RootRedirect() {
  const hostname = window.location.hostname;

  if (hostname === "support.jashanz.com") {
    return <Navigate to="/support/login" replace />;
  }

  if (hostname === "finance.jashanz.com") {
    return <Navigate to="/finance/login" replace />;
  }

  if (hostname === "admanager.jashanz.com") {
    return <Navigate to="/admanager/login" replace />;
  }

  return <Navigate to="/admin/login" replace />;
}

function AppRoutes() {
  const { auth: adminAuth } = useAdminAuth();
  const { auth: financeAuth } = useFinanceAuth();
  const { auth: supportAuth } = useSupportAuth();
  const { auth: admanagerAuth } = useAdManagerAuth();

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* ── Admin Portal ── */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute
            auth={adminAuth}
            roles={["SUPER_ADMIN", "ADMIN"]}
            redirectTo="/admin/login"
          >
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route
          path="dashboard"
          element={
            <PagePermissionGuard pageId="dashboard">
              <AdminDashboard />
            </PagePermissionGuard>
          }
        />

        <Route
          path="businesses"
          element={
            <PagePermissionGuard pageId="businesses">
              <BusinessesPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="creators"
          element={
            <PagePermissionGuard pageId="creators">
              <CreatorsPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="customers"
          element={
            <PagePermissionGuard pageId="customers">
              <CustomersPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="categories"
          element={
            <PagePermissionGuard pageId="categories">
              <CategoriesPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="circles"
          element={
            <PagePermissionGuard pageId="circles">
              <CirclesPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="finance"
          element={
            <PagePermissionGuard pageId="adminFinance">
              <FinancePage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="support-users"
          element={
            <PagePermissionGuard pageId="staff">
              <SupportUsersPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="finance-users"
          element={
            <PagePermissionGuard pageId="staff">
              <FinanceUsersPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="admanager-users"
          element={
            <PagePermissionGuard pageId="adManagerAccess">
              <AdManagerUsersPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="reports"
          element={
            <PagePermissionGuard pageId="reports">
              <ReportsPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="audit"
          element={
            <PagePermissionGuard pageId="auditLogs">
              <AuditLogsPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="settings"
          element={
            <PagePermissionGuard pageId="settings">
              <AdminSettingsPage />
            </PagePermissionGuard>
          }
        />

        <Route path="profile" element={<StaffProfilePage />} />
      </Route>

      {/* ── Support Portal ── */}
      <Route path="/support/login" element={<SupportLoginPage />} />

      <Route
        path="/support"
        element={
          <ProtectedRoute
            auth={supportAuth}
            roles={SUPPORT_ROLES}
            redirectTo="/support/login"
          >
            <SupportLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route
          path="dashboard"
          element={
            <PagePermissionGuard pageId="supportDashboard">
              <SupportDashboardPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="approvals"
          element={
            <PagePermissionGuard pageId="supportApprovals">
              <SupportVendorApprovalsPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="ads"
          element={
            <PagePermissionGuard pageId="supportAds">
              <SupportAdReviewPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="tickets"
          element={
            <PagePermissionGuard pageId="tickets">
              <SupportTicketsPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="admanager-requests"
          element={
            <PagePermissionGuard pageId="tickets">
              <SupportTicketsPage
                lockedSource="ADMANAGER"
                title="AdManager Requests"
                subtitle="Support requests raised from the AdManager portal"
              />
            </PagePermissionGuard>
          }
        />

        <Route
          path="circles"
          element={
            <PagePermissionGuard pageId="supportCircles">
              <PlaceholderPage title="Event Circles" />
            </PagePermissionGuard>
          }
        />

        <Route path="profile" element={<StaffProfilePage />} />
      </Route>

      {/* ── Finance Portal ── */}
      <Route path="/finance/login" element={<FinanceLoginPage />} />

      <Route
        path="/finance"
        element={
          <ProtectedRoute
            auth={financeAuth}
            roles={FINANCE_ROLES}
            redirectTo="/finance/login"
          >
            <FinanceLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route
          path="dashboard"
          element={
            <PagePermissionGuard pageId="financeDashboard">
              <FinanceDashboardPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="bookings"
          element={
            <PagePermissionGuard pageId="financeBookings">
              <VendorPaymentsPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="booking-payments"
          element={
            <PagePermissionGuard pageId="financeBookingPayments">
              <BookingPaymentsPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="commission"
          element={
            <PagePermissionGuard pageId="financeCommission">
              <FinanceCommissionsPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="recharge"
          element={
            <PagePermissionGuard pageId="financeRecharge">
              <RechargeManagementPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="settlements"
          element={
            <PagePermissionGuard pageId="financeSettlements">
              <PayoutsPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="refunds"
          element={
            <PagePermissionGuard pageId="financeRefunds">
              <FinanceRefundsPage />
            </PagePermissionGuard>
          }
        />

        <Route
          path="reports"
          element={
            <PagePermissionGuard pageId="financeReports">
              <FinanceReportsPage />
            </PagePermissionGuard>
          }
        />

        <Route path="profile" element={<StaffProfilePage />} />
      </Route>

      {/* ── AdManager Portal ── */}
      <Route path="/admanager/login" element={<AdManagerLoginPage />} />

      <Route
        path="/admanager"
        element={
          <ProtectedRoute
            auth={admanagerAuth}
            roles={ADMANAGER_ROLES}
            redirectTo="/admanager/login"
          >
            <AdManagerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<AdManagerDashboardPage />} />
        <Route path="create-ad" element={<AdManagerCreateAdPage />} />
        <Route path="ad-history" element={<AdManagerAdHistoryPage />} />
        <Route path="wallet" element={<AdManagerWalletPage />} />
        <Route path="preview" element={<AdManagerPreviewPage />} />
        <Route path="support" element={<AdManagerSupportPage />} />
        <Route path="profile" element={<AdManagerProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <FinanceAuthProvider>
        <SupportAuthProvider>
          <AdManagerAuthProvider>
            <AppRoutes />
          </AdManagerAuthProvider>
        </SupportAuthProvider>
      </FinanceAuthProvider>
    </AdminAuthProvider>
  );
}
