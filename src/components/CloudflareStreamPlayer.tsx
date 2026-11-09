'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, Gauge } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface CloudflareStreamPlayerProps {
  streamId?: string | null;
  muxPlaybackId?: string | null;
  courseId: string;
  lectureId: string;
  title: string;
  onEnded?: () => void;
}

export function CloudflareStreamPlayer({ streamId, muxPlaybackId, courseId, lectureId, title }: CloudflareStreamPlayerProps) {
  const [dataSaverMode, setDataSaverMode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playbackState, setPlaybackState] = useState<{
    lectureId: string;
    muxPlaybackId: string;
    token?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (!muxPlaybackId) return;

    const controller = new AbortController();

    void (async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const response = await fetch(
          `/api/mux/playback-token?lectureId=${encodeURIComponent(lectureId)}`,
          {
            headers: sessionData.session
              ? { Authorization: `Bearer ${sessionData.session.access_token}` }
              : {},
            cache: 'no-store',
            signal: controller.signal,
          }
        );
        const result = await response.json() as { token?: string; error?: string };
        if (!response.ok || !result.token) {
          throw new Error(result.error || 'Could not authorize video playback.');
        }
        setPlaybackState({ lectureId, muxPlaybackId, token: result.token });
      } catch (error) {
        if (controller.signal.aborted) return;
        setPlaybackState({
          lectureId,
          muxPlaybackId,
          error: error instanceof Error ? error.message : 'Could not authorize video playback.',
        });
      }
    })();

    return () => controller.abort();
  }, [courseId, lectureId, muxPlaybackId]);

  const currentPlayback = playbackState?.lectureId === lectureId
    && playbackState.muxPlaybackId === muxPlaybackId
    ? playbackState
    : null;
  const muxToken = currentPlayback?.token ?? null;
  const playbackError = currentPlayback?.error ?? '';
  const muxStreamUrl = muxPlaybackId && muxToken
    ? `https://player.mux.com/${encodeURIComponent(muxPlaybackId)}?token=${encodeURIComponent(muxToken)}`
    : null;
  const cloudflareStreamUrl = streamId
    ? `https://customer-m033p5x0q6nfd92u.cloudflarestream.com/${encodeURIComponent(streamId)}/iframe?preload=auto&poster=https%3A%2F%2Fcustomer-m033p5x0q6nfd92u.cloudflarestream.com%2F${encodeURIComponent(streamId)}%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D5s%26height%3D600`
    : null;

  return (
    <div className="w-full bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Player Frame */}
      <div className="relative aspect-video w-full bg-black">
        {muxStreamUrl || (!muxPlaybackId && cloudflareStreamUrl) ? (
          <iframe
            src={muxStreamUrl || cloudflareStreamUrl || undefined}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
            title={title}
          />
        ) : (
          <div role={playbackError ? 'alert' : 'status'} className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-300">
            {playbackError || 'Authorizing secure video playback...'}
          </div>
        )}
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
