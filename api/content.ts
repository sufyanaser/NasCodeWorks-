type SiteContent = {
  brand: {
    name: string
    tagline: string
    adminNote: string
  }
  cta: {
    primary: string
    secondary: string
  }
  hero: {
    eyebrow: string
    title: string
    body: string
  }
  sections: Array<{
    id: string
    title: string
    body: string
  }>
  services: Array<{
    title: string
    price: string
    body: string
  }>
  intake: {
    recipientEmail: string
    subjectPrefix: string
    successMessage: string
    failureMessage: string
  }
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  setHeader: (key: string, value: string) => void
}

type VercelRequest = {
  method?: string
  body?: SiteContent
  headers?: { cookie?: string }
}

type SupabaseContentRow = {
  content_json: SiteContent
}

const CONTENT_KEY = 'main'
const ADMIN_COOKIE_NAME = 'nas_admin_session'

const defaultContent: SiteContent = {
  brand: {
    name: 'NAS CodeWorks',
    tagline: 'أدوات تشغيلية مخصصة للشركات العراقية',
    adminNote: 'لوحة التحكم تتحكم بالنصوص العامة ورسائل نموذج المشكلة وبريد الاستلام.',
  },
  cta: {
    primary: 'ابدأ بوصف المشكلة الحالية',
    secondary: 'راجع مسارات الحل',
  },
  hero: {
    eyebrow: 'Operational Problem-Solving Studio',
    title: 'حوّل فوضى العمل اليومي إلى أداة واضحة يمكن إدارتها',
    body: 'NAS CodeWorks يساعد الشركات العراقية على تقليل Excel المتناثر، الرسائل المتفرقة، التقارير المتأخرة، والعمل اليدوي المتكرر من خلال أدوات عربية مخصصة لطريقة العمل الفعلية.',
  },
  sections: [
    {
      id: 'problem',
      title: 'نبدأ من المشكلة، لا من اسم البرنامج',
      body: 'الخطوة الأولى هي فهم أين يتعطل العمل: أين تضيع المعلومة، أين يتكرر الإدخال، وأين تتأخر المتابعة أو التقارير.',
    },
    {
      id: 'center',
      title: 'نبني مركز رؤية تشغيلي',
      body: 'نربط الملفات، الأشخاص، التقارير، والمهام داخل مسار واضح بدلاً من تركها موزعة بين Excel وWhatsApp والورق.',
    },
    {
      id: 'scope',
      title: 'نطاق واضح قبل التنفيذ',
      body: 'لا يبدأ التنفيذ قبل تحديد ما سيتم بناؤه، وما الذي لن يدخل ضمن المرحلة الحالية، وما النتيجة التشغيلية المطلوبة.',
    },
  ],
  services: [
    {
      title: 'تطبيقات سطح مكتب مخصصة للشركات',
      price: 'تبدأ من 500 دولار',
      body: 'أدوات داخلية عربية لتنظيم عمليات يومية لا يناسبها Excel أو برنامج جاهز.',
    },
    {
      title: 'أنظمة أرشفة وإدارة ملفات داخلية',
      price: 'تبدأ من 900 دولار',
      body: 'تنظيم المستندات والعملاء والمشاريع والمعاملات بطريقة قابلة للبحث والمتابعة.',
    },
    {
      title: 'أتمتة التقارير وربط البيانات',
      price: 'يحدد بعد فهم النطاق',
      body: 'تقليل جمع الأرقام يدوياً وربط مصادر البيانات لإنتاج رؤية أوضح للإدارة.',
    },
  ],
  intake: {
    recipientEmail: '',
    subjectPrefix: 'NAS CodeWorks Intake',
    successMessage: 'تم استلام وصف المشكلة وإرسال إشعار إلى البريد المحدد.',
    failureMessage: 'تعذر إرسال الإشعار الآن. راجع إعدادات البريد أو حاول لاحقاً.',
  },
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\/$/, '') : ''
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
    if (!await isAdminAuthorized(req)) {
      return res.status(401).json({ ok: false, message: 'Admin authentication required.' })
    }

    const content = req.body

    if (!content || typeof content !== 'object') {
      return res.status(400).json({ ok: false, message: 'Content body is required.' })
    }

    const result = await saveContent(content)
    return res.status(result.ok ? 200 : 503).json(result)
  }

  return res.status(405).json({ ok: false, message: 'Method not allowed' })
}
