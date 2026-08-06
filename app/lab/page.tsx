"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Locomotive from "@/components/Locomotive";
import PinPad from "@/components/PinPad";
import BookCard from "@/components/BookCard";
import JournalTable from "@/components/JournalTable";
import DownloadButton from "@/components/DownloadButton";
import WorkerCoverflow from "@/components/WorkerCoverflow";
import TrainEnter from "@/components/TrainEnter";
import { Tilt, TouchRipple, SpeedLines } from "@/components/Fx";

export default function Lab() {
  const [train, setTrain] = useState(false);
  const [pinKey, setPinKey] = useState(0);
  const [blind, setBlind] = useState(false);

  return (
    <main className="relative min-h-dvh">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1000px_500px_at_50%_-10%,rgba(27,111,224,.18),transparent_65%)]" />

      <AnimatePresence>{train && <TrainEnter onFinish={() => setTrain(false)} />}</AnimatePresence>

      <div className="relative mx-auto w-full max-w-[1180px] px-5 pb-28 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-sky-300/80">TB tizimi</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Effektlar galereyasi
            </h1>
            <p className="mt-2 max-w-[640px] text-[13.5px] leading-relaxed text-slate-400">
              Har bir effekt alohida sinab koʻriladi. Yoqqanini qoldiramiz, yoqmaganini oʻchiramiz
              yoki qayta ishlaymiz.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-white/12 px-4 py-2.5 text-[13px] text-slate-300 transition hover:border-sky-400/60 hover:text-white"
          >
            ← Haqiqiy oqimga qaytish
          </Link>
        </div>

        <div className="mt-12 space-y-6">
          <Demo
            n="01"
            title="Tubes Cursor — neon lentalar"
            note="Faqat desktop. Sichqoncha ortidan 5 ta rangli lenta spring bilan quvlaydi, bosilganda kengayadi. Mobilda avtomatik oʻchadi."
          >
            <div className="grid h-[220px] place-items-center rounded-xl border border-dashed border-white/12 bg-white/[0.02]">
              <p className="text-center text-[13px] text-slate-400">
                Sichqonchani shu maydonda harakatlantiring
                <br />
                <span className="text-slate-600">(effekt butun sahifa boʻylab ishlaydi)</span>
              </p>
            </div>
          </Demo>

          <Demo
            n="02"
            title="Afrosiyob kirish oʻtishi"
            note="Login tasdiqlangan zahoti: poyezd yaqinlashadi → eshiklar ochiladi → kamera ichkariga uchib kiradi → oq portlash → dashboard."
          >
            <button
              onClick={() => setTrain(true)}
              className="rounded-xl bg-gradient-to-r from-[#1b6fe0] to-[#38bdf8] px-6 py-3 text-[14px] font-semibold text-white"
            >
              Oʻtishni ishga tushirish
            </button>
          </Demo>

          <Demo
            n="03"
            title="PIN / OTP animatsiyasi"
            note="4 raqam kiritilgach kataklar sochiladi, bittaga yigʻiladi va yashil tasdiq halqasi chiziladi."
          >
            <div className="flex flex-col items-center gap-5">
              <PinPad key={pinKey} autoFocus={false} />
              <button
                onClick={() => setPinKey((k) => k + 1)}
                className="text-[12px] text-slate-500 hover:text-sky-300"
              >
                Qaytadan sinash
              </button>
            </div>
          </Demo>

          <Demo
            n="04"
            title="Lokomotiv mascot"
            note="Faralar kursorni kuzatadi. PIN yoki parol kiritilganda faralar oʻchadi — foydalanuvchiga 'koʻrmayapman' signali."
          >
            <div className="flex flex-col items-center gap-5">
              <Locomotive blind={blind} size={230} />
              <label className="flex cursor-pointer items-center gap-3 text-[13px] text-slate-300">
                <input
                  type="checkbox"
                  checked={blind}
                  onChange={(e) => setBlind(e.target.checked)}
                  className="h-4 w-4 accent-sky-400"
                />
                Faralarni oʻchirish (parol rejimi)
              </label>
            </div>
          </Demo>

          <Demo
            n="05"
            title="Kitob ochilishi — parchalanish + 3D"
            note="Muqova 70 boʻlakka parchalanadi va uchib ketadi, keyin qaytib yigʻiladi va kitob 3D da ochiladi."
          >
            <div className="mx-auto h-[260px] w-full max-w-[420px]">
              <BookCard
                title="Maʼmuriy jamoatchilik nazoratining birinchi bosqichini qayd qilish jurnali"
                subtitle="Kartaga bosing"
                accent="#38bdf8"
              >
                <JournalTable />
              </BookCard>
            </div>
          </Demo>

          <Demo
            n="06"
            title="Morflanuvchi yuklab olish tugmasi"
            note="Yuklab olish → doiraga siqiladi + progres halqasi → 'Ochish'. Hisobotlar boʻlimida ishlatiladi."
          >
            <DownloadButton />
          </Demo>

          <Demo
            n="07"
            title="3D coverflow qidiruv"
            note="Mashinist yoʻriqchisi ishchini qidiradi. Kartalar 3D perspektivada, markazdagisi KIP holati rangi bilan yonadi."
          >
            <WorkerCoverflow />
          </Demo>

          <Demo
            n="08"
            title="Tilt + Touch Ripple"
            note="Desktopda karta kursor ostida qiyalanadi va yaltiraydi. Mobilda barmoq tekkan joydan yorugʻlik toʻlqini tarqaladi."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {["Texnika xavfsizligi", "Omborxona"].map((t, i) => (
                <Tilt key={t} max={14} className="h-[170px]">
                  <TouchRipple className="h-full rounded-2xl">
                    <div className="glass grid h-full place-items-center rounded-2xl">
                      <p className="text-[15px] font-semibold text-white">{t}</p>
                    </div>
                  </TouchRipple>
                </Tilt>
              ))}
            </div>
          </Demo>

          <Demo
            n="09"
            title="Tezlik chiziqlari (speed lines)"
            note="Afrosiyob mavzusining takrorlanuvchi elementi — faol kartalar va oʻtishlarda ishlatiladi."
          >
            <div className="relative h-[200px] overflow-hidden rounded-xl border border-white/10 bg-[#060d18]">
              <SpeedLines count={40} opacity={0.7} />
            </div>
          </Demo>
        </div>
      </div>
    </main>
  );
}

function Demo({
  n,
  title,
  note,
  children,
}: {
  n: string;
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass overflow-hidden rounded-2xl p-6 md:p-8"
    >
      <div className="mb-6 flex items-start gap-4">
        <span className="mt-0.5 rounded-lg bg-sky-400/12 px-2.5 py-1 text-[12px] font-bold tabular-nums text-sky-300">
          {n}
        </span>
        <div>
          <h2 className="text-[17px] font-semibold text-white">{title}</h2>
          <p className="mt-1.5 max-w-[720px] text-[13px] leading-relaxed text-slate-400">{note}</p>
        </div>
      </div>
      {children}
    </motion.section>
  );
}
