import { Course, Enrollment, Lecture, Tenant, QUOTA_TIER_LIMITS } from '@/types/database';

export const initialTenants: Record<string, Tenant> = {
  'physics-pro': {
    id: 'tenant-physics-001',
    organization_id: null,
    subdomain: 'physics-pro',
    custom_domain: null,
    tier: 'basic',
    theme_settings: {
      template: 'modern',
      primary_color: '#0284c7', // Sky 600
      accent_color: '#38bdf8',
      school_name: 'أكاديمية د. أحمد للفيزياء (Physics Pro)',
      banner_headline: 'شرح مادة الفيزياء للثانوية العامة مع د. أحمد',
      bio: 'خبرة أكثر من 12 عاماً في تدريس منهج الفيزياء للثانوية العامة والشهادات المعادلة بالقاهرة.',
      instructor_vodafone_cash: '01012345678',
      instructor_instapay_id: 'ahmed.physics@instapay',
    },
    storage_used_bytes: 1.2 * 1024 * 1024 * 1024, // 1.2 GB
    active_students_count: 24,
    created_at: new Date().toISOString(),
  },
  'math-master': {
    id: 'tenant-math-002',
    organization_id: null,
    subdomain: 'math-master',
    custom_domain: 'math.egypt-edu.com',
    tier: 'pro',
    theme_settings: {
      template: 'academy',
      primary_color: '#10b981', // Emerald 500
      accent_color: '#059669',
      school_name: 'سنتر الرياضيات المتخصص (Math Master)',
      banner_headline: 'برامج التفوق في التفاضل والتكامل والجبر والهندسة',
      bio: 'إعداد متخصص لطلاب مدارس المتفوقين والثانوية العامة مع حل أهم أفكار امتحانات الأعوام السابقة.',
      instructor_vodafone_cash: '01198765432',
      instructor_instapay_id: 'math.academy@instapay',
    },
    storage_used_bytes: 8.4 * 1024 * 1024 * 1024, // 8.4 GB
    active_students_count: 142,
    created_at: new Date().toISOString(),
  },
};

export const initialCourses: Course[] = [
  {
    id: 'course-phy-101',
    tenant_id: 'tenant-physics-001',
    title: 'التيار الكهربي وقانون أوم وقوانين كيرشوف (دفعة 2026)',
    description: 'شرح تفصيلي شامل من الصفر لقوانين الدوائر الكهربية، وتوصيل المقاومات، وحل المسائل الصعبة وأسئلة بنك المعرفة.',
    thumbnail_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80',
    price_egp: 350.0,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'course-phy-102',
    tenant_id: 'tenant-physics-001',
    title: 'الفيزياء الحديثة وازدواجية الموجة والجسيم',
    description: 'إشعاع الجسم الأسود، الظاهرة الكهروضوئية، وظاهرة كومتون ونموذج بور مع مراجعة نهائية على الباب الخامس.',
    thumbnail_url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
    price_egp: 280.0,
    is_published: true,
    created_at: new Date().toISOString(),
  },
];

export const initialLectures: Lecture[] = [
  {
    id: 'lec-01',
    course_id: 'course-phy-101',
    title: 'المحاضرة 1: شدة التيار الكهربي وفرق الجهد وقانون أوم',
    description: 'محاضرة تأسيسية مجانية لشرح الشحنات الكهربية والمفهوم الفيزيائي لفرق الجهد.',
    cloudflare_stream_id: '5d5ba37938e5692697963b15b22692bf',
    file_size_bytes: 240 * 1024 * 1024, // 240 MB
    sort_order: 1,
    is_free_preview: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'lec-02',
    course_id: 'course-phy-101',
    title: 'المحاضرة 2: المقاومة النوعية والتوصيلية الكهربية',
    description: 'العوامل المؤثرة على مقاومة الموصل وأفكار إعادة تشكيل وسحب الأسلاك.',
    cloudflare_stream_id: 'b5e5f58c73de2986429b4662d53bf574',
    file_size_bytes: 310 * 1024 * 1024,
    sort_order: 2,
    is_free_preview: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'lec-03',
    course_id: 'course-phy-101',
    title: 'المحاضرة 3: توصيل المقاومات على التوالي والتوازي وطرق اختزال الدوائر',
    description: 'طريقة النقاط، وحساب المقاومة المكافئة، وحالات إلغاء المقاومات.',
    cloudflare_stream_id: '5d5ba37938e5692697963b15b22692bf',
    file_size_bytes: 420 * 1024 * 1024,
    sort_order: 3,
    is_free_preview: false,
    created_at: new Date().toISOString(),
  },
];

export const initialEnrollments: Enrollment[] = [
  {
    id: 'enr-001',
    course_id: 'course-phy-101',
    student_id: '01011223344',
    payment_status: 'pending',
    payment_receipt_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    payment_method: 'manual_instapay',
    reviewed_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'enr-002',
    course_id: 'course-phy-101',
    student_id: '01122334455',
    payment_status: 'approved',
    payment_receipt_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    payment_method: 'manual_vodafone_cash',
    reviewed_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 26).toISOString(),
  },
];

export function checkTenantQuota(tenant: Tenant, newFileSizeBytes = 0) {
  const limits = QUOTA_TIER_LIMITS[tenant.tier];
  const projectedStorage = tenant.storage_used_bytes + newFileSizeBytes;
  const storageAllowed = projectedStorage <= limits.maxStorageBytes;
  const studentsAllowed = tenant.active_students_count < limits.maxActiveStudents;

  return {
    storageAllowed,
    studentsAllowed,
    limits,
    projectedStorage,
    storagePercent: Math.min(100, Math.round((tenant.storage_used_bytes / limits.maxStorageBytes) * 100)),
  };
}
