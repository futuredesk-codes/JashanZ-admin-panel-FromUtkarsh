import { createPortalAuthContext } from './createPortalAuthContext'
import { FINANCE_AUTH_STORAGE_KEY } from '../api/client'

const { Provider, useAuth } = createPortalAuthContext(FINANCE_AUTH_STORAGE_KEY)

export const FinanceAuthProvider = Provider
// useFinanceAuth is imported alongside FinanceAuthProvider from this same
// file across the app; splitting it into its own file would mean updating
// every one of those import sites for a fast-refresh-only concern, not a
// correctness one.
// eslint-disable-next-line react-refresh/only-export-components
export const useFinanceAuth = useAuth
