type IntakePayload = {
  company?: string
  contact?: string
  problemType?: string
  description?: string
  recipientEmail?: string
  subjectPrefix?: string
}

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
  body?: IntakePayload & { id?: string; status?: string }
  query?: { id?: string }
}

const RESEND_API_URL = 'https://api.resend.com/emails'

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanUrl(value: unknown) {
  return clean(value).replace(/\/$/, '')
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
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

async function listIntakeSubmissions() {
  const supabase = getSupabaseEnv()

  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.', submissions: [] as IntakeSubmissionRow[] }
  }

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

async function updateIntakeStatus(id: string, status: string) {
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

async function deleteIntakeSubmission(id: string) {
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
async function saveIntakeSubmission(input: { company: string; contact: string; problemType: string; description: string }) {
  const supabase = getSupabaseEnv()

  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' }
  }

  const response = await fetch(`${supabase.url}/rest/v1/intake_submissions`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders(supabase.key),
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      company: input.company,
      contact: input.contact,
      problem_type: input.problemType,
      description: input.description,
      status: 'new',
      created_at: new Date().toISOString(),
    }),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    return { ok: false, message }
  }

  return { ok: true, message: 'Saved to Supabase.' }
}

async function sendEmail(input: { company: string; contact: string; problemType: string; description: string; recipientEmail: string; subjectPrefix: string }) {
  const fromEmail = clean(process.env.NAS_INTAKE_FROM) || 'NAS CodeWorks <onboarding@resend.dev>'
  const resendApiKey = clean(process.env.RESEND_API_KEY)

  if (!input.recipientEmail) {
    return { ok: false, skipped: true, message: 'Recipient email is not configured.' }
  }

  if (!isEmail(input.recipientEmail)) {
    return { ok: false, skipped: true, message: 'Recipient email is invalid.' }
  }

  if (!resendApiKey) {
    return { ok: false, skipped: true, message: 'RESEND_API_KEY is not configured.' }
  }

  const subject = `${input.subjectPrefix}: ${input.company}`
  const text = [
    'New NAS CodeWorks intake submission',
    '',
    `Company: ${input.company}`,
    `Contact: ${input.contact || 'Not provided'}`,
    `Problem type: ${input.problemType}`,
    '',
    'Problem description:',
    input.description,
  ].join('\n')

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: input.recipientEmail,
      subject,
      text,
    }),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    return { ok: false, message }
  }

  return { ok: true, message: 'Email sent.' }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).json(null)
  }

  if (req.method === 'GET') {
    const result = await listIntakeSubmissions()
    return res.status(result.ok ? 200 : 503).json(result)
  }

  if (req.method === 'PATCH') {
    const id = clean(req.body?.id)
    const status = clean(req.body?.status)
    if (!id || !status) return res.status(400).json({ ok: false, message: 'id and status are required.' })
    const result = await updateIntakeStatus(id, status)
    return res.status(result.ok ? 200 : 503).json(result)
  }

  if (req.method === 'DELETE') {
    const id = clean(req.body?.id || req.query?.id)
    if (!id) return res.status(400).json({ ok: false, message: 'id is required.' })
    const result = await deleteIntakeSubmission(id)
    return res.status(result.ok ? 200 : 503).json(result)
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' })
  }

  const payload = req.body ?? {}
  const company = clean(payload.company)
  const contact = clean(payload.contact)
  const problemType = clean(payload.problemType) || 'غير محدد'
  const description = clean(payload.description)
  const configuredRecipient = clean(process.env.NAS_INTAKE_TO)
  const requestedRecipient = clean(payload.recipientEmail)
  const recipientEmail = configuredRecipient || requestedRecipient
  const subjectPrefix = clean(payload.subjectPrefix) || 'NAS CodeWorks Intake'

  if (!company || !description) {
    return res.status(400).json({ ok: false, message: 'Company and problem description are required.' })
  }

  const storage = await saveIntakeSubmission({ company, contact, problemType, description })

  if (!storage.ok) {
    return res.status(502).json({ ok: false, message: storage.message, storage })
  }

  const email = await sendEmail({ company, contact, problemType, description, recipientEmail, subjectPrefix })

  return res.status(200).json({
    ok: true,
    message: email.ok ? 'Intake saved and email sent.' : 'Intake saved. Email notification skipped or failed.',
    storage,
    email,
  })
}

