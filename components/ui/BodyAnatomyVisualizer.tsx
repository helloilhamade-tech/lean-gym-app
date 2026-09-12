'use client';

import { MuscleGroup } from '@/lib/db/schema';

interface BodyAnatomyVisualizerProps {
  activeMuscles?: MuscleGroup[];
  highlightColor?: string;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onMuscleClick?: (muscle: MuscleGroup) => void;
  showLabels?: boolean;
}

export function BodyAnatomyVisualizer({
  activeMuscles = [],
  highlightColor = '#22c55e', // Athletic emerald green
  size = 'md',
  interactive = false,
  onMuscleClick,
  showLabels = true,
}: BodyAnatomyVisualizerProps) {
  const isHighlighted = (muscle: MuscleGroup) => activeMuscles.includes(muscle);

  const getFill = (muscle: MuscleGroup) => {
    return isHighlighted(muscle) ? highlightColor : '#2c3138';
  };

  const getGlowFilter = (muscle: MuscleGroup) => {
    return isHighlighted(muscle) ? 'drop-shadow(0 0 6px rgba(34,197,94,0.7))' : 'none';
  };

  const width = size === 'sm' ? 140 : size === 'lg' ? 260 : 200;
  const height = size === 'sm' ? 210 : size === 'lg' ? 390 : 300;

  const handleClick = (muscle: MuscleGroup) => {
    if (interactive && onMuscleClick) {
      onMuscleClick(muscle);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-card/60 border border-surfaceBorder rounded-3xl backdrop-blur-sm">
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        {/* ================= FRONT (ANTERIOR) BODY ================= */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText mb-2">
            Tampak Depan
          </span>
          <svg
            width={width}
            height={height}
            viewBox="0 0 160 240"
            className="transition-all select-none"
          >
            {/* Head */}
            <circle cx="80" cy="22" r="14" fill="#3a4149" stroke="#1f2328" strokeWidth="1.5" />

            {/* Neck & Upper Traps */}
            <path
              d="M74,34 L86,34 L90,44 L70,44 Z"
              fill="#3a4149"
              stroke="#1f2328"
              strokeWidth="1"
            />

            {/* Shoulders (Front & Lateral Delts) */}
            <path
              d="M48,46 Q40,55 42,70 Q52,65 56,50 Z"
              fill={getFill('shoulders')}
              style={{ filter: getGlowFilter('shoulders') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('shoulders')}
            />
            <path
              d="M112,46 Q120,55 118,70 Q108,65 104,50 Z"
              fill={getFill('shoulders')}
              style={{ filter: getGlowFilter('shoulders') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('shoulders')}
            />

            {/* Chest (Pectoralis Major) */}
            <path
              d="M58,47 Q78,50 78,74 Q62,76 56,66 Q54,54 58,47 Z"
              fill={getFill('chest')}
              style={{ filter: getGlowFilter('chest') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('chest')}
            />
            <path
              d="M102,47 Q82,50 82,74 Q98,76 104,66 Q106,54 102,47 Z"
              fill={getFill('chest')}
              style={{ filter: getGlowFilter('chest') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('chest')}
            />

            {/* Biceps */}
            <path
              d="M39,71 Q34,85 36,98 Q44,96 46,82 Q45,74 39,71 Z"
              fill={getFill('biceps')}
              style={{ filter: getGlowFilter('biceps') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('biceps')}
            />
            <path
              d="M121,71 Q126,85 124,98 Q116,96 114,82 Q115,74 121,71 Z"
              fill={getFill('biceps')}
              style={{ filter: getGlowFilter('biceps') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('biceps')}
            />

            {/* Forearms */}
            <path
              d="M34,101 Q28,122 30,135 Q37,133 42,118 Q41,105 34,101 Z"
              fill="#2c3138"
              stroke="#1f2328"
            />
            <path
              d="M126,101 Q132,122 130,135 Q123,133 118,118 Q119,105 126,101 Z"
              fill="#2c3138"
              stroke="#1f2328"
            />

            {/* Core / Rectus Abdominis (6-Pack) */}
            <g
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('core')}
            >
              {/* Upper abs */}
              <rect
                x="68"
                y="76"
                width="11"
                height="10"
                rx="2"
                fill={getFill('core')}
                style={{ filter: getGlowFilter('core') }}
              />
              <rect
                x="81"
                y="76"
                width="11"
                height="10"
                rx="2"
                fill={getFill('core')}
                style={{ filter: getGlowFilter('core') }}
              />
              {/* Mid abs */}
              <rect
                x="68"
                y="88"
                width="11"
                height="10"
                rx="2"
                fill={getFill('core')}
                style={{ filter: getGlowFilter('core') }}
              />
              <rect
                x="81"
                y="88"
                width="11"
                height="10"
                rx="2"
                fill={getFill('core')}
                style={{ filter: getGlowFilter('core') }}
              />
              {/* Lower abs */}
              <rect
                x="69"
                y="100"
                width="10"
                height="11"
                rx="2"
                fill={getFill('core')}
                style={{ filter: getGlowFilter('core') }}
              />
              <rect
                x="81"
                y="100"
                width="10"
                height="11"
                rx="2"
                fill={getFill('core')}
                style={{ filter: getGlowFilter('core') }}
              />
            </g>

            {/* Obliques (Waist) */}
            <path
              d="M59,76 Q66,88 66,112 Q56,108 55,88 Z"
              fill={getFill('core')}
              style={{ filter: getGlowFilter('core') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('core')}
            />
            <path
              d="M101,76 Q94,88 94,112 Q104,108 105,88 Z"
              fill={getFill('core')}
              style={{ filter: getGlowFilter('core') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('core')}
            />

            {/* Pelvis / Hips */}
            <path
              d="M63,114 L97,114 L90,132 L70,132 Z"
              fill="#262b32"
              stroke="#1f2328"
            />

            {/* Quadriceps (Front Thighs) */}
            <path
              d="M55,134 Q51,162 60,186 Q72,185 75,158 Q73,135 55,134 Z"
              fill={getFill('quads')}
              style={{ filter: getGlowFilter('quads') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('quads')}
            />
            <path
              d="M105,134 Q109,162 100,186 Q88,185 85,158 Q87,135 105,134 Z"
              fill={getFill('quads')}
              style={{ filter: getGlowFilter('quads') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('quads')}
            />

            {/* Knees */}
            <circle cx="62" cy="191" r="5" fill="#3a4149" />
            <circle cx="98" cy="191" r="5" fill="#3a4149" />

            {/* Calves / Shin (Front) */}
            <path
              d="M57,198 Q54,215 58,230 Q67,230 68,214 Q66,198 57,198 Z"
              fill={getFill('calves')}
              style={{ filter: getGlowFilter('calves') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('calves')}
            />
            <path
              d="M103,198 Q106,215 102,230 Q93,230 92,214 Q94,198 103,198 Z"
              fill={getFill('calves')}
              style={{ filter: getGlowFilter('calves') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('calves')}
            />
          </svg>
        </div>

        {/* ================= BACK (POSTERIOR) BODY ================= */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mutedText mb-2">
            Tampak Belakang
          </span>
          <svg
            width={width}
            height={height}
            viewBox="0 0 160 240"
            className="transition-all select-none"
          >
            {/* Back Head */}
            <circle cx="80" cy="22" r="14" fill="#3a4149" stroke="#1f2328" strokeWidth="1.5" />

            {/* Upper Trapezius */}
            <path
              d="M68,36 Q80,44 92,36 L104,46 L56,46 Z"
              fill={getFill('back')}
              style={{ filter: getGlowFilter('back') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('back')}
            />

            {/* Rear Deltoids */}
            <path
              d="M48,46 Q40,55 42,68 Q50,65 54,50 Z"
              fill={getFill('shoulders')}
              style={{ filter: getGlowFilter('shoulders') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('shoulders')}
            />
            <path
              d="M112,46 Q120,55 118,68 Q110,65 106,50 Z"
              fill={getFill('shoulders')}
              style={{ filter: getGlowFilter('shoulders') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('shoulders')}
            />

            {/* Mid Back & Rhomboids */}
            <path
              d="M58,48 L102,48 L94,76 L66,76 Z"
              fill={getFill('back')}
              style={{ filter: getGlowFilter('back') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('back')}
            />

            {/* Latissimus Dorsi (Lats / V-Taper) */}
            <path
              d="M55,54 Q50,78 62,104 Q72,96 74,78 Q62,68 55,54 Z"
              fill={getFill('back')}
              style={{ filter: getGlowFilter('back') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('back')}
            />
            <path
              d="M105,54 Q110,78 98,104 Q88,96 86,78 Q98,68 105,54 Z"
              fill={getFill('back')}
              style={{ filter: getGlowFilter('back') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('back')}
            />

            {/* Triceps (Long & Lateral Heads) */}
            <path
              d="M39,70 Q32,84 35,98 Q43,96 46,84 Q45,74 39,70 Z"
              fill={getFill('triceps')}
              style={{ filter: getGlowFilter('triceps') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('triceps')}
            />
            <path
              d="M121,70 Q128,84 125,98 Q117,96 114,84 Q115,74 121,70 Z"
              fill={getFill('triceps')}
              style={{ filter: getGlowFilter('triceps') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('triceps')}
            />

            {/* Lower Back (Erector Spinae) */}
            <path
              d="M68,90 L92,90 L88,114 L72,114 Z"
              fill={getFill('back')}
              style={{ filter: getGlowFilter('back') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('back')}
            />

            {/* Glutes (Bokong) */}
            <path
              d="M56,116 Q54,136 68,146 Q80,146 79,126 Q74,116 56,116 Z"
              fill={getFill('glutes')}
              style={{ filter: getGlowFilter('glutes') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('glutes')}
            />
            <path
              d="M104,116 Q106,136 92,146 Q80,146 81,126 Q86,116 104,116 Z"
              fill={getFill('glutes')}
              style={{ filter: getGlowFilter('glutes') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('glutes')}
            />

            {/* Hamstrings (Paha Belakang) */}
            <path
              d="M58,147 Q52,168 59,186 Q72,185 75,166 Q74,148 58,147 Z"
              fill={getFill('hamstrings')}
              style={{ filter: getGlowFilter('hamstrings') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('hamstrings')}
            />
            <path
              d="M102,147 Q108,168 101,186 Q88,185 85,166 Q86,148 102,147 Z"
              fill={getFill('hamstrings')}
              style={{ filter: getGlowFilter('hamstrings') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('hamstrings')}
            />

            {/* Back Calves (Gastrocnemius) */}
            <path
              d="M56,196 Q50,214 56,230 Q67,230 68,214 Q68,198 56,196 Z"
              fill={getFill('calves')}
              style={{ filter: getGlowFilter('calves') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('calves')}
            />
            <path
              d="M104,196 Q110,214 104,230 Q93,230 92,214 Q92,198 104,196 Z"
              fill={getFill('calves')}
              style={{ filter: getGlowFilter('calves') }}
              className={interactive ? 'cursor-pointer hover:opacity-80' : ''}
              onClick={() => handleClick('calves')}
            />
          </svg>
        </div>
      </div>

      {showLabels && activeMuscles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
          {activeMuscles.map((m) => (
            <span
              key={m}
              className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30"
            >
              Target: {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
