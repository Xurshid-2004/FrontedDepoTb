"use client";

import { useState } from "react";
import type { DB, IncidentEntry } from "@/lib/types";
import { fioShort } from "@/lib/logic";
import { Btn, Empty, Panel, Textarea, useToast } from "@/components/ui";

function fmtDT(d: string) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${p2(x.getDate())}.${p2(x.getMonth() + 1)}.${x.getFullYear()} ${p2(x.getHours())}:${p2(x.getMinutes())}`;
}

/** TB baxtsiz xodisalari / mashinist yoʻriqchisi avariyalari uchun umumiy karta.
 *  Yozuvlar eskisidan keyingisi tartibida (pastga qarab) koʻrsatiladi. */
export default function IncidentFeed({
  db, entries, canWrite, onAdd, title, subtitle, placeholder, accent = "#38bdf8",
}: {
  db: DB;
  entries: IncidentEntry[];
  canWrite: boolean;
  onAdd?: (matn: string) => void;
  title: string;
  subtitle?: string;
  placeholder: string;
  accent?: string;
}) {
  const t = useToast();
  const [matn, setMatn] = useState("");

  const authorName = (id: string) => {
    const w = db.workers.find((x) => x.id === id);
    return w ? fioShort(w) : "Tizim";
  };

  return (
    <Panel>
      {t.node}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12px] text-slate-500">{subtitle}</p>}
        </div>
        <span
          className="grid h-8 min-w-8 place-items-center rounded-full px-2 text-[12px] font-semibold"
          style={{ background: `${accent}15`, color: accent }}
        >
          {entries.length}
        </span>
      </div>

      {canWrite && onAdd && (
        <div className="mb-4 space-y-2">
          <Textarea
            value={matn}
            onChange={(e) => setMatn(e.target.value)}
            placeholder={placeholder}
            className="h-20"
          />
          <div className="flex justify-end">
            <Btn
              size="sm"
              variant="primary"
              disabled={!matn.trim()}
              onClick={() => {
                onAdd(matn.trim());
                setMatn("");
                t.show("Xabar yuborildi — hammaga koʻrinadi");
              }}
            >
              Yuborish
            </Btn>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <Empty text="Hozircha yozuvlar yoʻq" />
      ) : (
        <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
          {entries.map((e) => (
            <div key={e.id} className="rounded-xl border border-slate-200 px-3.5 py-2.5">
              <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-800">{e.matn}</p>
              <p className="mt-1.5 text-[11px] text-slate-500">
                {authorName(e.authorId)} · {fmtDT(e.sana)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
