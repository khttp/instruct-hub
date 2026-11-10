'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { initialTenants, initialCourses } from '@/lib/data-store';
import { Course, Tenant } from '@/types/database';
import { Video, ArrowRight, ShieldCheck, CheckCircle2, User, LogOut, Mail } from 'lucide-react';
import { translations, Locale } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';
import { StudentAuthModal } from '@/components/StudentAuthModal';
import { signOutStudent, useStudentSession } from '@/lib/student-auth';
import { getTenantUrl } from '@/lib/tenant-url';
import { supabase } from '@/lib/supabase/client';

export default function TenantPage() {
  const params = useParams();
  const subdomain = (params?.subdomain as string) || 'physics-pro';
  const knownTenant = initialTenants[subdomain] ?? null;
  const [tenant, setTenant] = useState<Tenant | null>(knownTenant);
  const [courses, setCourses] = useState<Course[]>(
    knownTenant ? initialCourses.filter((course) => course.tenant_id === knownTenant.id) : []
  );
  const [tenantStatus, setTenantStatus] = useState<'loading' | 'ready' | 'not-found' | 'error'>(
    'loading'
  );

  const [locale, setLocale] = useState<Locale>('ar'); // Default Egyptian Arabic
  const student = useStudentSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const showDemoTenant = () => {
      if (!active || !knownTenant) return false;
      setTenant(knownTenant);
      setCourses(initialCourses.filter((course) => course.tenant_id === knownTenant.id));
      setTenantStatus('ready');
      return true;
    };

    void (async () => {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('subdomain', subdomain)
          .maybeSingle();
        if (!active) return;
        if (error) {
          console.error('Could not load academy storefront:', error.message);
          setTenantStatus('error');
          return;
        }
        if (!data) {
          if (!showDemoTenant()) setTenantStatus('not-found');
          return;
        }

        const { data: courseData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('tenant_id', data.id)
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        if (!active) return;
        if (coursesError) {
          console.error('Could not load academy courses:', coursesError.message);
          setTenantStatus('error');
          return;
        }

        setTenant(data as Tenant);
        setCourses((courseData ?? []) as Course[]);
        setTenantStatus('ready');
      } catch (error) {
        if (!active) return;
        console.error('Could not load academy storefront:', error);
        setTenantStatus('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [knownTenant, subdomain]);

  const handleLogout = async () => {
    try {
      await signOutStudent();
    } catch (error) {
      console.error('Could not sign out student:', error);
    }
  };

  const t = translations[locale].storefront;
  const isRtl = locale === 'ar';

  if (tenantStatus === 'loading') {
    return <main className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">
      {isRtl ? 'جارٍ تحميل الموقع...' : 'Loading academy...'}
    </main>;
  }

  if (tenantStatus !== 'ready' || !tenant) {
    const message = tenantStatus === 'not-found'
      ? (isRtl ? 'لم يتم العثور على هذا الموقع التعليمي.' : 'This academy page was not found.')
      : (isRtl ? 'تعذّر تحميل الموقع. حاول مرة أخرى لاحقاً.' : 'Could not load this academy. Please try again later.');
    return <main className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <p>{message}</p>
      <Link href="/" className="text-sky-400 hover:text-sky-300">{isRtl ? 'العودة للرئيسية' : 'Back to LearnHub'}</Link>
    </main>;
  }

  const theme = tenant.theme_settings;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white"
    >
      {/* Dynamic Tenant Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              title={isRtl ? 'الرئيسية' : 'Home'}
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: theme.primary_color }}
            >
              {theme.school_name.charAt(0)}
            </Link>
            <div>
              <span className="font-bold text-base sm:text-lg text-white block leading-tight">
                {theme.school_name}
              </span>
              <span dir="ltr" className="text-xs text-slate-400 font-mono block text-left">
                {getTenantUrl(subdomain).replace(/^https?:\/\//, '')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Student Auth Header State */}
            {student ? (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 py-1 px-2.5 rounded-xl text-xs">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="hidden sm:block text-start leading-tight">
                  <div className="font-bold text-white text-xs">{student.fullName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{student.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title={isRtl ? 'تسجيل خروج' : 'Log out'}
                  className="p-1 hover:text-rose-400 text-slate-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span>{isRtl ? 'دخول الطالب بالبريد الإلكتروني' : 'Student Login'}</span>
              </button>
            )}

            <LanguageToggle locale={locale} onToggle={setLocale} />
            <Link
              href="/app"
              className="hidden md:inline-block text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {t.instructorPortal}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner with Custom Theme Accents */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            {t.officialBadge}
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            {theme.banner_headline || theme.school_name}
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            {theme.bio}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#courses"
              className="px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-transform hover:-translate-y-0.5 flex items-center gap-2"
              style={{ backgroundColor: theme.primary_color }}
            >
              {t.exploreBtn} <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </a>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {t.badgeInstaVodafone}
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {t.badgeDataSaver}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Course Catalog */}
      <section id="courses" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{t.catalogTitle}</h2>
            <p className="text-sm text-slate-400 mt-1">{t.catalogSubtitle}</p>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {courses.length} {t.coursesCount}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all hover:shadow-2xl flex flex-col"
            >
              {course.thumbnail_url && (
                <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className={`absolute top-3 ${isRtl ? 'left-3' : 'right-3'} px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur text-xs font-bold text-sky-400 border border-slate-700`}>
                    {course.price_egp} {isRtl ? 'ج.م' : 'EGP'}
                  </div>
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-3 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Video className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isRtl ? 'فيديو ذكي موفر للباقة' : 'Smart Video'}</span>
                  </div>
                  <Link
                    href={`/tenants/${tenant.subdomain}/courses/${course.id}`}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all shadow flex items-center gap-1"
                    style={{ backgroundColor: theme.primary_color }}
                  >
                    {t.viewAndEnroll}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        {courses.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
            {isRtl ? 'لا توجد كورسات منشورة حالياً.' : 'There are no published courses yet.'}
          </p>
        )}
      </section>

      {/* Student Auth Modal */}
      <StudentAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        locale={locale}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 text-center text-xs text-slate-500 bg-slate-950">
        <p>{t.footerText}</p>
      </footer>
    </div>
  );
}
