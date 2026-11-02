'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { initialTenants, initialCourses, initialLectures } from '@/lib/data-store';
import { CloudflareStreamPlayer } from '@/components/CloudflareStreamPlayer';
import { ManualPaymentCheckout } from '@/components/ManualPaymentCheckout';
import { ArrowLeft, ArrowRight, Play, Lock, CheckCircle2, ShieldCheck, Clock, User, LogOut, Phone } from 'lucide-react';
import { translations, Locale } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';
import { setActiveStudentSession, useStudentSession } from '@/lib/student-auth';
import { StudentAuthModal } from '@/components/StudentAuthModal';

export default function CourseDetailsPage() {
  const params = useParams();
  const subdomain = (params?.subdomain as string) || 'physics-pro';
  const courseId = (params?.courseId as string) || 'course-phy-101';

  const [locale, setLocale] = useState<Locale>('ar'); // Default Egyptian Arabic
  const student = useStudentSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLogout = () => {
    setActiveStudentSession(null);
  };

  const t = translations[locale].courseDetails;
  const isRtl = locale === 'ar';

  const tenant = initialTenants[subdomain] || initialTenants['physics-pro'];
  const course = initialCourses.find((c) => c.id === courseId) || initialCourses[0];
  const lectures = initialLectures.filter((l) => l.course_id === course.id);

  const [activePreviewLecture, setActivePreviewLecture] = useState(
    lectures.find((l) => l.is_free_preview) || null
  );

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href={`/tenants/${tenant.subdomain}`}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{t.backToStore}</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Student Auth Header State */}
            {student ? (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 py-1 px-2.5 rounded-xl text-xs">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="hidden sm:block text-start leading-tight">
                  <div className="font-bold text-white text-xs">{student.fullName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{student.phoneNumber}</div>
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
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                <span>{isRtl ? 'دخول الطالب (بالهاتف و PIN)' : 'Student Login'}</span>
              </button>
            )}

            <LanguageToggle locale={locale} onToggle={setLocale} />
            <div dir="ltr" className="text-xs font-mono text-slate-400 hidden sm:block">
              {tenant.subdomain}.learnhub.me
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Left Section: Video Preview + Syllabus */}
          <div className="lg:col-span-2 space-y-8">
            {/* Free Preview Video Player */}
            {activePreviewLecture ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {t.freePreviewBadge}
                    </span>
                    <h2 className="text-base font-bold text-white">{activePreviewLecture.title}</h2>
                  </div>
                  <span className="text-xs text-slate-400">{t.fastVideoNotice}</span>
                </div>
                <CloudflareStreamPlayer
                  streamId={activePreviewLecture.cloudflare_stream_id}
                  title={activePreviewLecture.title}
                />
              </div>
            ) : (
              <div className="aspect-video bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center p-6 text-center">
                <div>
                  <Lock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white">{t.unlockNoticeTitle}</h3>
                  <p className="text-sm text-slate-400 mt-1">{t.unlockNoticeDesc}</p>
                </div>
              </div>
            )}

            {/* Course Title & Overview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                {course.title}
              </h1>
              <p className="text-slate-300 leading-relaxed mb-6">
                {course.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-sky-400" /> {lectures.length} {t.lessonsCount}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" /> {t.lifetimeAccess}
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" /> {t.mentorship}
                </div>
              </div>
            </div>

            {/* Curriculum Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
              <h3 className="text-xl font-bold text-white mb-4">{t.syllabusTitle}</h3>
              <div className="space-y-3">
                {lectures.map((lec, idx) => (
                  <div
                    key={lec.id}
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                      lec.is_free_preview
                        ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                    onClick={() => {
                      if (lec.is_free_preview) {
                        setActivePreviewLecture(lec);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          lec.is_free_preview ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{lec.title}</div>
                        <div className="text-xs text-slate-400">{lec.description}</div>
                      </div>
                    </div>

                    <div>
                      {lec.is_free_preview ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Play className="w-3.5 h-3.5" /> {t.watchPreview}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Lock className="w-3.5 h-3.5" /> {t.locked}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Localized Egyptian Checkout Rail */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ManualPaymentCheckout
                course={course}
                tenant={tenant}
              />

              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isRtl ? 'طريقة دفع مصرية 100%' : '100% Egyptian Local Payment'}</span>
                </div>
                {isRtl
                  ? 'لا تحتاج لبطاقة ائتمان أو فيزا دولية. ادفع بسهولة من محفظة فودافون كاش أو تطبيق إنستاباي.'
                  : 'No international credit card required. Pay directly via Vodafone Cash or InstaPay instant transfer.'}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Student Auth Modal */}
      <StudentAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        locale={locale}
      />
    </div>
  );
}
