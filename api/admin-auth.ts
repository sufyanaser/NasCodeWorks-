type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  setHeader: (key: string, value: string) => void
}

type VercelRequest = {
  method?: string
  body?: { code?: string }
  headers?: { cookie?: string }
}

const COOKIE_NAME = 'nas_admin_session'
const ONE_DAY = 60 * 60 * 24

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getAdminCode() {
  return clean(process.env.ADMIN_ACCESS_CODE)
}

function getAuthSalt() {
  return clean(process.env.ADMIN_AUTH_SALT) || 'nas-codeworks-admin-v1'
}

async function makeSessionToken(code: string) {
  const input = new TextEncoder().encode(`${code}:${getAuthSalt()}`)
  const digest = await crypto.subtle.digest('SHA-256', input)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function getCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return ''

  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))

  if (!match) return ''

  try {
    return decodeURIComponent(match.slice(name.length + 1))
  } catch {
    return ''
  }
}

function cookieAttributes(maxAge: number) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
}

async function isAuthorized(req: VercelRequest) {
  const adminCode = getAdminCode()
  if (!adminCode) return false

  const cookieValue = getCookieValue(req.headers?.cookie, COOKIE_NAME)
  if (!cookieValue) return false

  return cookieValue === await makeSessionToken(adminCode)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).json(null)
  }

  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, authenticated: await isAuthorized(req), configured: Boolean(getAdminCode()) })
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; ${cookieAttributes(0)}`)
    return res.status(200).json({ ok: true, authenticated: false })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  const adminCode = getAdminCode()
  const submittedCode = clean(req.body?.code)

  if (!adminCode) {
    return res.status(503).json({ ok: false, message: 'ADMIN_ACCESS_CODE is not configured.' })
  }

  if (!submittedCode || submittedCode !== adminCode) {
    return res.status(401).json({ ok: false, message: 'Invalid admin access code.' })
  }

  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${await makeSessionToken(adminCode)}; ${cookieAttributes(ONE_DAY)}`)
  return res.status(200).json({ ok: true, authenticated: true })
}
