import { defaultContent, type SiteContent } from '../src/content'

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  setHeader: (key: string, value: string) => void
}

type VercelRequest = {
  method?: string
  body?: SiteContent
}

type SupabaseContentRow = {
  content_json: SiteContent
}

const CONTENT_KEY = 'main'

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\/$/, '') : ''
}

function getSupabaseEnv() {
  const url = clean(process.env.SUPABASE_URL)
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!url || !key) {
    return null
  }

  return { url, key }
}

function supabaseHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
}

async function loadContent() {
  const supabase = getSupabaseEnv()

  if (!supabase) {
    return { ok: false, source: 'default', content: defaultContent, message: 'Supabase is not configured.' }
  }

  const response = await fetch(`${supabase.url}/rest/v1/site_content?key=eq.${CONTENT_KEY}&select=content_json&limit=1`, {
    headers: supabaseHeaders(supabase.key),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    return { ok: false, source: 'default', content: defaultContent, message }
  }

  const rows = await response.json() as SupabaseContentRow[]
  const content = rows[0]?.content_json ?? defaultContent

  return { ok: true, source: rows[0] ? 'supabase' : 'default', content }
}

async function saveContent(content: SiteContent) {
  const supabase = getSupabaseEnv()

  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch(`${supabase.url}/rest/v1/site_content?on_conflict=key`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(supabase.key),
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      key: CONTENT_KEY,
      content_json: content,
      updated_at: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    return { ok: false, message }
  }

  return { ok: true, message: 'Content saved to Supabase.' }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).json(null)
  }

  if (req.method === 'GET') {
    const result = await loadContent()
    return res.status(result.ok ? 200 : 503).json(result)
  }

  if (req.method === 'PUT') {
    const content = req.body

    if (!content || typeof content !== 'object') {
      return res.status(400).json({ ok: false, message: 'Content body is required.' })
    }

    const result = await saveContent(content)
    return res.status(result.ok ? 200 : 503).json(result)
  }

  return res.status(405).json({ ok: false, message: 'Method not allowed' })
}
