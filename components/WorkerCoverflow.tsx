"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

export type Worker = {
  tabel: string;
  fio: string;
  position: string;
  kolonna: string;
  kip: { left: number; total: number };
};

export const WORKERS: Worker[] = [
  { tabel: "10427", fio: "Rasulov Baxtiyor Anvarovich", position: "Elektrovoz mashinisti", kolonna: "El. mashinist / yordamchi", kip: { left: 3, total: 30 } },
  { tabel: "10512", fio: "Qodirov Sanjar Toshpoʻlatovich", position: "Elektrovoz mashinisti yordamchisi", kolonna: "El. mashinist / yordamchi", kip: { left: 2, total: 30 } },
  { tabel: "10933", fio: "Ergashev Ulugʻbek Zokirovich", position: "Teplovoz mashinisti", kolonna: "Teplovoz mashinist / yordamchi", kip: { left: 0, total: 90 } },
  { tabel: "11204", fio: "Yoʻldoshev Aziz Baxodirovich", position: "Manyovr teplovoz mashinisti", kolonna: "Manyovr teplovoz", kip: { left: -4, total: 30 } },
  { tabel: "11388", fio: "Toshmatov Jasur Alisherovich", position: "Teplovoz mashinisti yordamchisi", kolonna: "Teplovoz mashinist / yordamchi", kip: { left: 12, total: 180 } },
  { tabel: "11640", fio: "Norqulov Shavkat Rustamovich", position: "Elektrovoz mashinisti", kolonna: "El. mashinist / yordamchi", kip: { left: 27, total: 180 } },
  { tabel: "11902", fio: "Hasanov Doniyor Salimovich", position: "Manyovr teplovoz mashinisti yordamchisi", kolonna: "Manyovr teplovoz", kip: { left: 1, total: 30 } },
];

function kipTone(left: number) {
  if (left < 0) return { label: "Muddati oʻtdi", color: "#b91c1c", ring: "rgba(185,28,28,.75)" };
  if (left === 0) return { label: "Bugun tugaydi", color: "#f97316", ring: "rgba(249,115,22,.7)" };
  if (left <= 2) return { label: `${left} kun qoldi`, color: "#f59e0b", ring: "rgba(245,158,11,.7)" };
  if (left <= 3) return { label: `${left} kun qoldi`, color: "#22c55e", ring: "rgba(34,197,94,.7)" };
  return { label: `${left} kun qoldi`, color: "#38bdf8", ring: "rgba(56,189,248,.55)" };
}

/**
 * Mashinist yoʻriqchisi uchun 3D "coverflow" qidiruv.
 * Qidiruvda yozilganda kartalar filtrlanadi va markazga sirgʻalib chiqadi.
 */
