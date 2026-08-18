const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// Each portal keeps its own session so they can stay logged in simultaneously
// across browser tabs (e.g. Admin opens Support/Finance in new tabs without
// losing its own session). Centralized here as the single source of truth —
// the auth contexts import their key from this file rather than each other.
export const AUTH_STORAGE_KEY = 'jashanz_admin_auth'
export const SUPPORT_AUTH_STORAGE_KEY = 'jashanz_support_auth'
export const FINANCE_AUTH_STORAGE_KEY = 'jashanz_finance_auth'
export const ADMANAGER_AUTH_STORAGE_KEY = 'jashanz_admanager_auth'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// A single browser can have all 3 portal sessions active at once (different
// tabs), so which token applies depends on which portal's page is making the
// call, not just "whichever token exists" — resolved from the current path.
function currentAuthStorageKey() {
  const path = window.location.pathname
  if (path.startsWith('/support')) return SUPPORT_AUTH_STORAGE_KEY
  if (path.startsWith('/finance')) return FINANCE_AUTH_STORAGE_KEY
  if (path.startsWith('/admanager')) return ADMANAGER_AUTH_STORAGE_KEY
  return AUTH_STORAGE_KEY
}

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(currentAuthStorageKey())
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Zod validation errors arrive as a JSON-stringified array in `message`: [{ field, message }]
function parseErrorMessage(message) {
  if (typeof message !== 'string') return message
  if (message.startsWith('[')) {
    try {
      const fields = JSON.parse(message)
      if (Array.isArray(fields) && fields[0]?.message) {
        return fields.map(f => f.message).join(', ')
      }
    } catch {
      // not JSON, fall through
    }
  }
  return message
}

async function request(path, { method = 'GET', body, params, auth = true } = {}) {
  const url = new URL(API_BASE_URL.replace(/\/$/, '') + path)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
    })
  }

  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const stored = getStoredAuth()
    if (stored?.token) headers.Authorization = `Bearer ${stored.token}`
  }

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection.', 0, null)
  }

  let json = null
  try {
    json = await res.json()
  } catch {
    // no JSON body (e.g. 204)
  }

  if (!res.ok || json?.success === false) {
    throw new ApiError(parseErrorMessage(json?.message) || `Request failed (${res.status})`, res.status, json)
  }

  return json?.data
}

export const api = {
  get: (path, params) => request(path, { method: 'GET', params }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

/** Uploads a file directly to S3 using a presigned PUT URL obtained from the backend. */
export async function uploadToPresignedUrl(presignedUrl, file) {
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!res.ok) throw new ApiError('File upload failed', res.status, null)
}
