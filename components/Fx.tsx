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
   SpeedLines — 3D perspektivali tezlik chiziqlari + yulduz uchishi.
   Chiziqlar yoʻqolish nuqtasidan tashqariga eksponensial tezlashib uchadi.
   Har bir chiziqning boshi yorugʻ "yulduz" — orqasida soʻnib boruvchi dum.
   Vaqti-vaqti bilan yirikroq meteorlar (kesishuvchi nur bilan) uchib oʻtadi.
------------------------------------------------------------------ */
type Star = {
  a: number;      // burchak
  r: number;      // radius koeffitsiyenti
  z: number;      // 0..1 — chuqurlik
  v: number;      // tezlik
  l: number;      // dum uzunligi
  meteor: boolean;
  tw: number;     // miltillash fazasi
};

export function SpeedLines({
  count = 160,
  opacity = 0.6,
  speed = 2,
  hue = 199,
  meteorRate = 0.09,
}: {
  count?: number;
  opacity?: number;
  speed?: number;
  hue?: number;
  meteorRate?: number;
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

    const mk = (fresh = false): Star => {
      const meteor = Math.random() < meteorRate;
      return {
        a: Math.random() * Math.PI * 2,
        r: 0.06 + Math.random() * 0.9,
        z: fresh ? 0 : Math.random(),
        v: (meteor ? 0.006 : 0.0035) + Math.random() * (meteor ? 0.016 : 0.011),
        l: (meteor ? 0.14 : 0.05) + Math.random() * (meteor ? 0.2 : 0.14),
        meteor,
        tw: Math.random() * Math.PI * 2,
      };
    };
    const parts: Star[] = Array.from({ length: count }, () => mk());

    // fon yulduzlari (qimirlamaydi, faqat miltillaydi)
    const bg = Array.from({ length: Math.round(count * 0.35) }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 0.4 + Math.random() * 1.2,
      tw: Math.random() * Math.PI * 2,
      sp: 0.6 + Math.random() * 1.8,
    }));

    let raf = 0;
    let time = 0;

    const draw = () => {
      time += 0.016;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.hypot(w, h) * 0.62;

      ctx.globalCompositeOperation = "lighter";

      /* --- fon yulduzlari --- */
      for (const b of bg) {
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * b.sp + b.tw));
        ctx.fillStyle = `hsla(${hue}, 60%, 92%, ${tw * 0.5})`;
        ctx.beginPath();
        ctx.arc(b.x * w, b.y * h, b.s, 0, Math.PI * 2);
        ctx.fill();
      }

      /* --- uchuvchi yulduzlar --- */
      ctx.lineCap = "round";
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.z += p.v * speed;
        if (p.z > 1) {
          parts[i] = mk(true);
          continue;
        }

        const k1 = Math.pow(p.z, 2.4);
        const k2 = Math.pow(Math.max(0, p.z - p.l), 2.4);
        const spread = 0.35 + p.r;
        const ca = Math.cos(p.a);
        const sa = Math.sin(p.a) * 0.72;

        const hx = cx + ca * k1 * R * spread; // bosh (yulduz)
        const hy = cy + sa * k1 * R * spread;
        const tx = cx + ca * k2 * R * spread; // dum uchi
        const ty = cy + sa * k2 * R * spread;

        const fade = Math.min(1, p.z * 3) * (1 - Math.pow(p.z, 6));
        const wdt = (p.meteor ? 1.4 : 0.5) + k1 * (p.meteor ? 4 : 2.2);
        const light = p.meteor ? 92 : 82;

        // dum — gradient bilan soʻnadi
        const g = ctx.createLinearGradient(tx, ty, hx, hy);
        g.addColorStop(0, `hsla(${hue}, 95%, ${light}%, 0)`);
        g.addColorStop(0.65, `hsla(${hue}, 95%, ${light}%, ${fade * 0.35})`);
        g.addColorStop(1, `hsla(${hue}, 100%, 97%, ${fade * 0.95})`);
        ctx.strokeStyle = g;
        ctx.lineWidth = wdt;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();

        // bosh — yorugʻ nuqta
        const hr = (p.meteor ? 2.2 : 1.1) + k1 * (p.meteor ? 5 : 2);
        const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr * 2.6);
        hg.addColorStop(0, `rgba(255,255,255,${fade})`);
        hg.addColorStop(0.35, `hsla(${hue}, 100%, 88%, ${fade * 0.6})`);
        hg.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(hx, hy, hr * 2.6, 0, Math.PI * 2);
        ctx.fill();

        // meteor uchun kesishuvchi nur (yulduz porlashi)
        if (p.meteor && p.z > 0.35) {
          const fl = hr * 3.4 * fade;
          ctx.strokeStyle = `hsla(${hue}, 100%, 96%, ${fade * 0.55})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(hx - fl, hy);
          ctx.lineTo(hx + fl, hy);
          ctx.moveTo(hx, hy - fl * 0.7);
          ctx.lineTo(hx, hy + fl * 0.7);
          ctx.stroke();
        }
      }

      /* --- markazdagi yorugʻlik --- */
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.26);
      cg.addColorStop(0, `hsla(${hue}, 100%, 85%, .3)`);
      cg.addColorStop(1, "transparent");
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [count, speed, hue, meteorRate]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity }}>
      <canvas ref={ref} className="absolute inset-0" />
    </div>
  );
}
