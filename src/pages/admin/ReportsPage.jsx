import { useState } from 'react'

/* ── Report sections ── */
const REPORT_SECTIONS = [
  {
    key: 'users',
    title: 'User Reports',
    colorClass: 'bg-brand/8 text-brand',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    reports: [
      {name:'Customer Registrations Report', desc:'New customer signups by date range and city'},
      {name:'Customer Activity Report', desc:'Active vs inactive customer metrics and engagement'},
      {name:'Suspended Accounts Report', desc:'All suspended and banned accounts with reasons'},
    ],
  },
  {
    key: 'businesses',
    title: 'Business Reports',
    colorClass: 'bg-success/8 text-success',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    reports: [
      {name:'Vendor Registration Report', desc:'All registered vendors with status breakdown'},
      {name:'Approved Vendors Report', desc:'Active approved businesses by category and city'},
      {name:'Category-wise Vendor Report', desc:'Vendor distribution across all service categories'},
      {name:'City-wise Vendor Report', desc:'Geographic distribution of vendors across cities'},
    ],
  },
  {
    key: 'revenue',
    title: 'Booking & Revenue Reports',
    colorClass: 'bg-warning/8 text-warning',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
    reports: [
      {name:'Booking Summary Report', desc:'Total bookings with status breakdown and trends'},
      {name:'Commission Revenue Report', desc:'Platform commission earnings by category and period'},
      {name:'Recharge Revenue Report', desc:'Vendor wallet recharge transactions and totals'},
      {name:'Settlement Report', desc:'Completed vendor settlements and pending amounts'},
      {name:'Refund Report', desc:'All refund transactions with reasons and statuses'},
    ],
  },
  {
    key: 'support',
    title: 'Support Reports',
    colorClass: 'bg-info/8 text-info',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 7.81 19.79 19.79 0 01.63 2.18 2 2 0 012.62.01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.6a16 16 0 006.29 6.29l.96-.96a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
    reports: [
      {name:'Vendor Approval Report', desc:'Approval and rejection summary for vendor onboarding'},
      {name:'Ticket Summary Report', desc:'Support ticket volume, status, and resolution times'},
      {name:'Escalated Tickets Report', desc:'Tickets escalated beyond first-level support'},
    ],
  },
]

/* ── Icons ── */
const IconDownload = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const IconCalendar = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>

/* ── Report Card ── */
function ReportCard({ report }) {
  const [generating, setGenerating] = useState(null)
  const handleDownload = (format) => {
    setGenerating(format)
    setTimeout(() => setGenerating(null), 1200)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
      <div className="mb-3">
        <p className="font-bold text-slate-800 text-sm leading-tight mb-1">{report.name}</p>
        <p className="text-xs text-slate-400 leading-snug">{report.desc}</p>
      </div>
      <div className="flex items-center gap-1.5 mt-4">
        {['CSV','Excel','PDF'].map(fmt => {
          const styles = {
            CSV:   'bg-success/8 text-success hover:bg-success/15',
            Excel: 'bg-info/8 text-info hover:bg-info/15',
            PDF:   'bg-danger/8 text-danger hover:bg-danger/15',
          }
          return (
            <button
              key={fmt}
              onClick={() => handleDownload(fmt)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${styles[fmt]} ${generating===fmt ? 'opacity-60' : ''}`}
            >
              {generating===fmt ? (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                  {fmt}
                </span>
              ) : (
                <><IconDownload />{fmt}</>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function ReportsPage() {
  const [fromDate, setFromDate] = useState('2024-01-01')
  const [toDate, setToDate] = useState('2024-06-16')
  const [generating, setGenerating] = useState(false)

  const handleGenerateAll = () => {
    setGenerating(true)
    setTimeout(() => setGenerating(false), 2000)
  }

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Generate and download platform reports in CSV, Excel or PDF format</p>
      </div>

      {/* Date range filter */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-slate-500">
          <IconCalendar />
          <span className="text-xs font-semibold text-slate-500">Date Range</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">From</span>
          <input
            type="date"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">To</span>
          <input
            type="date"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-brand/20"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </div>
        <div className="ml-auto">
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            className="bg-brand text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-brand/90 disabled:opacity-60 transition-opacity"
          >
            {generating ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                Generating...
              </>
            ) : (
              <>
                <IconDownload />
                Generate All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report sections */}
      {REPORT_SECTIONS.map(section => (
        <div key={section.key}>
          {/* Section header */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`w-8 h-8 rounded-xl ${section.colorClass} flex items-center justify-center`}>
              {section.icon}
            </div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">{section.title}</h2>
            <span className="text-xs text-slate-400 font-semibold">({section.reports.length} reports)</span>
          </div>

          {/* Report cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.reports.map(report => (
              <ReportCard key={report.name} report={report} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
