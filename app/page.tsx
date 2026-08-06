"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LoginCard from "@/components/LoginCard";
import TrainEnter from "@/components/TrainEnter";
import BookCard from "@/components/BookCard";
import JournalTable from "@/components/JournalTable";
import DownloadButton from "@/components/DownloadButton";
import WorkerCoverflow from "@/components/WorkerCoverflow";
import { Tilt, TouchRipple, SpeedLines } from "@/components/Fx";

type Stage = "auth" | "entering" | "app";

export default function Home() {
  const [stage, setStage] = useState<Stage>("auth");
  const [tab, setTab] = useState<"tb" | "ombor">("tb");

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* fon */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(27,111,224,.22),transparent_65%)]" />
        <div className="grid-floor absolute inset-x-[-40%] bottom-[-25%] h-[60%] origin-bottom opacity-[0.18]" style={{ transform: "rotateX(74deg)" }} />
      </div>

      <AnimatePresence>
        {stage === "entering" && <TrainEnter onFinish={() => setStage("app")} />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {stage === "auth" ? (
          <motion.section
            key="auth"
            exit={{ opacity: 0, scale: 0.97, filter: "blur(8px)" }}
            transition={{ duration: 0.45 }}
            className="relative grid min-h-dvh place-items-center px-4 py-10"
          >
            <div className="w-full max-w-[980px]">
              <LoginCard onAuthed={() => setStage("entering")} />
              <p className="mt-6 text-center text-[12px] text-slate-500">
                Prototip · istalgan tabel raqami va 4 xonali PIN bilan kiring ·{" "}
                <Link href="/lab" className="text-sky-400 hover:underline">
                  effektlar galereyasi →
                </Link>
              </p>
            </div>
          </motion.section>
        ) : stage === "app" ? (
          <motion.section
            key="app"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-[1180px] px-5 pb-24 pt-8"
          >
            <Header />

            {/* modullar */}
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <ModuleCard
                active={tab === "tb"}
                onClick={() => setTab("tb")}
                accent="#38bdf8"
                kicker="Modul 1"
                title="TB — Texnika xavfsizligi"
                desc="Maʼmuriy jamoatchilik nazoratining 1- va 2-bosqich jurnallari (Yo D-26)"
                stats={[
                  ["Ochiq yozuv", "12"],
                  ["Muddat yaqin", "3"],
                  ["Muddati oʻtgan", "1"],
                ]}
              />
              <ModuleCard
                active={tab === "ombor"}
                onClick={() => setTab("ombor")}
                accent="#f2b544"
                kicker="Modul 2"
                title="Omborxona"
                desc="Maxsus kiyim, poyabzal va shaxsiy himoya vositalari aylanmasi"
                stats={[
                  ["Faol ariza", "27"],
                  ["Muddati kelgan", "64"],
                  ["Muddati oʻtgan", "18"],
                ]}
              />
            </div>

            <AnimatePresence mode="wait">
              {tab === "tb" ? (
                <motion.div
                  key="tb"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                >
                  <SectionTitle
                    title="Nazorat jurnallari"
                    sub="Kartaga bosing — muqova parchalanadi, boʻlaklar yigʻilib kitob ochiladi"
                  />
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="h-[260px]">
                      <BookCard
                        title="Maʼmuriy jamoatchilik nazoratining birinchi bosqichini qayd qilish jurnali"
                        subtitle="1-bosqich · smena boshida oʻtkaziladigan nazorat"
                        accent="#38bdf8"
                      >
                        <JournalTable />
                      </BookCard>
                    </div>
                    <div className="h-[260px]">
                      <BookCard
                        title="Maʼmuriy jamoatchilik nazoratining ikkinchi bosqichini qayd qilish jurnali"
                        subtitle="2-bosqich · haftalik komissiya nazorati"
                        accent="#a78bfa"
                      >
                        <JournalTable />
                      </BookCard>
                    </div>
                  </div>

                  <SectionTitle
                    title="Mashinist yoʻriqchisi — ishchi qidiruvi"
                    sub="Yozing va kartalar 3D da markazga sirgʻalib chiqadi"
                  />
                  <WorkerCoverflow />
                </motion.div>
              ) : (
                <motion.div
                  key="ombor"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                >
                  <SectionTitle title="Hisobotlar" sub="Morflanuvchi yuklab olish tugmasi" />
                  <div className="glass flex flex-wrap items-center justify-between gap-6 rounded-2xl p-6">
                    <div>
                      <p className="text-[15px] font-semibold text-white">
                        Berilgan buyumlar hisoboti
                      </p>
                      <p className="mt-1 text-[12.5px] text-slate-400">
                        01.07.2026 — 06.08.2026 · 212 yozuv · PDF
                      </p>
                    </div>
                    <DownloadButton />
                  </div>

                  <SectionTitle title="Ariza holati" sub="4 bosqichli tasdiqlash zanjiri" />
                  <Chain />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function Header() {
  return (
    <header className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#1b6fe0] to-[#38bdf8] text-[15px] font-black text-white">
          TB
        </span>
        <div>
          <p className="text-[14px] font-semibold leading-tight text-white">
            Buxoro lokomotiv deposi
          </p>
          <p className="text-[11px] text-slate-400">TCH-6 · TEMIRYOʻLINFRATUZILMA AJ</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/lab"
          className="rounded-lg border border-white/12 px-3.5 py-2 text-[12.5px] text-slate-300 transition hover:border-sky-400/60 hover:text-white"
        >
          Effektlar galereyasi
        </Link>
        <span className="hidden items-center gap-2 rounded-lg border border-white/12 px-3 py-2 text-[12.5px] text-slate-300 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Tabel 10427
        </span>
      </div>
    </header>
  );
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-5 mt-14">
      <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
      <p className="mt-1 text-[13px] text-slate-400">{sub}</p>
    </div>
  );
}

function ModuleCard({
  active,
  onClick,
  accent,
  kicker,
  title,
  desc,
  stats,
}: {
  active: boolean;
  onClick: () => void;
  accent: string;
  kicker: string;
  title: string;
  desc: string;
  stats: [string, string][];
}) {
  return (
    <Tilt max={9} className="h-full">
      <TouchRipple className="h-full rounded-2xl">
        <button
          type="button"
          onClick={onClick}
          className="relative h-full w-full overflow-hidden rounded-2xl border p-6 text-left transition-colors"
          style={{
            borderColor: active ? `${accent}88` : "rgba(255,255,255,.09)",
            background: active
              ? `linear-gradient(150deg, ${accent}1f, rgba(12,21,36,.9))`
              : "linear-gradient(150deg, rgba(255,255,255,.045), rgba(255,255,255,.015))",
            boxShadow: active ? `0 30px 90px -30px ${accent}` : "none",
          }}
        >
          <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent, opacity: active ? 1 : 0.3 }} />
          {active && <SpeedLines count={14} opacity={0.18} />}
          <p className="relative text-[10px] uppercase tracking-[0.32em]" style={{ color: accent }}>
            {kicker}
          </p>
          <h3 className="relative mt-3 text-[22px] font-bold tracking-tight text-white">{title}</h3>
          <p className="relative mt-2 max-w-[440px] text-[13px] leading-relaxed text-slate-400">{desc}</p>
          <div className="relative mt-6 flex flex-wrap gap-6">
            {stats.map(([k, v]) => (
              <div key={k}>
                <p className="text-[22px] font-bold tabular-nums text-white">{v}</p>
                <p className="text-[11px] text-slate-400">{k}</p>
              </div>
            ))}
          </div>
        </button>
      </TouchRipple>
    </Tilt>
  );
}

const CHAIN = [
  { t: "Ishchi", s: "Yuborildi", c: "#38bdf8", done: true },
  { t: "Bugalter", s: "Tasdiqladi", c: "#22c55e", done: true },
  { t: "Bosh xisobchi", s: "Tasdiqladi", c: "#22c55e", done: true },
  { t: "Depo boshligʻi", s: "Koʻrikda", c: "#f59e0b", done: false },
  { t: "Ombor mudiri", s: "Kutilmoqda", c: "#64748b", done: false },
];

function Chain() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex flex-wrap items-center gap-y-6">
        {CHAIN.map((n, i) => (
          <div key={n.t} className="flex items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex min-w-[128px] flex-col items-center gap-2"
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-full border-2 text-[13px] font-bold"
                style={{ borderColor: n.c, color: n.c, background: `${n.c}18` }}
              >
                {n.done ? "✓" : i + 1}
              </span>
              <p className="text-center text-[12px] font-medium text-white">{n.t}</p>
              <p className="text-center text-[11px]" style={{ color: n.c }}>
                {n.s}
              </p>
            </motion.div>
            {i < CHAIN.length - 1 && (
              <div className="relative mx-1 hidden h-px w-10 bg-white/12 sm:block lg:w-16">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-sky-400"
                  initial={{ width: 0 }}
                  animate={{ width: n.done ? "100%" : "0%" }}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
