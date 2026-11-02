'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { initialTenants, initialCourses, initialEnrollments, checkTenantQuota } from '@/lib/data-store';
import { Course, Lecture, SubscriptionTier, QUOTA_TIER_LIMITS, Tenant } from '@/types/database';
import { updateEnrollmentStatus, useEnrollments } from '@/lib/enrollment-store';
import {
  Users,
  HardDrive,
  CreditCard,
  CheckCircle,
  XCircle,
  Plus,
  ExternalLink,
  Video,
  Eye,
  Share2,
  Copy,
  Check,
  MessageCircle,
  QrCode,
  Pencil,
  Trash2,
} from 'lucide-react';
import { translations, Locale } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ShareWebsiteModal } from '@/components/ShareWebsiteModal';
import { getTenantUrl } from '@/lib/tenant-url';
import { supabase } from '@/lib/supabase/client';

export default function InstructorDashboard() {
  const [locale, setLocale] = useState<Locale>('ar'); // Default Egyptian Arabic
  const [activeTab, setActiveTab] = useState<'receipts' | 'courses'>('receipts');
  const [baseTenant, setTenant] = useState(initialTenants['physics-pro']);
  const [dashboardStatus, setDashboardStatus] = useState<'loading' | 'signed-out' | 'no-site' | 'ready' | 'error'>('loading');
  const [dashboardError, setDashboardError] = useState('');
  const enrollments = useEnrollments();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const tenantCourseIds = new Set(courses.filter((course) => course.tenant_id === baseTenant.id).map((course) => course.id));
  const activeStudentIds = new Set(
    enrollments
      .filter((enrollment) => tenantCourseIds.has(enrollment.course_id) && enrollment.payment_status === 'approved')
      .map((enrollment) => enrollment.student_id)
  );
  const initialTenantCourseIds = new Set(
    initialCourses.filter((course) => course.tenant_id === baseTenant.id).map((course) => course.id)
  );
  const initialActiveStudentIds = new Set(
    initialEnrollments
      .filter((enrollment) => initialTenantCourseIds.has(enrollment.course_id) && enrollment.payment_status === 'approved')
      .map((enrollment) => enrollment.student_id)
  );
  const tenant = {
    ...baseTenant,
    active_students_count: Math.max(
      0,
      baseTenant.active_students_count + activeStudentIds.size - initialActiveStudentIds.size
    ),
  };
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  // Sharing Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // New Course Modal State
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState('350');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseThumbnailUrl, setNewCourseThumbnailUrl] = useState('');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [courseError, setCourseError] = useState('');
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState('');
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newLectureDescription, setNewLectureDescription] = useState('');
  const [newLectureStreamId, setNewLectureStreamId] = useState('');
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [isCreatingLecture, setIsCreatingLecture] = useState(false);

  const t = translations[locale].dashboard;
  const isRtl = locale === 'ar';
  const publicUrl = getTenantUrl(tenant.subdomain);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          if (active) setDashboardStatus('signed-out');
          return;
        }

        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('owner_id', sessionData.session.user.id)
          .maybeSingle();
        if (tenantError) throw tenantError;
        if (!tenantData) {
          if (active) setDashboardStatus('no-site');
          return;
        }

        const { data: courseData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .order('created_at', { ascending: false });
        if (coursesError) throw coursesError;
        const loadedCourses = (courseData ?? []) as Course[];
        const courseIds = loadedCourses.map((course) => course.id);
        const { data: lectureData, error: lecturesError } = courseIds.length > 0
          ? await supabase
            .from('lectures')
            .select('*')
            .in('course_id', courseIds)
            .order('sort_order', { ascending: true })
          : { data: [], error: null };
        if (lecturesError) throw lecturesError;
        if (!active) return;

        setTenant(tenantData as Tenant);
        setCourses(loadedCourses);
        setLectures((lectureData ?? []) as Lecture[]);
        setTargetCourseId(loadedCourses[0]?.id ?? '');
        setDashboardStatus('ready');
      } catch (error) {
        if (!active) return;
        setDashboardError(error instanceof Error ? error.message : 'Could not load your instructor dashboard.');
        setDashboardStatus('error');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Calculate live quotas
  const quotaInfo = checkTenantQuota(tenant);
  const tierLimit = QUOTA_TIER_LIMITS[tenant.tier];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    isRtl
      ? `أهلاً بكم يا شباب! ده موقعي التعليمي الرسمي (${tenant.theme_settings.school_name}) لمتابعة شروحات الكورسات ومحاضرات المراجعة وحل المسائل أونلاين:\n${publicUrl}`
      : `Hello students! Here is my official academy website (${tenant.theme_settings.school_name}) to watch lecture videos and practice exercises:\n${publicUrl}`
  )}`;

  // Approve or Reject Enrollment
  const handleToggleEnrollmentStatus = (enrollmentId: string, status: 'approved' | 'rejected' | 'pending') => {
    const enrollment = enrollments.find((item) => item.id === enrollmentId);
    if (!enrollment || enrollment.payment_status === status) return;
    updateEnrollmentStatus(enrollmentId, status);
  };

  // Add Course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(newCoursePrice);
    if (!newCourseTitle.trim() || !Number.isFinite(price) || price < 0) {
      setCourseError(isRtl ? 'أدخل اسم الكورس وسعراً صحيحاً.' : 'Enter a course title and a valid non-negative price.');
      return;
    }
    const thumbnailUrl = newCourseThumbnailUrl.trim();
    if (thumbnailUrl) {
      try {
        const parsedUrl = new URL(thumbnailUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Unsupported image URL protocol');
      } catch {
        setCourseError(isRtl
          ? 'أدخل رابط صورة صحيحاً يبدأ بـ https:// أو http://.'
          : 'Enter a valid image URL starting with https:// or http://.');
        return;
      }
    }

    setCourseError('');
    setIsCreatingCourse(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        setDashboardStatus('signed-out');
        return;
      }

      const courseChanges = {
        title: newCourseTitle.trim(),
        description: newCourseDesc.trim(),
        price_egp: price,
        thumbnail_url: thumbnailUrl || null,
      };
      const query = editingCourseId
        ? supabase
          .from('courses')
          .update(courseChanges)
          .eq('id', editingCourseId)
          .eq('tenant_id', tenant.id)
        : supabase.from('courses').insert({
          ...courseChanges,
          tenant_id: tenant.id,
          is_published: false,
        });
      const { data, error } = await query.select('*').single();
      if (error) throw error;

      setCourses((previous) => editingCourseId
        ? previous.map((item) => item.id === editingCourseId ? data as Course : item)
        : [data as Course, ...previous]);
      setIsAddCourseOpen(false);
      setEditingCourseId(null);
      setNewCourseTitle('');
      setNewCoursePrice('350');
      setNewCourseDesc('');
      setNewCourseThumbnailUrl('');
    } catch (error) {
      setCourseError(error instanceof Error ? error.message : (isRtl ? 'تعذر إنشاء الكورس.' : 'Could not create the course.'));
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const startEditingCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setNewCourseTitle(course.title);
    setNewCoursePrice(String(course.price_egp));
    setNewCourseDesc(course.description ?? '');
    setNewCourseThumbnailUrl(course.thumbnail_url ?? '');
    setCourseError('');
    setIsAddCourseOpen(true);
  };

  const handleDeleteCourse = async (course: Course) => {
    const confirmed = window.confirm(isRtl
      ? `هل تريد حذف كورس "${course.title}"؟ سيؤدي ذلك أيضاً إلى حذف المحاضرات والتسجيلات المرتبطة به، ولا يمكن التراجع.`
      : `Delete "${course.title}"? Its lessons and enrollments will also be deleted. This cannot be undone.`);
    if (!confirmed) return;

    setCourseError('');
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        setDashboardStatus('signed-out');
        return;
      }

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id)
        .eq('tenant_id', tenant.id);
      if (error) throw error;
      setCourses((previous) => previous.filter((item) => item.id !== course.id));
    } catch (error) {
      setCourseError(error instanceof Error ? error.message : (isRtl ? 'تعذر حذف الكورس.' : 'Could not delete the course.'));
    }
  };

  const handleToggleCoursePublished = async (course: Course) => {
    setCourseError('');
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        setDashboardStatus('signed-out');
        return;
      }

      const { data, error } = await supabase
        .from('courses')
        .update({ is_published: !course.is_published })
        .eq('id', course.id)
        .eq('tenant_id', tenant.id)
        .select('*')
        .single();
      if (error) throw error;
      setCourses((previous) => previous.map((item) => item.id === course.id ? data as Course : item));
    } catch (error) {
      setCourseError(error instanceof Error ? error.message : (isRtl ? 'تعذر تحديث حالة الكورس.' : 'Could not update course status.'));
    }
  };

  const handleCreateLecture = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newLectureTitle.trim();
    const streamId = newLectureStreamId.trim();
    if (!targetCourseId || !title || !streamId) {
      setCourseError(isRtl ? 'اختر كورساً وأدخل عنوان المحاضرة ومعرّف فيديو Cloudflare.' : 'Select a course and enter a lesson title and Cloudflare Stream video ID.');
      return;
    }

    setCourseError('');
    setIsCreatingLecture(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        setDashboardStatus('signed-out');
        return;
      }

      const nextSortOrder = lectures
        .filter((lecture) => lecture.course_id === targetCourseId)
        .reduce((maximum, lecture) => Math.max(maximum, lecture.sort_order), 0) + 1;
      const { data, error } = await supabase
        .from('lectures')
        .insert({
          course_id: targetCourseId,
          title,
          description: newLectureDescription.trim(),
          cloudflare_stream_id: streamId,
          sort_order: nextSortOrder,
          is_free_preview: isFreePreview,
        })
        .select('*')
        .single();
      if (error) throw error;

      setLectures((previous) => [...previous, data as Lecture]);
      setIsAddLectureOpen(false);
      setNewLectureTitle('');
      setNewLectureDescription('');
      setNewLectureStreamId('');
      setIsFreePreview(false);
    } catch (error) {
      setCourseError(error instanceof Error ? error.message : (isRtl ? 'تعذر حفظ المحاضرة.' : 'Could not save the lesson.'));
    } finally {
      setIsCreatingLecture(false);
    }
  };

  if (dashboardStatus !== 'ready') {
    const message = dashboardStatus === 'loading'
      ? (isRtl ? 'جارٍ تحميل لوحة التحكم...' : 'Loading your dashboard...')
      : dashboardStatus === 'signed-out'
        ? (isRtl ? 'سجّل الدخول من الصفحة الرئيسية لفتح لوحة التحكم.' : 'Sign in from the home page to open your dashboard.')
        : dashboardStatus === 'no-site'
          ? (isRtl ? 'أنشئ موقعك التعليمي أولاً من الصفحة الرئيسية.' : 'Create your academy website from the home page first.')
          : (dashboardError || (isRtl ? 'تعذر تحميل لوحة التحكم.' : 'Could not load your dashboard.'));
    return (
      <main dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p role={dashboardStatus === 'error' ? 'alert' : 'status'}>{message}</p>
        <Link href="/" className="text-sky-400 hover:text-sky-300">{isRtl ? 'العودة إلى الرئيسية' : 'Back to LearnHub'}</Link>
      </main>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center font-bold text-white shadow-md">
              LH
            </div>
            <div>
              <div className="font-bold text-sm text-white">{t.portalTitle}</div>
              <div className="text-xs text-slate-400">
                {tenant.theme_settings.school_name}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isRtl ? 'مشاركة الموقع للطلاب' : 'Share Website'}</span>
            </button>
            <LanguageToggle locale={locale} onToggle={setLocale} />
            <Link
              href={`/tenants/${tenant.subdomain}`}
              target="_blank"
              className="hidden sm:flex px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-400 items-center gap-1.5 border border-slate-700 transition-colors"
            >
              {t.previewLive} <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* NEW: Public Website Live & Student Sharing Bar */}
        <div className="bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-start">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href="/app/site"
                  className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  {isRtl ? 'تعديل الموقع' : 'Edit website'}
                </Link>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-bold text-white text-sm">
                  {isRtl ? 'موقعك متاح أونلاين الآن لجميع الطلاب' : 'Your Website is Public & Active Worldwide'}
                </h3>
              </div>
              <div dir="ltr" className="font-mono text-xs text-sky-300 mt-0.5">
                {publicUrl}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? (isRtl ? 'تم النسخ' : 'Copied') : (isRtl ? 'نسخ الرابط' : 'Copy Link')}</span>
            </button>

            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{isRtl ? 'واتساب' : 'WhatsApp'}</span>
            </a>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{isRtl ? 'رمز QR للمذكرات' : 'QR Code'}</span>
            </button>
          </div>
        </div>

        {/* Metric Cards - Teacher Friendly */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Storage */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">{t.storageTitle}</span>
              <HardDrive className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {(tenant.storage_used_bytes / (1024 * 1024 * 1024)).toFixed(2)}{' '}
              <span className="text-sm font-normal text-slate-400">/ {tierLimit.maxStorageGB} {isRtl ? 'جيجا' : 'GB'}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-sky-500 h-2 rounded-full transition-all"
                style={{ width: `${quotaInfo.storagePercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex justify-between">
              <span>{quotaInfo.storagePercent}% {isRtl ? 'مستخدم' : 'Used'}</span>
              <span>{isRtl ? (tenant.tier === 'basic' ? 'باقة مجانية' : tenant.tier === 'pro' ? 'باقة برو' : 'باقة أكاديمية') : tierLimit.name}</span>
            </div>
          </div>

          {/* Active Students */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">{t.studentsTitle}</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {tenant.active_students_count}{' '}
              <span className="text-sm font-normal text-slate-400">
                / {tierLimit.maxActiveStudents === Infinity ? (isRtl ? 'غير محدود' : 'Unlimited') : tierLimit.maxActiveStudents}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    tierLimit.maxActiveStudents === Infinity
                      ? 20
                      : Math.min(100, Math.round((tenant.active_students_count / tierLimit.maxActiveStudents) * 100))
                  }%`,
                }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              {isRtl ? 'الطلاب المشتركون الذين تم تفعيل كورساتهم' : 'Enrolled students with active course access'}
            </div>
          </div>

          {/* Subscription Tier */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">{t.planTitle}</span>
              <CreditCard className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white capitalize">
              {isRtl ? (tenant.tier === 'basic' ? 'الباقة المجانية' : tenant.tier === 'pro' ? 'باقة المحترفين (Pro)' : 'باقة الأكاديمية') : `${tenant.tier} Plan`}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {tenant.tier === 'basic' ? (isRtl ? '0 جنيه مصاريف شهرية • 5% على كل مبيعة' : '$0 monthly fee • 5% per sale') : `${tierLimit.monthlyFeeEGP} ${isRtl ? 'جنيه شهرياً' : 'EGP/month'}`}
            </div>
            <div className="mt-3 flex gap-2">
              {(['basic', 'pro', 'academy'] as SubscriptionTier[]).map((tr) => (
                <button
                  key={tr}
                  onClick={() => setTenant((prev) => ({ ...prev, tier: tr }))}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded capitalize transition-all border ${
                    tenant.tier === tr
                      ? 'bg-purple-600/30 text-purple-300 border-purple-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {isRtl ? (tr === 'basic' ? 'بيسك' : tr === 'pro' ? 'برو' : 'أكاديمي') : tr}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('receipts')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'receipts' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.receiptsTab} ({enrollments.filter((e) => e.payment_status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'courses' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.coursesTab} ({courses.length})
          </button>
        </div>

        {/* Tab 1: Manual Receipt Verification Dashboard */}
        {activeTab === 'receipts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{t.queueTitle}</h2>
                <p className="text-xs text-slate-400">{t.queueDesc}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'اسم الطالب / الهاتف' : 'Student / Phone'}</th>
                      <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'الكورس' : 'Course'}</th>
                      <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'طريقة التحويل' : 'Payment Method'}</th>
                      <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'إيصال التحويل' : 'Transfer Screenshot'}</th>
                      <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'حالة الطلب' : 'Status'}</th>
                      <th className={`p-4 ${isRtl ? 'text-left' : 'text-right'}`}>{isRtl ? 'قرار التفعيل' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {enrollments.map((enr) => {
                      const course = courses.find((c) => c.id === enr.course_id);
                      return (
                        <tr key={enr.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-medium text-slate-300">{enr.student_id}</td>
                          <td className="p-4 text-white font-medium">{course?.title || enr.course_id}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                              {enr.payment_method === 'manual_instapay'
                                ? (isRtl ? 'إنستاباي (InstaPay)' : 'InstaPay')
                                : (isRtl ? 'فودافون كاش' : 'Vodafone Cash')}
                            </span>
                          </td>
                          <td className="p-4">
                            {enr.payment_receipt_url ? (
                              <button
                                onClick={() => setSelectedReceiptUrl(enr.payment_receipt_url || null)}
                                className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold"
                              >
                                <Eye className="w-3.5 h-3.5" /> {t.viewReceipt}
                              </button>
                            ) : (
                              <span className="text-slate-500 italic">{isRtl ? 'لا يوجد صورة' : 'No attachment'}</span>
                            )}
                          </td>
                          <td className="p-4">
                            {enr.payment_status === 'pending' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                {t.pending}
                              </span>
                            )}
                            {enr.payment_status === 'approved' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {t.approved}
                              </span>
                            )}
                            {enr.payment_status === 'rejected' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                {t.rejected}
                              </span>
                            )}
                          </td>
                          <td className={`p-4 ${isRtl ? 'text-left' : 'text-right'} space-x-2`}>
                            {enr.payment_status === 'pending' ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleToggleEnrollmentStatus(enr.id, 'approved')}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1 shadow"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> {t.approve}
                                </button>
                                <button
                                  onClick={() => handleToggleEnrollmentStatus(enr.id, 'rejected')}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 font-bold text-xs inline-flex items-center gap-1 border border-slate-700"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> {t.reject}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleToggleEnrollmentStatus(enr.id, 'pending')}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px]"
                              >
                                {isRtl ? 'إعادة للمراجعة' : 'Reset Status'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Course & Lecture Management */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{isRtl ? 'قائمة الكورسات والمحاضرات' : 'Courses & Video Lessons'}</h2>
                <p className="text-xs text-slate-400">{isRtl ? 'أضف كورسات جديدة وارفع شروحات الفيديو لطلابك' : 'Manage your course content and lessons'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={courses.length === 0}
                  onClick={() => {
                    setTargetCourseId(courses[0]?.id ?? '');
                    setCourseError('');
                    setIsAddLectureOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs border border-slate-700 flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Video className="w-3.5 h-3.5" /> {t.addLecture}
                </button>
                <button
                  onClick={() => {
                    setEditingCourseId(null);
                    setNewCourseTitle('');
                    setNewCoursePrice('350');
                    setNewCourseDesc('');
                    setNewCourseThumbnailUrl('');
                    setCourseError('');
                    setIsAddCourseOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> {t.newCourse}
                </button>
              </div>
            </div>

            {courseError && <p role="alert" className="text-sm text-rose-400">{courseError}</p>}
            {courses.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
                {isRtl ? 'لا توجد كورسات بعد. أنشئ أول كورس ليظهر في لوحة التحكم.' : 'No courses yet. Create your first course to get started.'}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((c) => {
                const courseLectures = lectures.filter((l) => l.course_id === c.id);
                return (
                  <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    {c.thumbnail_url && (
                      <div className="aspect-video w-full overflow-hidden bg-slate-800">
                        <img src={c.thumbnail_url} alt={c.title} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-base text-white">{c.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>
                      </div>
                      <span className="text-sm font-extrabold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20">
                        {c.price_egp} {isRtl ? 'ج.م' : 'EGP'}
                      </span>
                    </div>
                    <div className="mb-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => startEditingCourse(c)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" /> {isRtl ? 'تعديل' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCourse(c)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> {isRtl ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${c.is_published ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
                        {c.is_published ? (isRtl ? 'منشور' : 'Published') : (isRtl ? 'مسودة' : 'Draft')}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleToggleCoursePublished(c)}
                        className="text-xs font-semibold text-sky-400 hover:text-sky-300"
                      >
                        {c.is_published ? (isRtl ? 'إلغاء النشر' : 'Unpublish') : (isRtl ? 'نشر الكورس' : 'Publish course')}
                      </button>
                    </div>

                    <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                      {isRtl ? `المحاضرات (${courseLectures.length})` : `Lessons (${courseLectures.length})`}
                    </div>
                    <div className="space-y-2 mb-4">
                      {courseLectures.map((l) => (
                        <div
                          key={l.id}
                          className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Video className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className="text-slate-200 truncate max-w-xs">{l.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {l.is_free_preview && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                {isRtl ? 'معاينة مجانية' : 'Free Preview'}
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-slate-500">
                              {Math.round(l.file_size_bytes / (1024 * 1024))} {isRtl ? 'ميجابايت' : 'MB'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetCourseId(c.id);
                          setCourseError('');
                          setIsAddLectureOpen(true);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        {isRtl ? '+ إضافة محاضرة' : '+ Add lesson'}
                      </button>
                      <Link
                        href={`/tenants/${tenant.subdomain}/courses/${c.id}`}
                        target="_blank"
                        className="text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        {c.is_published
                          ? (isRtl ? 'فتح صفحة الكورس للطلاب ←' : 'Open student course page →')
                          : (isRtl ? 'معاينة مسودة الكورس ←' : 'Preview course draft →')}
                      </Link>
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal: Receipt Preview */}
        {selectedReceiptUrl && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-base font-bold text-white mb-4">
                {isRtl ? 'صورة إيصال التحويل' : 'Transfer Screenshot Proof'}
              </h3>
              <img
                src={selectedReceiptUrl}
                alt="Receipt Full"
                className="w-full max-h-96 object-contain rounded-xl border border-slate-800 bg-black"
              />
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedReceiptUrl(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
                >
                  {isRtl ? 'إغلاق الصورة' : 'Close Preview'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isAddLectureOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <h3 className="mb-2 text-base font-bold text-white">{isRtl ? 'إضافة محاضرة للكورس' : 'Add lesson to course'}</h3>
              <p className="mb-5 text-xs text-slate-400">
                {isRtl
                  ? 'ارفع الفيديو إلى Cloudflare Stream أولاً، ثم الصق معرّف الفيديو هنا.'
                  : 'Upload your video to Cloudflare Stream first, then paste its video ID here.'}
              </p>
              <form onSubmit={(event) => void handleCreateLecture(event)} className="space-y-4 text-xs">
                <div>
                  <label htmlFor="lesson-course" className="mb-1 block font-semibold text-slate-400">{isRtl ? 'الكورس' : 'Course'}</label>
                  <select
                    id="lesson-course"
                    required
                    value={targetCourseId}
                    onChange={(event) => setTargetCourseId(event.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white"
                  >
                    {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="lesson-title" className="mb-1 block font-semibold text-slate-400">{isRtl ? 'عنوان المحاضرة' : 'Lesson title'}</label>
                  <input
                    id="lesson-title"
                    required
                    maxLength={255}
                    value={newLectureTitle}
                    onChange={(event) => setNewLectureTitle(event.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="lesson-description" className="mb-1 block font-semibold text-slate-400">{isRtl ? 'الوصف (اختياري)' : 'Description (optional)'}</label>
                  <textarea
                    id="lesson-description"
                    rows={3}
                    value={newLectureDescription}
                    onChange={(event) => setNewLectureDescription(event.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="lesson-stream-id" className="mb-1 block font-semibold text-slate-400">{isRtl ? 'معرّف فيديو Cloudflare Stream' : 'Cloudflare Stream video ID'}</label>
                  <input
                    id="lesson-stream-id"
                    required
                    maxLength={255}
                    value={newLectureStreamId}
                    onChange={(event) => setNewLectureStreamId(event.target.value)}
                    placeholder="e.g. 5d5ba37938e5692697963b15b22692bf"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 font-mono text-white"
                  />
                </div>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={isFreePreview} onChange={(event) => setIsFreePreview(event.target.checked)} />
                  {isRtl ? 'إتاحة هذه المحاضرة كمعاينة مجانية' : 'Make this lesson a free preview'}
                </label>
                {courseError && <p role="alert" className="text-rose-400">{courseError}</p>}
                <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddLectureOpen(false)}
                    className="rounded-xl bg-slate-800 px-4 py-2 font-bold text-white hover:bg-slate-700"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingLecture}
                    className="rounded-xl bg-sky-600 px-4 py-2 font-bold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreatingLecture ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : (isRtl ? 'حفظ المحاضرة' : 'Save lesson')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Share Website to Students */}
        <ShareWebsiteModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          subdomain={tenant.subdomain}
          academyName={tenant.theme_settings.school_name}
          locale={locale}
        />

        {/* Modal: Add Course */}
        {isAddCourseOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-base font-bold text-white mb-2">
                {editingCourseId
                  ? (isRtl ? 'تعديل الكورس' : 'Edit Course')
                  : (isRtl ? 'إنشاء كورس جديد' : 'Create New Course')}
              </h3>
              <form onSubmit={(event) => void handleCreateCourse(event)} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    {isRtl ? 'اسم الكورس' : 'Course Title'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={255}
                    placeholder={isRtl ? 'مثال: مراجعة نهائية فيزياء 2026' : 'e.g. Physics Final Revision 2026'}
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    {isRtl ? 'سعر الكورس (بالجنيه المصري)' : 'Price (EGP)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={newCoursePrice}
                    onChange={(e) => setNewCoursePrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    {isRtl ? 'وصف الكورس' : 'Description'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={isRtl ? 'اكتب نبذة عن الدروس والتمارين المشمولة...' : 'Overview of topics covered...'}
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="course-thumbnail-url" className="block text-slate-400 font-semibold mb-1">
                    {isRtl ? 'رابط صورة الكورس (اختياري)' : 'Course image URL (optional)'}
                  </label>
                  <input
                    id="course-thumbnail-url"
                    type="url"
                    placeholder="https://example.com/course-image.jpg"
                    value={newCourseThumbnailUrl}
                    onChange={(event) => setNewCourseThumbnailUrl(event.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                  {newCourseThumbnailUrl && (
                    <img
                      src={newCourseThumbnailUrl}
                      alt={isRtl ? 'معاينة صورة الكورس' : 'Course image preview'}
                      className="mt-3 aspect-video w-full rounded-lg border border-slate-800 bg-slate-950 object-cover"
                    />
                  )}
                </div>
                <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-slate-800">
                  {courseError && <p role="alert" className="me-auto self-center text-rose-400">{courseError}</p>}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddCourseOpen(false);
                      setEditingCourseId(null);
                      setCourseError('');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingCourse}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreatingCourse
                      ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...')
                      : editingCourseId
                        ? (isRtl ? 'حفظ التعديلات' : 'Save changes')
                        : (isRtl ? 'إنشاء الكورس' : 'Create Course')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
