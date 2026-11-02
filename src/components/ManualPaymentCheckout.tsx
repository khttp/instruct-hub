'use client';

import React, { useState } from 'react';
import { Course, Tenant, PaymentMethod } from '@/types/database';
import { Smartphone, CreditCard, UploadCloud, CheckCircle2, AlertCircle, Copy, Check, User, Phone } from 'lucide-react';
import { translations, Locale } from '@/lib/i18n';
import { useStudentSession } from '@/lib/student-auth';
import { StudentAuthModal } from '@/components/StudentAuthModal';
import { submitEnrollment } from '@/lib/enrollment-store';

interface ManualPaymentCheckoutProps {
  course: Course;
  tenant: Tenant;
  onSuccess?: () => void;
}

export function ManualPaymentCheckout({ course, tenant, onSuccess }: ManualPaymentCheckoutProps) {
  const [locale, setLocale] = useState<Locale>('ar'); // Default Egyptian Arabic
  const [method, setMethod] = useState<PaymentMethod>('manual_instapay');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptError, setReceiptError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Student auth integration
  const student = useStudentSession();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const t = translations[locale].checkout;
  const isRtl = locale === 'ar';

  const vodafoneCashNumber = tenant.theme_settings.instructor_vodafone_cash || '01012345678';
  const instapayId = tenant.theme_settings.instructor_instapay_id || `${tenant.subdomain}@instapay`;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setReceiptError(isRtl ? 'يرجى اختيار ملف صورة.' : 'Please choose an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setReceiptError(isRtl ? 'حجم الصورة يجب ألا يتجاوز 2 ميجابايت.' : 'Receipt images must be 2 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setReceiptError(isRtl ? 'تعذر قراءة الصورة. حاول مرة أخرى.' : 'The image could not be read. Please try again.');
        return;
      }
      setReceiptUrl(reader.result);
      setReceiptError('');
    };
    reader.onerror = () => {
      setReceiptError(isRtl ? 'تعذر قراءة الصورة. حاول مرة أخرى.' : 'The image could not be read. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!receiptUrl) {
      alert(isRtl ? 'يرجى رفع صورة لإيصال التحويل أولاً.' : 'Please upload a screenshot of your transfer receipt.');
      return;
    }

    setIsSubmitting(true);
    try {
      const enrollment = submitEnrollment({
        courseId: course.id,
        studentId: student.phoneNumber,
        paymentMethod: method,
        receiptUrl,
      });
      if (!enrollment) {
        setReceiptError(isRtl ? 'تم تفعيل هذا الكورس لحسابك بالفعل.' : 'This course is already approved for your account.');
        return;
      }
      setIsSubmitting(false);
      setIsSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (error) {
      setReceiptError(
        error instanceof Error
          ? error.message
          : (isRtl ? 'تعذر إرسال طلب الدفع. حاول مرة أخرى.' : 'Could not submit the payment request. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-xl">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{t.successTitle}</h3>
        <p className="text-slate-300 text-sm max-w-md mx-auto mb-4">
          {t.successDesc}
        </p>

        {student && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-950 rounded-xl text-xs text-sky-400 border border-slate-800 mb-4 font-mono">
            <span>{isRtl ? 'اسم الطالب:' : 'Student:'} {student.fullName} ({student.phoneNumber})</span>
          </div>
        )}

        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-xs text-slate-400 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{t.pendingStatus}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
      <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">{t.enrollTitle}</h2>
          <p className="text-sm text-slate-400">{course.title}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            className="text-[11px] font-bold px-2 py-1 rounded bg-slate-800 text-sky-400 hover:bg-slate-700 border border-slate-700"
          >
            {locale === 'ar' ? 'English' : 'عربي'}
          </button>
          <div className={isRtl ? 'text-left' : 'text-right'}>
            <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider">{t.totalPrice}</div>
            <div className="text-2xl font-extrabold text-sky-400">{course.price_egp} {isRtl ? 'ج.م' : 'EGP'}</div>
          </div>
        </div>
      </div>

      {/* Student Session Verification Box */}
      <div className="mb-6 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
        {student ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{isRtl ? 'حساب الطالب:' : 'Student Account:'} {student.fullName}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-[11px] text-slate-400 font-mono">{student.phoneNumber}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Phone className="w-4 h-4 text-sky-400" />
              <span>{isRtl ? 'يجب تسجيل دخول الطالب بالهاتف و PIN للمتابعة' : 'Log in with mobile phone to enroll'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              {isRtl ? 'دخول / تسجيل' : 'Login / Register'}
            </button>
          </div>
        )}
      </div>

      {/* Payment Rail Selector (InstaPay / Vodafone Cash) */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => setMethod('manual_instapay')}
          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
            method === 'manual_instapay'
              ? 'border-sky-500 bg-sky-500/10 text-white shadow-lg shadow-sky-500/10'
              : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
          } ${isRtl ? 'text-right' : ''}`}
        >
          <CreditCard className="w-6 h-6 text-sky-400 shrink-0" />
          <div>
            <div className="font-semibold text-sm">{t.instapayTitle}</div>
            <div className="text-xs opacity-75">{t.instapaySubtitle}</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMethod('manual_vodafone_cash')}
          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
            method === 'manual_vodafone_cash'
              ? 'border-rose-500 bg-rose-500/10 text-white shadow-lg shadow-rose-500/10'
              : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
          } ${isRtl ? 'text-right' : ''}`}
        >
          <Smartphone className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <div className="font-semibold text-sm">{t.vodafoneCashTitle}</div>
            <div className="text-xs opacity-75">{t.vodafoneCashSubtitle}</div>
          </div>
        </button>
      </div>

      {/* Instructor Credentials Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          {t.step1}
        </div>
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
          <div>
            <div className="text-xs text-slate-400">
              {method === 'manual_instapay'
                ? (isRtl ? 'عنوان الدفع اللحظي (IPA) أو رقم الحساب' : 'InstaPay IPA / Address')
                : (isRtl ? 'رقم محفظة فودافون كاش' : 'Vodafone Cash Wallet Number')}
            </div>
            <div dir="ltr" className="text-base font-mono font-bold text-white text-left">
              {method === 'manual_instapay' ? instapayId : vodafoneCashNumber}
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              copyToClipboard(
                method === 'manual_instapay' ? instapayId : vodafoneCashNumber,
                'credentials'
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
          >
            {copiedField === 'credentials' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedField === 'credentials' ? t.copied : t.copy}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-amber-400/90">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {t.alertNotice}
        </div>
      </div>

      {/* Step 2: Screenshot Receipt Upload */}
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            {t.step2}
          </label>
          <label className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/50">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleReceiptUpload}
            />
            {receiptUrl ? (
              <div className="text-center">
                <img
                  src={receiptUrl}
                  alt="Receipt Preview"
                  className="max-h-40 rounded-lg mx-auto mb-2 border border-slate-700 shadow"
                />
                <span className="text-xs text-emerald-400 font-medium">
                  {isRtl ? 'تم إرفاق الإيصال (اضغط للتغيير)' : 'Receipt Attached (click to change)'}
                </span>
              </div>
            ) : (
              <div className="text-center">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-sm font-medium text-slate-200">{t.uploadPlaceholder}</span>
                <span className="block text-xs text-slate-500 mt-1">{t.uploadHint}</span>
              </div>
            )}
          </label>
          {receiptError && (
            <p role="alert" className="mt-2 text-xs text-rose-400">{receiptError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !receiptUrl}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all shadow-lg ${
            receiptUrl && !isSubmitting
              ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? t.submitting : t.submitCta}
        </button>
      </form>

      {/* Auth Modal for Unauthenticated Students */}
      <StudentAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        locale={locale}
      />
    </div>
  );
}
