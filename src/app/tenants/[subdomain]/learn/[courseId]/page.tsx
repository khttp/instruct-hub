'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CloudflareStreamPlayer } from '@/components/CloudflareStreamPlayer';
import { ArrowLeft, ArrowRight, CheckCircle2, Bot, Send, Sparkles } from 'lucide-react';
import { translations, Locale } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useStudentSession } from '@/lib/student-auth';
import { StudentAuthModal } from '@/components/StudentAuthModal';
import { supabase } from '@/lib/supabase/client';
import { Course, Lecture, Tenant } from '@/types/database';

export default function StudentClassroomPage() {
  const params = useParams();
  const subdomain = (params?.subdomain as string) || 'physics-pro';
  const courseId = (params?.courseId as string) || 'course-phy-101';

  const [locale, setLocale] = useState<Locale>('ar'); // Default Egyptian Arabic
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const t = translations[locale].classroom;
  const isRtl = locale === 'ar';
  const student = useStudentSession();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [pageStatus, setPageStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadedKey, setLoadedKey] = useState('');
  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [completedLectureIds, setCompletedLectureIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('subdomain', subdomain)
          .maybeSingle();
        if (tenantError) throw tenantError;
        if (!tenantData) throw new Error('Academy not found.');

        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .eq('tenant_id', tenantData.id)
          .maybeSingle();
        if (courseError) throw courseError;
        if (!courseData) throw new Error('Course not found or not published.');

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        let approved = false;
        if (sessionData.session) {
          const { data: enrollment, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('payment_status')
            .eq('course_id', courseId)
            .eq('student_id', sessionData.session.user.id)
            .maybeSingle();
          if (enrollmentError) throw enrollmentError;
          approved = enrollment?.payment_status === 'approved';
        }

        const { data: lectureData, error: lectureError } = await supabase
          .from('lectures')
          .select('*')
          .eq('course_id', courseId)
          .order('sort_order', { ascending: true });
        if (lectureError) throw lectureError;
        if (!active) return;

        const loadedLectures = (lectureData ?? []) as Lecture[];
        setTenant(tenantData as Tenant);
        setCourse(courseData as Course);
        setLectures(loadedLectures);
        setIsEnrolled(approved);
        setCurrentLecture(
          approved
            ? loadedLectures[0] ?? null
            : loadedLectures.find((lecture) => lecture.is_free_preview) ?? null
        );
        setLoadedKey(`${subdomain}:${courseId}:${sessionData.session?.user.id ?? 'anonymous'}`);
        setPageStatus('ready');
      } catch (error) {
        if (!active) return;
        console.error('Could not load student classroom:', error);
        setPageStatus('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [courseId, student?.id, subdomain]);

  // AI Assistant Chat state
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: t.aiInitialGreeting,
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim()) return;

    const userText = inputQuestion;
    setAiChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputQuestion('');

    setTimeout(() => {
      setAiChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: isRtl
            ? `بناءً على شرح المحاضرة "${currentLecture?.title}": تذكر أن قانون أوم ينص على أن V = I * R. في التوصيل على التوالي شدة التيار متساوية في جميع المقاومات، بينما يتجزأ فرق الجهد. هل تحب نحل مسألة معاً من أسئلة الواجب؟`
            : `Based on lecture "${currentLecture?.title}": Remember that Ohm's Law states V = I * R. In series circuits, current is constant while voltage divides according to resistor values. Want me to solve an example from the homework sheet?`,
        },
      ]);
    }, 1000);
  };

  const toggleCompleted = (id: string) => {
    setCompletedLectureIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const currentRequestKey = `${subdomain}:${courseId}:${student?.id ?? 'anonymous'}`;
  if (pageStatus !== 'ready' || loadedKey !== currentRequestKey || !tenant || !course) {
    const message = pageStatus === 'error'
      ? (isRtl ? 'تعذر تحميل هذا الكورس أو لا تملك صلاحية الوصول.' : 'Could not load this course or access is unavailable.')
      : (isRtl ? 'جارٍ تحميل الفصل...' : 'Loading classroom...');
    return (
      <main dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6 text-center">
        <p role={pageStatus === 'error' ? 'alert' : 'status'}>{message}</p>
      </main>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href={`/tenants/${tenant.subdomain}`}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{t.exitClassroom}</span>
          </Link>
          <span className="text-slate-600">|</span>
          <span className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">
            {course.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle locale={locale} onToggle={setLocale} />
          <span className="text-xs text-slate-400 hidden sm:inline">
            {t.progress}: {completedLectureIds.length} / {lectures.length} {t.completed}
          </span>
        </div>
      </header>

      {/* Classroom Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4">
        {/* Left 3 cols: Video Player & AI Assistant */}
        <div className="lg:col-span-3 p-4 sm:p-6 flex flex-col gap-6">
          {currentLecture && (currentLecture.is_free_preview || isEnrolled) ? (
            <div>
              <CloudflareStreamPlayer
                streamId={currentLecture.cloudflare_stream_id}
                muxPlaybackId={currentLecture.mux_playback_id}
                title={currentLecture.title}
                courseId={course.id}
                lectureId={currentLecture.id}
              />
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white">{currentLecture.title}</h1>
                  <p className="text-sm text-slate-400 mt-1">{currentLecture.description}</p>
                </div>
                <button
                  onClick={() => toggleCompleted(currentLecture.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border ${
                    completedLectureIds.includes(currentLecture.id)
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {completedLectureIds.includes(currentLecture.id) ? t.completed : t.markComplete}
                </button>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-6 text-center">
              <div className="text-sm font-bold text-white">
                {student
                  ? (isRtl ? 'طلبك قيد المراجعة أو لم يتم تفعيله بعد' : 'Your enrollment is pending approval')
                  : (isRtl ? 'سجّل دخولك لمشاهدة هذا الكورس' : 'Log in to access this course')}
              </div>
              {!student && (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="mt-4 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
                >
                  {isRtl ? 'دخول الطالب' : 'Student Login'}
                </button>
              )}
            </div>
          )}

          {/* AI Teaching Assistant Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mt-4">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800 mb-4">
              <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  {t.aiTitle} <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h3>
                <p className="text-xs text-slate-400">
                  {t.aiSubtitle}
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="space-y-3 max-h-56 overflow-y-auto mb-4 pr-1">
              {aiChatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-sky-600 text-white rounded-br-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleAskAI} className="flex gap-2">
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder={t.aiInputPlaceholder}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Send className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                <span>{t.aiSend}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right 1 col: Lecture Playlist */}
        <div className={`lg:col-span-1 border-t lg:border-t-0 ${isRtl ? 'lg:border-r' : 'lg:border-l'} border-slate-800 bg-slate-900/50 p-4`}>
          <h3 className="text-sm font-bold text-slate-300 mb-3 px-2">{t.playlistTitle}</h3>
          <div className="space-y-2">
            {lectures.map((lec, index) => {
              const isActive = currentLecture?.id === lec.id;
              const isDone = completedLectureIds.includes(lec.id);
              const isLocked = !lec.is_free_preview && !isEnrolled;

              return (
                <button
                  key={lec.id}
                  onClick={() => {
                    if (!isLocked) setCurrentLecture(lec);
                  }}
                  disabled={isLocked}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    isActive
                      ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/5'
                      : 'border-slate-800/80 bg-slate-900 hover:border-slate-700'
                  } ${isRtl ? 'text-right' : ''} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isActive
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-xs font-semibold truncate ${
                        isActive ? 'text-sky-300' : 'text-slate-200'
                      }`}
                    >
                      {lec.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      {isLocked
                        ? translations[locale].player.locked
                        : `${Math.round(lec.file_size_bytes / (1024 * 1024))} ${t.fileSizeMb}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <StudentAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        locale={locale}
      />
    </div>
  );
}
