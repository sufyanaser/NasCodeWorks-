import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CONTENT_STORAGE_KEY, defaultContent, type SiteContent } from './content'

type IntakeForm = {
  company: string
  contact: string
  problemType: string
  description: string
}

type LeadForm = {
  name: string
  company: string
  type: string
  message: string
}

type IntakeSubmission = {
  id: string
  company: string
  contact: string | null
  problem_type: string | null
  description: string
  status: string
  created_at: string
}

type ViewMode = 'site' | 'admin'
type AdminSection = 'content' | 'intake' | 'requests'
type SubmitState = 'idle' | 'sending' | 'success' | 'error'
type AdminAuthState = 'checking' | 'authenticated' | 'anonymous'

type ContentApiResult = {
  ok: boolean
  content?: SiteContent
  message?: string
  source?: string
}

type IntakeApiResult = {
  ok: boolean
  submissions?: IntakeSubmission[]
  message?: string
}

type AdminAuthResult = {
  ok: boolean
  authenticated?: boolean
  configured?: boolean
  message?: string
}

const WHATSAPP_NUMBER = '9647708111744'
const emptyIntake: IntakeForm = { company: '', contact: '', problemType: '', description: '' }
const emptyLead: LeadForm = { name: '', company: '', type: 'توزيع ومخازن', message: '' }

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

const painItems = [
  {
    title: 'بضاعة تطلع من المخزن بدون تسجيل',
    body: 'السائق ياخذ البضاعة، الموظف ينسى يكتبها، وآخر الشهر الكمية بالدفتر ما تطابق اللي بالمخزن فعلاً.',
    quote: 'المخزن ضايع، ما أعرف منو أخذ شنو',
  },
  {
    title: 'كل واحد يسجّل على Excel خاص فيه',
    body: 'المحاسب عنده ملف، المخزنجي عنده ملف ثاني، والمدير ما يشوف الصورة الكاملة إلا بعد طلب يدوي.',
    quote: 'الفاتورة عند فلان، والثاني ما يعرف بيها',
  },
  {
    title: 'الحسابات ما تتطابق آخر الشهر',
    body: 'تقعد ساعات تطابق الديون والمقبوضات يدوياً، وتلكى فرق ما تعرف منين جاء.',
    quote: 'الحسابات ما تطابق، وين راحت الفلوس؟',
  },
  {
    title: 'تطلب تقرير، يجيك بعد يومين',
    body: 'تريد تعرف أكثر زبون مديون أو أكثر صنف يتحرك، فتنتظر الموظف يجمعها من ملفات متفرقة.',
    quote: 'أي معلومة تريدها تنطر عليها',
  },
  {
    title: 'الأرشيف الورقي تايه بالأدراج',
    body: 'تبحث عن فاتورة قديمة أو عقد زبون بين أدراج وكراتين، وبالنهاية قد لا تجده.',
    quote: 'الوثيقة موجودة... بس وين؟',
  },
  {
    title: 'الموظف يطلع، والمعلومات تطلع وياه',
    body: 'كل المعرفة بدماغ موظف واحد أو بملفه الخاص. يوم يغيب، تكتشف أن الشغل كان معلقاً عليه.',
    quote: 'الشغل كله معلق بشخص واحد',
  },
]

const proofCards = [
  ['QuickDock — لوحة أوامر سريعة', 'برنامج Desktop يختصر أوامر ونصوص متكررة بضغطة واحدة داخل بيئة العمل.'],
  ['منبه المواقيت — لإذاعة NAS FM', 'واجهة عربية تعمل بالخلفية مع إعدادات دقيقة وتنبيهات منظمة.'],
  ['أنظمة بث وأتمتة إذاعية', 'منظومات تشغيل تجمع البيانات وتعالجها وتبثها أوتوماتيكياً وفق مسارات محددة.'],
]

