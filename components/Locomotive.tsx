"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Afrosiyob (Talgo-250) uslubidagi lokomotiv "mascot".
 * - Faralar kursorni / barmoqni kuzatadi (nur konusi ham buriladi)
 * - `blind` = true  → faralar yopiladi (PIN/parol kiritilmoqda)
 * - `happy` = true  → faralar yashil yonadi (muvaffaqiyatli kirish)
 * SVG, lekin koʻp qatlamli gradient va soyalar bilan 3D taassurot beradi.
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
      setP({ x: c(dx * 34, 9), y: c(dy * 30, 6) });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const lamp = happy ? "#7bf3a8" : "#e8f9ff";
  const halo = happy ? "#22c55e" : "#7cd4ff";

  return (
    <svg
      ref={ref}
      width={size}
      height={size * 0.86}
      viewBox="0 0 260 224"
      className="animate-floaty select-none overflow-visible"
      aria-hidden
    >
      <defs>
        {/* korpus: yuqoridan yorug', pastdan qorong'i */}
        <linearGradient id="lc-body" x1="0.25" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="26%" stopColor="#eaf3fb" />
          <stop offset="58%" stopColor="#c3d4e6" />
          <stop offset="100%" stopColor="#7f95ad" />
        </linearGradient>
        {/* yon qirradagi aks etish */}
        <linearGradient id="lc-spec" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lc-glass" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#2b5f8f" />
          <stop offset="35%" stopColor="#0d2138" />
          <stop offset="100%" stopColor="#050e1a" />
        </linearGradient>
        <linearGradient id="lc-stripe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0b4ea8" />
          <stop offset="45%" stopColor="#2f8ff0" />
          <stop offset="100%" stopColor="#0b4ea8" />
        </linearGradient>
        <radialGradient id="lc-halo">
          <stop offset="0%" stopColor={lamp} stopOpacity="0.95" />
          <stop offset="45%" stopColor={halo} stopOpacity="0.42" />
          <stop offset="100%" stopColor={halo} stopOpacity="0" />
        </radialGradient>
        <filter id="lc-blur" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="lc-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#020712" floodOpacity="0.75" />
        </filter>
      </defs>

      {/* pastdagi soya */}
      <ellipse cx="130" cy="204" rx="86" ry="10" fill="#020712" opacity="0.9" />
      <ellipse cx="130" cy="204" rx="52" ry="6" fill="#0a1a2c" opacity="0.9" />

      {/* nur konuslari (faralardan) */}
      {!blind && (
        <g filter="url(#lc-blur)" opacity="0.85">
          <path
            d={`M78 168 L${34 + p.x * 2} 224 L${118 + p.x * 2} 224 Z`}
            fill="url(#lc-halo)"
          />
          <path
            d={`M182 168 L${142 + p.x * 2} 224 L${226 + p.x * 2} 224 Z`}
            fill="url(#lc-halo)"
          />
        </g>
      )}

      <g filter="url(#lc-shadow)">
        {/* asosiy korpus — Talgo burun silueti */}
        <path
          d="M34 186
             C34 120 52 40 130 40
             C208 40 226 120 226 186
             C226 190 222 192 218 192
             L42 192
             C38 192 34 190 34 186 Z"
          fill="url(#lc-body)"
        />
        {/* yuqori yorug' qirra */}
        <path
          d="M60 96 C74 56 98 44 130 44 C162 44 186 56 200 96 C176 70 154 60 130 60 C106 60 84 70 60 96 Z"
          fill="#ffffff"
          opacity="0.75"
        />
        {/* yon spekulyar chiziq */}
        <path
          d="M40 178 C40 116 58 52 130 52 C202 52 220 116 220 178"
          fill="none"
          stroke="url(#lc-spec)"
          strokeWidth="3"
          opacity="0.5"
        />

        {/* old oyna */}
        <path
          d="M66 132
             C69 88 92 62 130 62
             C168 62 191 88 194 132
             C170 122 152 118 130 118
             C108 118 90 122 66 132 Z"
          fill="url(#lc-glass)"
        />
        {/* oynadagi aks */}
        <path
          d="M80 122 C86 92 102 74 128 71 C110 82 96 100 90 126 Z"
          fill="#8fd0ff"
          opacity="0.28"
        />

        {/* koʻk livreya chizigʻi */}
        <path
          d="M38 152 C60 142 96 137 130 137 C164 137 200 142 222 152 L222 163 C200 153 164 148 130 148 C96 148 60 153 38 163 Z"
          fill="url(#lc-stripe)"
        />

        {/* faralar uyasi */}
        <g>
          <rect x="56" y="160" width="46" height="18" rx="9" fill="#0a1626" />
          <rect x="158" y="160" width="46" height="18" rx="9" fill="#0a1626" />
          <rect x="56" y="160" width="46" height="18" rx="9" fill="none" stroke="#48688c" strokeWidth="1.4" />
          <rect x="158" y="160" width="46" height="18" rx="9" fill="none" stroke="#48688c" strokeWidth="1.4" />

          {blind ? (
            <>
              <path d="M62 169 h34" stroke="#7c93ad" strokeWidth="4" strokeLinecap="round" />
              <path d="M164 169 h34" stroke="#7c93ad" strokeWidth="4" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx={79 + p.x} cy={169 + p.y * 0.5} rx="14" ry="6" fill={lamp} />
              <ellipse cx={181 + p.x} cy={169 + p.y * 0.5} rx="14" ry="6" fill={lamp} />
              <ellipse cx={79 + p.x} cy={169 + p.y * 0.5} rx="6" ry="3" fill="#ffffff" />
              <ellipse cx={181 + p.x} cy={169 + p.y * 0.5} rx="6" ry="3" fill="#ffffff" />
            </>
          )}
        </g>

        {/* pastki etak */}
        <path d="M40 184 L220 184 L216 192 L44 192 Z" fill="#16273c" />
        <rect x="118" y="180" width="24" height="12" rx="3" fill="#0c1929" />
      </g>

      {/* pantograf */}
      <g stroke="#8ea6bf" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M112 40 L130 16" />
        <path d="M148 40 L130 16" />
        <path d="M112 16 H148" />
      </g>
      <circle cx="130" cy="12" r="4" fill={happy ? "#22c55e" : "#f2b544"}>
        <animate attributeName="opacity" values="1;0.2;1" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