export default function WorkerCoverflow() {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return WORKERS;
    return WORKERS.filter(
      (w) =>
        w.fio.toLowerCase().includes(s) ||
        w.tabel.includes(s) ||
        w.position.toLowerCase().includes(s) ||
        w.kolonna.toLowerCase().includes(s)
    );
  }, [q]);

  const active = Math.min(idx, Math.max(list.length - 1, 0));

  return (
    <div className="w-full">
      {/* qidiruv */}
      <div className="mx-auto flex max-w-[520px] items-center gap-3 rounded-full border border-slate-200 bg-slate-100 px-5 py-3 backdrop-blur">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-sky-700" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.6-3.6" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setIdx(0);
          }}
          placeholder="F.I.Sh., tabel raqami yoki kolonna boʻyicha qidirish"
          className="h-6 w-full bg-transparent text-[14px] text-slate-900 outline-none placeholder:text-slate-500"
        />
        <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 tabular-nums">
          {list.length}
        </span>
      </div>

      {/* coverflow */}
      {/* Kartalar 3D karusel boʻlib yonma-yon turadi: markazdagisidan
          chapga-oʻngga 132 px suriladi. Telefon eni bunga yetmaydi va
          yon kartalar ekran chetidan qirqilib qolardi.

          Yechim — butun karuselni kichraytirish. Oʻlchamlar va 3D
          hisob-kitob oʻzgarmaydi (ular komponent mantigʻining bir
          qismi), faqat koʻrinish miqyosi kichrayadi. */}
      <div
        className="relative mt-8 h-[262px] w-full select-none md:mt-10 md:h-[330px]"
        style={{ perspective: 1400 }}
      >
        <div
          className="absolute inset-0 grid origin-center scale-[0.74] place-items-center md:scale-100"
          style={{ transformStyle: "preserve-3d" }}
        >
          {list.map((w, i) => {
            const d = i - active;
            const abs = Math.abs(d);
            if (abs > 3) return null;
            const tone = kipTone(w.kip.left);
            const isActive = d === 0;
            return (
              <motion.button
                key={w.tabel}
                type="button"
                onClick={() => setIdx(i)}
                className="absolute h-[300px] w-[214px] overflow-hidden rounded-2xl border text-left"
                style={{
                  borderColor: isActive ? tone.ring : "rgba(13,27,42,.10)",
                  background: isActive
                    ? "linear-gradient(160deg,#ffffff,#f1f6fc)"
                    : "linear-gradient(160deg,#f8fafd,#eef3f9)",
                  boxShadow: isActive ? `0 26px 70px -26px ${tone.ring}` : "0 4px 18px -14px rgba(13,42,85,.5)",
                  transformStyle: "preserve-3d",
                }}
                animate={{
                  x: d * 132,
                  z: -abs * 190,
                  rotateY: d * -26,
                  scale: isActive ? 1 : 0.9 - abs * 0.03,
                  opacity: abs > 2 ? 0.25 : 1,
                  filter: isActive ? "blur(0px)" : `blur(${abs * 0.9}px)`,
                }}
                transition={{ type: "spring", stiffness: 210, damping: 26 }}
              >
                <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: tone.color }} />
                <div className="flex h-full flex-col justify-between p-5">
                  <div>
                    <div
                      className="grid h-11 w-11 place-items-center rounded-xl text-[13px] font-bold"
                      style={{ background: `${tone.color}22`, color: tone.color }}
                    >
                      {w.fio.split(" ")[0].slice(0, 2).toUpperCase()}
                    </div>
                    <p className="mt-4 text-[10px] uppercase tracking-[0.28em] text-slate-500">
                      Tabel {w.tabel}
                    </p>
                    <p className="mt-1.5 text-[14px] font-semibold leading-snug text-slate-900">{w.fio}</p>
                    <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">{w.position}</p>
                  </div>
                  <div>
                    <p className="text-[10.5px] text-slate-500">{w.kolonna}</p>
                    <p className="mt-2 text-[12px] font-semibold" style={{ color: tone.color }}>
                      KIP: {tone.label}
                    </p>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${Math.max(4, Math.min(100, ((w.kip.left < 0 ? 0 : w.kip.left) / w.kip.total) * 100))}%`,
                          background: tone.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {list.length === 0 && (
          <p className="absolute inset-0 grid place-items-center text-[13px] text-slate-500">
            Hech narsa topilmadi
          </p>
        )}
      </div>

      {/* nuqtalar */}
      {list.length > 0 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <button
            onClick={() => setIdx((v) => Math.max(0, v - 1))}
            className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-sky-500 hover:text-slate-900"
          >
            ‹
          </button>
          {list.map((w, i) => (
            <button
              key={w.tabel}
              onClick={() => setIdx(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === active ? 22 : 6,
                background: i === active ? "#38bdf8" : "rgba(255,255,255,.2)",
              }}
            />
          ))}
          <button
            onClick={() => setIdx((v) => Math.min(list.length - 1, v + 1))}
            className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-sky-500 hover:text-slate-900"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
