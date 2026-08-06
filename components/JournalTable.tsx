"use client";

import { motion } from "framer-motion";

const COLS = [
  "Nazorat sanasi",
  "Komissiya tarkibi",
  "Aniqlangan nomuvofiqliklar",
  "Chora-tadbirlar",
  "Javobgar shaxs",
  "Bajarish muddati",
  "Bajarilgani boʻyicha belgi",
];

const ROWS = [
  {
    d: "04.08.2026",
    k: "Ergashev U. — TB muhandisi\nSaidov B. — sex boshligʻi",
    n: "Taʼmirlash sexida yoritish yetarli emas",
    c: "Qoʻshimcha 4 ta LED chiroq oʻrnatish",
    r: "Saidov B. — sex boshligʻi",
    m: "12.08.2026",
    s: "ok",
  },
  {
    d: "05.08.2026",
    k: "Ergashev U. — TB muhandisi\nQodirov S. — usta",
    n: "Akkumulyator boʻlimida ventilyatsiya kuchsiz",
    c: "Soʻrgʻich ventilyatorni almashtirish",
    r: "Qodirov S. — usta",
    m: "09.08.2026",
    s: "soon",
  },
  {
    d: "06.08.2026",
    k: "Ergashev U. — TB muhandisi",
    n: "PTO sexida himoya kaskalari yetishmayapti (4 dona)",
    c: "Omborxonaga talabnoma yuborish",
    r: "Rasulov B. — ombor mudiri",
    m: "01.08.2026",
    s: "late",
  },
];

const tone = {
  ok: { c: "#22c55e", t: "Bajarildi" },
  soon: { c: "#f59e0b", t: "Muddat yaqin" },
  late: { c: "#ef4444", t: "Muddati oʻtdi" },
} as const;

export default function JournalTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[820px] border-collapse text-left">
        <thead>
          <tr className="bg-white/[0.04]">
            {COLS.map((c, i) => (
              <th
                key={c}
                className="border-b border-white/10 px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400"
              >
                <span className="mr-1.5 text-sky-400/70">{i + 1}</span>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r, i) => {
            const t = tone[r.s as keyof typeof tone];
            return (
              <motion.tr
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.09 }}
                className="align-top transition-colors hover:bg-white/[0.03]"
              >
                <td className="border-b border-white/6 px-3 py-3 text-[12px] tabular-nums text-slate-300">{r.d}</td>
                <td className="whitespace-pre-line border-b border-white/6 px-3 py-3 text-[12px] text-slate-300">{r.k}</td>
                <td className="border-b border-white/6 px-3 py-3 text-[12px] text-slate-200">{r.n}</td>
                <td className="border-b border-white/6 px-3 py-3 text-[12px] text-slate-300">{r.c}</td>
                <td className="border-b border-white/6 px-3 py-3 text-[12px] text-slate-300">{r.r}</td>
                <td className="border-b border-white/6 px-3 py-3 text-[12px] tabular-nums text-slate-300">{r.m}</td>
                <td className="border-b border-white/6 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-md border"
                      style={{ borderColor: `${t.c}66`, background: `${t.c}14` }}
                      title="QR imzo"
                    >
                      <QrIcon color={t.c} />
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: t.c }}>
                      {t.t}
                    </span>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function QrIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill={color}>
      <rect x="3" y="3" width="7" height="7" rx="1.4" fillOpacity="0.25" />
      <rect x="5" y="5" width="3" height="3" rx="0.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.4" fillOpacity="0.25" />
      <rect x="16" y="5" width="3" height="3" rx="0.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.4" fillOpacity="0.25" />
      <rect x="5" y="16" width="3" height="3" rx="0.6" />
      <rect x="14" y="14" width="3" height="3" rx="0.6" />
      <rect x="18" y="18" width="3" height="3" rx="0.6" />
      <rect x="14" y="19" width="2" height="2" rx="0.5" />
      <rect x="19" y="14" width="2" height="2" rx="0.5" />
    </svg>
  );
}
