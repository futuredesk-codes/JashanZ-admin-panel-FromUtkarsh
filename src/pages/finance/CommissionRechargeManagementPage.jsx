import CommissionsPage from './CommissionsPage'
import RechargeManagementPage from './RechargeManagementPage'

// Combines the Commission Manager and Recharge Management pages onto one
// screen so Finance staff can manage both without switching pages — purely
// a layout wrapper, each section is still the exact same component with the
// exact same functionality, data, and permission checks (financeCommission
// for the first section, financeRecharge for the second) it already had as
// its own standalone page.
export default function CommissionRechargeManagementPage() {
  return (
    <div className="space-y-10 pb-6">
      <CommissionsPage />
      <div className="border-t border-slate-200" />
      <RechargeManagementPage />
    </div>
  )
}
