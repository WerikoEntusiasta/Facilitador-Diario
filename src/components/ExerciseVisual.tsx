import React, { useState, useEffect } from 'react';
import { Activity, Dumbbell, Sparkles } from 'lucide-react';
import { getExerciseGifUrl } from '../lib/exerciseDb';

interface ExerciseVisualProps {
  name: string;
  gifUrl?: string;
  imageUrl?: string;
  bodyPart?: string;
  target?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showControls?: boolean;
  aspectRatio?: string;
}

export const ExerciseVisual: React.FC<ExerciseVisualProps> = ({
  name,
  gifUrl,
  imageUrl,
  bodyPart = 'chest',
  target = 'pectorals',
  className = '',
  size = 'md',
  showControls = false,
}) => {
  const [hasImageError, setHasImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [useVectorAnim, setUseVectorAnim] = useState(false);

  const resolvedUrl = gifUrl || imageUrl || getExerciseGifUrl({ name, gifUrl, imageUrl });

  useEffect(() => {
    setIsLoading(true);
    setHasImageError(false);
  }, [resolvedUrl, name]);

  const cleanName = (name || '').toLowerCase();

  const getCategory = () => {
    const b = (bodyPart || '').toLowerCase();
    const t = (target || '').toLowerCase();
    const n = cleanName;

    if (n.includes('supino') || n.includes('peito') || n.includes('bench') || n.includes('crucifixo') || n.includes('push up') || b.includes('chest') || t.includes('chest') || t.includes('pectorals')) {
      return 'chest';
    }
    if (n.includes('rosca') || n.includes('biceps') || n.includes('bíceps') || n.includes('curl') || t.includes('biceps')) {
      return 'biceps';
    }
    if (n.includes('triceps') || n.includes('tríceps') || n.includes('corda') || n.includes('testa') || t.includes('triceps')) {
      return 'triceps';
    }
    if (n.includes('puxada') || n.includes('remada') || n.includes('costa') || n.includes('dorsal') || n.includes('barra fixa') || b.includes('back') || t.includes('lat')) {
      return 'back';
    }
    if (n.includes('agacha') || n.includes('squat') || n.includes('leg press') || n.includes('extensor') || n.includes('flexor') || n.includes('stiff') || n.includes('afundo') || b.includes('leg') || t.includes('quad') || t.includes('glute')) {
      return 'legs';
    }
    if (n.includes('ombro') || n.includes('elevaç') || n.includes('desenvolvimento') || n.includes('deltoide') || b.includes('shoulder') || t.includes('delt')) {
      return 'shoulders';
    }
    if (n.includes('abdominal') || n.includes('prancha') || n.includes('crunch') || n.includes('core') || b.includes('waist') || t.includes('abs') || t.includes('abdominals')) {
      return 'abs';
    }
    return 'general';
  };

  const category = getCategory();
  const showVector = useVectorAnim || hasImageError;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-950 flex items-center justify-center select-none ${className}`}>
      {!showVector ? (
        <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
          <img
            src={resolvedUrl}
            alt={name}
            loading="lazy"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasImageError(true);
              setIsLoading(false);
            }}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 animate-pulse">
              <Activity className="w-5 h-5 text-emerald-400 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        /* Vector Animation Fallback */
        <div className="w-full h-full min-h-[120px] flex flex-col items-center justify-center p-3 relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {category === 'chest' && (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="20" y="70" width="60" height="6" rx="3" fill="#334155" />
                <rect x="28" y="76" width="6" height="16" rx="2" fill="#1e293b" />
                <rect x="66" y="76" width="6" height="16" rx="2" fill="#1e293b" />
                <circle cx="28" cy="62" r="7" fill="#94a3b8" />
                <rect x="34" y="60" width="36" height="10" rx="4" fill="#64748b" />
                <circle cx="48" cy="64" r="5" fill="#10b981" className="animate-ping opacity-75" />
                <circle cx="48" cy="64" r="4" fill="#10b981" />
                <g className="animate-bounce" style={{ animationDuration: '1.4s' }}>
                  <line x1="20" y1="36" x2="80" y2="36" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                  <rect x="18" y="26" width="6" height="20" rx="2" fill="#ef4444" />
                  <rect x="76" y="26" width="6" height="20" rx="2" fill="#ef4444" />
                  <line x1="38" y1="36" x2="42" y2="60" stroke="#94a3b8" strokeWidth="3" />
                  <line x1="62" y1="36" x2="58" y2="60" stroke="#94a3b8" strokeWidth="3" />
                </g>
              </svg>
            )}

            {category === 'biceps' && (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="40" cy="24" r="8" fill="#94a3b8" />
                <rect x="34" y="32" width="14" height="40" rx="4" fill="#475569" />
                <circle cx="56" cy="46" r="6" fill="#10b981" className="animate-pulse" />
                <g className="origin-bottom" style={{ transformOrigin: '48px 52px' }}>
                  <line x1="48" y1="38" x2="56" y2="52" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
                  <g className="animate-bounce" style={{ animationDuration: '1.2s' }}>
                    <line x1="56" y1="52" x2="68" y2="40" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                    <rect x="62" y="32" width="12" height="16" rx="3" fill="#f59e0b" />
                    <line x1="68" y1="28" x2="68" y2="52" stroke="#64748b" strokeWidth="4" />
                  </g>
                </g>
              </svg>
            )}

            {category === 'triceps' && (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <line x1="60" y1="10" x2="60" y2="35" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="36" cy="25" r="8" fill="#94a3b8" />
                <rect x="30" y="33" width="14" height="40" rx="4" fill="#475569" />
                <circle cx="48" cy="42" r="5" fill="#10b981" className="animate-pulse" />
                <g className="animate-bounce" style={{ animationDuration: '1.3s' }}>
                  <line x1="44" y1="38" x2="52" y2="50" stroke="#94a3b8" strokeWidth="4" />
                  <line x1="52" y1="50" x2="60" y2="68" stroke="#94a3b8" strokeWidth="4" />
                  <path d="M 54 68 Q 60 72 66 68" stroke="#f59e0b" strokeWidth="5" fill="none" strokeLinecap="round" />
                </g>
              </svg>
            )}

            {category === 'back' && (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <line x1="20" y1="12" x2="80" y2="12" stroke="#475569" strokeWidth="4" />
                <circle cx="50" cy="48" r="8" fill="#94a3b8" />
                <path d="M 38 56 L 62 56 L 56 86 L 44 86 Z" fill="#334155" />
                <path d="M 36 60 Q 30 70 42 78" stroke="#10b981" strokeWidth="4" fill="none" className="animate-pulse" />
                <path d="M 64 60 Q 70 70 58 78" stroke="#10b981" strokeWidth="4" fill="none" className="animate-pulse" />
                <g className="animate-bounce" style={{ animationDuration: '1.5s' }}>
                  <line x1="15" y1="32" x2="85" y2="32" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                  <line x1="25" y1="32" x2="42" y2="56" stroke="#94a3b8" strokeWidth="3" />
                  <line x1="75" y1="32" x2="58" y2="56" stroke="#94a3b8" strokeWidth="3" />
                </g>
              </svg>
            )}

            {category === 'legs' && (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <g className="animate-bounce" style={{ animationDuration: '1.6s' }}>
                  <circle cx="50" cy="22" r="7" fill="#94a3b8" />
                  <line x1="15" y1="28" x2="85" y2="28" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                  <rect x="14" y="18" width="6" height="20" rx="2" fill="#ef4444" />
                  <rect x="80" y="18" width="6" height="20" rx="2" fill="#ef4444" />
                  <rect x="44" y="30" width="12" height="26" rx="3" fill="#475569" />
                  <circle cx="42" cy="62" r="5" fill="#10b981" className="animate-pulse" />
                  <circle cx="58" cy="62" r="5" fill="#10b981" className="animate-pulse" />
                  <line x1="46" y1="56" x2="38" y2="70" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
                  <line x1="54" y1="56" x2="62" y2="70" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
                </g>
              </svg>
            )}

            {category === 'shoulders' && (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="24" r="8" fill="#94a3b8" />
                <rect x="42" y="32" width="16" height="38" rx="4" fill="#334155" />
                <circle cx="36" cy="36" r="4" fill="#10b981" />
                <circle cx="64" cy="36" r="4" fill="#10b981" />
                <g className="animate-bounce" style={{ animationDuration: '1.4s' }}>
                  <line x1="42" y1="36" x2="22" y2="38" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                  <line x1="58" y1="36" x2="78" y2="38" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                  <rect x="14" y="32" width="8" height="12" rx="2" fill="#f59e0b" />
                  <rect x="78" y="32" width="8" height="12" rx="2" fill="#f59e0b" />
                </g>
              </svg>
            )}

            {category === 'abs' && (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <line x1="15" y1="75" x2="85" y2="75" stroke="#334155" strokeWidth="4" />
                <g className="animate-bounce" style={{ animationDuration: '1.3s' }}>
                  <circle cx="32" cy="50" r="7" fill="#94a3b8" />
                  <line x1="32" y1="56" x2="48" y2="68" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
                  <circle cx="44" cy="62" r="5" fill="#10b981" className="animate-pulse" />
                  <line x1="48" y1="68" x2="66" y2="54" stroke="#64748b" strokeWidth="6" strokeLinecap="round" />
                </g>
              </svg>
            )}

            {category === 'general' && (
              <div className="flex flex-col items-center justify-center animate-pulse">
                <Dumbbell className="w-12 h-12 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
            )}
          </div>

          <div className="text-center mt-1 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
              <Activity size={10} className="animate-pulse" /> Movimento 3D
            </span>
          </div>
        </div>
      )}

      {showControls && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setUseVectorAnim(!useVectorAnim);
          }}
          className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1 border border-white/20 cursor-pointer z-20"
          title="Alternar modo de animação"
        >
          <Sparkles size={12} className="text-amber-400" /> {useVectorAnim ? 'Ver GIF' : 'Ver 3D'}
        </button>
      )}
    </div>
  );
};
