import { useState, useEffect, useCallback } from 'react'
import { Card, fmtMoney, fmtDate } from './shared'
import {
  getAdManagerWallet,
  getAdManagerCoinPacks,
  createAdManagerRechargeOrder,
  verifyAdManagerRechargePayment,
  createAdManagerCustomRechargeOrder,
  verifyAdManagerCustomRechargePayment,
} from '../../api/admanager'
import { useCashfreeCheckout } from '../../hooks/useCashfreeCheckout'
import { ApiError } from '../../api/client'

const MIN_CUSTOM_COINS = 100

const TYPE_LABEL = {
  CREDIT_PURCHASE: 'Purchase',
  CREDIT_REFERRAL: 'Referral',
  DEBIT_BOOST: 'Ad Boost',
  DEBIT_LEAD_UNLOCK: 'Lead Unlock',
}
const TYPE_STYLES = {
  CREDIT_PURCHASE: 'bg-success/8 text-success',
  CREDIT_REFERRAL: 'bg-brand/8 text-brand',
  DEBIT_BOOST: 'bg-info/8 text-info',
  DEBIT_LEAD_UNLOCK: 'bg-warning/8 text-warning',
}
const isCredit = (type) => type === 'CREDIT_PURCHASE' || type === 'CREDIT_REFERRAL'

export default function WalletPage() {
  const { checkout } = useCashfreeCheckout()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [packs, setPacks] = useState([])
  const [coinPricePaise, setCoinPricePaise] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buyingPackId, setBuyingPackId] = useState(null)
  const [customCoins, setCustomCoins] = useState('')
  const [buyingCustom, setBuyingCustom] = useState(false)
  const [error, setError] = useState('')

  const loadWallet = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [walletData, packsData] = await Promise.all([
        getAdManagerWallet(),
        getAdManagerCoinPacks(),
      ])
      setWallet(walletData.wallet)
      setTransactions(walletData.recentTransactions || [])
      setPacks(packsData.packs || [])
      setCoinPricePaise(packsData.coinPricePaise ?? null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load wallet.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadWallet's own setState calls are the fetch-on-mount trigger, not a derived-render value
    loadWallet()
  }, [loadWallet])

  const handleBuy = async (pack) => {
    if (buyingPackId) return
    setBuyingPackId(pack._id)
    setError('')
    try {
      const order = await createAdManagerRechargeOrder(pack._id)
      await checkout(order.paymentSessionId)
      await verifyAdManagerRechargePayment(pack._id, order.razorpayOrderId)
      await loadWallet()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Payment could not be completed.')
    } finally {
      setBuyingPackId(null)
    }
  }

  const customCoinsNum = Number(customCoins)
  const customPriceRupees = coinPricePaise != null ? (customCoinsNum * coinPricePaise) / 100 : null
  const canBuyCustom = customCoins !== '' && customCoinsNum >= MIN_CUSTOM_COINS && !buyingCustom

  const handleBuyCustom = async () => {
    if (!canBuyCustom) return
    setBuyingCustom(true)
    setError('')
    try {
      const order = await createAdManagerCustomRechargeOrder(customCoinsNum)
      await checkout(order.paymentSessionId)
      await verifyAdManagerCustomRechargePayment(customCoinsNum, order.razorpayOrderId)
      setCustomCoins('')
      await loadWallet()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Payment could not be completed.')
    } finally {
      setBuyingCustom(false)
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Coin Wallet</h1>
        <p className="text-sm text-slate-500 mt-0.5">Coins fund your ads — 1 coin funds 1 impression shown to a customer</p>
      </div>

      {error && <p className="text-sm text-danger font-semibold bg-danger/5 border border-danger/20 rounded-xl px-4 py-2.5">{error}</p>}

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-info/8 rounded-2xl p-5">
          <p className="text-[11px] font-semibold text-info/80 uppercase tracking-wide">Available Coins</p>
          <p className="text-3xl font-black text-info mt-1">{loading ? '…' : (wallet?.coins ?? 0)}</p>
          <p className="text-[11px] text-info/70 mt-1">Min 100 required to run an ad</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Referral Coins</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{loading ? '…' : (wallet?.referralCoins ?? 0)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Cannot be withdrawn</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Total Coins</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{loading ? '…' : (wallet?.totalCoins ?? 0)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Available + referral</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Buy coins */}
        <div className="lg:col-span-2">
          <Card title="Buy Coins" sub="Secure payment via Cashfree">
            {loading ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : packs.length === 0 ? (
              <p className="text-sm text-slate-400">No coin packs available right now.</p>
            ) : (
              <div className="space-y-2">
                {packs.map(p => (
                  <div key={p._id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                      <p className="text-[11px] text-slate-400">{p.coins} coins · {fmtMoney(p.price)}</p>
                    </div>
                    <button
                      onClick={() => handleBuy(p)}
                      disabled={buyingPackId === p._id}
                      className="bg-info text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:opacity-90 disabled:opacity-50"
                    >
                      {buyingPackId === p._id ? 'Processing…' : 'Buy'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!loading && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-700 mb-2">Or buy a custom amount</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    min={MIN_CUSTOM_COINS}
                    step={10}
                    placeholder={`e.g. 250 (min ${MIN_CUSTOM_COINS})`}
                    value={customCoins}
                    onChange={e => setCustomCoins(e.target.value)}
                    className="flex-1 min-w-35 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-info/20"
                  />
                  <button
                    onClick={handleBuyCustom}
                    disabled={!canBuyCustom}
                    className="bg-info text-white rounded-lg px-4 py-2.5 text-xs font-bold hover:opacity-90 disabled:opacity-40"
                  >
                    {buyingCustom ? 'Processing…' : 'Buy'}
                  </button>
                </div>
                {customCoins !== '' && customCoinsNum < MIN_CUSTOM_COINS ? (
                  <p className="text-[11px] text-danger font-semibold mt-1.5">Minimum {MIN_CUSTOM_COINS} coins.</p>
                ) : customPriceRupees != null && customCoinsNum >= MIN_CUSTOM_COINS ? (
                  <p className="text-[11px] text-slate-400 mt-1.5">= {fmtMoney(customPriceRupees)}</p>
                ) : null}
              </div>
            )}
          </Card>
        </div>

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
      <Card title="Coin Transaction History" sub="Most recent 20 transactions">
        <div className="overflow-x-auto -m-5">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/70 border-b border-slate-100">
              <tr>
                {['Date', 'Description', 'Type', 'Coins'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400 text-sm">Loading…</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400 text-sm">No transactions yet</td></tr>
              ) : transactions.map((t, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(t.createdAt)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{t.meta?.reason || t.meta?.subscriptionPlan || TYPE_LABEL[t.type] || t.type}</td>
                  <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${TYPE_STYLES[t.type] || 'bg-slate-100 text-slate-500'}`}>{TYPE_LABEL[t.type] || t.type}</span></td>
                  <td className={`px-4 py-3 text-xs font-bold ${isCredit(t.type) ? 'text-success' : 'text-slate-800'}`}>{isCredit(t.type) ? '+' : '−'}{t.coins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
