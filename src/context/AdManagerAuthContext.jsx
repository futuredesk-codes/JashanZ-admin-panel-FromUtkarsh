import { createPortalAuthContext } from './createPortalAuthContext'
import { ADMANAGER_AUTH_STORAGE_KEY } from '../api/client'

const { Provider, useAuth } = createPortalAuthContext(ADMANAGER_AUTH_STORAGE_KEY)

export const AdManagerAuthProvider = Provider
// useAdManagerAuth is imported alongside AdManagerAuthProvider from this same
// file across the app; splitting it into its own file would mean updating
// every one of those import sites for a fast-refresh-only concern, not a
// correctness one.
// eslint-disable-next-line react-refresh/only-export-components
export const useAdManagerAuth = useAuth