const processSteps = [
  ['01', 'نفهم المشكلة الحالية', 'نبدأ من أين يتعطل العمل، لا من اسم البرنامج المطلوب.'],
  ['02', 'نفهم طريقة العمل الحالية', 'نراجع Excel والورق وWhatsApp والملفات والخطوات اليدوية.'],
  ['03', 'نحدد النطاق بوضوح', 'نعرف ما الذي سيدخل في المرحلة الحالية وما الذي سيبقى خارجها.'],
  ['04', 'نبني ونتحقق', 'نبني الأداة ثم نتحقق أنها تقلل الألم التشغيلي فعلاً.'],
]

function cloneContent(content: SiteContent): SiteContent {
  return JSON.parse(JSON.stringify(content)) as SiteContent
}

function readStoredContent(): SiteContent {
  try {
    const stored = window.localStorage.getItem(CONTENT_STORAGE_KEY)
    if (!stored) return defaultContent
    return { ...defaultContent, ...JSON.parse(stored) } as SiteContent
  } catch {
    return defaultContent
  }
}

function whatsappLink(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  } catch {
    return value || '—'
  }
}

function csvCell(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <svg className={small ? 'logo-mark small' : 'logo-mark'} viewBox="0 0 96 96" role="img" aria-label="NAS CodeWorks logo">
      <defs>
        <linearGradient id="nasMarkGradient" x1="10" x2="88" y1="8" y2="90">
          <stop offset="0" stopColor="#00D4FF" />
          <stop offset="0.55" stopColor="#2563EB" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <path d="M68 14A38 38 0 1 0 68 82" className="mark-ring" />
      <circle cx="46" cy="48" r="9" className="mark-core" />
      <path d="M31 48a18 18 0 0 1 18-18" className="mark-orbit" />
      <path d="M31 48a18 18 0 0 0 18 18" className="mark-orbit" />
      {[
        [61, 28, 7], [75, 25, 5], [58, 42, 9], [73, 43, 7], [85, 39, 4],
        [61, 56, 8], [77, 58, 6], [88, 55, 4], [70, 72, 5], [84, 72, 4],
      ].map(([x, y, s], index) => (
        <rect key={index} x={x} y={y} width={s} height={s} rx="2" className="mark-pixel" />
      ))}
    </svg>
  )
}

function Field({ label, value, multiline, onChange }: { label: string; value: string; multiline?: boolean; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} /> : <input value={value} onChange={(event) => onChange(event.target.value)} />}
    </label>
  )
}

