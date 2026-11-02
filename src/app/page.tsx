'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Globe,
  CreditCard,
  Video,
  Check,
  ExternalLink,
  BookOpen,
  Share2,
  MessageCircle,
  Copy,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { SubscriptionTier, QUOTA_TIER_LIMITS } from '@/types/database';
import { translations, Locale } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function PlatformLandingPage() {
  const [locale, setLocale] = useState<Locale>('ar'); // Default to Arabic for Egyptian market
  const [subdomainInput, setSubdomainInput] = useState('');
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('basic');
  const [accentColor, setAccentColor] = useState('#0284c7');

  // Onboarding & Payment activation state
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [isPaymentStep, setIsPaymentStep] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const t = translations[locale];
  const isRtl = locale === 'ar';
  const cleanSubdomain = subdomainInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const publicUrl = `https://${cleanSubdomain}.learnhub.me`;

  const handleFastOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanSubdomain) return;
    setIsOnboardingActive(true);

    if (selectedTier === 'basic') {
      // Basic plan activates instantly ($0 setup)
      setIsPaymentStep(false);
      setIsActivated(true);
    } else {
      // Paid plan requires payment confirmation
      setIsPaymentStep(true);
      setIsActivated(false);
    }
  };

  const handleCompletePlanPayment = () => {
    setIsPaymentStep(false);
    setIsActivated(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    isRtl
      ? `أهلاً بكم يا شباب! ده موقعي التعليمي الجديد لمتابعة دروس وشروحات الكورسات أونلاين:\n${publicUrl}`
      : `Hello students! Here is my official course website to watch lectures and enroll:\n${publicUrl}`
  )}`;

  const stepIcons = [
    <Globe key="1" className="w-6 h-6 text-sky-400" />,
    <CreditCard key="2" className="w-6 h-6 text-emerald-400" />,
    <Video key="3" className="w-6 h-6 text-purple-400" />,
    <Share2 key="4" className="w-6 h-6 text-amber-400" />,
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white ${
        isRtl ? 'font-sans' : ''
      }`}
    >
      {/* Platform Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-sky-500/20">
              LH
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight">LearnHub</span>
              <span className="mx-2 text-[10px] uppercase font-bold tracking-widest text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                {isRtl ? 'منصة المعلمين والأكاديميات' : 'Academy Course Platform'}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <a
              href="#manual"
              className="hidden md:inline-block text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              {t.nav.howItWorks}
            </a>
            <LanguageToggle locale={locale} onToggle={setLocale} />
            <Link
              href="/app"
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              {t.nav.portal}
            </Link>
            <a
              href="#onboard"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 transition-all shadow-lg shadow-sky-600/25"
            >
              {t.nav.launch}
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden pt-20 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20 mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {t.hero.badge}
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.2] mb-6">
            {t.hero.title} <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
              {t.hero.titleHighlight}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.hero.description}
          </p>

          {/* Quick Demo Subdomain Links */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="text-slate-400 font-medium">{t.hero.demoNotice}</span>
            <Link
              href="/tenants/physics-pro"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 font-semibold flex items-center gap-1 transition-colors"
            >
              {isRtl ? 'أكاديمية د. أحمد فيزياء' : 'Physics Pro Academy'} <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href="/tenants/math-master"
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-semibold flex items-center gap-1 transition-colors"
            >
              {isRtl ? 'سنتر الرياضيات المتخصص' : 'Math Master Academy'} <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* 60-Second Onboarding Widget */}
          <div id="onboard" className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur text-left">
            <div className={`flex items-center gap-2 mb-6 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
              <Globe className="w-5 h-5 text-sky-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                {t.onboarding.title}
              </h2>
            </div>

            <form onSubmit={handleFastOnboarding} className="space-y-6">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 ${isRtl ? 'text-right' : ''}`}>
                  {t.onboarding.subdomainLabel}
                </label>
                <div dir="ltr" className="flex items-center bg-slate-950 border border-slate-700 rounded-xl overflow-hidden focus-within:border-sky-500 transition-colors">
                  <input
                    type="text"
                    required
                    placeholder={t.onboarding.subdomainPlaceholder}
                    value={subdomainInput}
                    onChange={(e) => setSubdomainInput(e.target.value)}
                    className="flex-1 bg-transparent px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                  />
                  <div className="px-4 py-3.5 bg-slate-800/80 text-xs font-mono text-slate-400 border-l border-slate-700">
                    .learnhub.me
                  </div>
                </div>
                {cleanSubdomain && (
                  <p dir="ltr" className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" /> URL: https://{cleanSubdomain}.learnhub.me
                  </p>
                )}
              </div>

              {/* Theme Customization Accent */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 ${isRtl ? 'text-right' : ''}`}>
                  {t.onboarding.themeLabel}
                </label>
                <div className={`flex items-center gap-3 ${isRtl ? 'justify-end' : ''}`}>
                  {[
                    { color: '#0284c7', name: 'Sky' },
                    { color: '#10b981', name: 'Emerald' },
                    { color: '#8b5cf6', name: 'Purple' },
                    { color: '#f59e0b', name: 'Amber' },
                    { color: '#ef4444', name: 'Rose' },
                  ].map((item) => (
                    <button
                      key={item.color}
                      type="button"
                      onClick={() => setAccentColor(item.color)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        accentColor === item.color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: item.color }}
                    >
                      {accentColor === item.color && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tier Selection */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 ${isRtl ? 'text-right' : ''}`}>
                  {t.onboarding.tierLabel}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['basic', 'pro', 'academy'] as SubscriptionTier[]).map((tier) => {
                    const info = QUOTA_TIER_LIMITS[tier];
                    const isSelected = selectedTier === tier;
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setSelectedTier(tier)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-sky-500 bg-sky-500/10 text-white shadow-md'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                        } ${isRtl ? 'text-right' : ''}`}
                      >
                        <div className="text-xs font-bold capitalize mb-1">
                          {tier === 'basic' ? (isRtl ? 'بيسك' : 'Basic') : tier === 'pro' ? (isRtl ? 'برو' : 'Pro') : (isRtl ? 'أكاديمي' : 'Academy')}
                        </div>
                        <div className="text-sm font-black text-white">
                          {tier === 'basic' ? (isRtl ? 'مجاني (5%)' : 'Free (5%)') : `${info.monthlyFeeEGP} ج.م`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {info.maxStorageGB} {isRtl ? 'جيجا للمحاضرات' : 'GB Video Space'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={!cleanSubdomain}
                className={`w-full py-4 rounded-xl font-bold text-sm text-white transition-all shadow-xl flex items-center justify-center gap-2 ${
                  cleanSubdomain
                    ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {t.onboarding.cta} <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Step-by-Step Instructor Manual Section */}
      <section id="manual" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-b border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
            <BookOpen className="w-4 h-4" />
            {t.manual.badge}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.manual.title}
          </h2>
          <p className="text-slate-400 mt-3 text-sm sm:text-base leading-relaxed">
            {t.manual.subtitle}
          </p>
        </div>

        {/* 4 Interactive Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.manual.steps.map((step, idx) => (
            <div
              key={step.number}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 relative hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
                    {stepIcons[idx]}
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-700">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                  {step.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-emerald-400/90 font-medium">
                {step.tip}
              </div>
            </div>
          ))}
        </div>

        {/* Manual CTA banner */}
        <div className="mt-12 text-center">
          <a
            href="#onboard"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-sky-500/40 text-sky-400 font-bold text-sm shadow-lg transition-all hover:scale-105"
          >
            {t.manual.cta} <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </a>
        </div>
      </section>

      {/* Feature Pillar Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-white">
            {t.features.title}
          </h2>
          <p className="text-slate-400 mt-3 text-sm">
            {t.features.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-6 border border-sky-500/20">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t.features.brandTitle}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                {t.features.brandDesc}
              </p>
            </div>
            <div className="text-xs font-semibold text-sky-400 pt-3 border-t border-slate-800">
              ✓ {t.features.brandHighlight}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t.features.videoTitle}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                {t.features.videoDesc}
              </p>
            </div>
            <div className="text-xs font-semibold text-emerald-400 pt-3 border-t border-slate-800">
              ✓ {t.features.videoHighlight}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 border border-purple-500/20">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{t.features.cashTitle}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                {t.features.cashDesc}
              </p>
            </div>
            <div className="text-xs font-semibold text-purple-400 pt-3 border-t border-slate-800">
              ✓ {t.features.cashHighlight}
            </div>
          </div>
        </div>
      </section>

      {/* Onboarding & Payment Activation Flow Modal */}
      {isOnboardingActive && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl relative">
            {/* Step A: Paid Plan Subscription Payment (Pro / Academy) */}
            {isPaymentStep && (
              <div>
                <div className="w-16 h-16 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4 border border-purple-500/40">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {isRtl ? 'تأكيد اشتراك الباقة' : 'Confirm Plan Subscription'}
                </h3>
                <p className="text-slate-300 text-xs mb-6">
                  {isRtl
                    ? `قيمة اشتراك باقة ${selectedTier === 'pro' ? 'برو (Pro)' : 'الأكاديمية'}: ${QUOTA_TIER_LIMITS[selectedTier].monthlyFeeEGP} جنيه مصري شهرياً.`
                    : `Plan fee for ${selectedTier.toUpperCase()}: ${QUOTA_TIER_LIMITS[selectedTier].monthlyFeeEGP} EGP/month.`}
                </p>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 text-start space-y-2 mb-6">
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">{isRtl ? 'تحويل فودافون كاش للمنصة:' : 'Platform Vodafone Cash:'}</span>
                    <strong className="font-mono text-white">01012345678</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{isRtl ? 'عنوان إنستاباي للمنصة:' : 'Platform InstaPay:'}</span>
                    <strong className="font-mono text-white">learnhub.eg@instapay</strong>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleCompletePlanPayment}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    {isRtl ? 'تأكيد السداد وتفعيل موقعي الآن ✓' : 'Confirm Payment & Make Website Public Now ✓'}
                  </button>
                  <button
                    onClick={() => setIsOnboardingActive(false)}
                    className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-400"
                  >
                    {isRtl ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}

            {/* Step B: Website Activated & Public Anywhere + WhatsApp Share Ready! */}
            {isActivated && (
              <div>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
                  <Check className="w-8 h-8" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {isRtl ? 'موقعك متاح أونلاين ونشط الآن للجميع' : 'Your Website is Now Live & Public Worldwide'}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {isRtl ? 'مبروك! موقع أكاديميتك أصبح جاهزاً' : 'Congratulations! Your Website is Live'}
                </h3>
                <p className="text-slate-300 text-xs mb-5">
                  {isRtl
                    ? 'تم حجز نطاقك وتفعيله بنجاح. يمكن لأي طالب الدخول لموقعك وتصفح كورساتك من أي مكان.'
                    : 'Your academy domain is activated. Students can now access your courses from anywhere.'}
                </p>

                {/* Direct Public Link Box with Copy Button */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 mb-5 flex items-center justify-between gap-2">
                  <span dir="ltr" className="font-mono text-xs text-sky-400 truncate select-all">
                    {publicUrl}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors shrink-0 flex items-center gap-1"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? (isRtl ? 'تم النسخ' : 'Copied') : (isRtl ? 'نسخ الرابط' : 'Copy')}</span>
                  </button>
                </div>

                {/* Action Buttons: WhatsApp Share & Enter Dashboard */}
                <div className="flex flex-col gap-3">
                  <a
                    href={whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{isRtl ? 'مشاركة الموقع في جروب الواتساب لطلابك' : 'Share Link on WhatsApp to Students'}</span>
                  </a>

                  <Link
                    href="/app"
                    className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>{isRtl ? 'الدخول للوحة تحكم موقعك ورفع الشروحات ←' : 'Enter Dashboard & Add Lessons →'}</span>
                  </Link>

                  <Link
                    href={`/tenants/physics-pro`}
                    className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold rounded-xl text-xs transition-colors"
                  >
                    {isRtl ? 'معاينة تجريبية كطالب' : 'Preview Student Experience'}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 py-10 px-4 text-center text-xs text-slate-500 bg-slate-950 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {isRtl
              ? 'منصة LearnHub التعليمية لمدرسي ومراكز مصر • جميع الحقوق محفوظة'
              : 'LearnHub Educational Academy Platform • All Rights Reserved'}
          </div>
          <div className="flex gap-4">
            <a href="#manual" className="hover:text-slate-300">{t.nav.howItWorks}</a>
            <Link href="/app" className="hover:text-slate-300">{t.nav.portal}</Link>
            <Link href="/tenants/physics-pro" className="hover:text-slate-300">
              {isRtl ? 'نموذج أكاديمية فيزياء' : 'Physics Academy Demo'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
