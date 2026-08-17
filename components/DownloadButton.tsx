"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type S = "idle" | "loading" | "done";

/**
 * Morflanuvchi yuklab olish tugmasi:
 * "Yuklab olish" → doiraga siqiladi + progres halqasi → "Ochish"
 * Hisobotlarni yuklashda ishlatiladi.
 */
export default function DownloadButton({
  label = "Yuklab olish",
  doneLabel = "Ochish",
  duration = 2000,
}: {
  label?: string;
  doneLabel?: string;
  duration?: number;
}) {
  const [s, setS] = useState<S>("idle");
  const [p, setP] = useState(0);

  useEffect(() => {
    if (s !== "loading") return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min((t - t0) / duration, 1);
      setP(k);
      if (k < 1) raf = requestAnimationFrame(tick);
      else setS("done");
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [s, duration]);

  const reset = () => {
    setP(0);
    setS("idle");
  };

  return (
    <div className="flex items-center gap-3">
      <motion.button
        type="button"
        onClick={() => (s === "idle" ? setS("loading") : s === "done" ? reset() : null)}
        layout
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        /* Ranglar oq fon uchun. Ilgari ular toʻq mavzudan qolgan edi
           (och havorang matn) va oq kartada deyarli koʻrinmasdi. */
        className={`relative grid h-12 max-w-full place-items-center overflow-hidden rounded-full border font-semibold ${
          s === "done"
            ? "border-emerald-400 bg-emerald-50 text-emerald-700"
            : "border-sky-400 bg-sky-50 text-sky-700"
        }`}
        style={{ width: s === "loading" ? 48 : 184 }}
      >
        <AnimatePresence mode="popLayout">
          {s === "idle" && (
            <motion.span
              key="i"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 px-5 text-[14px]"
            >
              <Arrow />
              {label}
            </motion.span>
          )}
          {s === "loading" && (
            <motion.span
              key="l"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute inset-0 grid place-items-center"
            >
              <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(56,189,248,.18)" strokeWidth="3" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={2 * Math.PI * 20 * (1 - p)}
                />
              </svg>
              <span className="h-3 w-3 rounded-[3px] bg-sky-300" />
            </motion.span>
          )}
          {s === "done" && (
            <motion.span
              key="d"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 px-5 text-[14px]"
            >
              <Check />
              {doneLabel}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {s === "loading" && (
        <span className="text-[12px] tabular-nums text-slate-400">{Math.round(p * 100)}%</span>
      )}
    </div>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 3v12" strokeLinecap="round" />
      <path d="M7 11l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" strokeLinecap="round" />
    </svg>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
