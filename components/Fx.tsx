"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
   SpeedLines — 3D perspektivali tezlik chiziqlari (canvas).
   Chiziqlar markazdan (yoʻqolish nuqtasi) tashqariga qarab uchadi —
   xuddi tunnel ichida tez ketayotgandek.
------------------------------------------------------------------ */
export function SpeedLines({
  count = 160,
  opacity = 0.6,
  speed = 1,
  hue = 199,
}: {
  count?: number;
  opacity?: number;
  speed?: number;
  hue?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const parent = cv.parentElement;
    if (!parent) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = parent.clientWidth;
      h = parent.clientHeight;
      cv.width = Math.max(1, Math.floor(w * dpr));
      cv.height = Math.max(1, Math.floor(h * dpr));
      cv.style.width = w + "px";
      cv.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    type P = { a: number; r: number; z: number; v: number; l: number };
    const parts: P[] = Array.from({ length: count }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 0.06 + Math.random() * 0.9,
      z: Math.random(),
      v: 0.0035 + Math.random() * 0.011,
      l: 0.05 + Math.random() * 0.16,
    }));

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.hypot(w, h) * 0.62;

      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";

      for (const p of parts) {
        p.z += p.v * speed;
        if (p.z > 1) {
          p.z = 0;
          p.a = Math.random() * Math.PI * 2;
          p.r = 0.06 + Math.random() * 0.9;
        }
        // perspektiva: z oshgani sari markazdan uzoqlashadi (eksponensial)
        const k = Math.pow(p.z, 2.4);
        const k2 = Math.pow(Math.min(1, p.z + p.l), 2.4);
        const d1 = k * R * (0.35 + p.r);
        const d2 = k2 * R * (0.35 + p.r);
        const ca = Math.cos(p.a);
        const sa = Math.sin(p.a);

        const alpha = Math.min(1, p.z * 2.4) * (1 - p.z * 0.25);
        ctx.strokeStyle = `hsla(${hue}, 95%, 78%, ${alpha * 0.75})`;
        ctx.lineWidth = 0.5 + k * 2.4;
        ctx.beginPath();
        ctx.moveTo(cx + ca * d1, cy + sa * d1 * 0.72);
        ctx.lineTo(cx + ca * d2, cy + sa * d2 * 0.72);
        ctx.stroke();
      }

      // markazdagi yorugʻlik
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.28);
      g.addColorStop(0, `hsla(${hue}, 100%, 85%, .28)`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [count, speed, hue]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity }}>
      <canvas ref={ref} className="absolute inset-0" />
    </div>
  );
}
