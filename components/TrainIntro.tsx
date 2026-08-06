"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TrainScene from "./TrainScene";

/**
 * AFROSIYOB KIRISH OʻTISHI — video asosida.
 *
 * `public/afrosiyob.mp4` mavjud boʻlsa — haqiqiy video toʻliq ekranda kinematik
 * ishlov bilan oʻynatiladi (zoom, yorugʻlik, vinyetka, matn, oq portlash).
 * Fayl boʻlmasa yoki oʻqilmasa — avtomatik ravishda Three.js sahnasiga tushadi.
 * Shu sababli sayt hech qachon buzilmaydi.
 */

const DUR = 5200; // ms — video rejimi
const VIDEO = "/afrosiyob.mp4";

type Mode = "checking" | "video" | "fallback";

export default function TrainIntro({ onFinish }: { onFinish: () => void }) {
  const [mode, setMode] = useState<Mode>("checking");
  const [t, setT] = useState(0);
  const vRef = useRef<HTMLVideoElement | null>(null);
  const done = useRef(false);

  /* fayl bormi? */
  useEffect(() => {
    let alive = true;
    fetch(VIDEO, { method: "HEAD" })
      .then((r) => {
        if (!alive) return;
        setMode(r.ok && (r.headers.get("content-type") ?? "").includes("video") ? "video" : "fallback");
      })
      .catch(() => alive && setMode("fallback"));
    return () => {
      alive = false;
    };
  }, []);

  /* video rejimidagi vaqt chizigʻi */
  useEffect(() => {
    if (mode !== "video") return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min((now - start) / DUR, 1);
      setT(k);
      if (k < 1) raf = requestAnimationFrame(tick);
      else if (!done.current) {
        done.current = true;
        onFinish();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode, onFinish]);

  if (mode === "checking") {
    return (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-[#eaf1f8]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
      </div>
    );
  }

  if (mode === "fallback") return <TrainScene onFinish={onFinish} />;

  /* --- video rejimi --- */
  const zoom = 1.12 + t * 0.22;
  const blur = t > 0.82 ? (t - 0.82) * 26 : 0;
  const flash = t > 0.86 ? Math.min(1, (t - 0.86) / 0.09) * (t > 0.95 ? (1 - t) / 0.05 : 1) : 0;

  return (
    <motion.div
      className="fixed inset-0 z-[70] overflow-hidden bg-white"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <video
        ref={vRef}
        src={VIDEO}
        autoPlay
        muted
        playsInline
        preload="auto"
        onError={() => setMode("fallback")}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          transform: `scale(${zoom})`,
          filter: `blur(${blur}px) saturate(${1.05 + t * 0.25}) contrast(${1.02 + t * 0.1}) brightness(${1 + t * 0.15})`,
          transition: "filter .2s linear",
        }}
      />

      {/* yumshoq yorugʻlik va vinyetka */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_38%,rgba(6,18,34,.55)_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.35)_0%,transparent_28%,transparent_62%,rgba(9,22,40,.55)_100%)]"
        style={{ opacity: 0.9 }}
      />

      {/* yon chiziqlar — tezlik urgʻusi */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 w-[22%] bg-[linear-gradient(90deg,rgba(255,255,255,.55),transparent)]"
        animate={{ opacity: t > 0.35 ? 0.65 : 0 }}
      />
      <motion.div
        className="pointer-events-none absolute inset-y-0 right-0 w-[22%] bg-[linear-gradient(270deg,rgba(255,255,255,.55),transparent)]"
        animate={{ opacity: t > 0.35 ? 0.65 : 0 }}
      />

      {/* sarlavha */}
      <AnimatePresence>
        {t < 0.72 && (
          <motion.div
            className="absolute inset-x-0 bottom-[14%] px-6 text-center"
            initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -18, filter: "blur(10px)" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[12px] uppercase tracking-[0.5em] text-white/80 drop-shadow-lg">
              TCH-6 · Buxoro lokomotiv deposi
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-white drop-shadow-[0_6px_24px_rgba(0,0,0,.6)] md:text-5xl">
              Tizimga kirilmoqda
            </p>
            <div className="mx-auto mt-6 h-[3px] w-[220px] overflow-hidden rounded-full bg-white/25">
              <span
                className="block h-full rounded-full bg-white"
                style={{ width: `${Math.min(100, (t / 0.86) * 100)}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* oq portlash */}
      <div className="pointer-events-none absolute inset-0 bg-white" style={{ opacity: flash }} />
    </motion.div>
  );
}
