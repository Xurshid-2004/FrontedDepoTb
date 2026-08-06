"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "idle" | "scatter" | "merge" | "done";

/**
 * PIN / OTP animatsiyasi:
 * 1) 4 ta katak — raqam kiritilganda katak "sakraydi"
 * 2) to'lgach kataklar sochilib aylanadi (scatter)
 * 3) bitta katakka yig'iladi (merge)
 * 4) yashil doira + belgi (done)
 */
export default function PinPad({
  length = 4,
  onDone,
  label = "PIN kodni kiriting",
  hint = "Ilovada har kirishda shu kod soʻraladi",
  autoFocus = true,
}: {
  length?: number;
  onDone?: (pin: string) => void;
  label?: string;
  hint?: string;
  autoFocus?: boolean;
}) {
  const [val, setVal] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scatter = useMemo(
    () =>
      Array.from({ length }, (_, i) => ({
        x: (i - (length - 1) / 2) * 34 + (i % 2 ? 26 : -22),
        y: i % 2 ? -34 : 30,
        r: (i % 2 ? 1 : -1) * (16 + i * 9),
      })),
    [length]
  );

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (val.length !== length || phase !== "idle") return;
    const t1 = setTimeout(() => setPhase("scatter"), 220);
    const t2 = setTimeout(() => setPhase("merge"), 1000);
    const t3 = setTimeout(() => {
      setPhase("done");
      onDone?.(val);
    }, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [val, length, phase, onDone]);

  const reset = () => {
    setVal("");
    setPhase("idle");
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        {phase !== "done" ? (
          <motion.div
            key="entry"
            exit={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center"
          >
            <p className="text-[15px] font-semibold text-slate-100">{label}</p>
            <p className="mt-1 text-center text-[12px] text-slate-400">{hint}</p>

            <div
              className="relative mt-7 flex items-center justify-center gap-3"
              onClick={() => inputRef.current?.focus()}
            >
              {Array.from({ length }).map((_, i) => {
                const filled = i < val.length;
                const s = scatter[i];
                const isScatter = phase === "scatter";
                const isMerge = phase === "merge";
                return (
                  <motion.div
                    key={i}
                    animate={
                      isMerge
                        ? { x: -(i - (length - 1) / 2) * 60, y: 0, rotate: 0, scale: 0.9, opacity: i === 0 ? 1 : 0 }
                        : isScatter
                        ? { x: s.x, y: s.y, rotate: s.r, scale: 0.96 }
                        : { x: 0, y: 0, rotate: 0, scale: filled ? 1.06 : 1 }
                    }
                    transition={
                      isScatter
                        ? { type: "spring", stiffness: 130, damping: 9 }
                        : { type: "spring", stiffness: 300, damping: 20 }
                    }
                    className={`grid h-14 w-12 place-items-center rounded-2xl border text-xl font-semibold tabular-nums ${
                      filled
                        ? "border-sky-400/70 bg-sky-400/10 text-white shadow-[0_0_24px_-4px_rgba(56,189,248,.8)]"
                        : "border-white/12 bg-white/[0.03] text-slate-500"
                    }`}
                  >
                    {filled ? "•" : ""}
                    {filled && (
                      <motion.span
                        layoutId={`d${i}`}
                        className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-sky-300"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 2.6, 1] }}
                        transition={{ duration: 0.4 }}
                      />
                    )}
                  </motion.div>
                );
              })}

              <input
                ref={inputRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={val}
                onChange={(e) => {
                  if (phase !== "idle") return;
                  setVal(e.target.value.replace(/\D/g, "").slice(0, length));
                }}
                className="absolute inset-0 h-full w-full cursor-default opacity-0"
                aria-label={label}
              />
            </div>

            <button
              type="button"
              onClick={reset}
              className="mt-6 text-[12px] text-slate-500 transition hover:text-sky-300"
            >
              Kodni tozalash
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="ok"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="flex flex-col items-center"
          >
            <div className="relative grid h-28 w-28 place-items-center">
              <motion.span
                className="absolute inset-0 rounded-full bg-emerald-400/15"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: [0.6, 1.35, 1], opacity: [0, 0.9, 0.35] }}
                transition={{ duration: 0.9 }}
              />
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
                <motion.circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                />
              </svg>
              <motion.svg
                viewBox="0 0 24 24"
                className="h-11 w-11"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.45, type: "spring", stiffness: 260, damping: 14 }}
              >
                <path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </div>
            <p className="mt-4 text-[15px] font-semibold text-emerald-300">Tasdiqlandi</p>
            <p className="mt-1 text-[12px] text-slate-400">Tizimga kirilmoqda…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
