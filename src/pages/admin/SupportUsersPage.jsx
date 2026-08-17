import StaffUsersPage from '../../components/StaffUsersPage'

const ROLES = [
  { value: 'SUPPORT_AGENT', label: 'Support Agent', description: 'Handles tickets and vendor approvals', badgeClass: 'bg-info/8 text-info' },
  { value: 'SUPPORT_LEAD', label: 'Support Lead', description: 'Full support portal access, can assign tickets', badgeClass: 'bg-success/8 text-success' },
]

export default function SupportUsersPage() {
  return (
    <StaffUsersPage
      title="Support Users"
      subtitle="Manage who has access to the Support Portal"
      entityLabel="Support User"
      roles={ROLES}
      createRole="SUPPORT_AGENT"
    />
  )
}
