"use client";

import { useEffect, useRef } from "react";

/**
 * TUBES CURSOR — neon lentalar kursor ortidan.
 * Canvas 2D, WebGL'siz: har bir "tube" kursorni spring bilan quvlaydi,
 * o'z tarixini saqlaydi va uni yorug'lik chizig'i sifatida chizadi.
 * Mobil qurilmalarda o'chadi (hover: none).
 */

type Tube = {
  hue: number;
  lag: number;
  width: number;
  pts: { x: number; y: number }[];
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const TUBE_CONF = [
  { hue: 195, lag: 0.26, width: 4.4 },
  { hue: 285, lag: 0.2, width: 3.6 },
  { hue: 330, lag: 0.155, width: 3.0 },
  { hue: 45, lag: 0.12, width: 2.4 },
  { hue: 150, lag: 0.09, width: 2.0 },
];

const TRAIL = 42;

export default function CursorTubes() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const fine =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;

    document.body.dataset.tubes = "on";

    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const mouse = { x: w / 2, y: h / 2 };
    let active = false;
    let pressed = false;

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      active = true;
    };
    const onDown = () => (pressed = true);
    const onUp = () => (pressed = false);
    const onLeave = () => (active = false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointerleave", onLeave);

    const tubes: Tube[] = TUBE_CONF.map((c) => ({
      ...c,
      pts: Array.from({ length: TRAIL }, () => ({ x: mouse.x, y: mouse.y })),
      x: mouse.x,
      y: mouse.y,
      vx: 0,
      vy: 0,
    }));

    let raf = 0;
    let t = 0;

    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";

      for (const tube of tubes) {
        // spring towards cursor
        const k = tube.lag;
        tube.vx = (tube.vx + (mouse.x - tube.x) * k) * 0.72;
        tube.vy = (tube.vy + (mouse.y - tube.y) * k) * 0.72;
        tube.x += tube.vx;
        tube.y += tube.vy;

        tube.pts.push({ x: tube.x, y: tube.y });
        if (tube.pts.length > TRAIL) tube.pts.shift();

        const speed = Math.min(Math.hypot(tube.vx, tube.vy), 60);
        const boost = pressed ? 2.1 : 1;
        // Boʻsh turganда ham koʻrinib tursin, harakatда yorqinroq
        const alpha = active ? 0.48 + speed / 55 : 0.3;

        for (let pass = 0; pass < 2; pass++) {
          const glow = pass === 0;
          ctx.beginPath();
          ctx.moveTo(tube.pts[0].x, tube.pts[0].y);
          for (let i = 1; i < tube.pts.length - 1; i++) {
            const p = tube.pts[i];
            const n = tube.pts[i + 1];
            ctx.quadraticCurveTo(p.x, p.y, (p.x + n.x) / 2, (p.y + n.y) / 2);
          }
          const hue = tube.hue + Math.sin(t / 60) * 18;
          ctx.strokeStyle = `hsla(${hue}, 95%, ${glow ? 62 : 48}%, ${
            (glow ? alpha * 0.22 : alpha * 0.98) * boost
          })`;
          ctx.lineWidth = (glow ? tube.width * 7 : tube.width) * boost;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
        }
      }

      // Sichqoncha kursori tizimniki — ustiga nuqta chizilmaydi.
      // Faqat bosilganda yengil halqa chiqadi (bosilganini bildirish uchun).
      if (pressed) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(27,111,224,0.35)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointerleave", onLeave);
      delete document.body.dataset.tubes;
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-20 hidden md:block"
    />
  );
}
