'use client';

import React, { useState } from 'react';
import { Wifi, Gauge } from 'lucide-react';

interface CloudflareStreamPlayerProps {
  streamId: string;
  title: string;
  onEnded?: () => void;
}

export function CloudflareStreamPlayer({ streamId, title }: CloudflareStreamPlayerProps) {
  const [dataSaverMode, setDataSaverMode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Video Streaming URL
  const streamUrl = `https://customer-m033p5x0q6nfd92u.cloudflarestream.com/${streamId}/iframe?preload=auto&poster=https%3A%2F%2Fcustomer-m033p5x0q6nfd92u.cloudflarestream.com%2F${streamId}%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D5s%26height%3D600`;

  return (
    <div className="w-full bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Player Frame */}
      <div className="relative aspect-video w-full bg-black">
        <iframe
          src={streamUrl}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          title={title}
        />
      </div>

      {/* Egyptian Low-Bandwidth & Mobile Data Optimization Bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-200">
              مشغل فيديو ذكي عالي السرعة
            </div>
            <div className="text-xs text-slate-400">
              {dataSaverMode ? 'وضع توفير باقة النت 360p مفعل (~180 ميجا لكل ساعة)' : 'جودة ذكية تتكيف تلقائياً مع سرعة اتصالك'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 360p Data Saver Toggle */}
          <button
            onClick={() => setDataSaverMode(!dataSaverMode)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border ${
              dataSaverMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            {dataSaverMode ? 'توفير باقة النت 360p مفعل' : 'تفعيل وضع توفير باقة النت'}
          </button>

          {/* Speed Presets */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            {[1, 1.25, 1.5, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  playbackSpeed === spd ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
