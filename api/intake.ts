type IntakePayload = {
  company?: string
  contact?: string
  problemType?: string
  description?: string
  recipientEmail?: string
  subjectPrefix?: string
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  setHeader: (key: string, value: string) => void
}

type VercelRequest = {
  method?: string
  body?: IntakePayload
}

const RESEND_API_URL = 'https://api.resend.com/emails'

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).json(null)
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
  const fromEmail = clean(process.env.NAS_INTAKE_FROM) || 'NAS CodeWorks <onboarding@resend.dev>'
  const resendApiKey = clean(process.env.RESEND_API_KEY)

  if (!company || !description) {
    return res.status(400).json({ ok: false, message: 'Company and problem description are required.' })
  }

  if (!isEmail(recipientEmail)) {
    return res.status(400).json({ ok: false, message: 'Recipient email is missing or invalid.' })
  }

  if (!resendApiKey) {
    return res.status(500).json({ ok: false, message: 'RESEND_API_KEY is not configured.' })
  }

  const subject = `${subjectPrefix}: ${company}`
  const text = [
    'New NAS CodeWorks intake submission',
    '',
    `Company: ${company}`,
    `Contact: ${contact || 'Not provided'}`,
    `Problem type: ${problemType}`,
    '',
    'Problem description:',
    description,
  ].join('\n')

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: recipientEmail,
      subject,
      text,
    }),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    return res.status(502).json({ ok: false, message })
  }

  return res.status(200).json({ ok: true, message: 'Email sent.' })
}
