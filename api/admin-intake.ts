type IntakeSubmissionRow = {
  id: string
  company: string
  contact: string | null
  problem_type: string | null
  description: string
  status: string
  created_at: string
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  setHeader: (key: string, value: string) => void
}

type VercelRequest = {
  method?: string
  body?: { id?: string; status?: string }
  query?: { id?: string }
  headers?: { cookie?: string }
}

const ADMIN_COOKIE_NAME = 'nas_admin_session'

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanUrl(value: unknown) {
  return clean(value).replace(/\/$/, '')
}

function getAuthSalt() {
  return clean(process.env.ADMIN_AUTH_SALT) || 'nas-codeworks-admin-v1'
}

function getCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return ''
  const match = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))
  if (!match) return ''

  try {
    return decodeURIComponent(match.slice(name.length + 1))
  } catch {
    return ''
  }
}

async function makeSessionToken(code: string) {
  const input = new TextEncoder().encode(`${code}:${getAuthSalt()}`)
  const digest = await crypto.subtle.digest('SHA-256', input)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function isAdminAuthorized(req: VercelRequest) {
  const adminCode = clean(process.env.ADMIN_ACCESS_CODE)
  if (!adminCode) return false
  return getCookieValue(req.headers?.cookie, ADMIN_COOKIE_NAME) === await makeSessionToken(adminCode)
}

function getSupabaseEnv() {
  const url = cleanUrl(process.env.SUPABASE_URL)
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  if (!url || !key) return null
  return { url, key }
}

function supabaseHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

async function listSubmissions() {
  const supabase = getSupabaseEnv()
  if (!supabase) return { ok: false, message: 'Supabase is not configured.', submissions: [] as IntakeSubmissionRow[] }

  const response = await fetch(`${supabase.url}/rest/v1/intake_submissions?select=*&order=created_at.desc&limit=50`, {
    headers: supabaseHeaders(supabase.key),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    return { ok: false, message, submissions: [] as IntakeSubmissionRow[] }
  }

  const submissions = await response.json() as IntakeSubmissionRow[]
  return { ok: true, submissions }
}

async function updateStatus(id: string, status: string) {
  const supabase = getSupabaseEnv()
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' }

  const allowed = ['new', 'in_review', 'in_progress', 'completed', 'archived']
  if (!allowed.includes(status)) return { ok: false, message: 'Invalid status.' }

  const response = await fetch(`${supabase.url}/rest/v1/intake_submissions?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { ...supabaseHeaders(supabase.key), Prefer: 'return=minimal' },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    return { ok: false, message }
  }

  return { ok: true, message: 'Status updated.' }
}

async function deleteSubmission(id: string) {
  const supabase = getSupabaseEnv()
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' }

  const response = await fetch(`${supabase.url}/rest/v1/intake_submissions?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { ...supabaseHeaders(supabase.key), Prefer: 'return=minimal' },
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    return { ok: false, message }
  }

  return { ok: true, message: 'Submission deleted.' }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).json(null)

  if (!await isAdminAuthorized(req)) {
    return res.status(401).json({ ok: false, message: 'Admin authentication required.' })
  }

  if (req.method === 'GET') {
    const result = await listSubmissions()
    return res.status(result.ok ? 200 : 503).json(result)
  }

  if (req.method === 'PATCH') {
    const id = clean(req.body?.id)
    const status = clean(req.body?.status)
    if (!id || !status) return res.status(400).json({ ok: false, message: 'id and status are required.' })
    const result = await updateStatus(id, status)
    return res.status(result.ok ? 200 : 503).json(result)
  }

  if (req.method === 'DELETE') {
    const id = clean(req.body?.id || req.query?.id)
    if (!id) return res.status(400).json({ ok: false, message: 'id is required.' })
    const result = await deleteSubmission(id)
    return res.status(result.ok ? 200 : 503).json(result)
  }

  return res.status(405).json({ ok: false, message: 'Method not allowed' })
}
