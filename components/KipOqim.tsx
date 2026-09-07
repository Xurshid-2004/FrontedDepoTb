"use client";

import { useEffect, useState } from "react";
import type { Kip } from "@/lib/types";
import { fmt, fioShort, jonliRang, kipTone, TODAY, workerById } from "@/lib/logic";
import { useStore } from "@/lib/store";
import { Empty } from "@/components/ui";

/* ------------------------------------------------------------------
   KIP muddatlari — jonli lenta.

   Bosh sahifadagi «KIP muddatlari» paneli avval faqat dastlabki 6 ta
   yozuvni qotib koʻrsatardi. Endi:

   • Roʻyxat 6 qatordan uzun boʻlsa — yuqoriga uzluksiz sirpanadi
     (CSS keyframe, GPU'da), shunda barcha xodimlar navbat bilan koʻrinadi.
   • Sichqoncha ustiga kelganda yoki klaviatura bilan fokuslanganda
     toʻxtaydi — oʻqish qulay.
   • 6 ta yoki undan kam boʻlsa — oddiy statik roʻyxat (aylantirishning
     maʼnosi yoʻq).
   • Maʼlumot store orqali har 12 s va oynaga qaytilganda yangilanadi;
     bundan tashqari har daqiqada qayta hisoblanadi — yarim tunda
     «Bugun tugaydi» → «Muddati oʻtdi» oʻz-oʻzidan almashadi.
   • «Harakatni kamaytirish» tizim sozlamasida animatsiya oʻchadi.
------------------------------------------------------------------ */

const KORINADI = 6;          // bir vaqtda koʻrinadigan qatorlar
const QATOR_PX = 42;         // bitta qator balandligi (h-[42px])
const ORALIQ_PX = 8;         // qatorlar orasi (gap-2)
const SONIYA_HAR_QATOR = 2.6; // bitta qator oʻtishi uchun vaqt

export default function KipOqim({ kips }: { kips: Kip[] }) {
  const { db } = useStore();

  // Daqiqalik «tick» — muddat yorliqlari sana oʻzgarganda yangilansin.
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(iv);
  }, []);

  if (kips.length === 0) return <Empty text="Muddati yaqin KIP yoʻq" />;

  const bugun = TODAY();
  const qatorlar = kips.map((k) => {
    const w = workerById(db, k.workerId);
    const t = kipTone(k.tugash, bugun);
    return { id: k.id, ism: w ? fioShort(w) : "—", tugash: k.tugash, tone: t, rang: jonliRang(k.id) };
  });

  const aylanadi = qatorlar.length > KORINADI;
  const balandlik = KORINADI * QATOR_PX + (KORINADI - 1) * ORALIQ_PX;
  const davr = Math.max(12, Math.round(qatorlar.length * SONIYA_HAR_QATOR));

  const Royxat = ({ yashirin = false }: { yashirin?: boolean }) => (
    <ul className="flex flex-col gap-2 pb-2" aria-hidden={yashirin || undefined}>
      {qatorlar.map((q) => (
        <li
          key={q.id}
          className="flex h-[42px] items-center gap-3 rounded-xl border border-slate-200 bg-white/70 px-3"
          tabIndex={yashirin ? -1 : 0}
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${q.tone.qism >= 3 ? "kip-nuqta-puls" : ""}`}
            style={{ background: q.tone.color, ["--kip-rang" as string]: q.tone.color }}
          />
          <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold" style={{ color: q.rang }}>
            {q.ism}
          </span>
          <span className="hidden shrink-0 text-[11.5px] tabular-nums text-slate-400 sm:inline">{fmt(q.tugash)}</span>
          <span className="shrink-0 text-[13px] font-semibold" style={{ color: q.tone.color }}>
            {q.tone.label}
          </span>
        </li>
      ))}
    </ul>
  );

  if (!aylanadi) {
    return (
      <div className="-mb-2">
        <Royxat />
      </div>
    );
  }

  return (
    <div
      className="kip-oqim-qobiq relative -mx-1 overflow-hidden px-1"
      style={{
        height: balandlik,
        WebkitMaskImage: "linear-gradient(180deg, transparent 0, #000 14px, #000 calc(100% - 18px), transparent 100%)",
        maskImage: "linear-gradient(180deg, transparent 0, #000 14px, #000 calc(100% - 18px), transparent 100%)",
      }}
      role="region"
      aria-label={`KIP muddatlari, ${qatorlar.length} ta yozuv, avtomatik aylanadi`}
    >
      <div className="kip-oqim" style={{ ["--kip-davr" as string]: `${davr}s` }}>
        <Royxat />
        <Royxat yashirin />
      </div>
    </div>
  );
}

/** Panel sarlavhasi uchun jonli koʻrsatkich: yashil puls + soni. */
export function KipJonli({ soni }: { soni: number }) {
  if (soni === 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
      <span className="kip-nuqta-puls h-1.5 w-1.5 rounded-full bg-emerald-500" style={{ ["--kip-rang" as string]: "#10b981" }} />
      {soni} ta · jonli
    </span>
  );
}
