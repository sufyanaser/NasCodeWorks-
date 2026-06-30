export type SiteContent = {
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

export const defaultContent: SiteContent = {
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

export const CONTENT_STORAGE_KEY = 'nas-codeworks-content-v1'
