import { useState } from 'react'
import { Card, COIN_PACKS, MOCK_SPEND, fmtMoney, fmtDate, btnPrimary } from './shared'

const TYPE_STYLES = {
  'Ad Boost': 'bg-info/8 text-info',
  Purchase: 'bg-success/8 text-success',
  Referral: 'bg-brand/8 text-brand',
}

export default function WalletPage() {
  const [emailInvoice, setEmailInvoice] = useState(true)
  const [toast, setToast] = useState('')
  const flash = (t) => { setToast(t); setTimeout(() => setToast(''), 2600) }

  const AVAILABLE = 640
  const REFERRAL = 60

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Coin Wallet</h1>
        <p className="text-sm text-slate-500 mt-0.5">Coins fund your ads — 1 coin ≈ 10 interested customers</p>
      </div>

      {toast && <p className="text-sm text-slate-600 bg-slate-100 rounded-xl px-4 py-2.5">{toast}</p>}

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-info/8 rounded-2xl p-5">
          <p className="text-[11px] font-semibold text-info/80 uppercase tracking-wide">Available Coins</p>
          <p className="text-3xl font-black text-info mt-1">{AVAILABLE}</p>
          <p className="text-[11px] text-info/70 mt-1">Min 100 required to run an ad</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Referral Coins</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{REFERRAL}</p>
          <p className="text-[11px] text-slate-400 mt-1">Valid 30 days · cannot be withdrawn</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Conversion rate</p>
          <p className="text-lg font-black text-slate-800 mt-1">₹10 = 1 Coin</p>
          <p className="text-[11px] text-slate-400 mt-1">Set by Jashanz</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Buy coins */}
        <Card title="Buy Coins" sub="Secure payment via Razorpay / PayU">
          <div className="space-y-2">
            {COIN_PACKS.map(p => (
              <div key={p.coins} className={`flex items-center justify-between rounded-xl border px-3 py-3 ${p.popular ? 'border-info/40 bg-info/5' : 'border-slate-200'}`}>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{p.coins} coins {p.popular && <span className="ml-1 text-[10px] text-info font-bold">POPULAR</span>}</p>
                  <p className="text-[11px] text-slate-400">{fmtMoney(p.price)}</p>
                </div>
                <button onClick={() => flash(`Redirecting to payment for ${p.coins} coins — demo only.`)} className="bg-info text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:opacity-90">Buy</button>
              </div>
            ))}
          </div>
          <label className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2.5 mt-3 cursor-pointer">
            <span className="text-xs font-semibold text-slate-600">Email me the invoice</span>
            <button type="button" onClick={() => setEmailInvoice(v => !v)} className={`relative w-10 h-5 rounded-full transition-colors ${emailInvoice ? 'bg-info' : 'bg-slate-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${emailInvoice ? 'translate-x-5' : ''}`} />
            </button>
          </label>
        </Card>

        {/* Referral */}
        <Card title="Referral Coins" sub="Invite other vendors, earn coins">
          <p className="text-sm text-slate-500">Referral coins are auto-added to your wallet when an invited vendor upgrades to Premium.</p>
          <div className="mt-3 flex items-center gap-2">
            <input readOnly value="https://jashanz.com/refer/SALONVALA" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none" />
            <button onClick={() => flash('Invite link copied — demo.')} className="bg-slate-100 text-slate-600 rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-200">Copy</button>
          </div>
          <ul className="text-[11px] text-slate-400 mt-3 list-disc pl-4 space-y-1">
            <li>Valid for 30 days from credit</li>
            <li>Cannot be converted or withdrawn as cash</li>
          </ul>
        </Card>

        {/* Guidelines */}
        <Card title="Wallet Guidelines">
          <ul className="text-xs text-slate-500 list-disc pl-4 space-y-1.5">
            <li>Coins are strictly for ad spend.</li>
            <li>Purchased coins are non-refundable.</li>
            <li>No conversion or withdrawal to a bank account.</li>
            <li>Misuse results in banning of AdManager access.</li>
          </ul>
        </Card>
      </div>

      {/* Spend history */}
      <Card title="Coin Spend History" sub="Per transaction, linked to the Ad ID" action={<button onClick={() => flash('Exported — demo.')} className={btnPrimary}>Export</button>}>
        <div className="overflow-x-auto -m-5">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Date', 'Transaction', 'Ad ID', 'Description', 'Type', 'Coins'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_SPEND.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(t.date)}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{t.id}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{t.adId}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{t.adTitle}</td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${TYPE_STYLES[t.type] || 'bg-slate-100 text-slate-500'}`}>{t.type}</span></td>
                  <td className={`px-4 py-3 text-xs font-bold ${t.type === 'Purchase' || t.type === 'Referral' ? 'text-success' : 'text-slate-800'}`}>{t.type === 'Purchase' || t.type === 'Referral' ? '+' : '−'}{t.coins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
