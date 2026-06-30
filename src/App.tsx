import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Database, Mail, Save, Settings, ShieldCheck } from 'lucide-react'
import { CONTENT_STORAGE_KEY, defaultContent, type SiteContent } from './content'

type IntakeForm = {
  company: string
  contact: string
  problemType: string
  description: string
}

type ViewMode = 'site' | 'admin'

type SubmitState = 'idle' | 'sending' | 'success' | 'error'

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

  const exportedJson = useMemo(() => JSON.stringify(content, null, 2), [content])

  useEffect(() => {
    window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content))
  }, [content])

  const updateContent = (mutate: (next: SiteContent) => void) => {
    setContent((current) => {
      const next = structuredClone(current)
      mutate(next)
      return next
    })
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
        throw new Error(result.message || 'Email delivery failed')
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
          <button className="secondary-button" type="button" onClick={() => { window.history.pushState(null, '', '/'); setMode('site') }}>العودة للموقع</button>
        </aside>

        <section className="admin-workspace">
          <header className="admin-header">
            <div>
              <span>Content Control</span>
              <h1>لوحة تحكم النصوص والإيميل</h1>
            </div>
            <button className="primary-button" type="button" onClick={() => navigator.clipboard.writeText(exportedJson)}>نسخ JSON</button>
          </header>

          <div className="admin-grid">
            <article className="panel">
              <h2>الهوية والواجهة</h2>
              <Field label="اسم المشروع" value={content.brand.name} onChange={(value) => updateContent((next) => { next.brand.name = value })} />
              <Field label="الوصف المختصر" value={content.brand.tagline} onChange={(value) => updateContent((next) => { next.brand.tagline = value })} />
              <Field label="Hero Eyebrow" value={content.hero.eyebrow} onChange={(value) => updateContent((next) => { next.hero.eyebrow = value })} />
              <Field label="عنوان Hero" value={content.hero.title} multiline onChange={(value) => updateContent((next) => { next.hero.title = value })} />
              <Field label="نص Hero" value={content.hero.body} multiline onChange={(value) => updateContent((next) => { next.hero.body = value })} />
            </article>

            <article className="panel">
              <h2>إعدادات نموذج المشكلة</h2>
              <Field label="إيميل استقبال الطلبات" value={content.intake.recipientEmail} onChange={(value) => updateContent((next) => { next.intake.recipientEmail = value })} />
              <Field label="بادئة عنوان الإيميل" value={content.intake.subjectPrefix} onChange={(value) => updateContent((next) => { next.intake.subjectPrefix = value })} />
              <Field label="رسالة النجاح" value={content.intake.successMessage} multiline onChange={(value) => updateContent((next) => { next.intake.successMessage = value })} />
              <Field label="رسالة الفشل" value={content.intake.failureMessage} multiline onChange={(value) => updateContent((next) => { next.intake.failureMessage = value })} />
              <p className="notice">مهم: الإرسال الفعلي يعتمد على متغيرات بيئة Vercel الخاصة بالبريد. لا تضع أي Secret داخل الواجهة.</p>
            </article>

            <article className="panel wide">
              <h2>أقسام الموقع</h2>
              <div className="section-editors">
                {content.sections.map((section, index) => (
                  <div className="nested-editor" key={section.id}>
                    <Field label={`عنوان القسم ${index + 1}`} value={section.title} onChange={(value) => updateContent((next) => { next.sections[index].title = value })} />
                    <Field label="النص" value={section.body} multiline onChange={(value) => updateContent((next) => { next.sections[index].body = value })} />
                  </div>
                ))}
              </div>
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
