import { useEffect, useRef } from 'react'
import { connectStaffSocket } from '../utils/staffSocket'

/** Live cross-portal sync for ad moderation: when either Admin's Ad Review
 * page or Support's Ad Review & Moderation page approves/rejects/pauses/
 * resumes an ad, this fires on every other open staff tab so they patch the
 * row in place instead of needing a manual refresh. Mirrors
 * useBusinessStatusSocket's shape (see that file). */
export function useAdStatusSocket({ onStatusChanged }) {
  const onStatusChangedRef = useRef(onStatusChanged)
  useEffect(() => { onStatusChangedRef.current = onStatusChanged }, [onStatusChanged])

  useEffect(() => {
    const socket = connectStaffSocket()

    socket.on('ad:status-changed', (payload) => {
      onStatusChangedRef.current?.(payload)
    })

    return () => socket.disconnect()
  }, [])
}
