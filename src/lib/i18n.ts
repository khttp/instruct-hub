export type Locale = 'en' | 'ar';

export interface StepItem {
  number: string;
  title: string;
  description: string;
  tip: string;
}

export interface Translations {
  nav: {
    portal: string;
    launch: string;
    browseCourses: string;
    exitClassroom: string;
    backToAcademy: string;
    howItWorks: string;
  };
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    description: string;
    demoNotice: string;
  };
  manual: {
    badge: string;
    title: string;
    subtitle: string;
    steps: StepItem[];
    cta: string;
  };
  onboarding: {
    title: string;
    subdomainLabel: string;
    subdomainPlaceholder: string;
    themeLabel: string;
    tierLabel: string;
    cta: string;
    modalTitle: string;
    modalDesc: string;
    dashboardCta: string;
    previewCta: string;
  };
  features: {
    title: string;
    subtitle: string;
    brandTitle: string;
    brandDesc: string;
    brandHighlight: string;
    videoTitle: string;
    videoDesc: string;
    videoHighlight: string;
    cashTitle: string;
    cashDesc: string;
    cashHighlight: string;
  };
  storefront: {
    officialBadge: string;
    exploreBtn: string;
    badgeInstaVodafone: string;
    badgeDataSaver: string;
    catalogTitle: string;
    catalogSubtitle: string;
    coursesCount: string;
    viewAndEnroll: string;
    footerText: string;
    instructorPortal: string;
  };
  courseDetails: {
    backToStore: string;
    freePreviewBadge: string;
    fastVideoNotice: string;
    unlockNoticeTitle: string;
    unlockNoticeDesc: string;
    lessonsCount: string;
    lifetimeAccess: string;
    mentorship: string;
    syllabusTitle: string;
    watchPreview: string;
    locked: string;
  };
  classroom: {
    exitClassroom: string;
    progress: string;
    completed: string;
    markComplete: string;
    aiTitle: string;
    aiSubtitle: string;
    aiInitialGreeting: string;
    aiInputPlaceholder: string;
    aiSend: string;
    playlistTitle: string;
    fileSizeMb: string;
  };
  checkout: {
    enrollTitle: string;
    totalPrice: string;
    instapayTitle: string;
    instapaySubtitle: string;
    vodafoneCashTitle: string;
    vodafoneCashSubtitle: string;
    step1: string;
    step2: string;
    copy: string;
    copied: string;
    alertNotice: string;
    uploadPlaceholder: string;
    uploadHint: string;
    submitCta: string;
    submitting: string;
    successTitle: string;
    successDesc: string;
    pendingStatus: string;
    egpNoticeTitle: string;
    egpNoticeDesc: string;
  };
  player: {
    engineTitle: string;
    engineDescAuto: string;
    engineDescSaver: string;
    saverActive: string;
    enableSaver: string;
    freePreview: string;
    locked: string;
    watchPreview: string;
  };
  dashboard: {
    portalTitle: string;
    previewLive: string;
    storageTitle: string;
    studentsTitle: string;
    planTitle: string;
    receiptsTab: string;
    coursesTab: string;
    queueTitle: string;
    queueDesc: string;
    approve: string;
    reject: string;
    approved: string;
    rejected: string;
    pending: string;
    viewReceipt: string;
    newCourse: string;
    addLecture: string;
  };
}

