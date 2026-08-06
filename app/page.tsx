"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import LoginCard from "@/components/LoginCard";
import TrainScene from "@/components/TrainScene";
import { DEMO_ACCOUNTS } from "@/lib/seed";
import { useStore } from "@/lib/store";

type Stage = "auth" | "entering";

export default function Home() {
  const [stage, setStage] = useState<Stage>("auth");
  const router = useRouter();
  const { ready } = useStore();

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(27,111,224,.22),transparent_65%)]" />
        <div
          className="grid-floor absolute inset-x-[-40%] bottom-[-25%] h-[60%] origin-bottom opacity-[0.18]"
          style={{ transform: "rotateX(74deg)" }}
        />
      </div>

      {stage === "entering" && <TrainScene onFinish={() => router.push("/dash")} />}

      <AnimatePresence mode="wait">
        {stage === "auth" && ready && (
          <motion.section
            key="auth"
            exit={{ opacity: 0, scale: 0.97, filter: "blur(8px)" }}
            transition={{ duration: 0.45 }}
            className="relative grid min-h-dvh place-items-center px-4 py-10"
          >
            <div className="w-full max-w-[980px]">
              <LoginCard onAuthed={() => setStage("entering")} />

              <div className="mt-7 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                <p className="mb-3 text-center text-[11px] uppercase tracking-wider text-slate-500">
                  Demo hisoblar — istalgan 4 xonali PIN bilan
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {DEMO_ACCOUNTS.map((a) => (
                    <span
                      key={a.tabel}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] text-slate-300"
                    >
                      <b className="tabular-nums text-sky-300">{a.tabel}</b>
                      <span className="mx-1.5 text-slate-600">·</span>
                      {a.rol}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-5 text-center text-[12px] text-slate-500">
                <Link href="/lab" className="text-sky-400 hover:underline">
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
