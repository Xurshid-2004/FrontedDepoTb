"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------
   TouchRipple — mobil qurilmada kursor o'rniga: barmoq tekkan joydan
   tarqaladigan yorug'lik to'lqini.
------------------------------------------------------------------ */
type Ring = { id: number; x: number; y: number };

export function TouchRipple({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [rings, setRings] = useState<Ring[]>([]);
  const idRef = useRef(0);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const spawn = useCallback((e: React.PointerEvent) => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const id = ++idRef.current;
    setRings((p) => [...p, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRings((p) => p.filter((x) => x.id !== id)), 900);
  }, []);

  return (
    <div
      ref={boxRef}
      onPointerDown={spawn}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      <AnimatePresence>
        {rings.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0.55, scale: 0 }}
            animate={{ opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            style={{ left: r.x, top: r.y }}
            className="pointer-events-none absolute -ml-[240px] -mt-[240px] h-[480px] w-[480px] rounded-full"
          >
            <span className="block h-full w-full rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.45)_0%,rgba(56,189,248,0.12)_38%,transparent_66%)]" />
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------
   Tilt — kartani sichqoncha / barmoq ostida qiyalatib ko'rsatish
------------------------------------------------------------------ */
export function Tilt({
  children,
  className = "",
  max = 12,
  glare = true,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [s, setS] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, on: false });

  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setS({
      rx: (0.5 - py) * max * 2,
      ry: (px - 0.5) * max * 2,
      gx: px * 100,
      gy: py * 100,
      on: true,
    });
  };

  const leave = () => setS((p) => ({ ...p, rx: 0, ry: 0, on: false }));

  return (
    <div style={{ perspective: 1100 }} className={className}>
      <div
        ref={ref}
        onPointerMove={move}
        onPointerLeave={leave}
        style={{
          transform: `rotateX(${s.rx}deg) rotateY(${s.ry}deg) scale(${s.on ? 1.02 : 1})`,
          transformStyle: "preserve-3d",
          transition: s.on ? "transform .08s linear" : "transform .5s cubic-bezier(.16,1,.3,1)",
        }}
        className="relative h-full w-full"
      >
        {children}
        {glare && (
          <span
            aria-hidden
            style={{
              opacity: s.on ? 1 : 0,
              background: `radial-gradient(400px circle at ${s.gx}% ${s.gy}%, rgba(255,255,255,.16), transparent 45%)`,
            }}
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   SpeedLines — tezlik hissi (Afrosiyob)
------------------------------------------------------------------ */
export function SpeedLines({ count = 26, opacity = 0.5 }: { count?: number; opacity?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity }}>
      {Array.from({ length: count }).map((_, i) => {
        const left = (i / count) * 100 + (i % 3) * 1.4;
        const dur = 0.7 + ((i * 37) % 100) / 100;
        const delay = ((i * 61) % 100) / 100;
        return (
          <span
            key={i}
            className="absolute top-[-30vh] h-[26vh] w-px bg-gradient-to-b from-transparent via-sky-300/70 to-transparent"
            style={{
              left: `${left}%`,
              animation: `speedline ${dur}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
