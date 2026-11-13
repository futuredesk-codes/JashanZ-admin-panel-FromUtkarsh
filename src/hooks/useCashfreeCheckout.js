import { useRef, useCallback } from 'react'

const SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js'
// Must match the backend's CASHFREE_ENV: a payment session made by a server on live keys only works in
// Cashfree's 'production' checkout, and a test-mode session only in 'sandbox'. A mismatch shows up as
// "payment_session_id is not present or is invalid".
// The live site talks to https://api.jashanz.com, which runs on live keys, so that API means 'production';
// any other API (local development) stays 'sandbox'. VITE_CASHFREE_MODE=production|sandbox overrides it,
// e.g. to try the live API from a local build.
const API_URL = import.meta.env.VITE_API_URL || ''
const MODE_OVERRIDE = import.meta.env.VITE_CASHFREE_MODE
const MODE = MODE_OVERRIDE
  ? MODE_OVERRIDE === 'production' ? 'production' : 'sandbox'
  : /^https:\/\/api\.jashanz\.com(\/|$)/.test(API_URL) ? 'production' : 'sandbox'

let sdkLoadPromise = null

function loadSdk() {
  if (window.Cashfree) return Promise.resolve(window.Cashfree)
  if (sdkLoadPromise) return sdkLoadPromise

  sdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SDK_URL
    script.async = true
    script.onload = () => resolve(window.Cashfree)
    script.onerror = () => {
      sdkLoadPromise = null
      reject(new Error('Could not load the payment SDK. Check your connection and try again.'))
    }
    document.head.appendChild(script)
  })
  return sdkLoadPromise
}

/**
 * Opens Cashfree's Drop-in Checkout in a modal for the given payment session,
 * resolving once the modal closes (Cashfree's SDK doesn't distinguish
 * success/failure/cancel at this layer — the caller must always follow up
 * with the backend's verify-payment endpoint, which checks the order's real
 * status server-side, to find out what actually happened).
 */
export function useCashfreeCheckout() {
  const cashfreeRef = useRef(null)

  const checkout = useCallback(async (paymentSessionId) => {
    const Cashfree = await loadSdk()
    if (!cashfreeRef.current) {
      cashfreeRef.current = Cashfree({ mode: MODE })
    }
    return cashfreeRef.current.checkout({
      paymentSessionId,
      redirectTarget: '_modal',
    })
  }, [])

  return { checkout }
}
