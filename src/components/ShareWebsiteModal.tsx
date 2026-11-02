'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Share2, Copy, Check, MessageCircle, QrCode, X, ExternalLink, Sparkles } from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface ShareWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  subdomain: string;
  academyName: string;
  locale?: Locale;
}

export function ShareWebsiteModal({
  isOpen,
  onClose,
  subdomain,
  academyName,
  locale = 'ar',
}: ShareWebsiteModalProps) {
  const isRtl = locale === 'ar';
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const publicUrl = `https://${subdomain}.learnhub.me`;
  const shareMessage = isRtl
    ? `أهلاً بكم يا شباب! ده موقعي التعليمي الرسمي (${academyName}) لمتابعة شروحات الكورسات ومحاضرات المراجعة وحل المسائل أونلاين:\n${publicUrl}`
    : `Hello students! Here is my official academy website (${academyName}) to watch lecture videos and practice exercises:\n${publicUrl}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // QR code image via reliable public QR API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(publicUrl)}&bgcolor=020617&color=38bdf8`;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/20">
            <Share2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {isRtl ? 'مشاركة موقعك مع الطلاب' : 'Share Your Website with Students'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isRtl
              ? 'موقعك متاح أونلاين الآن! شارك الرابط عبر واتساب أو اطبع رمز QR لطلابك في السنتر.'
              : 'Your website is live! Share your link on WhatsApp or print your QR code for students.'}
          </p>
        </div>

        {/* Public Link Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            {isRtl ? 'الرابط المباشر لموقعك' : 'Your Live Website Link'}
          </label>
          <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
            <span dir="ltr" className="font-mono text-xs sm:text-sm text-sky-400 truncate select-all">
              {publicUrl}
            </span>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-700 shrink-0 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: WhatsApp & Direct Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{isRtl ? 'مشاركة في جروب الواتساب' : 'Share on WhatsApp'}</span>
          </a>

          <Link
            href={`/tenants/${subdomain}`}
            target="_blank"
            className="flex items-center justify-center gap-2 p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs border border-slate-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-sky-400" />
            <span>{isRtl ? 'زيارة الموقع كطالب' : 'Open Live Storefront'}</span>
          </Link>
        </div>

        {/* QR Code Section for Flyers and Notebooks */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 shadow">
            <img
              src={qrCodeUrl}
              alt="Website QR Code"
              className="w-28 h-28 rounded-lg"
            />
          </div>
          <div className="text-xs text-slate-400 text-center sm:text-start">
            <h4 className="font-bold text-white mb-1 flex items-center justify-center sm:justify-start gap-1.5">
              <QrCode className="w-4 h-4 text-sky-400" />
              <span>{isRtl ? 'رمز QR لمذكرات وبوسترات السنتر' : 'QR Code for Notebooks & Posters'}</span>
            </h4>
            <p className="leading-relaxed mb-2">
              {isRtl
                ? 'يمكنك أخذ لقطة شاشة للرمز وطباعته على مذكرات الشرح أو كروت الحصة، ليمسحه الطالب بكاميرا الموبايل ويدخل لموقعك مباشرة.'
                : 'Take a screenshot and print this QR code on homework booklets or center flyers for students to scan with their phones.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
