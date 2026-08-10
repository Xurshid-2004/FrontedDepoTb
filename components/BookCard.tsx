"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tilt } from "./Fx";

type Phase = "closed" | "shatter" | "assemble" | "open" | "content";

const COLS = 7;
const ROWS = 10;

/**
 * KITOB EFFEKTI (ikki bosqichli — kelishilganidek):
 *  1) shatter  — muqova mayda boʻlaklarga parchalanib uchib ketadi
 *  2) assemble — boʻlaklar qaytib kelib kitob shaklini yigʻadi
 *  3) open     — kitob 3D da ochiladi, ichidan jurnal sahifasi chiqadi
 */
export default function BookCard({
  title,
  subtitle,
  accent = "#38bdf8",
  children,
}: {
  title: string;
  subtitle: string;
  accent?: string;
  children?: React.ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>("closed");

  const tiles = useMemo(
    () =>
      Array.from({ length: COLS * ROWS }, (_, i) => {
        const cx = i % COLS;
        const cy = Math.floor(i / COLS);
        const dx = (cx - (COLS - 1) / 2) / COLS;
        const dy = (cy - (ROWS - 1) / 2) / ROWS;
        const seed = (i * 9301 + 49297) % 233280;
        const rnd = seed / 233280;
        return {
          i,
          cx,
          cy,
          fx: dx * (420 + rnd * 380),
          fy: dy * (420 + rnd * 380) - 60,
          fz: rnd * 300 - 60,
          rot: (rnd - 0.5) * 420,
          delay: rnd * 0.18,
        };
      }),
    []
  );

  const start = () => {
    if (phase !== "closed") return;
    setPhase("shatter");
  };

  useEffect(() => {
    if (phase === "shatter") {
      const t = setTimeout(() => setPhase("assemble"), 620);
      return () => clearTimeout(t);
    }
    if (phase === "assemble") {
      const t = setTimeout(() => setPhase("open"), 640);
      return () => clearTimeout(t);
    }
    if (phase === "open") {
      const t = setTimeout(() => setPhase("content"), 900);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const close = () => setPhase("closed");

  const coverBg = `linear-gradient(155deg, #0d1c30 0%, #12293f 45%, #0a1524 100%)`;

  return (
    <>
      <Tilt className="h-full w-full" max={10}>
        <button
          type="button"
          onClick={start}
          className="group relative block h-full w-full overflow-hidden rounded-2xl border border-white/10 text-left"
          style={{ background: coverBg }}
        >
          <span
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
          />
          <span
            aria-hidden
            className="absolute -left-10 top-0 h-full w-10"
            style={{ background: `linear-gradient(90deg, ${accent}22, transparent)` }}
          />
          <span className="absolute left-0 top-0 h-full w-[10px] bg-gradient-to-r from-black/60 to-transparent" />
          <div className="relative flex h-full flex-col justify-between p-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: accent }}>
                Yo D-26
              </p>
              <h3 className="mt-3 text-[19px] font-semibold leading-snug text-white">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-medium" style={{ color: accent }}>
              Kitobni ochish
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </div>
          </div>
        </button>
      </Tilt>

      <AnimatePresence>
        {phase !== "closed" && (
          <motion.div
            className="fixed inset-0 z-[80] grid place-items-center bg-[#03070d]/92 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ perspective: 1600 }}
          >
            {/* 1-2: parchalanish va yigʻilish */}
            {(phase === "shatter" || phase === "assemble") && (
              <div
                className="relative"
                style={{ width: 300, height: 420, transformStyle: "preserve-3d" }}
              >
                {tiles.map((t) => (
                  <motion.span
                    key={t.i}
                    className="absolute"
                    style={{
                      width: 300 / COLS + 0.6,
                      height: 420 / ROWS + 0.6,
                      left: (t.cx * 300) / COLS,
                      top: (t.cy * 420) / ROWS,
                      background: coverBg,
                      backgroundSize: "300px 420px",
                      backgroundPosition: `${-(t.cx * 300) / COLS}px ${-(t.cy * 420) / ROWS}px`,
                      boxShadow: `inset 0 0 0 .5px ${accent}22`,
                    }}
                    initial={{ x: 0, y: 0, z: 0, rotate: 0, opacity: 1 }}
                    animate={
                      phase === "shatter"
                        ? { x: t.fx, y: t.fy, z: t.fz, rotate: t.rot, opacity: 0.9 }
                        : { x: 0, y: 0, z: 0, rotate: 0, opacity: 1 }
                    }
                    transition={{
                      duration: phase === "shatter" ? 0.62 : 0.62,
                      delay: t.delay * (phase === "shatter" ? 1 : 0.5),
                      ease: phase === "shatter" ? [0.3, 0, 0.6, 1] : [0.16, 1, 0.3, 1],
                    }}
                  />
                ))}
              </div>
            )}

            {/* 3-4: kitob ochilishi va mazmun */}
            {(phase === "open" || phase === "content") && (
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="relative"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="relative flex" style={{ transformStyle: "preserve-3d" }}>
                  {/* ichki sahifa */}
                  <motion.div
                    className="relative w-[min(90vw,860px)] overflow-hidden rounded-r-xl rounded-l-sm border border-slate-200 bg-[#f8fafc]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    style={{ minHeight: 460 }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 w-6"
                      style={{ background: "linear-gradient(90deg, rgba(15,23,42,.12), transparent)" }}
                    />
                    <div className="max-h-[74vh] overflow-auto p-6 md:p-8">
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.32em] font-semibold" style={{ color: accent }}>
                            Yo D-26
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-slate-900">{title}</h3>
                        </div>
                        <button
                          onClick={close}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] text-slate-600 transition hover:border-sky-400 hover:text-slate-900"
                        >
                          Yopish
                        </button>
                      </div>
                      {children}
                    </div>
                  </motion.div>

                  {/* muqova — chapga ochiladi */}
                  <motion.div
                    className="absolute inset-y-0 left-0 w-[300px] origin-left rounded-l-sm rounded-r-xl border border-white/10"
                    style={{ background: coverBg, transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: -158 }}
                    transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
                  >
                    <span
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                    />
                    <div className="flex h-full flex-col justify-between p-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: accent }}>
                          Yo D-26
                        </p>
                        <h3 className="mt-3 text-[19px] font-semibold leading-snug text-white">{title}</h3>
                      </div>
                      <p className="text-[12px] text-slate-500">TCH-6 · Buxoro</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
