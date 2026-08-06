"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TrainScene from "./TrainScene";

/**
 * AFROSIYOB KIRISH OʻTISHI — ikki bosqichli video sahna.
 *
 *  1-qism  0.00 → 0.42   `afrosiyob.mp4`      poyezd yaqinlashadi (sekin zoom)
 *  2-qism  0.42 → 0.92   `afrosiyob-ichi.mp4` eshik ochiladi, kamera ichkariga kiradi
 *  3-qism  0.92 → 1.00   oq portlash → dashboard
 *
 * Videolar boʻlmasa avtomatik ravishda Three.js sahnasiga tushadi.
 * Istalgan vaqtda "Oʻtkazib yuborish" bilan toʻxtatish mumkin.
 */

const TOTAL = 7600; // ms
const V1 = "/afrosiyob.mp4";
const V2 = "/afrosiyob-ichi.mp4";
const V1_START = 5.6; // poyezd yetarlicha yaqin kadr
const V2_START = 4.4; // eshik ochilishidan sal oldin

const SWITCH = 0.42;
const FLASH_AT = 0.92;

type Mode = "checking" | "video" | "fallback";

export default function TrainIntro({ onFinish }: { onFinish: () => void }) {
  const [mode, setMode] = useState<Mode>("checking");
  const [t, setT] = useState(0);
  const v1 = useRef<HTMLVideoElement | null>(null);
  const v2 = useRef<HTMLVideoElement | null>(null);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish();
  };

  useEffect(() => {
    let alive = true;
    fetch(V1, { method: "HEAD" })
      .then((r) => alive && setMode(r.ok ? "video" : "fallback"))
      .catch(() => alive && setMode("fallback"));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== "video") return;
    const start = performance.now();
    let raf = 0;
    let switched = false;

    if (v1.current) {
      v1.current.currentTime = V1_START;
      v1.current.play().catch(() => {});
    }
    if (v2.current) v2.current.currentTime = V2_START;

    const tick = (now: number) => {
      const k = Math.min((now - start) / TOTAL, 1);
      setT(k);
      if (!switched && k >= SWITCH - 0.06) {
        switched = true;
        v2.current?.play().catch(() => {});
      }
      if (k < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (mode === "checking") {
    return (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-[#eef2f7]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
      </div>
    );
  }

  if (mode === "fallback") return <TrainScene onFinish={onFinish} />;

  /* --- kinematik parametrlar --- */
  const p1 = Math.min(1, t / SWITCH); // 1-qism progressi
  const p2 = Math.max(0, (t - SWITCH) / (FLASH_AT - SWITCH));
  const showV2 = t >= SWITCH - 0.06;
  const mix = Math.min(1, Math.max(0, (t - (SWITCH - 0.06)) / 0.1)); // crossfade

  const zoom1 = 1.06 + p1 * 0.16;
  const zoom2 = 1.02 + p2 * 0.14;
  const flash = t > FLASH_AT ? Math.min(1, (t - FLASH_AT) / 0.05) * (t > 0.97 ? (1 - t) / 0.03 : 1) : 0;
  const bars = t < 0.08 ? 1 - t / 0.08 : 0; // kinolenta chiziqlari ochiladi
  const grade = `saturate(${1.08 + t * 0.22}) contrast(${1.04 + t * 0.08}) brightness(${1.02 + t * 0.1})`;

  return (
    <motion.div
      className="fixed inset-0 z-[70] overflow-hidden bg-black"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* 1-qism — yaqinlashish */}
      <video
        ref={v1}
        src={V1}
        muted
        playsInline
        preload="auto"
        poster="/poster.jpg"
        onError={() => setMode("fallback")}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: `scale(${zoom1})`, filter: grade, opacity: 1 - mix }}
      />

      {/* 2-qism — eshik va ichkari */}
      <video
        ref={v2}
        src={V2}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          transform: `scale(${zoom2})`,
          filter: grade,
          opacity: showV2 ? mix : 0,
          transition: "opacity .1s linear",
        }}
      />

      {/* rang gradatsiyasi va vinyetka */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,transparent_34%,rgba(8,18,32,.6)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(180,214,240,.22)_0%,transparent_26%,transparent_64%,rgba(14,26,44,.5)_100%)]" />

      {/* quyosh yaltirashi */}
      <motion.div
        className="pointer-events-none absolute -right-[10%] top-[8%] h-[46vh] w-[46vh] rounded-full bg-[radial-gradient(circle,rgba(255,238,205,.55),transparent_62%)] blur-2xl"
        animate={{ opacity: t < SWITCH ? 0.9 : 0.25, scale: 1 + t * 0.3 }}
        transition={{ duration: 0.6 }}
      />

      {/* kinolenta chiziqlari */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 bg-black"
        style={{ height: `${bars * 12}vh` }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-black"
        style={{ height: `${bars * 12}vh` }}
      />

      {/* tezlik chiziqlari — yon tomonlardan */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 w-[18%] bg-[linear-gradient(90deg,rgba(255,255,255,.5),transparent)]"
        animate={{ opacity: t > 0.3 && t < FLASH_AT ? 0.55 : 0 }}
      />
      <motion.div
        className="pointer-events-none absolute inset-y-0 right-0 w-[18%] bg-[linear-gradient(270deg,rgba(255,255,255,.5),transparent)]"
        animate={{ opacity: t > 0.3 && t < FLASH_AT ? 0.55 : 0 }}
      />

      {/* sarlavha */}
      <AnimatePresence>
        {t < 0.62 && (
          <motion.div
            className="absolute inset-x-0 bottom-[13%] px-6 text-center"
            initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(12px)" }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[12px] uppercase tracking-[0.55em] text-white/85 drop-shadow-[0_2px_10px_rgba(0,0,0,.7)]">
              TCH-6 · Buxoro lokomotiv deposi
            </p>
            <p className="mt-3 text-4xl font-bold tracking-tight text-white drop-shadow-[0_8px_28px_rgba(0,0,0,.75)] md:text-6xl">
              Tizimga kirilmoqda
            </p>
            <div className="mx-auto mt-7 h-[3px] w-[240px] overflow-hidden rounded-full bg-white/25">
              <span
                className="block h-full rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,.9)]"
                style={{ width: `${Math.min(100, (t / FLASH_AT) * 100)}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* oʻtkazib yuborish */}
      {t < FLASH_AT && (
        <button
          onClick={finish}
          className="absolute right-5 top-5 rounded-full border border-white/35 bg-black/25 px-4 py-2 text-[12px] font-medium text-white/90 backdrop-blur transition hover:bg-black/45"
        >
          Oʻtkazib yuborish →
        </button>
      )}

      {/* oq portlash */}
      <div className="pointer-events-none absolute inset-0 bg-white" style={{ opacity: flash }} />
    </motion.div>
  );
}
