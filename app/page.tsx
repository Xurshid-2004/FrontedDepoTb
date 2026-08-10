"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import LoginCard from "@/components/LoginCard";
import TrainIntro from "@/components/TrainIntro";

type Stage = "auth" | "entering";

export default function Home() {
  const [stage, setStage] = useState<Stage>("auth");
  const router = useRouter();

  // Kirish sahifasi bir ekranga sigʻadi — sahifa scroll'i butunlay yopiladi.
  // Boshqa sahifalarga oʻtganda avvalgi holat qaytariladi.
  useEffect(() => {
    const html = document.documentElement;
    const oldingiHtml = html.style.overflow;
    const oldingiBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = oldingiHtml;
      document.body.style.overflow = oldingiBody;
    };
  }, []);

  return (
    <main className="relative h-dvh overflow-hidden">
      {/* Kirish fon videosi */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <video
          src="/kirish.mp4"
          poster="/hero.jpg"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full scale-105 object-cover"
          style={{ filter: "saturate(1.1) brightness(1.04)" }}
        />
        {/* Yengil parda — video koʻrinib tursin, matn ham oʻqilsin */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,26,45,.32)_0%,rgba(16,32,54,.28)_45%,rgba(28,40,58,.38)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_50%_18%,rgba(255,255,255,.14),transparent_70%)]" />
        <div
          className="grid-floor absolute inset-x-[-40%] bottom-[-25%] h-[55%] origin-bottom opacity-[0.3]"
          style={{ transform: "rotateX(74deg)" }}
        />
      </div>

      {stage === "entering" && <TrainIntro onFinish={() => router.push("/dash")} />}

      {/* Kirish kartasi holat yuklanishini KUTMAYDI. Ilgari u `ready`
          bayrogʻiga bogʻlangan edi — server sekin javob bersa yoki qayta
          ishga tushayotgan boʻlsa, bayroq koʻtarilmay ekranda faqat fon
          videosi qolardi. Kartaga db kerak emas: login() serverga
          toʻgʻridan-toʻgʻri murojaat qiladi va holatni oʻzi yuklaydi. */}
      <AnimatePresence mode="wait">
        {stage === "auth" && (
          <motion.section
            key="auth"
            exit={{ opacity: 0, scale: 0.97, filter: "blur(8px)" }}
            transition={{ duration: 0.45 }}
            className="relative grid h-dvh place-items-center overflow-hidden px-4 py-4"
          >
            <div className="flex max-h-full w-full max-w-[1000px] flex-col justify-center">
              <LoginCard onAuthed={() => setStage("entering")} />

              <p className="mt-4 shrink-0 text-center text-[11.5px] text-white/70 drop-shadow">
                © {new Date().getFullYear()} Oʻzbekiston temir yoʻllari AJ · Buxoro
                lokomotiv deposi (TCH-6) · Texnika xavfsizligi tizimi
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
