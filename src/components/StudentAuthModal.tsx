'use client';

import React, { useState } from 'react';
import {
  StudentUser,
  getStoredStudents,
  saveStudentUser,
  setActiveStudentSession,
  validateEgyptianPhone,
} from '@/lib/student-auth';
import { Phone, Lock, User, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateEgyptianPhone(phoneNumber)) {
      setErrorMessage(
        isRtl
          ? 'يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقم (مثال: 01012345678)'
          : 'Please enter a valid 11-digit Egyptian phone number (e.g. 01012345678)'
      );
      return;
    }

    if (!pin || pin.length < 4) {
      setErrorMessage(
        isRtl ? 'الرقم السري PIN يجب أن يتكون من 4 أرقام على الأقل' : 'PIN must be at least 4 digits'
      );
      return;
    }

    const students = getStoredStudents();
    const cleanPhone = phoneNumber.trim();
    const user = students.find((s) => s.phoneNumber === cleanPhone && s.pin === pin);

    if (!user) {
      setErrorMessage(
        isRtl
          ? 'رقم الموبايل أو الرقم السري غير صحيح. يمكنك إنشاء حساب جديد إذا كانت أول مرة.'
          : 'Incorrect phone number or PIN. You can create a new account if this is your first visit.'
      );
      return;
    }

    setActiveStudentSession(user);
    onSuccess?.(user);
    onClose();
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage(isRtl ? 'يرجى إدخال اسمك ثلاثي' : 'Please enter your full name');
      return;
    }

    if (!validateEgyptianPhone(phoneNumber)) {
      setErrorMessage(
        isRtl
          ? 'يرجى إدخال رقم موبايل مصري صحيح يبدأ بـ 010 أو 011 أو 012 أو 015'
          : 'Please enter a valid 11-digit Egyptian mobile number'
      );
      return;
    }

    if (!pin || pin.length < 4) {
      setErrorMessage(
        isRtl ? 'الرقم السري PIN يجب أن يتكون من 4 أرقام على الأقل' : 'PIN must be at least 4 digits'
      );
      return;
    }

    const students = getStoredStudents();
    const cleanPhone = phoneNumber.trim();
    if (students.some((s) => s.phoneNumber === cleanPhone)) {
      setErrorMessage(
        isRtl
          ? 'رقم الموبايل مسجل بالفعل! يرجى تسجيل الدخول بدلاً من ذلك.'
          : 'This phone number is already registered! Please log in.'
      );
      return;
    }

    const newStudent: StudentUser = {
      phoneNumber: cleanPhone,
      pin,
      fullName: fullName.trim(),
      enrolledCourseIds: [],
    };

    saveStudentUser(newStudent);
    setActiveStudentSession(newStudent);
    onSuccess?.(newStudent);
    onClose();
  };

  const fillDemoStudent = () => {
    setTab('login');
    setPhoneNumber('01011223344');
    setPin('1234');
    setErrorMessage('');
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3 border border-sky-500/20">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {isRtl ? 'بوابة دخول الطلاب' : 'Student Access Portal'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isRtl
              ? 'تسجيل دخول سريع برقم الموبايل والرقم السري (بدون إيميل)'
              : 'Fast login with your mobile phone & PIN (No email needed)'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'login'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isRtl ? 'تسجيل دخول' : 'Student Login'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'signup'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isRtl ? 'حساب طالب جديد' : 'New Student'}
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {isRtl ? 'رقم الموبايل (المصري)' : 'Mobile Phone Number'}
              </label>
              <div dir="ltr" className="relative">
                <input
                  type="tel"
                  required
                  placeholder="01012345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {isRtl ? 'الرقم السري (PIN)' : 'Security PIN (4 digits)'}
              </label>
              <div dir="ltr" className="relative">
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500 text-center tracking-widest text-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-sky-600/30 transition-all mt-2"
            >
              {isRtl ? 'تسجيل الدخول ومتابعة الكورس' : 'Log In & Continue Course'}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {isRtl ? 'اسم الطالب بالكامل (ثلاثي)' : 'Student Full Name'}
              </label>
              <input
                type="text"
                required
                placeholder={isRtl ? 'مثال: يوسف محمد أحمد' : 'e.g. Youssef Mohamed'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {isRtl ? 'رقم الموبايل (فودافون/أورنج/اتصالات/وي)' : 'Egyptian Mobile Number'}
              </label>
              <div dir="ltr">
                <input
                  type="tel"
                  required
                  placeholder="01012345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                {isRtl ? 'اختر رقماً سرياً (PIN مكون من 4 أرقام)' : 'Choose a 4-Digit PIN'}
              </label>
              <div dir="ltr">
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500 text-center tracking-widest text-lg"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {isRtl ? 'احفظ هذا الرقم السري لتسجيل الدخول به دائماً' : 'Remember this PIN for future logins'}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 transition-all mt-2"
            >
              {isRtl ? 'إنشاء حسابي ومتابعة الشرح' : 'Create Account & Continue'}
            </button>
          </form>
        )}

        {/* Demo Fast Login Helper */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={fillDemoStudent}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isRtl ? 'تجربة سريعة كطالب تجريبي (يوسف - 01011223344)' : 'Fill Demo Student (Youssef - 01011223344)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
