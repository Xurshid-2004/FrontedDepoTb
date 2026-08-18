"use client";

import { useState } from "react";
import type { DB, IncidentEntry } from "@/lib/types";
import { fioShort } from "@/lib/logic";
import { Btn, Empty, Modal, Panel, Textarea, useToast } from "@/components/ui";

function fmtDT(d: string) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${p2(x.getDate())}.${p2(x.getMonth() + 1)}.${x.getFullYear()} ${p2(x.getHours())}:${p2(x.getMinutes())}`;
}

/** TB baxtsiz xodisalari / mashinist yoʻriqchisi avariyalari uchun umumiy karta.
 *  Yozuvlar eskisidan keyingisi tartibida (pastga qarab) koʻrsatiladi. */
export default function IncidentFeed({
  db, entries, canWrite, onAdd, onEdit, onDelete, meId, canManageAll = false,
  title, subtitle, placeholder, accent = "#38bdf8",
}: {
  db: DB;
  entries: IncidentEntry[];
  canWrite: boolean;
  onAdd?: (matn: string) => void;
  /** Yozuvni tahrirlash — berilmasa tugma chiqmaydi */
  onEdit?: (id: string, matn: string) => void;
  /** Yozuvni oʻchirish — berilmasa tugma chiqmaydi */
  onDelete?: (id: string) => void;
  /** Kirgan foydalanuvchi — oʻz xabarini tahrirlay oladi */
  meId?: string;
  /** Administrator istalgan xabarni tahrirlay/oʻchira oladi */
  canManageAll?: boolean;
  title: string;
  subtitle?: string;
  placeholder: string;
  accent?: string;
}) {
  const t = useToast();
  const [matn, setMatn] = useState("");
  const [tahrir, setTahrir] = useState<{ id: string; matn: string } | null>(null);
  const [ochirish, setOchirish] = useState<IncidentEntry | null>(null);

  const authorName = (id: string) => {
    const w = db.workers.find((x) => x.id === id);
    return w ? fioShort(w) : "Tizim";
  };

  /* Xabarni faqat muallifning oʻzi tahrirlaydi; administrator — istalganini.
     Server ham shu qoidani tekshiradi, bu yerdagisi tugmani yashirish uchun. */
  const boshqara = (e: IncidentEntry) =>
    canWrite && (canManageAll || (!!meId && e.authorId === meId));

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
          {entries.map((e) => {
            const tahrirlanmoqda = tahrir?.id === e.id;
            return (
              <div key={e.id} className="rounded-xl border border-slate-200 px-3.5 py-2.5">
                {tahrirlanmoqda ? (
                  <div className="space-y-2">
                    <Textarea
                      value={tahrir.matn}
                      onChange={(ev) => setTahrir({ id: e.id, matn: ev.target.value })}
                      className="h-28"
                    />
                    <div className="flex justify-end gap-2">
                      <Btn size="sm" onClick={() => setTahrir(null)}>Bekor qilish</Btn>
                      <Btn
                        size="sm"
                        variant="primary"
                        disabled={!tahrir.matn.trim() || tahrir.matn.trim() === e.matn}
                        onClick={() => {
                          onEdit?.(e.id, tahrir.matn.trim());
                          setTahrir(null);
                          t.show("Xabar tahrirlandi");
                        }}
                      >
                        Saqlash
                      </Btn>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-800">
                      {e.matn}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-500">
                        {authorName(e.authorId)} · {fmtDT(e.sana)}
                      </p>
                      {boshqara(e) && (onEdit || onDelete) && (
                        <div className="flex gap-1.5">
                          {onEdit && (
                            <button
                              onClick={() => setTahrir({ id: e.id, matn: e.matn })}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11.5px] font-semibold text-slate-600 transition hover:border-sky-500 hover:text-sky-600"
                            >
                              Tahrirlash
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => setOchirish(e)}
                              className="rounded-lg border border-red-200 px-2.5 py-1 text-[11.5px] font-semibold text-red-500 transition hover:bg-red-50"
                            >
                              Oʻchirish
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Oʻchirish qaytarilmaydi — shuning uchun tasdiq soʻraladi */}
      <Modal open={!!ochirish} onClose={() => setOchirish(null)} title="Xabar oʻchirilsinmi?">
        <div className="space-y-4">
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-700">
            {ochirish?.matn}
          </p>
          <p className="text-[12px] text-slate-500">
            Oʻchirilgan xabarni qaytarib boʻlmaydi va u hammadan yoʻqoladi.
          </p>
          <div className="flex justify-end gap-3">
            <Btn onClick={() => setOchirish(null)}>Bekor qilish</Btn>
            <Btn
              variant="danger"
              onClick={() => {
                if (ochirish) onDelete?.(ochirish.id);
                setOchirish(null);
                t.show("Xabar oʻchirildi");
              }}
            >
              Oʻchirish
            </Btn>
          </div>
        </div>
      </Modal>
    </Panel>
  );
}
