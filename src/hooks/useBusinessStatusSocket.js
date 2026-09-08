import { useEffect, useRef } from 'react'
import { connectStaffSocket } from '../utils/staffSocket'

/** Live cross-portal sync for vendor approve/reject: when either the Admin
 * Businesses page or Support's Vendor Approvals page changes a business's
 * status, this fires on every other open staff tab so they patch the row in
 * place instead of needing a manual refresh to see the other portal's
 * action. */
export function useBusinessStatusSocket({ onStatusChanged }) {
  const onStatusChangedRef = useRef(onStatusChanged)
  useEffect(() => { onStatusChangedRef.current = onStatusChanged }, [onStatusChanged])

  useEffect(() => {
    const socket = connectStaffSocket()

    socket.on('business:status-changed', (payload) => {
      onStatusChangedRef.current?.(payload)
    })

    return () => socket.disconnect()
  }, [])
}
