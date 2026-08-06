"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Afrosiyob uslubidagi soddalashtirilgan lokomotiv "mascot".
 * - Faralar (koʻzlar) kursorni / barmoqni kuzatadi
 * - `blind` = true bo'lsa (PIN yoki parol kiritilmoqda) faralar yopiladi
 * - `happy` = true (muvaffaqiyatli kirish) — faralar yashil yonadi
 */
export default function Locomotive({
  blind = false,
  happy = false,
  size = 190,
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
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / Math.max(r.width, 1);
      const dy = (e.clientY - cy) / Math.max(r.height, 1);
      const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
      setP({ x: clamp(dx * 26, 7), y: clamp(dy * 26, 5) });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const beam = happy ? "#22c55e" : "#bfe9ff";
  const beamGlow = happy ? "#22c55e" : "#38bdf8";

  return (
    <svg
      ref={ref}
      width={size}
      height={size * 0.78}
      viewBox="0 0 240 188"
      className="animate-floaty select-none"
      aria-hidden
    >
      <defs>
        <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4f9ff" />
          <stop offset="52%" stopColor="#cfe0f2" />
          <stop offset="100%" stopColor="#8aa2bd" />
        </linearGradient>
        <linearGradient id="stripe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1b6fe0" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <radialGradient id="lamp">
          <stop offset="0%" stopColor={beam} stopOpacity="1" />
          <stop offset="60%" stopColor={beamGlow} stopOpacity="0.5" />
          <stop offset="100%" stopColor={beamGlow} stopOpacity="0" />
        </radialGradient>
        <filter id="soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* yer soyasi */}
      <ellipse cx="120" cy="176" rx="78" ry="9" fill="#0a1220" opacity="0.85" />

      {/* korpus */}
      <path
        d="M42 150 C42 92 66 42 120 42 C174 42 198 92 198 150 Z"
        fill="url(#body)"
        stroke="#5f7997"
        strokeWidth="1.5"
      />

      {/* old oyna */}
      <path
        d="M70 118 C72 82 92 58 120 58 C148 58 168 82 170 118 Z"
        fill="#0b1a2c"
        stroke="#33506f"
        strokeWidth="2"
      />
      <path
        d="M70 118 C72 82 92 58 120 58 C148 58 168 82 170 118 Z"
        fill="url(#stripe)"
        opacity="0.18"
      />

      {/* faralar nuri */}
      {!blind && (
        <>
          <circle cx={74 + p.x} cy={140 + p.y} r="26" fill="url(#lamp)" filter="url(#soft)" opacity="0.9" />
          <circle cx={166 + p.x} cy={140 + p.y} r="26" fill="url(#lamp)" filter="url(#soft)" opacity="0.9" />
        </>
      )}

      {/* faralar korpusi */}
      <g>
        <rect x="60" y="130" width="30" height="20" rx="9" fill="#14243a" stroke="#3b5a7d" strokeWidth="1.5" />
        <rect x="150" y="130" width="30" height="20" rx="9" fill="#14243a" stroke="#3b5a7d" strokeWidth="1.5" />
        {blind ? (
          <>
            <path d="M63 141 h24" stroke="#7f96b1" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M153 141 h24" stroke="#7f96b1" strokeWidth="3.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={75 + p.x} cy={140 + p.y} r="6.5" fill={beam} />
            <circle cx={165 + p.x} cy={140 + p.y} r="6.5" fill={beam} />
          </>
        )}
      </g>

      {/* yon chiziqlar */}
      <path d="M44 156 H196" stroke="url(#stripe)" strokeWidth="7" strokeLinecap="round" />
      <path d="M52 166 H188" stroke="#25405f" strokeWidth="4" strokeLinecap="round" opacity="0.7" />

      {/* tepa antenna */}
      <path d="M104 42 L120 22 L136 42" stroke="#7f9ab8" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="120" cy="20" r="3.4" fill={happy ? "#22c55e" : "#f2b544"}>
        <animate attributeName="opacity" values="1;0.25;1" dur="2.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
