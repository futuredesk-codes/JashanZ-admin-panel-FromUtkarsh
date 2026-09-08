import { createPortalAuthContext } from './createPortalAuthContext'
import { SUPPORT_AUTH_STORAGE_KEY } from '../api/client'

const { Provider, useAuth } = createPortalAuthContext(SUPPORT_AUTH_STORAGE_KEY)

export const SupportAuthProvider = Provider
// useSupportAuth is imported alongside SupportAuthProvider from this same
// file across the app; splitting it into its own file would mean updating
// every one of those import sites for a fast-refresh-only concern, not a
// correctness one.
// eslint-disable-next-line react-refresh/only-export-components
export const useSupportAuth = useAuth
