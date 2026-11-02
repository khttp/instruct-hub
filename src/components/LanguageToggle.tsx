'use client';

import React from 'react';
import { Locale } from '@/lib/i18n';
import { Languages } from 'lucide-react';

interface LanguageToggleProps {
  locale: Locale;
  onToggle: (locale: Locale) => void;
}

export function LanguageToggle({ locale, onToggle }: LanguageToggleProps) {
  return (
    <button
      onClick={() => onToggle(locale === 'en' ? 'ar' : 'en')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
      title="Toggle Language / تغيير اللغة"
    >
      <Languages className="w-3.5 h-3.5 text-sky-400" />
      <span>{locale === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
}
