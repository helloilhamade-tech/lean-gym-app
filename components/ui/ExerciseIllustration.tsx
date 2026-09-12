'use client';

import { MuscleGroup } from '@/lib/db/schema';

interface ExerciseIllustrationProps {
  exerciseId?: string;
  name?: string;
  muscleGroup?: MuscleGroup | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ExerciseIllustration({
  exerciseId = '',
  name = '',
  muscleGroup = 'chest',
  size = 'md',
  className = '',
}: ExerciseIllustrationProps) {
  const normName = (name + ' ' + exerciseId).toLowerCase();

  const pxSize = size === 'sm' ? 36 : size === 'lg' ? 64 : 44;

  // Render dedicated vector illustration depending on exercise type
  const renderIllustration = () => {
    // 1. INCLINE PRESS / BENCH PRESS
    if (normName.includes('incline') || normName.includes('bench press') || normName.includes('chest press')) {
      const isIncline = normName.includes('incline');
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Bench */}
          <line
            x1={isIncline ? '20' : '15'}
            y1={isIncline ? '75' : '65'}
            x2={isIncline ? '75' : '85'}
            y2={isIncline ? '40' : '65'}
            stroke="#475569"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Bench Legs */}
          <line x1="30" y1="70" x2="30" y2="88" stroke="#334155" strokeWidth="4" />
          <line x1="70" y1="50" x2="70" y2="88" stroke="#334155" strokeWidth="4" />
          {/* Lifter Body */}
          <circle cx={isIncline ? '38' : '30'} cy={isIncline ? '48' : '55'} r="8" fill="#e2e8f0" />
          <line
            x1={isIncline ? '43' : '37'}
            y1={isIncline ? '54' : '58'}
            x2={isIncline ? '65' : '65'}
            y2={isIncline ? '68' : '62'}
            stroke="#94a3b8"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Working Chest Muscle Highlight */}
          <circle
            cx={isIncline ? '50' : '48'}
            cy={isIncline ? '55' : '58'}
            r="6"
            fill="#22c55e"
            className="animate-pulse"
          />
          {/* Arms pushing up */}
          <path
            d={isIncline ? 'M48,58 L46,30 L55,24' : 'M45,58 L45,28 L55,28'}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dumbbell / Barbell */}
          <rect x={isIncline ? '40' : '38'} y="20" width="26" height="5" rx="2" fill="#38bdf8" />
          <circle cx={isIncline ? '40' : '38'} cy="22.5" r="5" fill="#0284c7" />
          <circle cx={isIncline ? '66' : '64'} cy="22.5" r="5" fill="#0284c7" />
        </svg>
      );
    }

    // 2. LAT PULLDOWN / PULL-UP
    if (normName.includes('lat pulldown') || normName.includes('pull-up') || normName.includes('pulldown')) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Machine frame */}
          <line x1="50" y1="10" x2="50" y2="30" stroke="#334155" strokeWidth="3" />
          <line x1="20" y1="20" x2="80" y2="20" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
          {/* Cable wire */}
          <line x1="50" y1="12" x2="50" y2="22" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Lifter sitting */}
          <circle cx="50" cy="40" r="7" fill="#e2e8f0" />
          {/* Back Torso */}
          <line x1="50" y1="46" x2="50" y2="72" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" />
          {/* Working Lats Wings Highlight */}
          <path d="M42,50 Q40,65 48,70 Z" fill="#22c55e" className="animate-pulse" />
          <path d="M58,50 Q60,65 52,70 Z" fill="#22c55e" className="animate-pulse" />
          {/* Arms pulling wide bar */}
          <line x1="50" y1="48" x2="28" y2="22" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="48" x2="72" y2="22" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
          {/* Seat */}
          <rect x="42" y="74" width="16" height="4" rx="2" fill="#334155" />
          <line x1="50" y1="78" x2="50" y2="90" stroke="#334155" strokeWidth="3" />
        </svg>
      );
    }

    // 3. SHOULDER PRESS / LATERAL RAISE
    if (normName.includes('shoulder') || normName.includes('lateral raise') || normName.includes('face pull')) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Lifter Head */}
          <circle cx="50" cy="30" r="8" fill="#e2e8f0" />
          {/* Torso */}
          <line x1="50" y1="38" x2="50" y2="70" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
          {/* Working Shoulder Delts Highlight */}
          <circle cx="41" cy="42" r="5" fill="#22c55e" className="animate-pulse" />
          <circle cx="59" cy="42" r="5" fill="#22c55e" className="animate-pulse" />
          {/* Arms in T-raise / Press */}
          <line x1="42" y1="42" x2="20" y2="44" stroke="#cbd5e1" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="58" y1="42" x2="80" y2="44" stroke="#cbd5e1" strokeWidth="3.5" strokeLinecap="round" />
          {/* Dumbbells */}
          <circle cx="18" cy="44" r="5" fill="#38bdf8" />
          <circle cx="82" cy="44" r="5" fill="#38bdf8" />
          {/* Legs */}
          <line x1="47" y1="70" x2="42" y2="92" stroke="#64748b" strokeWidth="4" />
          <line x1="53" y1="70" x2="58" y2="92" stroke="#64748b" strokeWidth="4" />
        </svg>
      );
    }

    // 4. SQUAT / LEG PRESS / LEGS
    if (normName.includes('squat') || normName.includes('leg press') || normName.includes('quad') || normName.includes('hamstring')) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Barbell on shoulders */}
          <line x1="16" y1="36" x2="84" y2="36" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="16" cy="36" r="6" fill="#0284c7" />
          <circle cx="84" cy="36" r="6" fill="#0284c7" />
          {/* Lifter Head */}
          <circle cx="50" cy="28" r="8" fill="#e2e8f0" />
          {/* Torso */}
          <line x1="50" y1="36" x2="50" y2="58" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
          {/* Squatting Legs / Quads Highlight */}
          <path d="M47,58 L32,70 L38,90" fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M53,58 L68,70 L62,90" fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          {/* Feet */}
          <line x1="32" y1="90" x2="42" y2="90" stroke="#334155" strokeWidth="3" />
          <line x1="58" y1="90" x2="68" y2="90" stroke="#334155" strokeWidth="3" />
        </svg>
      );
    }

    // 5. TRICEP PUSHDOWN / BICEP CURL / ARMS
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Head */}
        <circle cx="50" cy="25" r="8" fill="#e2e8f0" />
        {/* Torso */}
        <line x1="50" y1="33" x2="50" y2="68" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" />
        {/* Arm / Bicep / Tricep Highlight */}
        <path d="M46,38 L38,52 L46,62" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <circle cx="39" cy="50" r="5" fill="#22c55e" className="animate-pulse" />
        <line x1="46" y1="62" x2="56" y2="62" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
        {/* Legs */}
        <line x1="47" y1="68" x2="44" y2="92" stroke="#64748b" strokeWidth="4" />
        <line x1="53" y1="68" x2="56" y2="92" stroke="#64748b" strokeWidth="4" />
      </svg>
    );
  };

  return (
    <div
      style={{ width: pxSize, height: pxSize }}
      className={`rounded-2xl bg-card border border-surfaceBorder/80 p-1 flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden ${className}`}
    >
      {renderIllustration()}
    </div>
  );
}
