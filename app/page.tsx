"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import LoginCard from "@/components/LoginCard";
import TrainIntro from "@/components/TrainIntro";
import { DEMO_ACCOUNTS } from "@/lib/seed";
import { useStore } from "@/lib/store";

type Stage = "auth" | "entering";

export default function Home() {
  const [stage, setStage] = useState<Stage>("auth");
  const router = useRouter();
  const { ready } = useStore();

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* AFROSIYOB fon videosi */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <video
          src="/afrosiyob.mp4"
          poster="/hero.jpg"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full scale-105 object-cover"
          style={{ filter: "saturate(1.1) brightness(1.04)" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(238,242,247,.86)_0%,rgba(240,244,249,.9)_45%,rgba(243,239,232,.94)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_50%_20%,rgba(255,255,255,.5),transparent_70%)]" />
        <div
          className="grid-floor absolute inset-x-[-40%] bottom-[-25%] h-[55%] origin-bottom opacity-[0.3]"
          style={{ transform: "rotateX(74deg)" }}
        />
      </div>

      {stage === "entering" && <TrainIntro onFinish={() => router.push("/dash")} />}

      <AnimatePresence mode="wait">
        {stage === "auth" && ready && (
          <motion.section
            key="auth"
            exit={{ opacity: 0, scale: 0.97, filter: "blur(8px)" }}
            transition={{ duration: 0.45 }}
            className="relative grid min-h-dvh place-items-center px-4 py-10"
          >
            <div className="w-full max-w-[1000px]">
              <LoginCard onAuthed={() => setStage("entering")} />

              <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 card-shadow">
                <p className="mb-3 text-center text-[11px] uppercase tracking-wider text-slate-500">
                  Demo hisoblar — istalgan 4 xonali PIN bilan
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {DEMO_ACCOUNTS.map((a) => (
                    <span
                      key={a.tabel}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11.5px] text-slate-700"
                    >
                      <b className="tabular-nums text-sky-700">{a.tabel}</b>
                      <span className="mx-1.5 text-slate-300">·</span>
                      {a.rol}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-5 text-center text-[12px] text-slate-500">
                <Link href="/lab" className="text-sky-600 hover:underline">
                  effektlar galereyasi →
                </Link>
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