function App() {
  const [mode, setMode] = useState<ViewMode>(() => (window.location.pathname.startsWith('/admin') ? 'admin' : 'site'))
  const [content, setContent] = useState<SiteContent>(() => readStoredContent())
  const [intake, setIntake] = useState<IntakeForm>(emptyIntake)
  const [lead, setLead] = useState<LeadForm>(emptyLead)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [cloudStatus, setCloudStatus] = useState('Cloud content: local fallback')
  const [adminAuthState, setAdminAuthState] = useState<AdminAuthState>('checking')
  const [adminCode, setAdminCode] = useState('')
  const [adminAuthMessage, setAdminAuthMessage] = useState('')
  const [activeAdminSection, setActiveAdminSection] = useState<AdminSection>('requests')
  const [submissions, setSubmissions] = useState<IntakeSubmission[]>([])
  const [submissionsStatus, setSubmissionsStatus] = useState('لم يتم تحميل الطلبات بعد')
  const [requestSearch, setRequestSearch] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState('all')

  const filteredSubmissions = useMemo(() => {
    const term = requestSearch.trim().toLowerCase()
    return submissions.filter((submission) => {
      const statusMatches = requestStatusFilter === 'all' || submission.status === requestStatusFilter
      const searchable = [submission.company, submission.contact, submission.problem_type, submission.description, submission.status].join(' ').toLowerCase()
      return statusMatches && (!term || searchable.includes(term))
    })
  }, [requestSearch, requestStatusFilter, submissions])

  useEffect(() => {
    window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content))
  }, [content])

  useEffect(() => {
    void loadCloudContent(false)
  }, [])

  useEffect(() => {
    if (mode === 'admin') void checkAdminAuth()
  }, [mode])

  useEffect(() => {
    if (mode === 'admin' && adminAuthState === 'authenticated') void loadIntakeSubmissions(false)
  }, [mode, adminAuthState])

  useEffect(() => {
    const items = document.querySelectorAll('.rv')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' })
    items.forEach((item, index) => {
      ;(item as HTMLElement).style.transitionDelay = `${Math.min(index % 6, 5) * 55}ms`
      observer.observe(item)
    })
    return () => observer.disconnect()
  }, [mode])

  const updateContent = (mutate: (next: SiteContent) => void) => {
    setContent((current) => {
      const next = cloneContent(current)
      mutate(next)
      return next
    })
  }

  const goToSite = () => {
    window.history.pushState(null, '', '/')
    setMode('site')
  }

  const goToAdmin = () => {
    window.history.pushState(null, '', '/admin')
    setMode('admin')
  }

  async function loadCloudContent(showStatus = true) {
    try {
      if (showStatus) setCloudStatus('جاري تحميل النصوص من Supabase...')
      const response = await fetch('/api/content')
      const result = (await response.json()) as ContentApiResult
      if (!response.ok || !result.ok || !result.content) throw new Error(result.message || 'تعذر تحميل النصوص')
      setContent(result.content)
      setCloudStatus(`تم تحميل النصوص من ${result.source || 'supabase'}`)
    } catch (error) {
      if (showStatus) setCloudStatus(error instanceof Error ? error.message : 'فشل تحميل النصوص')
    }
  }

  async function saveCloudContent() {
    try {
      setCloudStatus('جاري حفظ النصوص في Supabase...')
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      const result = (await response.json()) as ContentApiResult
      if (!response.ok || !result.ok) throw new Error(result.message || 'Cloud save failed')
      setCloudStatus('تم حفظ النصوص سحابياً. ستظهر من أي جهاز بعد التحديث.')
    } catch (error) {
      setCloudStatus(error instanceof Error ? error.message : 'فشل حفظ النصوص سحابياً')
    }
  }

  async function checkAdminAuth() {
    try {
      setAdminAuthState('checking')
      const response = await fetch('/api/admin-auth')
      const result = (await response.json()) as AdminAuthResult
      if (!result.configured) {
        setAdminAuthState('anonymous')
        setAdminAuthMessage('ADMIN_ACCESS_CODE غير مضاف في Vercel Environment Variables.')
        return
      }
      setAdminAuthState(response.ok && result.authenticated ? 'authenticated' : 'anonymous')
      setAdminAuthMessage(response.ok && result.authenticated ? '' : 'أدخل كود الإدارة للمتابعة.')
    } catch (error) {
      setAdminAuthState('anonymous')
      setAdminAuthMessage(error instanceof Error ? error.message : 'تعذر التحقق من جلسة الإدارة')
    }
  }

  async function loginAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      setAdminAuthMessage('جاري التحقق...')
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: adminCode }),
      })
      const result = (await response.json()) as AdminAuthResult
      if (!response.ok || !result.ok || !result.authenticated) throw new Error(result.message || 'فشل تسجيل الدخول')
      setAdminAuthState('authenticated')
      setAdminAuthMessage('')
      setAdminCode('')
    } catch (error) {
      setAdminAuthState('anonymous')
      setAdminAuthMessage(error instanceof Error ? error.message : 'فشل تسجيل الدخول')
    }
  }

  async function logoutAdmin() {
    await fetch('/api/admin-auth', { method: 'DELETE' }).catch(() => null)
    setAdminAuthState('anonymous')
    setSubmissions([])
    setAdminAuthMessage('تم تسجيل الخروج.')
  }

  async function loadIntakeSubmissions(showStatus = true) {
    try {
      if (showStatus) setSubmissionsStatus('جاري تحميل طلبات العملاء...')
      const response = await fetch('/api/admin-intake')
      const result = (await response.json()) as IntakeApiResult
      if (!response.ok || !result.ok) throw new Error(result.message || 'فشل تحميل الطلبات')
      const loaded = result.submissions ?? []
      setSubmissions(loaded)
      setSubmissionsStatus(loaded.length ? `تم تحميل ${loaded.length} طلب` : 'لا توجد طلبات بعد')
    } catch (error) {
      setSubmissionsStatus(error instanceof Error ? error.message : 'فشل تحميل الطلبات')
    }
  }

  async function updateSubmissionStatus(id: string, status: string) {
    setSubmissionsStatus('جاري تحديث حالة الطلب...')
    const response = await fetch('/api/admin-intake', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    const result = (await response.json()) as IntakeApiResult
    if (!response.ok || !result.ok) {
      setSubmissionsStatus(result.message || 'فشل تحديث الحالة')
      return
    }
    setSubmissions((current) => current.map((submission) => (submission.id === id ? { ...submission, status } : submission)))
    setSubmissionsStatus('تم تحديث حالة الطلب')
  }

  async function deleteSubmission(id: string) {
    if (!window.confirm('حذف هذا الطلب نهائياً؟')) return
    setSubmissionsStatus('جاري حذف الطلب...')
    const response = await fetch('/api/admin-intake', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const result = (await response.json()) as IntakeApiResult
    if (!response.ok || !result.ok) {
      setSubmissionsStatus(result.message || 'فشل حذف الطلب')
      return
    }
    setSubmissions((current) => current.filter((submission) => submission.id !== id))
    setSubmissionsStatus('تم حذف الطلب')
  }

  function exportSubmissionsCsv() {
    const rows = filteredSubmissions.map((submission) => [submission.company, submission.contact ?? '', submission.problem_type ?? '', submission.status, submission.created_at, submission.description])
    const csv = [['Company', 'Contact', 'Problem Type', 'Status', 'Created At', 'Description'], ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'nas-codeworks-intake-submissions.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function submitProblem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!intake.company.trim() || !intake.description.trim()) {
      setSubmitState('error')
      setSubmitMessage('اكتب اسم الشركة ووصف المشكلة أولاً.')
      return
    }

    try {
      setSubmitState('sending')
      setSubmitMessage('جاري إرسال وصف المشكلة...')
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...intake,
          recipientEmail: content.intake.recipientEmail,
          subjectPrefix: content.intake.subjectPrefix,
        }),
      })
      const result = (await response.json()) as { ok?: boolean; message?: string }
      if (!response.ok || !result.ok) throw new Error(result.message || 'Intake delivery failed')
      setSubmitState('success')
      setSubmitMessage(content.intake.successMessage)
      setIntake(emptyIntake)
    } catch (error) {
      setSubmitState('error')
      setSubmitMessage(error instanceof Error ? error.message : content.intake.failureMessage)
    }
  }

  function sendLeadWhatsapp() {
    const lines = ['السلام عليكم، أريد استشارة مجانية من NAS CodeWorks.']
    if (lead.name) lines.push(`الاسم: ${lead.name}`)
    if (lead.company) lines.push(`الشركة: ${lead.company}`)
    lines.push(`نوع الشغل: ${lead.type}`)
    if (lead.message) lines.push(`المشكلة: ${lead.message}`)
    window.open(whatsappLink(lines.join('\n')), '_blank')
  }

  function renderAdminLogin() {
    return (
      <main className="admin-shell" dir="rtl">
        <aside className="admin-sidebar">
          <div className="admin-brand"><LogoMark small /><div><b>NAS</b><span>CodeWorks Admin</span></div></div>
          <p>لوحة الإدارة محمية بكود دخول. أضف ADMIN_ACCESS_CODE في Vercel ثم استخدمه هنا.</p>
          <button className="secondary-button" type="button" onClick={goToSite}>العودة للموقع</button>
        </aside>
        <section className="admin-workspace gate">
          <span className="admin-kicker">Admin Gate</span>
          <h1>تسجيل دخول لوحة الإدارة</h1>
          <form className="admin-card login-card" onSubmit={loginAdmin}>
            <Field label="كود الإدارة" value={adminCode} onChange={setAdminCode} />
            <button className="primary-button wide" type="submit" disabled={adminAuthState === 'checking'}>{adminAuthState === 'checking' ? 'جاري التحقق...' : 'دخول'}</button>
            <p className="notice">{adminAuthMessage}</p>
          </form>
        </section>
      </main>
    )
  }

  function renderAdmin() {
    if (adminAuthState !== 'authenticated') return renderAdminLogin()

    return (
      <main className="admin-shell" dir="rtl">
        <aside className="admin-sidebar">
          <div className="admin-brand"><LogoMark small /><div><b>NAS</b><span>CodeWorks Admin</span></div></div>
          <p>{content.brand.adminNote}</p>
          <nav className="admin-tabs">
            <button className={activeAdminSection === 'requests' ? 'active' : ''} onClick={() => setActiveAdminSection('requests')}>طلبات العملاء</button>
            <button className={activeAdminSection === 'content' ? 'active' : ''} onClick={() => setActiveAdminSection('content')}>نصوص الموقع</button>
            <button className={activeAdminSection === 'intake' ? 'active' : ''} onClick={() => setActiveAdminSection('intake')}>إعدادات الإرسال</button>
          </nav>
          <div className="admin-side-actions">
            <button className="secondary-button" type="button" onClick={goToSite}>العودة للموقع</button>
            <button className="secondary-button" type="button" onClick={() => void loadCloudContent(true)}>تحميل سحابي</button>
            <button className="primary-button" type="button" onClick={() => void saveCloudContent()}>حفظ سحابي</button>
            <button className="secondary-button" type="button" onClick={() => void logoutAdmin()}>تسجيل الخروج</button>
          </div>
          <p className="notice">{cloudStatus}</p>
          <p className="notice">{submissionsStatus}</p>
        </aside>

        <section className="admin-workspace">
          <header className="admin-header">
            <div><span className="admin-kicker">Content Control</span><h1>لوحة تحكم NAS CodeWorks</h1></div>
            <div className="admin-header-actions">
              <button className="secondary-button" type="button" onClick={() => setContent(defaultContent)}>استعادة الافتراضي</button>
              <button className="secondary-button" type="button" onClick={() => navigator.clipboard.writeText(JSON.stringify(content, null, 2))}>نسخ JSON</button>
            </div>
          </header>

          {activeAdminSection === 'requests' ? (
            <article className="admin-card">
              <div className="panel-title-row"><div><h2>طلبات العملاء</h2><p className="notice">آخر الطلبات المحفوظة من نموذج وصف المشكلة.</p></div><button className="secondary-button" type="button" onClick={() => void loadIntakeSubmissions(true)}>تحديث</button></div>
              <div className="request-toolbar">
                <input placeholder="بحث في الطلبات" value={requestSearch} onChange={(event) => setRequestSearch(event.target.value)} />
                <select value={requestStatusFilter} onChange={(event) => setRequestStatusFilter(event.target.value)}><option value="all">كل الحالات</option>{statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
                <button className="table-action" type="button" onClick={exportSubmissionsCsv}>تصدير CSV</button>
              </div>
              <div className="submissions-table-wrap">
                <table className="submissions-table">
                  <thead><tr><th>الشركة</th><th>التواصل</th><th>نوع المشكلة</th><th>الحالة</th><th>التاريخ</th><th>الوصف</th><th>إجراء</th></tr></thead>
                  <tbody>
                    {filteredSubmissions.length ? filteredSubmissions.map((submission) => (
                      <tr key={submission.id}>
                        <td><strong>{submission.company}</strong></td>
                        <td>{submission.contact || '—'}</td>
                        <td>{submission.problem_type || '—'}</td>
                        <td><select className="status-select" value={submission.status} onChange={(event) => void updateSubmissionStatus(submission.id, event.target.value)}>{statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></td>
                        <td>{formatDate(submission.created_at)}</td>
                        <td>{submission.description}</td>
                        <td><button className="table-action danger" type="button" onClick={() => void deleteSubmission(submission.id)}>حذف</button></td>
                      </tr>
                    )) : <tr><td className="empty-table" colSpan={7}>لا توجد طلبات مطابقة</td></tr>}
                  </tbody>
                </table>
              </div>
            </article>
          ) : null}

          {activeAdminSection === 'content' ? (
            <div className="admin-grid">
              <article className="admin-card">
                <h2>الهوية والواجهة</h2>
                <Field label="اسم المشروع" value={content.brand.name} onChange={(value) => updateContent((next) => { next.brand.name = value })} />
                <Field label="الوصف المختصر" value={content.brand.tagline} onChange={(value) => updateContent((next) => { next.brand.tagline = value })} />
                <Field label="Hero Eyebrow" value={content.hero.eyebrow} onChange={(value) => updateContent((next) => { next.hero.eyebrow = value })} />
                <Field label="عنوان Hero" value={content.hero.title} multiline onChange={(value) => updateContent((next) => { next.hero.title = value })} />
                <Field label="نص Hero" value={content.hero.body} multiline onChange={(value) => updateContent((next) => { next.hero.body = value })} />
              </article>
              <article className="admin-card">
                <h2>أقسام الموقع</h2>
                {content.sections.map((section, index) => (
                  <div className="nested-editor" key={section.id}>
                    <Field label={`عنوان القسم ${index + 1}`} value={section.title} onChange={(value) => updateContent((next) => { next.sections[index].title = value })} />
                    <Field label="النص" value={section.body} multiline onChange={(value) => updateContent((next) => { next.sections[index].body = value })} />
                  </div>
                ))}
              </article>
            </div>
          ) : null}

          {activeAdminSection === 'intake' ? (
            <div className="admin-grid">
              <article className="admin-card">
                <h2>إعدادات نموذج المشكلة</h2>
                <Field label="إيميل استقبال الطلبات" value={content.intake.recipientEmail} onChange={(value) => updateContent((next) => { next.intake.recipientEmail = value })} />
                <Field label="بادئة عنوان الإيميل" value={content.intake.subjectPrefix} onChange={(value) => updateContent((next) => { next.intake.subjectPrefix = value })} />
                <Field label="رسالة النجاح" value={content.intake.successMessage} multiline onChange={(value) => updateContent((next) => { next.intake.successMessage = value })} />
                <Field label="رسالة الفشل" value={content.intake.failureMessage} multiline onChange={(value) => updateContent((next) => { next.intake.failureMessage = value })} />
              </article>
              <article className="admin-card">
                <h2>الخدمات</h2>
                {content.services.map((service, index) => (
                  <div className="nested-editor" key={service.title}>
                    <Field label={`اسم الخدمة ${index + 1}`} value={service.title} onChange={(value) => updateContent((next) => { next.services[index].title = value })} />
                    <Field label="السعر" value={service.price} onChange={(value) => updateContent((next) => { next.services[index].price = value })} />
                    <Field label="الوصف" value={service.body} multiline onChange={(value) => updateContent((next) => { next.services[index].body = value })} />
                  </div>
                ))}
              </article>
            </div>
          ) : null}
        </section>
      </main>
    )
  }

  if (mode === 'admin') return renderAdmin()

  return (
    <main className="site" dir="rtl">
      <nav className="topbar"><div className="wrap nav-in"><a className="brand" href="#top"><LogoMark small /><span>NAS</span><b>CodeWorks</b></a><a className="whatsapp-top" href={whatsappLink('السلام عليكم، أريد أستفسر عن برنامج لشركتي')} target="_blank" rel="noreferrer">واتساب ●</a></div></nav>

      <header id="top" className="hero"><div className="wrap hero-wrap">
        <span className="pill rv"><i />{content.hero.eyebrow}</span>
        <div className="hero-logo rv"><LogoMark /></div>
        <h1 className="rv">{content.hero.title.includes('يدير') ? <>{content.hero.title.split('يدير')[0]}<br /><em>يدير{content.hero.title.split('يدير').slice(1).join('يدير').split('ويشتغل')[0]}</em><br />ويشتغل{content.hero.title.split('ويشتغل').slice(1).join('ويشتغل')}</> : content.hero.title}</h1>
        <p className="hero-sub rv">{content.hero.body}</p>
        <p className="hero-micro rv">صُمّم لمشاكل الشركات التي تعتمد على Excel والورق والرسائل والذاكرة: معلومات متفرقة، تقارير متأخرة، وأخطاء تتكرر كل شهر.</p>
        <div className="hero-actions rv"><a className="btn btn-wa" href={whatsappLink('السلام عليكم، عندي شركة وأريد أناقش برنامج يدير المخزن والفواتير')} target="_blank" rel="noreferrer">احكِ معنا بالواتساب</a><a className="btn btn-ghost" href="#services">{content.cta.secondary}</a></div>
        <div className="hero-trust rv"><span>✓ 15+ سنة خبرة هندسية وتقنية</span><span>✓ نطاق واضح قبل التنفيذ</span><span>✓ ضمان 30 يوم على أخطاء التسليم</span></div>
      </div></header>

      <section className="section"><div className="wrap"><span className="kicker rv">المشكلة التي تعرفها</span><h2 className="section-title rv">{content.sections[0]?.title}</h2><p className="section-sub rv">{content.sections[0]?.body}</p><div className="pain-grid">{painItems.map((item) => <article className="pain-card rv" key={item.title}><div className="warn">!</div><h3>{item.title}</h3><p>{item.body}</p><blockquote>{item.quote}</blockquote></article>)}</div></div></section>

      <section className="section soft"><div className="wrap"><span className="kicker rv">Operational Center</span><h2 className="section-title rv">{content.sections[1]?.title}</h2><p className="section-sub rv">{content.sections[1]?.body}</p><div className="center-stage rv"><div className="scatter left"><span /><span /><span /><span /><span /></div><LogoMark /><div className="center-copy"><b>Scattered Information</b><span>→</span><b>Operational Center</b><span>→</span><b>Structured Operations</b></div><div className="scatter right"><span /><span /><span /><span /><span /></div></div></div></section>

      <section id="services" className="section"><div className="wrap"><span className="kicker rv">الخدمات والأسعار</span><h2 className="section-title rv">ثلاث خدمات واضحة — تبدأ من المشكلة لا من اسم البرنامج</h2><p className="section-sub rv">الخدمة المناسبة لا تُختار لأنها تبدو أكبر، بل لأنها تعالج نوع المشكلة الموجودة داخل طريقة العمل الحالية.</p><div className="services-grid">{content.services.map((service, index) => <article className={`service-card rv ${index === 0 ? 'featured' : ''}`} key={service.title}>{index === 0 ? <span className="badge">الأكثر طلباً</span> : null}<div className="service-icon">◇</div><h3>{service.title}</h3><p>{service.body}</p><strong>{service.price}</strong><a href={whatsappLink(`السلام عليكم، أريد استشارة حول: ${service.title}`)} target="_blank" rel="noreferrer">احجز استشارة مجانية</a></article>)}</div></div></section>

      <section className="section soft"><div className="wrap"><span className="kicker rv">كيف نشتغل</span><h2 className="section-title rv">{content.sections[2]?.title}</h2><p className="section-sub rv">{content.sections[2]?.body}</p><div className="process-grid">{processSteps.map(([number, title, body]) => <article className="process-card rv" key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>

      <section className="section"><div className="wrap"><span className="kicker rv">إثبات قدرة</span><h2 className="section-title rv">برامج وتجارب تشغيلية مبنية حول مشاكل واقعية</h2><div className="proof-grid">{proofCards.map(([title, body]) => <article className="proof-card rv" key={title}><div className="mock-screen" /><h3>{title}</h3><p>{body}</p></article>)}</div><div className="founder rv"><div className="founder-avatar">س</div><div><h3>سفيان ناصر علي</h3><b>المؤسس والمدير التقني — NAS CodeWorks</b><p>خبرة في هندسة البث والأنظمة التقنية وبناء أدوات عملية للشركات التي تحتاج تنظيماً ووضوحاً في العمل اليومي.</p></div></div></div></section>

      <section className="section soft" id="start"><div className="wrap"><div className="start-panel rv"><div><span className="kicker">ابدأ الآن</span><h2>ابدأ باستشارة مجانية — وتعرف شنو نقدر نسوي لشركتك</h2><p>لا تحتاج أن تعرف اسم الأداة. اكتب المشكلة كما تحدث داخل العمل، ونحن نحدد المسار المناسب بعد فهمها.</p><a className="big-wa" href={whatsappLink('السلام عليكم، أريد استشارة مجانية عن مشكلة تشغيلية داخل شركتي')} target="_blank" rel="noreferrer">احكِ معنا مباشرة بالواتساب</a></div><div className="quick-form"><h3>أو اترك بياناتك ونرتب التواصل</h3><label>اسمك<input value={lead.name} onChange={(event) => setLead({ ...lead, name: event.target.value })} /></label><label>اسم الشركة<input value={lead.company} onChange={(event) => setLead({ ...lead, company: event.target.value })} /></label><label>نوع الشغل<select value={lead.type} onChange={(event) => setLead({ ...lead, type: event.target.value })}><option>توزيع ومخازن</option><option>أرشفة وملفات</option><option>تقارير وأتمتة</option><option>غير متأكد</option></select></label><label>شنو أكبر مشكلة عندك؟<textarea value={lead.message} onChange={(event) => setLead({ ...lead, message: event.target.value })} /></label><button type="button" onClick={sendLeadWhatsapp}>أرسل عبر الواتساب</button></div></div></div></section>

      <section className="section"><div className="wrap"><span className="kicker rv">نموذج المشكلة</span><h2 className="section-title rv">أرسل وصف المشكلة إلى لوحة التحكم</h2><form className="intake-form rv" onSubmit={submitProblem}><Field label="اسم الشركة" value={intake.company} onChange={(value) => setIntake({ ...intake, company: value })} /><Field label="وسيلة التواصل" value={intake.contact} onChange={(value) => setIntake({ ...intake, contact: value })} /><Field label="نوع المشكلة" value={intake.problemType} onChange={(value) => setIntake({ ...intake, problemType: value })} /><Field label="وصف المشكلة" value={intake.description} multiline onChange={(value) => setIntake({ ...intake, description: value })} /><button className="btn btn-wa" disabled={submitState === 'sending'}>{submitState === 'sending' ? 'جاري الإرسال...' : content.cta.primary}</button><p className={`form-status ${submitState}`}>{submitMessage}</p></form></div></section>

      <footer className="footer"><div className="wrap footer-in"><div className="brand"><LogoMark small /><span>NAS</span><b>CodeWorks</b></div><p>Operational Problem-Solving Studio · أدوات تشغيلية مخصصة للشركات العراقية</p><button type="button" onClick={goToAdmin}>لوحة التحكم</button></div></footer>
      <div className="sticky-wa"><a href={whatsappLink('السلام عليكم، أريد استشارة مجانية عن برنامج لشركتي')} target="_blank" rel="noreferrer">احجز استشارة مجانية الآن</a></div>
    </main>
  )
}

export default App
