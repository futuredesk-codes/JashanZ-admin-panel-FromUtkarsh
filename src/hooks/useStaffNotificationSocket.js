import { useEffect, useRef } from 'react'
import { connectStaffSocket } from '../utils/staffSocket'

/** Live delivery for staff notifications (vendor registered, ad created,
 * new support ticket) — the backend emits 'notification:new' to a staff
 * member's own per-user room (not the shared 'staff' room, since a
 * notification has one specific recipient) whenever notifyStaffForPage
 * creates one for them. Mirrors useBusinessStatusSocket/useAdStatusSocket's
 * shape (see those files). */
export function useStaffNotificationSocket({ onNewNotification }) {
  const onNewNotificationRef = useRef(onNewNotification)
  useEffect(() => { onNewNotificationRef.current = onNewNotification }, [onNewNotification])

  useEffect(() => {
    const socket = connectStaffSocket()

    socket.on('notification:new', (notification) => {
      onNewNotificationRef.current?.(notification)
    })

    return () => socket.disconnect()
  }, [])
}
