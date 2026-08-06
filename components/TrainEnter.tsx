"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpeedLines } from "./Fx";

/**
 * "AFROSIYOB" kirish oʻtishi.
 * Login tasdiqlangan zahoti ishga tushadi:
 *  1) poyezd old tomondan yaqinlashadi (tezlik chiziqlari)
 *  2) eshiklar ochiladi
 *  3) kamera ichkariga uchib kiradi — yorug'lik tunneli
 *  4) oq portlash → dashboard
 */
export default function TrainEnter({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const ts = [
      setTimeout(() => setStep(1), 850),
      setTimeout(() => setStep(2), 1750),
      setTimeout(() => setStep(3), 2750),
      setTimeout(() => onFinish(), 3350),
    ];
    return () => ts.forEach(clearTimeout);
  }, [onFinish]);

  return (
    <motion.div
      className="fixed inset-0 z-[70] overflow-hidden bg-[#03070d]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ perspective: 900 }}
    >
      {/* fon: relsli tekislik */}
      <div className="absolute inset-0">
        <div
          className="grid-floor absolute inset-x-[-60%] bottom-[-10%] h-[70%] origin-bottom"
          style={{ transform: "rotateX(72deg)", opacity: 0.35 }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(56,189,248,.18),transparent_60%)]" />
      </div>

      <SpeedLines count={34} opacity={step >= 1 ? 0.85 : 0.4} />

      {/* tunnel halqalari */}
      <div className="absolute inset-0 grid place-items-center" style={{ transformStyle: "preserve-3d" }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-[28px] border border-sky-300/35"
            style={{ width: 260 + i * 90, height: 170 + i * 62 }}
            animate={
              step >= 2
                ? { scale: [1, 4.4], opacity: [0.55, 0] }
                : { scale: 1, opacity: 0.12 + i * 0.02 }
            }
            transition={{ duration: 1.1, delay: i * 0.055, ease: [0.65, 0, 0.35, 1] }}
          />
        ))}
      </div>

      {/* poyezd old tomoni */}
      <motion.div
        className="absolute inset-0 grid place-items-center"
        animate={
          step === 0
            ? { scale: 0.62, opacity: 1 }
            : step === 1
            ? { scale: 1.05, opacity: 1 }
            : { scale: 3.6, opacity: 0 }
        }
        transition={{ duration: step === 0 ? 0.9 : 0.95, ease: [0.5, 0, 0.2, 1] }}
      >
        <div className="relative h-[340px] w-[440px]">
          {/* korpus */}
          <div className="absolute inset-0 rounded-t-[190px] rounded-b-[26px] bg-gradient-to-b from-slate-100 via-slate-300 to-slate-500 shadow-[0_40px_120px_-20px_rgba(56,189,248,.7)]" />
          {/* koʻk chiziq */}
          <div className="absolute inset-x-6 bottom-16 h-3 rounded-full bg-gradient-to-r from-sky-600 via-sky-400 to-sky-600" />
          <div className="absolute inset-x-10 bottom-9 h-1.5 rounded-full bg-slate-700/70" />

          {/* faralar */}
          <div className="absolute bottom-24 left-12 h-6 w-14 rounded-full bg-sky-100 shadow-[0_0_40px_10px_rgba(191,233,255,.85)]" />
          <div className="absolute bottom-24 right-12 h-6 w-14 rounded-full bg-sky-100 shadow-[0_0_40px_10px_rgba(191,233,255,.85)]" />

          {/* eshik / oyna — ochiladi */}
          <div className="absolute left-1/2 top-[70px] h-[190px] w-[300px] -translate-x-1/2 overflow-hidden rounded-[110px_110px_18px_18px] bg-[#05111e]">
            <motion.div
              className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-br from-[#0d2135] to-[#061423]"
              style={{ borderRight: "1px solid rgba(120,200,255,.35)" }}
              animate={step >= 1 ? { x: "-102%" } : { x: 0 }}
              transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
            />
            <motion.div
              className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-bl from-[#0d2135] to-[#061423]"
              style={{ borderLeft: "1px solid rgba(120,200,255,.35)" }}
              animate={step >= 1 ? { x: "102%" } : { x: 0 }}
              transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
            />
            {/* ichkaridagi yorugʻlik */}
            <motion.div
              className="absolute inset-0 bg-[radial-gradient(circle,rgba(180,235,255,.95),rgba(56,189,248,.35)_45%,transparent_72%)]"
              animate={{ opacity: step >= 1 ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.div>

      {/* matn */}
      <AnimatePresence>
        {step < 2 && (
          <motion.div
            className="absolute inset-x-0 bottom-24 text-center"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <p className="text-[13px] uppercase tracking-[0.4em] text-sky-300/80">TCH-6 · Buxoro</p>
            <p className="mt-2 text-2xl font-semibold text-white">Tizimga kirilmoqda</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* oq portlash */}
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: step >= 3 ? [0, 1, 0] : 0 }}
        transition={{ duration: 0.6, times: [0, 0.35, 1] }}
      />
    </motion.div>
  );
}
