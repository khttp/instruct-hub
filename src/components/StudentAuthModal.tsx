'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Lock, Mail, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { StudentUser } from '@/lib/student-auth';
import { Locale } from '@/lib/i18n';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (student: StudentUser) => void;
  locale?: Locale;
}

export function StudentAuthModal({
  isOpen,
  onClose,
  onSuccess,
  locale = 'ar',
}: StudentAuthModalProps) {
  const isRtl = locale === 'ar';
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setNotice('');
    setIsSubmitting(true);

    try {
      if (tab === 'signup') {
        if (!fullName.trim()) {
          throw new Error(isRtl ? 'يرجى إدخال اسم الطالب.' : 'Enter the student’s name.');
        }
        if (password.length < 8) {
          throw new Error(isRtl ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.' : 'Password must be at least 8 characters.');
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw error;

        if (!data.session || !data.user) {
          setNotice(isRtl
            ? 'تم إنشاء الحساب. افتح رسالة التأكيد في بريدك الإلكتروني ثم سجّل الدخول.'
            : 'Account created. Confirm your email using the link we sent, then sign in.');
          setTab('login');
          return;
        }

        onSuccess?.({
          id: data.user.id,
          email: data.user.email ?? email.trim(),
          fullName: fullName.trim(),
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (!data.user) throw new Error('Sign-in did not return a user.');

        onSuccess?.({
          id: data.user.id,
          email: data.user.email ?? email.trim(),
          fullName: typeof data.user.user_metadata.full_name === 'string'
            ? data.user.user_metadata.full_name
            : data.user.email ?? email.trim(),
        });
      }

      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error
        ? error.message
        : (isRtl ? 'تعذر تسجيل الدخول. حاول مرة أخرى.' : 'Could not authenticate. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label={isRtl ? 'إغلاق' : 'Close'}
          className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white`}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
            <User className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-white">{isRtl ? 'حساب الطالب' : 'Student account'}</h3>
          <p className="mt-1 text-xs text-slate-400">
            {isRtl ? 'سجّل دخولك ببريدك الإلكتروني لمتابعة طلباتك وكورساتك.' : 'Sign in with email to track your course requests and access.'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMessage(''); setNotice(''); }}
            className={`rounded-lg py-2 text-xs font-bold ${tab === 'login' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {isRtl ? 'تسجيل دخول' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setErrorMessage(''); setNotice(''); }}
            className={`rounded-lg py-2 text-xs font-bold ${tab === 'signup' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {isRtl ? 'حساب جديد' : 'Create account'}
          </button>
        </div>

        {errorMessage && (
          <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" /> {errorMessage}
          </div>
        )}
        {notice && (
          <div role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
          </div>
        )}

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          {tab === 'signup' && (
            <div>
              <label htmlFor="student-full-name" className="mb-1.5 block text-xs font-semibold text-slate-400">
                {isRtl ? 'اسم الطالب' : 'Student name'}
              </label>
              <div className="relative">
                <User className={`absolute top-3 h-4 w-4 text-slate-500 ${isRtl ? 'right-3' : 'left-3'}`} />
                <input
                  id="student-full-name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={255}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className={`w-full rounded-xl border border-slate-800 bg-slate-950 py-3 text-sm text-white focus:border-sky-500 focus:outline-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="student-email" className="mb-1.5 block text-xs font-semibold text-slate-400">
              {isRtl ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <div className="relative">
              <Mail className={`absolute top-3 h-4 w-4 text-slate-500 ${isRtl ? 'right-3' : 'left-3'}`} />
              <input
                id="student-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`w-full rounded-xl border border-slate-800 bg-slate-950 py-3 text-sm text-white focus:border-sky-500 focus:outline-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="student-password" className="mb-1.5 block text-xs font-semibold text-slate-400">
              {isRtl ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <Lock className={`absolute top-3 h-4 w-4 text-slate-500 ${isRtl ? 'right-3' : 'left-3'}`} />
              <input
                id="student-password"
                type="password"
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={tab === 'signup' ? 8 : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`w-full rounded-xl border border-slate-800 bg-slate-950 py-3 text-sm text-white focus:border-sky-500 focus:outline-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-sky-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-600/30 transition-all hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? (isRtl ? 'جارٍ التنفيذ...' : 'Please wait...')
              : tab === 'login'
                ? (isRtl ? 'تسجيل الدخول' : 'Sign in')
                : (isRtl ? 'إنشاء حساب طالب' : 'Create student account')}
          </button>
        </form>
      </div>
    </div>
  );
}
