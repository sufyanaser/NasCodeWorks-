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
    tagline: 'Operational Problem-Solving Studio',
    adminNote: 'لوحة التحكم تتحكم بالنصوص العامة، رسائل نموذج المشكلة، طلبات العملاء، وبريد الاستلام.',
  },
  cta: {
    primary: 'ابدأ بوصف المشكلة الحالية',
    secondary: 'شوف الخدمات والأسعار',
  },
  hero: {
    eyebrow: 'نخدم الشركات العراقية الصغيرة والمتوسطة',
    title: 'برنامج خاص لشركتك يدير المخزن والفواتير والأرشيف ويشتغل بدون إنترنت',
    body: 'ما نبيعك نظام جاهز عام ولا اشتراك شهري على السحابة. نبني لك أداة تشغيلية مخصصة على طريقة شغلك، تجعل المعلومات أوضح والعمل اليومي أسهل في المتابعة.',
  },
  sections: [
    {
      id: 'problem',
      title: 'إذا أي وحدة من هذي تصير بشركتك — أنت تخسر فلوس بدون ما تدري',
      body: 'المخزن لا يطابق، الفواتير موزعة، التقارير تتأخر، والملفات تضيع بين Excel وWhatsApp والورق. هذه ليست مشاكل منفصلة؛ هذه فوضى تشغيلية تحتاج مركزاً واضحاً.',
    },
    {
      id: 'center',
      title: 'نبني مركز تشغيل واضح بدل المعلومات المتناثرة',
      body: 'نجمع الملفات، الطلبات، الأرقام، التقارير، والمتابعة داخل أداة عملية تجعل الإدارة ترى ما يحدث بدون سؤال وتجميع يدوي مستمر.',
    },
    {
      id: 'scope',
      title: 'نطاق واضح قبل التنفيذ',
      body: 'لا نبدأ بالكود. نبدأ بفهم المشكلة، طريقة العمل الحالية، مصدر الألم الحقيقي، وما الذي يجب أن يدخل أو يبقى خارج المرحلة الحالية.',
    },
  ],
  services: [
    {
      title: 'تطبيقات سطح مكتب مخصصة للشركات',
      price: 'تبدأ من 500 دولار',
      body: 'برنامج Desktop خاص لشركتك لإدارة المخزن، الفواتير، الزبائن، الديون، أو عمليات داخلية لا يناسبها Excel أو برنامج جاهز.',
    },
    {
      title: 'أنظمة أرشفة وإدارة ملفات داخلية',
      price: 'تبدأ من 900 دولار',
      body: 'نظام عربي لتنظيم الوثائق، العقود، الفواتير، العملاء، أو المعاملات بطريقة قابلة للبحث والمتابعة.',
    },
    {
      title: 'أتمتة التقارير وربط البيانات',
      price: 'يحدد بعد فهم النطاق',
      body: 'تقليل جمع الأرقام يدوياً وربط مصادر البيانات لإنتاج تقارير أوضح ومتابعة أسرع للإدارة.',
    },
  ],
  intake: {
    recipientEmail: '',
    subjectPrefix: 'NAS CodeWorks Intake',
    successMessage: 'تم استلام وصف المشكلة وحفظه في لوحة التحكم. سنراجع التفاصيل ونتواصل معك.',
    failureMessage: 'تعذر إرسال وصف المشكلة الآن. حاول لاحقاً أو تواصل معنا مباشرة عبر واتساب.',
  },
}

export const CONTENT_STORAGE_KEY = 'nas-codeworks-content-v1'
