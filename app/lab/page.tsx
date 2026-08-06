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
import TrainIntro from "@/components/TrainIntro";
import { Tilt, TouchRipple, SpeedLines } from "@/components/Fx";

export default function Lab() {
  const [train, setTrain] = useState(false);
  const [pinKey, setPinKey] = useState(0);
  const [blind, setBlind] = useState(false);

  return (
    <main className="relative min-h-dvh">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1000px_500px_at_50%_-10%,rgba(27,111,224,.14),transparent_65%)]" />

      {train && <TrainIntro onFinish={() => setTrain(false)} />}

      <div className="relative mx-auto w-full max-w-[1180px] px-5 pb-28 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-sky-700">TB tizimi</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Effektlar galereyasi
            </h1>
            <p className="mt-2 max-w-[640px] text-[13.5px] leading-relaxed text-slate-500">
              Har bir effekt alohida sinab koʻriladi. Yoqqanini qoldiramiz, yoqmaganini oʻchiramiz
              yoki qayta ishlaymiz.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-[13px] text-slate-700 transition hover:border-sky-500 hover:text-slate-900"
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
            <div className="grid h-[220px] place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
              <p className="text-center text-[13px] text-slate-500">
                Sichqonchani shu maydonda harakatlantiring
                <br />
                <span className="text-slate-400">(effekt butun sahifa boʻylab ishlaydi)</span>
              </p>
            </div>
          </Demo>

          <Demo
            n="02"
            title="Afrosiyob kirish oʻtishi — haqiqiy 3D (WebGL)"
            note="Three.js sahnasi: relslar va ustunlar yonidan uchib oʻtadi, Afrosiyob yaqinlashadi, kamera yon tomonga chiqadi, eshik sirgʻalib ochiladi va kamera ichkariga uchib kiradi → yorugʻlik tunneli → oq portlash. Davomiyligi ~4.4 s."
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
              <label className="flex cursor-pointer items-center gap-3 text-[13px] text-slate-700">
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
                      <p className="text-[15px] font-semibold text-slate-900">{t}</p>
                    </div>
                  </TouchRipple>
                </Tilt>
              ))}
            </div>
          </Demo>

          <Demo
            n="09"
            title="Tezlik chiziqlari — 3D perspektiva + yulduz uchishi"
            note="Ikki barobar tezlashtirildi. Har bir chiziqning boshi yorugʻ yulduz — orqasida soʻnib boruvchi dum. Vaqti-vaqti bilan yirik meteorlar kesishuvchi nur bilan uchib oʻtadi. Fonda miltillovchi yulduzlar chuqurlik beradi."
          >
            <div className="relative h-[260px] overflow-hidden rounded-xl border border-white/10 bg-[#050b14]">
              <SpeedLines count={240} opacity={0.95} speed={2.3} />
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
          <h2 className="text-[17px] font-semibold text-slate-900">{title}</h2>
          <p className="mt-1.5 max-w-[720px] text-[13px] leading-relaxed text-slate-500">{note}</p>
        </div>
      </div>
      {children}
    </motion.section>
  );
}
