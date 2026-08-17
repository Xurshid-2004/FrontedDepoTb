"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TrainScene from "./TrainScene";

/**
 * KIRISH OʻTISHI — kinematik video sahna, har safar tizimga kirilganda
 * ikkita video navbat bilan almashadi (localStorage'da saqlanadi) —
 * shunda foydalanuvchi yuklanish paytida zerikib qolmaydi.
 *
 * Video oʻz tabiiy davomiyligicha oʻynatiladi; oxirida oq portlash →
 * dashboard. Video boʻlmasa avtomatik Three.js sahnasiga tushadi.
 * Istalgan vaqtda "Oʻtkazib yuborish" bilan toʻxtatish mumkin.
 */

const KIRISH_VIDEOS = ["/kirish.mp4", "/kirish2.mp4"];
const KIRISH_VIDEO_KEY = "tb_kirish_video_idx";

function nextKirishVideo(): string {
  if (typeof window === "undefined") return KIRISH_VIDEOS[0];
  try {
    const prev = Number(window.localStorage.getItem(KIRISH_VIDEO_KEY) ?? "-1");
    const idx = Number.isFinite(prev) ? (prev + 1) % KIRISH_VIDEOS.length : 0;
    window.localStorage.setItem(KIRISH_VIDEO_KEY, String(idx));
    return KIRISH_VIDEOS[idx];
  } catch {
    return KIRISH_VIDEOS[0];
  }
}

const FALLBACK_TOTAL = 11000; // metadata kelmasa — zaxira davomiylik (ms)
const FLASH_AT = 0.94;

type Mode = "video" | "fallback";

export default function TrainIntro({ onFinish }: { onFinish: () => void }) {
  // Video darrov mount qilinadi — mavjudligini oldindan tekshirmaymiz, chunki
  // tekshiruv so'rovi tugamaguncha brauzer videoni yuklashni boshlay olmaydi.
  // Fayl yo'q bo'lsa <video onError> baribir fallback'ga o'tkazadi.
  const [mode, setMode] = useState<Mode>("video");
  const [started, setStarted] = useState(false);
  const [t, setT] = useState(0);
  const vref = useRef<HTMLVideoElement | null>(null);
  const totalRef = useRef(FALLBACK_TOTAL);
  const done = useRef(false);
  // Har chaqirilganda (har kirishda) navbatdagi videoni bir marta tanlaymiz.
  const [V] = useState(nextKirishVideo);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish();
  };

  // Mount bo'lishi bilan o'ynatishni boshlaymiz (autoPlay'ga qo'shimcha zaxira).
  useEffect(() => {
    const el = vref.current;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.playbackRate = 1.0;
    el.play().catch(() => setTimeout(() => el.play().catch(() => {}), 150));
  }, []);

  // Kinematik taymer video haqiqatan oqishni boshlagach ishga tushadi —
  // aks holda bufer paytida animatsiya videodan oldinga ketib qolardi.
  useEffect(() => {
    if (mode !== "video" || !started) return;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const k = Math.min((now - start) / totalRef.current, 1);
      setT(k);
      if (k < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, started]);

  if (mode === "fallback") return <TrainScene onFinish={onFinish} />;

  /* --- kinematik parametrlar --- */
  const zoom = 1.05 + t * 0.16;
  const flash = t > FLASH_AT ? Math.min(1, (t - FLASH_AT) / 0.05) * (t > 0.97 ? (1 - t) / 0.03 : 1) : 0;
  const bars = t < 0.08 ? 1 - t / 0.08 : 0;
  const grade = `saturate(${1.08 + t * 0.22}) contrast(${1.04 + t * 0.08}) brightness(${1.02 + t * 0.1})`;

  return (
    <motion.div
      className="fixed inset-0 z-[70] overflow-hidden bg-black"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      <video
        ref={vref}
        src={V}
        autoPlay
        muted
        playsInline
        preload="auto"
        poster="/poster.jpg"
        onPlaying={() => setStarted(true)}
        onEnded={finish}
        onError={() => setMode("fallback")}
        onLoadedMetadata={(e) => {
          const d = (e.currentTarget as HTMLVideoElement).duration;
          if (d && isFinite(d)) totalRef.current = d * 1000;
        }}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: `scale(${zoom})`, filter: grade }}
      />

      {/* rang gradatsiyasi va vinyetka */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,transparent_34%,rgba(8,18,32,.6)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(180,214,240,.22)_0%,transparent_26%,transparent_64%,rgba(14,26,44,.5)_100%)]" />

      {/* quyosh yaltirashi */}
      <motion.div
        className="pointer-events-none absolute -right-[10%] top-[8%] h-[46vh] w-[46vh] rounded-full bg-[radial-gradient(circle,rgba(255,238,205,.55),transparent_62%)] blur-2xl"
        animate={{ opacity: t < 0.5 ? 0.9 : 0.25, scale: 1 + t * 0.3 }}
        transition={{ duration: 0.6 }}
      />

      {/* kinolenta chiziqlari */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-black" style={{ height: `${bars * 12}vh` }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black" style={{ height: `${bars * 12}vh` }} />

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
