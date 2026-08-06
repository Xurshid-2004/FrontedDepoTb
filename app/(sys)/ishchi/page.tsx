"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  addMonths, canRequest, daysBetween, fmt, iso, itemById, itemStates, kipTone, positionById,
  STATUS_COLOR, STATUS_LABEL, TODAY,
} from "@/lib/logic";
import { Badge, Btn, Empty, PageHead, Panel, Stat, Table, Td, Tr, useToast } from "@/components/ui";

export default function Ishchi() {
  const { db, me, createRequest } = useStore();
  const t = useToast();
  const [sel, setSel] = useState<string[]>([]);

  if (!me) return null;

  const pos = positionById(db, me.positionId);
  const states = itemStates(db, me);
  const myReqs = db.requests.filter((r) => r.workerId === me.id);
  const myTalons = db.talons.filter((x) => x.workerId === me.id).sort((a, b) => a.raqam - b.raqam);
  const exam = db.exams.find((x) => x.workerId === me.id);
  const nextExam = exam ? iso(addMonths(new Date(exam.oxirgi), exam.davriylikOy)) : null;
  const examDays = nextExam ? daysBetween(TODAY(), nextExam) : null;
  const myKips = db.kips.filter((k) => k.workerId === me.id).sort((a, b) => (a.tugash < b.tugash ? 1 : -1));

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const send = () => {
    if (!sel.length) return;
    createRequest(me.id, sel);
    setSel([]);
    t.show("Ariza yuborildi — bugalteriya koʻrigida");
  };

  const TALON_C = { 1: "#22c55e", 2: "#f59e0b", 3: "#ef4444" } as const;

  return (
    <>
      {t.node}
      <PageHead
        title="Mening kabinetim"
        sub={`${pos?.nomi ?? ""} · tabel ${me.tabel} · ${me.sex}`}
        right={<Link href={`/kartochka/${me.id}`}><Btn size="sm">Shaxsiy kartochkam (MB-6)</Btn></Link>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Normadagi buyumlar" value={states.length} />
        <Stat
          label="Olish muddati kelgan"
          value={states.filter((s) => s.holat === "sariq" || s.holat === "qizil").length}
          color="#f59e0b"
        />
        <Stat
          label="TB imtixoni"
          value={examDays === null ? "—" : examDays < 0 ? "muddati oʻtdi" : `${examDays} kun`}
          color={examDays !== null && examDays <= 10 ? "#ef4444" : "#22c55e"}
          hint={nextExam ? fmt(nextExam) : undefined}
        />
        <Stat
          label="Olingan talonlar"
          value={myTalons.filter((x) => x.olingan).length}
          color={myTalons.some((x) => x.olingan) ? "#ef4444" : "#22c55e"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-semibold text-white">Menga tegishli buyumlar</h3>
              <p className="mt-1 text-[12px] text-slate-400">
                Faqat muddati kelgan buyumlarni tanlash mumkin
              </p>
            </div>
            <Btn variant="primary" disabled={!sel.length} onClick={send}>
              Ariza yuborish {sel.length ? `(${sel.length})` : ""}
            </Btn>
          </div>

          <div className="space-y-2">
            {states.map((s) => {
              const it = itemById(db, s.itemId);
              const chk = canRequest(db, me, s.itemId);
              const c =
                s.holat === "yashil" ? "#22c55e" : s.holat === "sariq" ? "#f59e0b" : s.holat === "qizil" ? "#ef4444" : "#38bdf8";
              const on = sel.includes(s.itemId);
              return (
                <button
                  key={s.itemId}
                  type="button"
                  disabled={!chk.ok}
                  onClick={() => toggle(s.itemId)}
                  title={chk.ok ? "Tanlash" : chk.sabab}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                    on ? "border-sky-400/70 bg-sky-400/10" : "border-white/8 hover:border-white/20"
                  } ${!chk.ok ? "cursor-not-allowed opacity-55" : ""}`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[11px] ${
                      on ? "border-sky-400 bg-sky-400 text-[#05090f]" : "border-white/20"
                    }`}
                  >
                    {on ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-white">{it?.nomi}</span>
                    <span className="block text-[11.5px] text-slate-500">
                      {s.norm.muddatOy === null ? "Ish. Chiqqun" : `${s.norm.muddatOy} oy`}
                      {it?.qishki ? " · qishki" : ""}
                      {!chk.ok ? ` · ${chk.sabab}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11.5px] tabular-nums" style={{ color: c }}>
                    {s.holat === "chiqqun" ? "yaroqsizlanganda" : s.keyingi ? fmt(s.keyingi) : "muddati keldi"}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <h3 className="mb-4 text-[15px] font-semibold text-white">Ogohlantirish talonlari</h3>
            <div className="flex gap-3">
              {myTalons.map((x) => (
                <div
                  key={x.raqam}
                  className="flex-1 rounded-xl border p-3 text-center"
                  style={{
                    borderColor: x.olingan ? "#ef444455" : `${TALON_C[x.raqam]}66`,
                    background: x.olingan ? "rgba(239,68,68,.08)" : `${TALON_C[x.raqam]}12`,
                  }}
                >
                  <p className="text-[22px] font-bold" style={{ color: x.olingan ? "#64748b" : TALON_C[x.raqam] }}>
                    {x.raqam}
                  </p>
                  <p className="mt-1 text-[10.5px]" style={{ color: x.olingan ? "#ef4444" : "#94a3b8" }}>
                    {x.olingan ? "olingan" : "joyida"}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          {myKips.length > 0 && (
            <Panel>
              <h3 className="mb-4 text-[15px] font-semibold text-white">KIP maʼlumotnomam</h3>
              <div className="space-y-2">
                {myKips.slice(0, 4).map((k) => {
                  const tone = kipTone(k.tugash);
                  return (
                    <div key={k.id} className="rounded-xl border border-white/8 px-3.5 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-[12.5px] text-white">{k.liniya}</span>
                        <Badge color={tone.color}>{tone.label}</Badge>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {fmt(k.sana)} · {k.muddatOy} oy · tugash {fmt(k.tugash)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-[15px] font-semibold text-white">Mening arizalarim</h3>
        {myReqs.length === 0 ? (
          <Empty text="Hali ariza yubormagansiz" />
        ) : (
          <Panel pad={false}>
            <Table head={["Raqam", "Buyumlar", "Holat", "Sana", ""]} min={720}>
              {myReqs.map((r) => (
                <Tr key={r.id}>
                  <Td className="font-semibold tabular-nums text-white">{r.raqam}</Td>
                  <Td>{r.lines.map((l) => itemById(db, l.itemId)?.nomi).join(", ")}</Td>
                  <Td><Badge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge></Td>
                  <Td className="tabular-nums">{fmt(r.yaratilgan)}</Td>
                  <Td><Link href={`/arizalar/${r.id}`}><Btn size="sm">Hujjat</Btn></Link></Td>
                </Tr>
              ))}
            </Table>
          </Panel>
        )}
      </div>
    </>
  );
}
