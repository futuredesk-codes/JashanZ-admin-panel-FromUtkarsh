import { createPortalAuthContext } from './createPortalAuthContext'
import { ADMANAGER_AUTH_STORAGE_KEY } from '../api/client'

const { Provider, useAuth } = createPortalAuthContext(ADMANAGER_AUTH_STORAGE_KEY)

export const AdManagerAuthProvider = Provider
export const useAdManagerAuth = useAuth
