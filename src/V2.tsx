import { useEffect, useMemo, useState } from 'react'

const whatsapp = 'https://wa.me/9647708111744'

const screens = [
  {
    id: 'signal',
    eyebrow: 'Scattered Information',
    title: 'المشكلة ليست نقص برنامج — المشكلة أن العمل متفرق',
    body: 'Excel هنا، واتساب هناك، ملف ناقص، فاتورة مؤجلة، وقرار إداري ينتظر معلومة لا أحد يعرف أين توجد.',
    chips: ['Excel', 'WhatsApp', 'فواتير', 'مخزن', 'تقارير'],
  },
  {
    id: 'center',
    eyebrow: 'Operational Center',
    title: 'نحوّل الإشارات المتفرقة إلى مركز تشغيل واضح',
    body: 'NAS CodeWorks يبني أدوات داخلية تجعل الشركة ترى المخزن، العملاء، الملفات، الطلبات، والتقارير من نقطة تشغيل واحدة.',
    chips: ['مركز رؤية', 'مسار واضح', 'أرقام موحدة'],
  },
  {
    id: 'systems',
    eyebrow: 'Structured Operations',
    title: 'كل أداة تُبنى حول طريقة عملك الفعلية',
    body: 'لا نبدأ باسم البرنامج. نبدأ من أين يتعطل العمل، ما الذي يتكرر، أين تضيع المعلومة، وما القرار الذي يتأخر بسببها.',
    chips: ['Desktop App', 'Archive', 'Automation'],
  },
  {
    id: 'clarity',
    eyebrow: 'Operational Clarity',
    title: 'النتيجة: إدارة ترى، تتابع، وتقرر بسرعة أكبر',
    body: 'أقل إدخال يدوي، أخطاء أقل، تقارير أسرع، ومعلومات لا تبقى معلقة بشخص واحد أو ملف واحد.',
    chips: ['وضوح', 'متابعة', 'تقليل خسائر'],
  },
]

const services = [
  ['تطبيقات سطح مكتب مخصصة', 'تبدأ من 500 دولار', 'برامج عربية لإدارة المخزن، الفواتير، العملاء، الديون، أو أي مسار داخلي لا يناسبه Excel.'],
  ['أرشفة وإدارة ملفات', 'تبدأ من 900 دولار', 'تنظيم الوثائق والعقود والفواتير والمعاملات داخل نظام قابل للبحث والمتابعة.'],
  ['أتمتة وتقارير', 'حسب النطاق', 'تقليل العمل اليدوي المتكرر وربط البيانات لإنتاج تقارير واضحة للإدارة.'],
]

function V2Logo() {
  return (
    <svg className="v2-logo" viewBox="0 0 120 120" aria-label="NAS CodeWorks V2 Logo" role="img">
      <defs>
        <linearGradient id="v2g" x1="12" x2="105" y1="10" y2="108">
          <stop offset="0" stopColor="#00D4FF" />
          <stop offset="0.52" stopColor="#2563EB" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <path className="v2-ring" d="M84 20A46 46 0 1 0 84 100" />
      <circle className="v2-core" cx="56" cy="60" r="10" />
      <path className="v2-orbit" d="M38 60a22 22 0 0 1 24-22" />
      <path className="v2-orbit" d="M38 60a22 22 0 0 0 24 22" />
      {[
        [76, 35, 9], [94, 32, 6], [74, 52, 11], [94, 54, 8], [106, 48, 5],
        [76, 70, 10], [96, 74, 7], [108, 69, 5], [86, 91, 6], [104, 91, 5],
      ].map(([x, y, s], i) => <rect key={i} className="v2-pixel" x={x} y={y} width={s} height={s} rx="2" />)}
    </svg>
  )
}

function whatsappLink(message: string) {
  return `${whatsapp}?text=${encodeURIComponent(message)}`
}

export default function V2() {
  const [active, setActive] = useState(0)
  const current = screens[active]
  const progress = useMemo(() => `${((active + 1) / screens.length) * 100}%`, [active])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'PageDown') setActive((value) => Math.min(value + 1, screens.length - 1))
      if (event.key === 'ArrowUp' || event.key === 'PageUp') setActive((value) => Math.max(value - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className="v2" dir="rtl">
      <nav className="v2-nav">
        <a className="v2-brand" href="/v2"><V2Logo /><span>NAS</span><b>CodeWorks</b></a>
        <div className="v2-nav-actions">
          <a href="/">v1</a>
          <a href="/admin">Admin</a>
          <a className="v2-wa" href={whatsappLink('السلام عليكم، أريد استشارة حول NAS CodeWorks')} target="_blank" rel="noreferrer">واتساب</a>
        </div>
      </nav>

      <section className="v2-stage">
        <aside className="v2-rail">
          {screens.map((screen, index) => (
            <button key={screen.id} className={index === active ? 'active' : ''} onClick={() => setActive(index)}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {screen.eyebrow}
            </button>
          ))}
        </aside>

        <div className="v2-main-panel">
          <div className="v2-progress"><i style={{ width: progress }} /></div>
          <div className="v2-visual">
            <div className="v2-scatter left">{current.chips.map((chip) => <span key={chip}>{chip}</span>)}</div>
            <V2Logo />
            <div className="v2-scatter right">{current.chips.map((chip) => <span key={chip}>{chip}</span>)}</div>
          </div>
          <div className="v2-copy">
            <span className="v2-eyebrow">{current.eyebrow}</span>
            <h1>{current.title}</h1>
            <p>{current.body}</p>
            <div className="v2-actions">
              <a className="primary" href={whatsappLink('السلام عليكم، أريد تحليل مشكلة تشغيلية داخل شركتي')} target="_blank" rel="noreferrer">ابدأ بتحليل المشكلة</a>
              <button onClick={() => setActive((value) => Math.min(value + 1, screens.length - 1))}>التالي</button>
            </div>
          </div>
        </div>
      </section>

      <section className="v2-services">
        <div>
          <span className="v2-eyebrow">Service Paths</span>
          <h2>خدمات واضحة بعد فهم النطاق</h2>
        </div>
        <div className="v2-service-grid">
          {services.map(([title, price, body]) => (
            <article key={title}>
              <b>{title}</b>
              <strong>{price}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
