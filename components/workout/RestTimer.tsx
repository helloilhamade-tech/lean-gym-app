'use client';

import { useEffect, useState } from "react";
import { Play, Pause, X } from "lucide-react";

interface RestTimerProps {
  initialSeconds?: number;
  isActive: boolean;
  onComplete?: () => void;
  onDismiss?: () => void;
  lang?: 'id' | 'en';
}

export function RestTimer({
  initialSeconds = 90,
  isActive,
  onComplete,
  onDismiss,
  lang = 'id',
}: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(isActive);

  useEffect(() => {
    setTimeLeft(initialSeconds);
    setIsRunning(isActive);
  }, [initialSeconds, isActive]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          playTimerChime();
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onComplete]);

  // Web Audio API chime (zero asset dependency, works offline)
  const playTimerChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  if (!isActive && timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPct = initialSeconds > 0 ? ((initialSeconds - timeLeft) / initialSeconds) * 100 : 0;

  return (
    <aside aria-label="Rest timer" className="fixed bottom-4 left-0 right-0 z-40 max-w-[430px] mx-auto px-3">
      <div className="bg-surface/95 backdrop-blur-md border border-surfaceBorder shadow-2xl rounded-2xl p-3 flex flex-col gap-2 transition-all">
        {/* Progress line */}
        <div className="w-full bg-surfaceBorder h-1 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            <span className="text-xs uppercase tracking-wider text-mutedText font-semibold">
              {lang === 'id' ? 'Istirahat' : 'Rest'}
            </span>
            <span className="font-mono text-xl font-bold text-white tracking-wider ml-1">
              {formattedTime}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTimeLeft((prev) => Math.max(0, prev - 15))}
              className="p-1.5 rounded-lg bg-card hover:bg-surfaceBorder text-mutedText text-xs font-semibold"
              title="-15s"
            >
              -15s
            </button>
            <button
              onClick={() => setTimeLeft((prev) => prev + 30)}
              className="p-1.5 rounded-lg bg-card hover:bg-surfaceBorder text-mutedText text-xs font-semibold"
              title="+30s"
            >
              +30s
            </button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30"
              title={isRunning ? 'Pause' : 'Play'}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1.5 rounded-lg hover:bg-card text-mutedText hover:text-white"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
