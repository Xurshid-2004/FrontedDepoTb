"use client";

import { useEffect, useRef, useState } from "react";

/**
 * «AFROSIYOB» (Talgo-250) old koʻrinishi — mascot.
 * Haqiqiy livreyaga mos: tepasi toʻq koʻk kabina, pasti oq-kumush burun,
 * keng qora shamol oynasi, past joylashgan farlar va tashqi qizil signallar.
 *
 * - Farlar kursorni / barmoqni kuzatadi (nur konusi ham buriladi)
 * - `blind` = true  → farlar yopiladi (PIN yoki parol kiritilmoqda)
 * - `happy` = true  → farlar yashil yonadi (muvaffaqiyatli kirish)
 */
export default function Locomotive({
  blind = false,
  happy = false,
  size = 220,
}: {
  blind?: boolean;
  happy?: boolean;
  size?: number;
}) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [p, setP] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / Math.max(r.width, 1);
      const dy = (e.clientY - (r.top + r.height / 2)) / Math.max(r.height, 1);
      const c = (v: number, m: number) => Math.max(-m, Math.min(m, v));
      setP({ x: c(dx * 32, 8), y: c(dy * 26, 5) });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const lamp = happy ? "#7bf3a8" : "#eafaff";
  const halo = happy ? "#22c55e" : "#8ad6ff";

  return (
    <svg
      ref={ref}
      width={size}
      height={size * 0.94}
      viewBox="0 0 260 244"
      className="animate-floaty select-none overflow-visible"
      aria-hidden
    >
      <defs>
        {/* koʻk kabina */}
        <linearGradient id="af-blue" x1="0.25" y1="0" x2="0.75" y2="1">
          <stop offset="0%" stopColor="#3f7fd4" />
          <stop offset="35%" stopColor="#1f5aac" />
          <stop offset="100%" stopColor="#10346b" />
        </linearGradient>
        {/* oq-kumush burun */}
        <linearGradient id="af-white" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="38%" stopColor="#eaf1f8" />
          <stop offset="100%" stopColor="#9fb0c3" />
        </linearGradient>
        <linearGradient id="af-glass" x1="0.2" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#3a6f9e" />
          <stop offset="30%" stopColor="#0d2137" />
          <stop offset="100%" stopColor="#050d18" />
        </linearGradient>
        <linearGradient id="af-spec" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="62%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="af-halo">
          <stop offset="0%" stopColor={lamp} stopOpacity="0.95" />
          <stop offset="45%" stopColor={halo} stopOpacity="0.4" />
          <stop offset="100%" stopColor={halo} stopOpacity="0" />
        </radialGradient>
        <filter id="af-blur" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="af-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="12" stdDeviation="11" floodColor="#020712" floodOpacity="0.8" />
        </filter>
        {/* korpus konturi — livreyani kesish uchun */}
        <clipPath id="af-clip">
          <path d="M32 196 C32 126 50 34 130 34 C210 34 228 126 228 196 C228 201 224 204 219 204 L41 204 C36 204 32 201 32 196 Z" />
        </clipPath>
      </defs>

      {/* soya */}
      <ellipse cx="130" cy="216" rx="88" ry="10" fill="#020712" opacity="0.9" />
      <ellipse cx="130" cy="216" rx="54" ry="6" fill="#0a1a2c" opacity="0.9" />

      {/* far nur konuslari */}
      {!blind && (
        <g filter="url(#af-blur)" opacity="0.85">
          <path d={`M76 180 L${30 + p.x * 2} 244 L${118 + p.x * 2} 244 Z`} fill="url(#af-halo)" />
          <path d={`M184 180 L${142 + p.x * 2} 244 L${230 + p.x * 2} 244 Z`} fill="url(#af-halo)" />
        </g>
      )}

      <g filter="url(#af-shadow)">
        {/* asosiy korpus — oq burun */}
        <path
          d="M32 196 C32 126 50 34 130 34 C210 34 228 126 228 196 C228 201 224 204 219 204 L41 204 C36 204 32 201 32 196 Z"
          fill="url(#af-white)"
        />

        {/* koʻk kabina (yuqori qism) */}
        <g clipPath="url(#af-clip)">
          <path
            d="M20 34 C20 34 60 20 130 20 C200 20 240 34 240 34 L240 128 C210 118 176 112 130 112 C84 112 50 118 20 128 Z"
            fill="url(#af-blue)"
          />
          {/* koʻk va oq orasidagi qora ajratuvchi */}
          <path
            d="M20 126 C50 116 84 110 130 110 C176 110 210 116 240 126 L240 136 C210 126 176 120 130 120 C84 120 50 126 20 136 Z"
            fill="#08192e"
          />
          {/* tepadagi yorugʻ qirra */}
          <path
            d="M56 62 C74 40 100 32 130 32 C160 32 186 40 204 62 C178 46 156 40 130 40 C104 40 82 46 56 62 Z"
            fill="#ffffff"
            opacity="0.28"
          />
        </g>

        {/* yon spekulyar chiziq */}
        <path
          d="M38 190 C38 124 56 44 130 44 C204 44 222 124 222 190"
          fill="none"
          stroke="url(#af-spec)"
          strokeWidth="3"
          opacity="0.45"
        />

        {/* marshrut tablosi */}
        <rect x="96" y="46" width="68" height="14" rx="3" fill="#071628" />
        <rect x="100" y="49" width="60" height="8" rx="2" fill="#0d3050" />
        <g fill="#6fd2ff" opacity="0.85">
          <rect x="105" y="51" width="10" height="4" rx="1" />
          <rect x="120" y="51" width="14" height="4" rx="1" />
          <rect x="139" y="51" width="10" height="4" rx="1" />
        </g>

        {/* shamol oynasi */}
        <path
          d="M60 108
             C63 82 88 66 130 66
             C172 66 197 82 200 108
             C172 100 152 97 130 97
             C108 97 88 100 60 108 Z"
          fill="url(#af-glass)"
        />
        <path
          d="M74 100 C80 84 96 74 122 71 C104 79 90 88 84 104 Z"
          fill="#9ad8ff"
          opacity="0.3"
        />
        {/* stekloochistitel */}
        <path d="M96 104 L118 86" stroke="#0a1a2b" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
        <path d="M146 104 L166 88" stroke="#0a1a2b" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />

        {/* qizil signal chiroqlari (tashqarida) */}
        <ellipse cx="52" cy="158" rx="10" ry="6" fill="#3b0d12" />
        <ellipse cx="208" cy="158" rx="10" ry="6" fill="#3b0d12" />
        <ellipse cx="52" cy="158" rx="6.5" ry="3.6" fill="#ff4d4d" opacity={blind ? 0.35 : 1} />
        <ellipse cx="208" cy="158" rx="6.5" ry="3.6" fill="#ff4d4d" opacity={blind ? 0.35 : 1} />

        {/* farlar uyasi */}
        <g>
          <rect x="66" y="168" width="52" height="20" rx="10" fill="#0a1626" />
          <rect x="142" y="168" width="52" height="20" rx="10" fill="#0a1626" />
          <rect x="66" y="168" width="52" height="20" rx="10" fill="none" stroke="#5b7ba1" strokeWidth="1.4" />
          <rect x="142" y="168" width="52" height="20" rx="10" fill="none" stroke="#5b7ba1" strokeWidth="1.4" />

          {blind ? (
            <>
              <path d="M73 178 h38" stroke="#8199b4" strokeWidth="4" strokeLinecap="round" />
              <path d="M149 178 h38" stroke="#8199b4" strokeWidth="4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx={92 + p.x} cy={178 + p.y * 0.5} rx="17" ry="6.5" fill={lamp} />
              <ellipse cx={168 + p.x} cy={178 + p.y * 0.5} rx="17" ry="6.5" fill={lamp} />
              <ellipse cx={92 + p.x} cy={178 + p.y * 0.5} rx="7" ry="3" fill="#ffffff" />
              <ellipse cx={168 + p.x} cy={178 + p.y * 0.5} rx="7" ry="3" fill="#ffffff" />
            </>
          )}
        </g>

        {/* markazdagi panjara / mufta qopqogʻi */}
        <rect x="108" y="164" width="44" height="26" rx="5" fill="#dfe7f0" stroke="#8ea3b8" strokeWidth="1.2" />
        <g stroke="#8ea3b8" strokeWidth="1.6" strokeLinecap="round">
          <path d="M114 171 h32" />
          <path d="M114 177 h32" />
          <path d="M114 183 h32" />
        </g>

        {/* pastki etak */}
        <path d="M38 196 L222 196 L218 204 L42 204 Z" fill="#152437" />
        <rect x="116" y="192" width="28" height="12" rx="3" fill="#0b1929" />
      </g>

      {/* pantograf */}
      <g stroke="#a4bacf" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M110 34 L130 12" />
        <path d="M150 34 L130 12" />
        <path d="M108 12 H152" />
      </g>
      <circle cx="130" cy="8" r="4" fill={happy ? "#22c55e" : "#f2b544"}>
        <animate attributeName="opacity" values="1;0.2;1" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
