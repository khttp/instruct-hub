'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Pencil, Plus, Save, Trash2, Video } from 'lucide-react';
import * as UpChunk from '@mux/upchunk';
import { supabase } from '@/lib/supabase/client';
import { Course, Lecture, Tenant } from '@/types/database';
import { Locale } from '@/lib/i18n';

type PageStatus = 'loading' | 'signed-out' | 'not-found' | 'ready' | 'error';

export default function EditCoursePage() {
  const params = useParams();
  const courseId = String(params?.courseId ?? '');
  const [locale, setLocale] = useState<Locale>('ar');
  const [status, setStatus] = useState<PageStatus>('loading');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [streamId, setStreamId] = useState('');
  const [videoProvider, setVideoProvider] = useState<'mux' | 'cloudflare'>('mux');
  const [fileSizeBytes, setFileSizeBytes] = useState(0);
  const [pendingMuxUploadId, setPendingMuxUploadId] = useState<string | null>(null);
  const [freePreview, setFreePreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const isRtl = locale === 'ar';

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) {
          if (active) setStatus('signed-out');
          return;
        }

        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('owner_id', sessionData.session.user.id)
          .maybeSingle();
        if (tenantError) throw tenantError;
        if (!tenantData) {
          if (active) setStatus('not-found');
          return;
        }

        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .eq('tenant_id', tenantData.id)
          .maybeSingle();
        if (courseError) throw courseError;
        if (!courseData) {
          if (active) setStatus('not-found');
          return;
        }

        const { data: lectureData, error: lectureError } = await supabase
          .from('lectures')
          .select('*')
          .eq('course_id', courseId)
          .order('sort_order', { ascending: true });
        if (lectureError) throw lectureError;
        if (!active) return;

        const loadedCourse = courseData as Course;
        setTenant(tenantData as Tenant);
        setCourse(loadedCourse);
        setLectures((lectureData ?? []) as Lecture[]);
        setTitle(loadedCourse.title);
        setDescription(loadedCourse.description ?? '');
        setPrice(String(loadedCourse.price_egp));
        setThumbnailUrl(loadedCourse.thumbnail_url ?? '');
        setStatus('ready');
      } catch (error) {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : 'Could not load course editor.');
        setStatus('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [courseId]);

  const saveCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!course || !tenant) return;

    const parsedPrice = Number(price);
    if (!title.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setErrorMessage(isRtl ? 'تحقق من اسم الكورس والسعر.' : 'Enter a course title and a valid non-negative price.');
      return;
    }
    const imageUrl = thumbnailUrl.trim();
    if (imageUrl) {
      try {
        const parsedUrl = new URL(imageUrl);
        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') throw new Error('Unsupported URL protocol');
      } catch {
        setErrorMessage(isRtl ? 'رابط الصورة غير صالح.' : 'Enter a valid HTTP or HTTPS image URL.');
        return;
      }
    }

    setErrorMessage('');
    setNotice('');
    setIsSavingCourse(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        setStatus('signed-out');
        return;
      }

      const { data, error } = await supabase
        .from('courses')
        .update({
          title: title.trim(),
          description: description.trim(),
          price_egp: parsedPrice,
          thumbnail_url: imageUrl || null,
        })
        .eq('id', course.id)
        .eq('tenant_id', tenant.id)
        .select('*')
        .single();
      if (error) throw error;

      setCourse(data as Course);
      setNotice(isRtl ? 'تم حفظ تفاصيل الكورس.' : 'Course details saved.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : (isRtl ? 'تعذر حفظ الكورس.' : 'Could not save course.'));
    } finally {
      setIsSavingCourse(false);
    }
  };

  const resetLessonForm = () => {
    setLessonId(null);
    setLessonTitle('');
    setLessonDescription('');
    setStreamId('');
    setVideoProvider('mux');
    setFileSizeBytes(0);
    setPendingMuxUploadId(null);
    setFreePreview(false);
    setUploadProgress(null);
  };

  const editLesson = (lesson: Lecture) => {
    setLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonDescription(lesson.description ?? '');
    setStreamId(lesson.mux_playback_id ?? lesson.cloudflare_stream_id ?? '');
    setVideoProvider(lesson.mux_playback_id ? 'mux' : 'cloudflare');
    setFileSizeBytes(lesson.file_size_bytes);
    setFreePreview(lesson.is_free_preview);
    setUploadProgress(null);
    setErrorMessage('');
    setNotice('');
  };

  const uploadVideo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setErrorMessage(isRtl ? 'اختر ملف فيديو صالحاً.' : 'Choose a valid video file.');
      return;
    }

    setErrorMessage('');
    setNotice('');
    setUploadProgress(0);
    setPendingMuxUploadId(null);
    setIsUploadingVideo(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        setStatus('signed-out');
        return;
      }

      const response = await fetch('/api/mux/upload-url', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          fileSize: file.size,
          fileType: file.type,
        }),
      });
      const result = await response.json() as { uploadUrl?: string; uploadId?: string; error?: string };
      if (!response.ok || !result.uploadUrl || !result.uploadId) {
        throw new Error(result.error || (isRtl ? 'تعذر بدء رفع الفيديو.' : 'Could not start the video upload.'));
      }
      setPendingMuxUploadId(result.uploadId);

      await new Promise<void>((resolve, reject) => {
        const upload = UpChunk.createUpload({
          endpoint: result.uploadUrl!,
          file,
          chunkSize: 5120,
          attempts: 5,
        });
        upload.on('error', (event) => {
          const detail: unknown = event.detail;
          reject(new Error(typeof detail === 'string' ? detail : 'Mux upload failed.'));
        });
        upload.on('progress', (event) => {
          const progress: unknown = event.detail;
          if (typeof progress === 'number') setUploadProgress(Math.floor(progress));
        });
        upload.on('success', () => resolve());
      });
      setFileSizeBytes(file.size);

      let playbackId: string | null = null;
      for (let attempt = 0; attempt < 180; attempt += 1) {
        const statusResponse = await fetch(
          `/api/mux/uploads?courseId=${encodeURIComponent(courseId)}&uploadId=${encodeURIComponent(result.uploadId)}`,
          { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } }
        );
        const statusResult = await statusResponse.json() as {
          status?: string;
          playbackId?: string;
          error?: string;
        };
        if (!statusResponse.ok) {
          throw new Error(statusResult.error || 'Could not check the video processing status.');
        }
        if (statusResult.status === 'ready' && statusResult.playbackId) {
          playbackId = statusResult.playbackId;
          break;
        }
        if (statusResult.status === 'errored' || statusResult.status === 'timed_out' || statusResult.status === 'cancelled') {
          throw new Error(isRtl ? 'فشل Mux في معالجة الفيديو.' : 'Mux could not process this video.');
        }
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
      }
      if (!playbackId) {
        throw new Error(isRtl
          ? 'تم رفع الفيديو، لكن المعالجة ما زالت مستمرة. استخدم زر التحقق أدناه بدلاً من إعادة الرفع.'
          : 'The video uploaded, but processing is still underway. Use the status button below instead of uploading again.');
      }

      setStreamId(playbackId);
      setVideoProvider('mux');
      setPendingMuxUploadId(null);
      setNotice(isRtl
        ? 'اكتمل رفع الفيديو. احفظ المحاضرة لإضافته إلى الكورس.'
        : 'Video uploaded. Save the lesson to attach it to the course.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : (isRtl ? 'فشل رفع الفيديو.' : 'Video upload failed.'));
      setUploadProgress(null);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const checkPendingUpload = async () => {
    if (!pendingMuxUploadId) return;
    setErrorMessage('');
    setNotice('');
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        setStatus('signed-out');
        return;
      }

      const response = await fetch(
        `/api/mux/uploads?courseId=${encodeURIComponent(courseId)}&uploadId=${encodeURIComponent(pendingMuxUploadId)}`,
        { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } }
      );
      const result = await response.json() as { status?: string; playbackId?: string; error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not check video processing status.');
      if (result.status === 'ready' && result.playbackId) {
        setStreamId(result.playbackId);
        setVideoProvider('mux');
        setPendingMuxUploadId(null);
        setNotice(isRtl
          ? 'اكتملت معالجة الفيديو. احفظ المحاضرة لإضافته إلى الكورس.'
          : 'Video processing is complete. Save the lesson to attach it to the course.');
      } else if (result.status === 'errored' || result.status === 'timed_out' || result.status === 'cancelled') {
        setPendingMuxUploadId(null);
        throw new Error(isRtl ? 'فشل Mux في معالجة الفيديو.' : 'Mux could not process this video.');
      } else {
        setNotice(isRtl ? 'ما زال الفيديو قيد المعالجة.' : 'The video is still processing.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not check video processing status.');
    }
  };

  const saveLesson = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!course) return;
    if (!lessonTitle.trim() || !streamId.trim()) {
    setErrorMessage(isRtl
      ? 'أدخل عنوان المحاضرة وارفع فيديو.'
      : 'Enter a lesson title and upload a video.');
      return;
    }

    setErrorMessage('');
    setNotice('');
    setIsSavingLesson(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        setStatus('signed-out');
        return;
      }

      const lessonData = {
        title: lessonTitle.trim(),
        description: lessonDescription.trim(),
        cloudflare_stream_id: videoProvider === 'cloudflare' ? streamId.trim() : null,
        mux_playback_id: videoProvider === 'mux' ? streamId.trim() : null,
        file_size_bytes: fileSizeBytes,
        is_free_preview: freePreview,
      };
      const query = lessonId
        ? supabase
          .from('lectures')
          .update(lessonData)
          .eq('id', lessonId)
          .eq('course_id', course.id)
        : supabase.from('lectures').insert({
          ...lessonData,
          course_id: course.id,
          sort_order: lectures.reduce((maximum, item) => Math.max(maximum, item.sort_order), 0) + 1,
        });
      const { data, error } = await query.select('*').single();
      if (error) throw error;

      const savedLesson = data as Lecture;
      setLectures((previous) => lessonId
        ? previous.map((item) => item.id === lessonId ? savedLesson : item)
        : [...previous, savedLesson].sort((a, b) => a.sort_order - b.sort_order));
      resetLessonForm();
      setNotice(isRtl ? 'تم حفظ المحاضرة.' : 'Lesson saved.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : (isRtl ? 'تعذر حفظ المحاضرة.' : 'Could not save lesson.'));
    } finally {
      setIsSavingLesson(false);
    }
  };

  const deleteLesson = async (lesson: Lecture) => {
    const confirmed = window.confirm(isRtl
      ? `هل تريد حذف المحاضرة "${lesson.title}"؟`
      : `Delete lesson "${lesson.title}"?`);
    if (!confirmed) return;

    setErrorMessage('');
    setNotice('');
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        setStatus('signed-out');
        return;
      }

      const { error } = await supabase
        .from('lectures')
        .delete()
        .eq('id', lesson.id)
        .eq('course_id', courseId);
      if (error) throw error;
      setLectures((previous) => previous.filter((item) => item.id !== lesson.id));
      if (lessonId === lesson.id) resetLessonForm();
      setNotice(isRtl ? 'تم حذف المحاضرة.' : 'Lesson deleted.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : (isRtl ? 'تعذر حذف المحاضرة.' : 'Could not delete lesson.'));
    }
  };

  if (status !== 'ready' || !course) {
    const message = status === 'loading'
      ? (isRtl ? 'جارٍ تحميل محرر الكورس...' : 'Loading course editor...')
      : status === 'signed-out'
        ? (isRtl ? 'سجّل الدخول من الصفحة الرئيسية لإدارة الكورس.' : 'Sign in from the home page to manage this course.')
        : status === 'not-found'
          ? (isRtl ? 'الكورس غير موجود أو لا تملك صلاحية تعديله.' : 'Course not found, or you do not have permission to edit it.')
          : (errorMessage || (isRtl ? 'تعذر تحميل الكورس.' : 'Could not load course.'));
    return (
      <main dir={isRtl ? 'rtl' : 'ltr'} className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center text-slate-200">
        <p role={status === 'error' ? 'alert' : 'status'}>{message}</p>
        <Link href="/app" className="text-sky-400 hover:text-sky-300">{isRtl ? 'العودة للوحة التحكم' : 'Back to dashboard'}</Link>
      </main>
    );
  }

  return (
    <main dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/app" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
            <ArrowLeft className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
            {isRtl ? 'لوحة تحكم المدرس' : 'Instructor dashboard'}
          </Link>
          <button
            type="button"
            onClick={() => setLocale((value) => value === 'ar' ? 'en' : 'ar')}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            {isRtl ? 'English' : 'العربية'}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{isRtl ? 'إدارة الكورس' : 'Manage course'}</h1>
          <p className="mt-1 text-sm text-slate-400">{isRtl ? 'هذه الصفحة خاصة بإدارة المدرس، وليست صفحة الطالب.' : 'Instructor-only course editor, separate from the student course page.'}</p>
        </div>

        <form onSubmit={(event) => void saveCourse(event)} className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <h2 className="text-lg font-bold text-white">{isRtl ? 'تفاصيل الكورس' : 'Course details'}</h2>
          <div>
            <label htmlFor="course-title" className="mb-2 block text-sm font-medium">{isRtl ? 'اسم الكورس' : 'Course title'}</label>
            <input id="course-title" required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
          </div>
          <div>
            <label htmlFor="course-description" className="mb-2 block text-sm font-medium">{isRtl ? 'وصف الكورس' : 'Description'}</label>
            <textarea id="course-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="course-price" className="mb-2 block text-sm font-medium">{isRtl ? 'السعر (جنيه مصري)' : 'Price (EGP)'}</label>
              <input id="course-price" type="number" min="0" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label htmlFor="course-image" className="mb-2 block text-sm font-medium">{isRtl ? 'رابط صورة الكورس' : 'Course image URL'}</label>
              <input id="course-image" type="url" value={thumbnailUrl} onChange={(event) => setThumbnailUrl(event.target.value)} placeholder="https://example.com/image.jpg" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
            </div>
          </div>
          {thumbnailUrl && <img src={thumbnailUrl} alt={title} className="aspect-video max-h-72 rounded-xl border border-slate-800 object-cover" />}
          <button type="submit" disabled={isSavingCourse} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-500 disabled:opacity-60">
            <Save className="h-4 w-4" /> {isSavingCourse ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : (isRtl ? 'حفظ تفاصيل الكورس' : 'Save course details')}
          </button>
        </form>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">{isRtl ? `المحاضرات (${lectures.length})` : `Lessons (${lectures.length})`}</h2>
              <button type="button" onClick={resetLessonForm} className="inline-flex items-center gap-1 text-sm font-semibold text-sky-400 hover:text-sky-300">
                <Plus className="h-4 w-4" /> {isRtl ? 'إضافة' : 'Add lesson'}
              </button>
            </div>
            {lectures.length === 0 && <p className="text-sm text-slate-400">{isRtl ? 'لم تتم إضافة محاضرات بعد.' : 'No lessons have been added yet.'}</p>}
            <div className="space-y-3">
              {lectures.map((lesson, index) => (
                <div key={lesson.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Video className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{index + 1}. {lesson.title}</p>
                      <p className="truncate font-mono text-xs text-slate-500">{lesson.mux_playback_id ?? lesson.cloudflare_stream_id}</p>
                      {lesson.is_free_preview && <span className="mt-1 inline-block text-[11px] text-emerald-400">{isRtl ? 'معاينة مجانية' : 'Free preview'}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-3">
                    <button type="button" onClick={() => editLesson(lesson)} aria-label={isRtl ? 'تعديل المحاضرة' : 'Edit lesson'} className="text-slate-300 hover:text-sky-300"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => void deleteLesson(lesson)} aria-label={isRtl ? 'حذف المحاضرة' : 'Delete lesson'} className="text-rose-400 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {isRtl
                ? 'ارفع الفيديو هنا مباشرةً؛ LearnHub يتولى تخزينه وبثه.'
                : 'Upload the video here; LearnHub handles video storage and streaming.'}
            </p>
          </div>

          <form onSubmit={(event) => void saveLesson(event)} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
            <h2 className="text-lg font-bold text-white">
              {lessonId ? (isRtl ? 'تعديل المحاضرة' : 'Edit lesson') : (isRtl ? 'إضافة محاضرة' : 'Add lesson')}
            </h2>
            <div>
              <label htmlFor="lesson-title" className="mb-2 block text-sm font-medium">{isRtl ? 'عنوان المحاضرة' : 'Lesson title'}</label>
              <input id="lesson-title" required maxLength={255} value={lessonTitle} onChange={(event) => setLessonTitle(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label htmlFor="lesson-description" className="mb-2 block text-sm font-medium">{isRtl ? 'وصف المحاضرة' : 'Lesson description'}</label>
              <textarea id="lesson-description" rows={3} value={lessonDescription} onChange={(event) => setLessonDescription(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white" />
            </div>
            <div>
              <label htmlFor="lesson-video" className="mb-2 block text-sm font-medium">{isRtl ? 'ملف الفيديو' : 'Video file'}</label>
              <input
                id="lesson-video"
                type="file"
                accept="video/*"
                onChange={(event) => void uploadVideo(event)}
                disabled={isUploadingVideo}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 file:me-3 file:rounded-md file:border-0 file:bg-sky-600 file:px-3 file:py-1.5 file:font-semibold file:text-white disabled:opacity-60"
              />
              <p className="mt-2 break-all font-mono text-xs text-slate-500">
                {streamId
                  ? `${isRtl ? 'معرّف الفيديو:' : 'Video ID:'} ${streamId}`
                  : (isRtl ? 'اختر ملف فيديو لرفعه بأمان من هنا.' : 'Choose a video to upload securely from here.')}
              </p>
              {uploadProgress !== null && (
                <div className="mt-3" role="status" aria-live="polite">
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>{isRtl ? 'جارٍ رفع الفيديو...' : 'Uploading video...'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <progress value={uploadProgress} max="100" className="h-2 w-full accent-sky-500" />
                </div>
              )}
              {pendingMuxUploadId && !isUploadingVideo && (
                <button type="button" onClick={() => void checkPendingUpload()} className="mt-3 rounded-lg border border-sky-500/30 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/10">
                  {isRtl ? 'التحقق من معالجة الفيديو' : 'Check video processing'}
                </button>
              )}
            </div>
            <div>
              <label htmlFor="mux-playback-id" className="mb-2 block text-sm font-medium">
                {isRtl ? 'أو أضف معرّف التشغيل من Mux' : 'Or add an existing Mux Playback ID'}
              </label>
              <input
                id="mux-playback-id"
                maxLength={255}
                value={videoProvider === 'mux' ? streamId : ''}
                onChange={(event) => {
                  setStreamId(event.target.value.trim());
                  setVideoProvider('mux');
                  setFileSizeBytes(0);
                }}
                placeholder={isRtl ? 'الصق Playback ID وليس Asset ID' : 'Paste the Playback ID, not the Asset ID'}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono text-sm text-white"
              />
              <p className="mt-2 text-xs text-slate-500">
                {isRtl
                  ? 'من تفاصيل الفيديو في لوحة Mux انسخ Playback ID بعد اكتمال المعالجة.'
                  : 'Copy the Playback ID from the video asset details in Mux after processing finishes.'}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={freePreview} onChange={(event) => setFreePreview(event.target.checked)} />
              {isRtl ? 'إتاحة المحاضرة كمعاينة مجانية' : 'Make this lesson a free preview'}
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={isSavingLesson || isUploadingVideo || !streamId} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-60">
                <Save className="h-4 w-4" /> {isSavingLesson ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : (isRtl ? 'حفظ المحاضرة' : 'Save lesson')}
              </button>
              {lessonId && <button type="button" onClick={resetLessonForm} className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700">{isRtl ? 'إلغاء التعديل' : 'Cancel edit'}</button>}
            </div>
          </form>
        </section>

        {errorMessage && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{errorMessage}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}
      </div>
    </main>
  );
}
