const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

export const AUTH_STORAGE_KEY = 'jashanz_admin_auth'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
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
