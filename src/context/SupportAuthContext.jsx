import { createPortalAuthContext } from './createPortalAuthContext'
import { SUPPORT_AUTH_STORAGE_KEY } from '../api/client'

const { Provider, useAuth } = createPortalAuthContext(SUPPORT_AUTH_STORAGE_KEY)

export const SupportAuthProvider = Provider
export const useSupportAuth = useAuth
