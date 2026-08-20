import { createPortalAuthContext } from './createPortalAuthContext'
import { FINANCE_AUTH_STORAGE_KEY } from '../api/client'

const { Provider, useAuth } = createPortalAuthContext(FINANCE_AUTH_STORAGE_KEY)

export const FinanceAuthProvider = Provider
export const useFinanceAuth = useAuth
