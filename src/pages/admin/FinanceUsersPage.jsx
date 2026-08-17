import StaffUsersPage from '../../components/StaffUsersPage'

const ROLES = [
  { value: 'FINANCE_STAFF', label: 'Finance Staff', description: 'Processes settlements, refunds, and recharges', badgeClass: 'bg-info/8 text-info' },
  { value: 'FINANCE_ADMIN', label: 'Finance Admin', description: 'Full finance portal access, including commission config', badgeClass: 'bg-warning/8 text-warning' },
]

export default function FinanceUsersPage() {
  return (
    <StaffUsersPage
      title="Finance Users"
      subtitle="Manage who has access to the Finance Portal"
      entityLabel="Finance User"
      roles={ROLES}
      createRole="FINANCE_STAFF"
    />
  )
}
