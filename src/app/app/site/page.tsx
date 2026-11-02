'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getTenantUrl } from '@/lib/tenant-url';
import { Tenant } from '@/types/database';
import { Locale } from '@/lib/i18n';

type PageStatus = 'loading' | 'signed-out' | 'not-found' | 'ready' | 'error';

export default function EditAcademySitePage() {
  const [locale, setLocale] = useState<Locale>('ar');
  const [status, setStatus] = useState<PageStatus>('loading');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0284c7');
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('owner_id', sessionData.session.user.id)
          .maybeSingle();
        if (error) throw error;
        if (!active) return;
        if (!data) {
          setStatus('not-found');
          return;
        }

        const ownedTenant = data as Tenant;
        setTenant(ownedTenant);
        setSchoolName(ownedTenant.theme_settings.school_name ?? '');
        setHeadline(ownedTenant.theme_settings.banner_headline ?? '');
        setBio(ownedTenant.theme_settings.bio ?? '');
        setPrimaryColor(ownedTenant.theme_settings.primary_color ?? '#0284c7');
        setStatus('ready');
      } catch (error) {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : 'Could not load your website.');
        setStatus('error');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tenant) return;

    setIsSaving(true);
    setErrorMessage('');
    setNotice('');
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        setStatus('signed-out');
        return;
      }

      const themeSettings = {
        ...tenant.theme_settings,
        school_name: schoolName.trim(),
        banner_headline: headline.trim(),
        bio: bio.trim(),
        primary_color: primaryColor,
      };
      const { data, error } = await supabase
        .from('tenants')
        .update({ theme_settings: themeSettings })
        .eq('id', tenant.id)
        .eq('owner_id', sessionData.session.user.id)
        .select('*')
        .single();
      if (error) throw error;

      setTenant(data as Tenant);
      setNotice(isRtl ? 'تم حفظ تغييرات موقعك.' : 'Your website changes have been saved.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : (isRtl ? 'تعذر حفظ التغييرات.' : 'Could not save your changes.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (status !== 'ready' || !tenant) {
    const message = status === 'loading'
      ? (isRtl ? 'جارٍ تحميل موقعك...' : 'Loading your website...')
      : status === 'signed-out'
        ? (isRtl ? 'سجّل الدخول من الصفحة الرئيسية لتعديل موقعك.' : 'Sign in from the home page to edit your website.')
        : status === 'not-found'
          ? (isRtl ? 'لم يتم العثور على موقع مرتبط بهذا الحساب.' : 'No website was found for this account.')
          : (errorMessage || (isRtl ? 'تعذر تحميل موقعك.' : 'Could not load your website.'));

    return (
      <main dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-5 p-6 text-center">
        <p role={status === 'error' ? 'alert' : 'status'} className="text-slate-300">{message}</p>
        <Link href="/" className="text-sky-400 hover:text-sky-300">
          {isRtl ? 'العودة إلى الرئيسية' : 'Back to LearnHub'}
        </Link>
      </main>
    );
  }

  return (
    <main dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-sm text-slate-300 hover:text-white">
            <ArrowLeft className={`me-2 inline h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
            {isRtl ? 'الرئيسية' : 'Home'}
          </Link>
          <button
            type="button"
            onClick={() => setLocale((current) => current === 'ar' ? 'en' : 'ar')}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            {isRtl ? 'English' : 'العربية'}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{isRtl ? 'تعديل موقع الأكاديمية' : 'Edit your academy website'}</h1>
            <p className="mt-2 text-sm text-slate-400">{isRtl ? 'حدّث الاسم والعنوان والوصف ولون الموقع.' : 'Update your website name, headline, description, and color.'}</p>
          </div>
          <Link
            href={`/tenants/${encodeURIComponent(tenant.subdomain)}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-sky-300 hover:bg-slate-900"
          >
            {isRtl ? 'معاينة الموقع' : 'Preview site'} <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div>
            <label htmlFor="school-name" className="mb-2 block text-sm font-medium">{isRtl ? 'اسم الأكاديمية' : 'Academy name'}</label>
            <input id="school-name" required maxLength={100} value={schoolName} onChange={(event) => setSchoolName(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500" />
          </div>

          <div>
            <label htmlFor="site-headline" className="mb-2 block text-sm font-medium">{isRtl ? 'العنوان الرئيسي' : 'Headline'}</label>
            <input id="site-headline" maxLength={160} value={headline} onChange={(event) => setHeadline(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500" />
          </div>

          <div>
            <label htmlFor="site-bio" className="mb-2 block text-sm font-medium">{isRtl ? 'نبذة عن الأكاديمية' : 'About your academy'}</label>
            <textarea id="site-bio" rows={5} maxLength={1000} value={bio} onChange={(event) => setBio(event.target.value)} className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500" />
          </div>

          <div>
            <label htmlFor="site-color" className="mb-2 block text-sm font-medium">{isRtl ? 'اللون الرئيسي' : 'Primary color'}</label>
            <div className="flex items-center gap-3">
              <input id="site-color" type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} className="h-10 w-14 cursor-pointer rounded border border-slate-700 bg-slate-950 p-1" />
              <span className="font-mono text-sm text-slate-400">{primaryColor}</span>
            </div>
          </div>

          {errorMessage && <p role="alert" className="text-sm text-rose-400">{errorMessage}</p>}
          {notice && <p role="status" className="text-sm text-emerald-400">{notice}</p>}

          <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60">
            <Save className="h-4 w-4" />
            {isSaving ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التغييرات' : 'Save changes')}
          </button>
        </form>

        <p className="text-xs text-slate-500">
          {isRtl ? 'رابط موقعك ثابت:' : 'Your website link stays the same:'}{' '}
          <span dir="ltr" className="font-mono text-slate-400">{getTenantUrl(tenant.subdomain)}</span>
        </p>
      </section>
    </main>
  );
}