export const translations: Record<Locale, Translations> = {
  en: {
    nav: {
      portal: 'Instructor Dashboard',
      launch: 'Create Your Academy',
      browseCourses: 'Browse Courses',
      exitClassroom: 'Exit Classroom',
      backToAcademy: 'Back to Academy',
      howItWorks: 'Teacher Guide',
    },
    hero: {
      badge: 'Built for Teachers & Academies in Egypt • Zero Setup Fees',
      title: 'Your Complete Teaching Website',
      titleHighlight: 'Under Your Own Name & Brand',
      description:
        'Set up your online academy in under 60 seconds. Sell video courses to your students on your private web link, provide mobile data-saving playback, and receive student payments directly to your Vodafone Cash or InstaPay.',
      demoNotice: 'Explore demo academies:',
    },
    manual: {
      badge: "Instructor's Step-by-Step Manual",
      title: 'How to Launch Your Website & Start Teaching in 4 Steps',
      subtitle: 'A practical, simple walkthrough from reserving your link to collecting student course payments.',
      steps: [
        {
          number: '01',
          title: 'Reserve Your Web Link & Choose Brand Color',
          description:
            'Type your desired academy name (e.g. yourname.learnhub.me), pick your signature color, and click Create. No technical skills or coding needed.',
          tip: '💡 Tip: Pick a short, memorable name your students easily recognize.',
        },
        {
          number: '02',
          title: 'Add Your Vodafone Cash & InstaPay Details',
          description:
            'In your dashboard, save your Vodafone Cash wallet number and InstaPay handle. Students will transfer tuition fees directly to these accounts.',
          tip: '💡 Tip: 100% of student funds go directly to you without third-party deductions.',
        },
        {
          number: '03',
          title: 'Create Your Course & Upload Video Lessons',
          description:
            'Click "New Course", set the tuition fee in EGP, and add your lecture videos. Use "Preview course" to see the student page before publishing; unpublished drafts stay hidden from students.',
          tip: '💡 Tip: Videos feature automatic 360p data saving for students on mobile packages.',
        },
        {
          number: '04',
          title: 'Share Link on WhatsApp & Approve Students',
          description:
            'Send your website link to your students or WhatsApp groups. When students sign up and upload their transfer receipt, click "Approve" to unlock their access instantly.',
          tip: '💡 Tip: You can review the transfer screenshot anytime from your dashboard queue.',
        },
      ],
      cta: 'Ready to Start? Create Your Academy Now',
    },
    onboarding: {
      title: 'Choose Your Academy Web Link (Ready in 60s)',
      subdomainLabel: 'Your Desired Web Link Name',
      subdomainPlaceholder: 'e.g. physics-pro or cairo-prep',
      themeLabel: 'Pick Your Brand Theme Color',
      tierLabel: 'Select Your Plan',
      cta: 'Create My Academy & Enter Dashboard',
      modalTitle: 'Your Academy is Ready!',
      modalDesc: 'Your new educational website is live. Start adding your courses and welcoming students!',
      dashboardCta: 'Enter Instructor Dashboard →',
      previewCta: 'View Student Storefront Demo',
    },
    features: {
      title: 'Everything You Need to Sell & Teach Online',
      subtitle: 'Simple, direct tools designed specifically for tutors, teachers, and private educational centers.',
      brandTitle: 'Your Private Branded Website',
      brandDesc:
        'Get your dedicated web link (e.g. yourname.learnhub.me) complete with your personal logo, course list, and custom colors without writing any code.',
      brandHighlight: 'Custom Website in 60 Seconds',
      videoTitle: 'Smooth Video & Mobile Data Saver',
      videoDesc:
        'High-quality lecture videos that load quickly and allow students to enable a 360p data saver mode, saving their mobile phone packages from running out.',
      videoHighlight: 'Protected & Mobile-Friendly Playback',
      cashTitle: 'Direct Vodafone Cash & InstaPay',
      cashDesc:
        'Students transfer tuition directly to your personal phone wallet or bank account. You review their confirmation screenshot and approve access in one click.',
      cashHighlight: 'No International Credit Card Needed',
    },
    storefront: {
      officialBadge: 'Official Certified Egyptian Curriculum',
      exploreBtn: 'View Available Courses',
      badgeInstaVodafone: 'Vodafone Cash & InstaPay Accepted',
      badgeDataSaver: '360p Mobile Data Saver Available',
      catalogTitle: 'Available Courses & Modules',
      catalogSubtitle: 'Structured video curriculum with past exam pattern solutions.',
      coursesCount: 'courses available',
      viewAndEnroll: 'Curriculum & Enrollment →',
      footerText: 'Powered by LearnHub Educational Platform • All Rights Reserved',
      instructorPortal: 'Instructor Portal →',
    },
    courseDetails: {
      backToStore: 'Back to Academy Storefront',
      freePreviewBadge: 'FREE SAMPLE LESSON',
      fastVideoNotice: 'Protected Video Stream',
      unlockNoticeTitle: 'Enroll to Unlock All Lessons',
      unlockNoticeDesc: 'Submit your payment receipt below to unlock full course access.',
      lessonsCount: 'Lessons',
      lifetimeAccess: 'Full Course Access',
      mentorship: 'Direct Teacher Support',
      syllabusTitle: 'Course Curriculum & Chapters',
      watchPreview: 'Watch Sample',
      locked: 'Locked Lesson',
    },
    classroom: {
      exitClassroom: 'Exit Classroom',
      progress: 'Progress',
      completed: 'Completed',
      markComplete: 'Mark Complete',
      aiTitle: 'Course AI Teaching Assistant',
      aiSubtitle: 'Grounded strictly on this course syllabus and lecture transcripts',
      aiInitialGreeting: 'Hello! I am your AI assistant for this course. Ask me any question or problem step you need help with!',
      aiInputPlaceholder: 'Ask a question about this lecture...',
      aiSend: 'Ask',
      playlistTitle: 'Course Lectures Playlist',
      fileSizeMb: 'MB',
    },
    checkout: {
      enrollTitle: 'Course Enrollment',
      totalPrice: 'Course Fee',
      instapayTitle: 'InstaPay Instant Transfer',
      instapaySubtitle: 'Bank account / IPA payment',
      vodafoneCashTitle: 'Vodafone Cash Wallet',
      vodafoneCashSubtitle: 'Direct mobile wallet transfer',
      step1: 'Step 1: Transfer Course Fee to Instructor',
      step2: 'Step 2: Upload Screenshot of Transfer Confirmation',
      copy: 'Copy',
      copied: 'Copied!',
      alertNotice: 'Please ensure your screenshot clearly displays the reference number and transfer amount.',
      uploadPlaceholder: 'Click or tap to upload transfer screenshot',
      uploadHint: 'Image format: PNG, JPG, or WebP (up to 5MB)',
      submitCta: 'Confirm Payment & Submit Proof',
      submitting: 'Sending receipt to instructor...',
      successTitle: 'Receipt Received Successfully!',
      successDesc: 'Your transfer proof has been sent to your instructor for confirmation. Once approved, the full course will unlock automatically.',
      pendingStatus: 'Awaiting Instructor Confirmation',
      egpNoticeTitle: '100% Egyptian Local Payment',
      egpNoticeDesc: 'No international cards needed. Pay easily from any phone wallet or bank app.',
    },
    player: {
      engineTitle: 'High-Definition Video Player',
      engineDescAuto: 'Automatically chooses optimal speed for your connection',
      engineDescSaver: '360p Data Saver Mode active (~180MB per hour)',
      saverActive: '360p Data Saver Active',
      enableSaver: 'Turn On 360p Data Saver',
      freePreview: 'Free Sample Lecture',
      locked: 'Course Enrollment Required',
      watchPreview: 'Watch Sample',
    },
    dashboard: {
      portalTitle: 'Instructor Teaching Dashboard',
      previewLive: 'View Student Website',
      storageTitle: 'Video Storage Space',
      studentsTitle: 'Active Students Enrolled',
      planTitle: 'Current Plan',
      receiptsTab: 'New Student Payments',
      coursesTab: 'My Courses & Lectures',
      queueTitle: 'Pending Student Receipts (Vodafone Cash & InstaPay)',
      queueDesc: 'Verify transfer screenshots from students and unlock their courses instantly.',
      approve: 'Approve & Unlock',
      reject: 'Decline',
      approved: 'Enrolled & Active',
      rejected: 'Declined',
      pending: 'Awaiting Your Review',
      viewReceipt: 'View Transfer Screenshot',
      newCourse: '+ New Course',
      addLecture: '+ Add Video Lecture',
    },
  },
  ar: {
    nav: {
      portal: 'لوحة تحكم المعلم',
      launch: 'أنشئ أكاديميتك الآن',
      browseCourses: 'تصفح الكورسات',
      exitClassroom: 'الخروج من الفصل',
      backToAcademy: 'العودة لموقع المدرس',
      howItWorks: 'دليل المعلم (خطوات البدء)',
    },
    hero: {
      badge: 'مخصص للمدرسين والأكاديميات في مصر • بدون مصاريف إنشاء',
      title: 'موقعك التعليمي الخاص المتكامل',
      titleHighlight: 'باسمك وعلامتك التجارية الخاصة',
      description:
        'أنشئ أكاديميتك وموقعك الخاص لبيع كورساتك وشروحاتك لطلابك في أقل من 60 ثانية. فيديوهات سريعة موفرة لباقة النت، مع استلام أتعابك ومصروفات الكورسات مباشرة على فودافون كاش وإنستاباي.',
      demoNotice: 'استكشف نماذج تجريبية للأكاديميات:',
    },
    manual: {
      badge: 'دليل المعلم خطوة بخطوة',
      title: 'كيف تنشئ موقعك التعليمي وتبدأ التدريس في 4 خطوات بسيطة',
      subtitle: 'دليل عملي مباشر يشرح لك كل خطوة من حجز الرابط وحتى استلام أموال الكورسات وتفعيل الطلاب.',
      steps: [
        {
          number: '01',
          title: 'احجز رابط موقعك واختر لون هويتك',
          description:
            'اكتب الاسم الذي تريده لرابط موقعك (مثل: ahmed-physics.learnhub.me)، ثم اختر لونك المفضل واضغط إنشاء. لا تحتاج لأي خبرة برمجية نهائياً.',
          tip: '💡 نصيحة: اختر اسماً سهلاً يتذكره طلابك بسرعة.',
        },
        {
          number: '02',
          title: 'أضف أرقام فودافون كاش وإنستاباي الخاصة بك',
          description:
            'من لوحة التحكم، سجّل رقم محفظة فودافون كاش أو معرّف إنستاباي لتظهر لطلابك عند الاشتراك، ويحولوا الرسوم لحسابك الشخصي مباشرة.',
          tip: '💡 نصيحة: الفلوس تصلك كاملة 100% في يدك بدون خصومات شركات.',
        },
        {
          number: '03',
          title: 'أنشئ كورسك وارفع محاضرات الفيديو',
          description:
            'اضغط على "إضافة كورس"، حدد السعر وارفع المحاضرات. استخدم "معاينة الكورس" لرؤية صفحة الطالب قبل النشر؛ المسودات لا تظهر للطلاب.',
          tip: '💡 نصيحة: الفيديوهات تدعم ميزة توفير باقة النت 360p لحماية باقات موبايل الطلاب.',
        },
        {
          number: '04',
          title: 'شارك الرابط لطلابك على واتساب وفعّل اشتراكاتهم',
          description:
            'أرسل رابط موقعك لطلابك في جروبات الواتساب أو الفيسبوك. عندما يدخل الطالب ويحول المبلغ ويرفع صورة التحويل، اضغط "تفعيل" ليفتح الكورس له فوراً.',
          tip: '💡 نصيحة: يمكنك مراجعة صورة إيصال التحويل في أي وقت من لوحة التحكم قبل التفعيل.',
        },
      ],
      cta: 'جاهز للبدء؟ أنشئ موقع أكاديميتك الآن في 60 ثانية',
    },
    onboarding: {
      title: 'اختر رابط موقعك التعليمي (جاهز في 60 ثانية)',
      subdomainLabel: 'الاسم المطلوب لرابط موقعك',
      subdomainPlaceholder: 'مثال: ahmed-physics أو cairo-academy',
      themeLabel: 'اختر اللون المميز لموقعك وأكاديميتك',
      tierLabel: 'اختر باقة الاشتراك المناسبة لك',
      cta: 'إنشاء موقعي والدخول للوحة التحكم',
      modalTitle: 'تم تجهيز موقعك التعليمي بنجاح!',
      modalDesc: 'أكاديميتك ورابطك الخاص أصبح جاهزاً لاستقبال الطلاب ورفع الكورسات!',
      dashboardCta: 'الدخول إلى لوحة تحكم المعلم ←',
      previewCta: 'معاينة الموقع كما يراه الطلاب',
    },
    features: {
      title: 'كل ما تحتاجه للتدريس وبيع شروحاتك أونلاين',
      subtitle: 'أدوات بسيطة ومباشرة مصممة خصيصاً لمدرسي السناتر والمعلمين والمراكز التعليمية.',
      brandTitle: 'موقع خاص باسمك وهويتك',
      brandDesc:
        'احصل على رابط خاص بك (مثل: yourname.learnhub.me) مع اسمك وصورتك وقائمة كورساتك وأسعارك بدون الحاجة لأي مبرمج أو مصمم.',
      brandHighlight: 'موقعك جاهز في دقيقة واحدة',
      videoTitle: 'فيديوهات سريعة وتوفير باقة النت للطلاب',
      videoDesc:
        'شروحاتك تفتح بسرعة للطلاب، مع ميزة ذكية لتشغيل الفيديو بجودة 360p لحماية باقات الإنترنت على الموبايل من النفاد.',
      videoHighlight: 'حماية كاملة وتوفير لباقة الموبايل',
      cashTitle: 'تحويل مباشر على فودافون كاش وإنستاباي',
      cashDesc:
        'الطلاب يحولون لك الرسوم مباشرة على رقم محفظتك أو حسابك البنكي، بدون خصومات بنكية معقدة وبدون الحاجة لفيزا دولية.',
      cashHighlight: 'استلم فلوسك في يدك كاش',
    },
    storefront: {
      officialBadge: 'المنهج المصري المعتمد للشهادات والمراحل الدراسية',
      exploreBtn: 'تصفح الكورسات المتاحة',
      badgeInstaVodafone: 'الدفع متاح عبر فودافون كاش وإنستاباي',
      badgeDataSaver: 'ميزة توفير باقة الموبايل 360p متوفرة',
      catalogTitle: 'الكورسات والشروحات المتاحة',
      catalogSubtitle: 'محاضرات فيديو مرتبة مع تدريبات وحل نماذج الامتحانات السابقة.',
      coursesCount: 'كورسات متاحة',
      viewAndEnroll: 'تفاصيل المنهج والاشتراك ←',
      footerText: 'منصة LearnHub التعليمية • جميع الحقوق محفوظة للمعلم والأكاديمية',
      instructorPortal: 'دخول لوحة تحكم المعلم ←',
    },
    courseDetails: {
      backToStore: 'العودة لموقع المدرس الرئيسي',
      freePreviewBadge: 'محاضرة معاينة مجانية',
      fastVideoNotice: 'فيديو محمي سريع بدون تقطيع',
      unlockNoticeTitle: 'اشترك في الكورس لفتح جميع المحاضرات',
      unlockNoticeDesc: 'قم بتحويل الرسوم وارفع صورة الإيصال بالأسفل لفتح المحتوى فوراً.',
      lessonsCount: 'محاضرات كاملة',
      lifetimeAccess: 'إمكانية المشاهدة طوال العام',
      mentorship: 'متابعة مباشرة مع أستاذ المادة',
      syllabusTitle: 'محتوى ومنهج الكورس بالتفصيل',
      watchPreview: 'مشاهدة المعاينة',
      locked: 'محاضرة مخصصة للمشتركين',
    },
    classroom: {
      exitClassroom: 'الخروج من الفصل',
      progress: 'نسبة الإنجاز',
      completed: 'تمت المشاهدة',
      markComplete: 'تحديد كمكتمل',
      aiTitle: 'المساعد الذكي الخاص بالمادة',
      aiSubtitle: 'يجيب على أسئلتك مستنداً بشكل مباشر على شرح المدرس ومذكرات المحاضرة',
      aiInitialGreeting: 'أهلاً بك يا بطل! أنا المساعد الذكي لمادة الفيزياء. إذا واجهتك أي مسألة أو قانون يحتاج توضيح في هذه المحاضرة، اسألني في أي وقت!',
      aiInputPlaceholder: 'اكتب سؤالك أو النقطة غير المفهومة في المحاضرة...',
      aiSend: 'إرسال',
      playlistTitle: 'قائمة محاضرات الكورس',
      fileSizeMb: 'ميجابايت',
    },
    checkout: {
      enrollTitle: 'الاشتراك في الكورس',
      totalPrice: 'قيمة الاشتراك',
      instapayTitle: 'تحويل إنستاباي (InstaPay)',
      instapaySubtitle: 'تحويل فوري عبر التطبيق أو الحساب',
      vodafoneCashTitle: 'محفظة فودافون كاش',
      vodafoneCashSubtitle: 'تحويل مباشر من محفظة الموبايل',
      step1: 'الخطوة 1: تحويل رسوم الكورس إلى المعلم',
      step2: 'الخطوة 2: رفع صورة إيصال أو رسالة التحويل',
      copy: 'نسخ',
      copied: 'تم النسخ!',
      alertNotice: 'تأكد من أن صورة التحويل توضح رقم العملية والمبلغ المحول بوضوح.',
      uploadPlaceholder: 'اضغط لرفع سكرين شوت إيصال التحويل',
      uploadHint: 'الصيغ المدعومة: PNG أو JPG أو WebP (حتى 5 ميجا)',
      submitCta: 'تأكيد التحويل وإرسال الإيصال للمعلم',
      submitting: 'جارٍ إرسال الإيصال للمعلم...',
      successTitle: 'تم استلام إيصال التحويل بنجاح!',
      successDesc: 'تم إرسال إيصال الدفع إلى معلمك لتأكيده. بمجرد المراجعة، سيتم فتح جميع محاضرات الكورس لك فوراً.',
      pendingStatus: 'قيد تأكيد المعلم',
      egpNoticeTitle: 'طريقة دفع مصرية مباشرة 100%',
      egpNoticeDesc: 'لا تحتاج لبطاقات بنكية دولية. ادفع بسهولة من أي محفظة موبايل أو تطبيق بنكي.',
    },
    player: {
      engineTitle: 'مشغل محاضرات الفيديو الذكي',
      engineDescAuto: 'يعمل تلقائياً بأفضل جودة تناسب سرعة اتصالك',
      engineDescSaver: 'ميزة توفير باقة النت 360p مفعلة (~180 ميجا لكل ساعة)',
      saverActive: 'وضع توفير الباقة 360p يعمل الآن',
      enableSaver: 'تشغيل وضع توفير باقة النت 360p',
      freePreview: 'محاضرة معاينة مجانية',
      locked: 'محتوى مخصص للطلاب المشتركين',
      watchPreview: 'مشاهدة المعاينة',
    },
    dashboard: {
      portalTitle: 'لوحة تحكم وإدارة الأكاديمية',
      previewLive: 'معاينة موقعك كما يراه الطالب',
      storageTitle: 'مساحة الفيديوهات المستخدمة',
      studentsTitle: 'الطلاب المشتركون',
      planTitle: 'باقتك الحالية',
      receiptsTab: 'طلبات الاشتراك والتحويلات الجديدة',
      coursesTab: 'إدارة الكورسات والمحاضرات',
      queueTitle: 'إيصالات تحويلات الطلاب (فودافون كاش وإنستاباي)',
      queueDesc: 'راجع صور التحويلات واضغط "تفعيل" لفتح الكورس للطالب فوراً.',
      approve: 'تفعيل الكورس للطالب',
      reject: 'رفض الطلب',
      approved: 'مفعل ومتاح للطالب',
      rejected: 'طلب مرفوض',
      pending: 'في انتظار مراجعتك',
      viewReceipt: 'عرض صورة الإيصال',
      newCourse: '+ إضافة كورس جديد',
      addLecture: '+ إضافة محاضرة فيديو',
    },
  },
};
