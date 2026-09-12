import { useRef, useCallback } from 'react'

const SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js'
// Matches the backend's CASHFREE_ENV (SANDBOX while using test-mode keys) —
// must flip to 'production' together with switching to live keys server-side.
const MODE = 'sandbox'

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
