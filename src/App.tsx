import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Cloud, Database, Inbox, Mail, RefreshCw, Save, Settings, ShieldCheck } from 'lucide-react'
import { CONTENT_STORAGE_KEY, defaultContent, type SiteContent } from './content'

type IntakeForm = {
  company: string
  contact: string
  problemType: string
  description: string
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

type AdminSection = 'identity' | 'intake' | 'sections'

type SubmitState = 'idle' | 'sending' | 'success' | 'error'

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

const emptyForm: IntakeForm = {
  company: '',
  contact: '',
  problemType: '',
  description: '',
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

function formatDate(value: string) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('ar-IQ', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
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
  const [content, setContent] = useState<SiteContent>(() => readStoredContent())
  const [mode, setMode] = useState<ViewMode>(() => window.location.pathname.startsWith('/admin') ? 'admin' : 'site')
  const [form, setForm] = useState<IntakeForm>(emptyForm)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [cloudStatus, setCloudStatus] = useState('Cloud content: local fallback')
  const [submissions, setSubmissions] = useState<IntakeSubmission[]>([])
  const [submissionsStatus, setSubmissionsStatus] = useState('لم يتم تحميل الطلبات بعد')
  const [activeAdminSection, setActiveAdminSection] = useState<AdminSection>('identity')

  const exportedJson = useMemo(() => JSON.stringify(content, null, 2), [content])

  useEffect(() => {
    window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content))
  }, [content])

  useEffect(() => {
    void loadCloudContent(false)
  }, [])

  useEffect(() => {
    if (mode === 'admin') {
      void loadIntakeSubmissions(false)
    }
  }, [mode])

  const updateContent = (mutate: (next: SiteContent) => void) => {
    setContent((current) => {
      const next = structuredClone(current)
      mutate(next)
      return next
    })
  }

  const loadCloudContent = async (showStatus = true) => {
    try {
      if (showStatus) setCloudStatus('جاري تحميل النصوص من Supabase...')
      const response = await fetch('/api/content')
      const result = await response.json().catch(() => ({ ok: false, message: 'Invalid content API response' })) as ContentApiResult

      if (!response.ok || !result.ok || !result.content) {
        if (showStatus) setCloudStatus(result.message || 'تعذر تحميل النصوص السحابية.')
        return
      }

      setContent(result.content)
      setCloudStatus(`تم تحميل النصوص من ${result.source || 'cloud'}`)
    } catch (error) {
      if (showStatus) setCloudStatus(error instanceof Error ? error.message : 'فشل تحميل النصوص السحابية')
    }
  }

  const saveCloudContent = async () => {
    try {
      setCloudStatus('جاري حفظ النصوص في Supabase...')
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      const result = await response.json().catch(() => ({ ok: false, message: 'Invalid content API response' })) as ContentApiResult

      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Cloud save failed')
      }

      setCloudStatus('تم حفظ النصوص سحابياً. ستظهر من أي جهاز بعد التحديث.')
    } catch (error) {
      setCloudStatus(error instanceof Error ? error.message : 'فشل حفظ النصوص سحابياً')
    }
  }

  const loadIntakeSubmissions = async (showStatus = true) => {
    try {
      if (showStatus) setSubmissionsStatus('جاري تحميل طلبات العملاء...')
      const response = await fetch('/api/intake')
      const result = await response.json().catch(() => ({ ok: false, message: 'Invalid intake API response' })) as IntakeApiResult

      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'فشل تحميل الطلبات')
      }

      const loaded = result.submissions ?? []
      setSubmissions(loaded)
      setSubmissionsStatus(loaded.length ? `تم تحميل ${loaded.length} طلب` : 'لا توجد طلبات بعد')
    } catch (error) {
      setSubmissionsStatus(error instanceof Error ? error.message : 'فشل تحميل الطلبات')
    }
  }

  const resetLocalContent = () => {
    window.localStorage.removeItem(CONTENT_STORAGE_KEY)
    setContent(defaultContent)
    setCloudStatus('تمت استعادة النصوص الافتراضية محلياً فقط.')
  }

  const updateForm = (field: keyof IntakeForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (submitState !== 'idle') {
      setSubmitState('idle')
      setSubmitMessage('')
    }
  }

  const submitProblem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.company.trim() || !form.description.trim()) {
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
          ...form,
          recipientEmail: content.intake.recipientEmail,
          subjectPrefix: content.intake.subjectPrefix,
        }),
      })

      const result = await response.json().catch(() => ({ ok: false, message: 'Invalid server response' }))

      if (!response.ok || !result.ok) {
        throw new Error(result.message || 'Intake delivery failed')
      }

      setSubmitState('success')
      setSubmitMessage(content.intake.successMessage)
      setForm(emptyForm)
    } catch (error) {
      setSubmitState('error')
      setSubmitMessage(error instanceof Error ? error.message : content.intake.failureMessage)
    }
  }

  if (mode === 'admin') {
    return (
      <main className="admin-shell" dir="rtl">
        <aside className="admin-sidebar">
          <div className="brand-lockup">
            <strong>NAS</strong>
            <span>CodeWorks Admin</span>
          </div>
          <p>{content.brand.adminNote}</p>
          <div className="admin-side-actions">
            <button className="secondary-button" type="button" onClick={() => { window.history.pushState(null, '', '/'); setMode('site') }}>العودة للموقع</button>
            <button className="secondary-button" type="button" onClick={() => void loadCloudContent(true)}><Cloud size={16} /> تحميل سحابي</button>
            <button className="primary-button" type="button" onClick={() => void saveCloudContent()}><Save size={16} /> حفظ سحابي</button>
            <button className="secondary-button" type="button" onClick={() => void loadIntakeSubmissions(true)}><RefreshCw size={16} /> تحديث الطلبات</button>
          </div>
          <p className="notice">{cloudStatus}</p>
          <p className="notice">{submissionsStatus}</p>
        </aside>

        <section className="admin-workspace">
          <header className="admin-header">
            <div>
              <span>Content Control</span>
              <h1>لوحة تحكم النصوص والإيميل</h1>
            </div>
            <div className="admin-header-actions">
              <button className="secondary-button" type="button" onClick={resetLocalContent}>استعادة الافتراضي</button>
              <button className="primary-button" type="button" onClick={() => navigator.clipboard.writeText(exportedJson)}>نسخ JSON</button>
            </div>
          </header>

          <div className="admin-grid admin-grid-separated">
            <article className={`panel accordion-panel ${activeAdminSection === 'identity' ? 'open' : ''}`}>`n              <button className="accordion-trigger" type="button" onClick={() => setActiveAdminSection(activeAdminSection === 'identity' ? 'sections' : 'identity')}>`n                <span>الهوية والواجهة</span>`n                <strong>{activeAdminSection === 'identity' ? '−' : '+'}</strong>`n              </button>`n              <div className="accordion-body"><div className="accordion-body-inner">
              <Field label="اسم المشروع" value={content.brand.name} onChange={(value) => updateContent((next) => { next.brand.name = value })} />
              <Field label="الوصف المختصر" value={content.brand.tagline} onChange={(value) => updateContent((next) => { next.brand.tagline = value })} />
              <Field label="Hero Eyebrow" value={content.hero.eyebrow} onChange={(value) => updateContent((next) => { next.hero.eyebrow = value })} />
              <Field label="عنوان Hero" value={content.hero.title} multiline onChange={(value) => updateContent((next) => { next.hero.title = value })} />
              <Field label="نص Hero" value={content.hero.body} multiline onChange={(value) => updateContent((next) => { next.hero.body = value })} />`n              </div></div>`n            </article>

            <article className={`panel accordion-panel ${activeAdminSection === 'intake' ? 'open' : ''}`}>`n              <button className="accordion-trigger" type="button" onClick={() => setActiveAdminSection(activeAdminSection === 'intake' ? 'identity' : 'intake')}>`n                <span>إعدادات نموذج المشكلة</span>`n                <strong>{activeAdminSection === 'intake' ? '−' : '+'}</strong>`n              </button>`n              <div className="accordion-body"><div className="accordion-body-inner">
              <Field label="إيميل استقبال الطلبات" value={content.intake.recipientEmail} onChange={(value) => updateContent((next) => { next.intake.recipientEmail = value })} />
              <Field label="بادئة عنوان الإيميل" value={content.intake.subjectPrefix} onChange={(value) => updateContent((next) => { next.intake.subjectPrefix = value })} />
              <Field label="رسالة النجاح" value={content.intake.successMessage} multiline onChange={(value) => updateContent((next) => { next.intake.successMessage = value })} />
              <Field label="رسالة الفشل" value={content.intake.failureMessage} multiline onChange={(value) => updateContent((next) => { next.intake.failureMessage = value })} />
              <p className="notice">يحفظ النموذج الطلبات في Supabase. إرسال الإيميل يصبح تلقائياً بعد إضافة RESEND_API_KEY.</p>`n              </div></div>`n            </article>

            <article className="panel wide requests-panel">`n              <div className="panel-title-row">
                <div>
                  <h2>طلبات العملاء</h2>
                  <p className="notice">آخر 50 طلب من نموذج اكتب المشكلة.</p>
                </div>
                <button className="secondary-button" type="button" onClick={() => void loadIntakeSubmissions(true)}><Inbox size={16} /> تحديث</button>
              </div>

              <div className="submissions-table-wrap">
                <table className="submissions-table">
                  <thead>
                    <tr>
                      <th>الشركة</th>
                      <th>التواصل</th>
                      <th>نوع المشكلة</th>
                      <th>الحالة</th>
                      <th>التاريخ</th>
                      <th>الوصف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length ? submissions.map((submission) => (
                      <tr key={submission.id}>
                        <td><strong>{submission.company}</strong></td>
                        <td>{submission.contact || '—'}</td>
                        <td>{submission.problem_type || '—'}</td>
                        <td><span className="status-pill">{submission.status}</span></td>
                        <td>{formatDate(submission.created_at)}</td>
                        <td>{submission.description}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="empty-table">لا توجد طلبات بعد</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className={`panel wide accordion-panel ${activeAdminSection === 'sections' ? 'open' : ''}`}>`n              <button className="accordion-trigger" type="button" onClick={() => setActiveAdminSection(activeAdminSection === 'sections' ? 'identity' : 'sections')}>`n                <span>أقسام الموقع</span>`n                <strong>{activeAdminSection === 'sections' ? '−' : '+'}</strong>`n              </button>`n              <div className="accordion-body"><div className="accordion-body-inner">
              <div className="section-editors">
                {content.sections.map((section, index) => (
                  <div className="nested-editor" key={section.id}>
                    <Field label={`عنوان القسم ${index + 1}`} value={section.title} onChange={(value) => updateContent((next) => { next.sections[index].title = value })} />
                    <Field label="النص" value={section.body} multiline onChange={(value) => updateContent((next) => { next.sections[index].body = value })} />
                  </div>
                ))}
              </div></div>`n            </div>
            </article>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="site-shell" dir="rtl">
      <nav className="topbar">
        <div className="brand-lockup"><strong>NAS</strong><span>CodeWorks</span></div>
        <button className="ghost-button" type="button" onClick={() => { window.history.pushState(null, '', '/admin'); setMode('admin') }}><Settings size={16} /> لوحة التحكم</button>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">{content.hero.eyebrow}</span>
          <h1>{content.hero.title}</h1>
          <p>{content.hero.body}</p>
          <div className="hero-actions">
            <a className="primary-button" href="#intake">{content.cta.primary}<ArrowLeft size={18} /></a>
            <a className="secondary-button" href="#services">{content.cta.secondary}</a>
          </div>
        </div>
        <div className="ops-card" aria-label="Operational Center graphic">
          <div className="center-node">Operational Center</div>
          <span className="node node-a">Excel</span>
          <span className="node node-b">WhatsApp</span>
          <span className="node node-c">Reports</span>
          <span className="node node-d">Files</span>
        </div>
      </section>

      <section className="section-grid">
        {content.sections.map((section) => (
          <article className="panel" key={section.id}>
            <Database size={22} />
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </article>
        ))}
      </section>

      <section id="services" className="services-section">
        <div className="section-heading">
          <span>Service Paths</span>
          <h2>الخدمات الثلاث المعتمدة</h2>
        </div>
        <div className="services-grid">
          {content.services.map((service) => (
            <article className="service-card" key={service.title}>
              <ShieldCheck size={20} />
              <h3>{service.title}</h3>
              <strong>{service.price}</strong>
              <p>{service.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="intake" className="intake-section">
        <div className="section-heading">
          <span>Guided Intake</span>
          <h2>اكتب المشكلة الحالية</h2>
          <p>سيتم إرسال الوصف تلقائياً إلى البريد المحدد في لوحة التحكم أو متغيرات البيئة.</p>
        </div>

        <form className="intake-form" onSubmit={submitProblem}>
          <Field label="اسم الشركة" value={form.company} onChange={(value) => updateForm('company', value)} />
          <Field label="وسيلة التواصل" value={form.contact} onChange={(value) => updateForm('contact', value)} />
          <Field label="نوع المشكلة تقريباً" value={form.problemType} onChange={(value) => updateForm('problemType', value)} />
          <Field label="وصف المشكلة" value={form.description} multiline onChange={(value) => updateForm('description', value)} />
          <button className="primary-button" type="submit" disabled={submitState === 'sending'}><Mail size={18} />{submitState === 'sending' ? 'جاري الإرسال...' : 'إرسال وصف المشكلة'}</button>
          <p className={`form-status ${submitState}`}>{submitMessage}</p>
        </form>
      </section>

      <footer className="site-footer">
        <span>{content.brand.name}</span>
        <button type="button" onClick={() => { window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content)); setSubmitMessage('تم حفظ نسخة محلية من إعدادات الموقع.') }}><Save size={16} /> حفظ محلي</button>
      </footer>
    </main>
  )
}

export default App

