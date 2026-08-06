"use client";

import { use } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  fmt, fmtDT, fio, itemById, money, STATUS_COLOR, STATUS_LABEL, stageIndex, workerById,
} from "@/lib/logic";
import { Badge, Btn, Empty, PageHead, Panel, QrSig } from "@/components/ui";

const CHAIN = [
  { l: "Ishchi", f: "12" },
  { l: "Bugalter", f: "06" },
  { l: "Bosh xisobchi", f: "14" },
  { l: "Depo boshligʻi", f: "05" },
  { l: "Ombor mudiri", f: "11" },
];

export default function ArizaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db } = useStore();
  const r = db.requests.find((x) => x.id === id);

  if (!r) return <Empty text="Ariza topilmadi" />;
  const w = workerById(db, r.workerId);
  const ombor = db.workers.find((x) => x.roles.includes("ombor_mudiri"));
  const sum = r.lines.reduce((a, l) => a + l.narx * l.soni, 0);
  const stage = stageIndex(r.status);

  const sigOf = (field: string) => r.imzolar.find((s) => s.field === field);

  return (
    <>
      <PageHead
        title={`Требование ${r.raqam}`}
        sub="Форма МУ№27 · blanka oʻzgarmaydi, ichiga maʼlumot toʻldiriladi"
        right={
          <>
            <Badge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
            <Link href="/arizalar"><Btn size="sm">← Roʻyxatga</Btn></Link>
          </>
        }
      />

      {/* zanjir */}
      <Panel className="mb-5">
        <div className="flex flex-wrap items-center gap-y-5">
          {CHAIN.map((n, i) => {
            const done = r.status === "REJECTED" ? i === 0 : i <= stage;
            const c = r.status === "REJECTED" && i > 0 ? "#64748b" : done ? "#22c55e" : "#64748b";
            return (
              <div key={n.l} className="flex items-center">
                <div className="flex min-w-[124px] flex-col items-center gap-1.5">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full border-2 text-[13px] font-bold"
                    style={{ borderColor: c, color: c, background: `${c}18` }}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <p className="text-[11.5px] font-medium text-slate-900">{n.l}</p>
                  <p className="text-[10px] text-slate-500">maydon {n.f}</p>
                </div>
                {i < CHAIN.length - 1 && <div className="mx-1 hidden h-px w-8 bg-slate-200 sm:block lg:w-14" />}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* hujjat */}
      <Panel>
        <div className="mb-6 border-b border-slate-200 pb-4 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Форма МУ№27</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">ТРЕБОВАНИЕ</h2>
          <p className="mt-1 text-[12px] text-slate-500">на выдачу спецодежды, инвентаря и инструмента</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <F n="01" l="Korxona (depo)" v={db.depo.nomi} auto />
          <F n="20" l="Tabel raqami" v={w?.tabel ?? "—"} auto />
          <F n="02" l="Ariza yuboruvchi" v={w ? fio(w) : "—"} auto />
          <F n="03" l="Ombor mudiri" v={ombor ? fio(ombor) : "—"} auto />
          <F n="13" l="Roʻyxatga olingan raqam" v={r.raqam} auto />
          <F n="07" l="Sana" v={fmt(r.yaratilgan)} />
          <F n="04" l="—" v="toʻldirilmaydi" muted />
        </div>

        {/* 06-10, 15 */}
        <div className="mt-6">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">
            06 · Buyumlar roʻyxati · 08 oʻlchov birligi · 09/10 soni · 15 narx
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-100">
                  {["06 · Nomi", "20 · Kod", "08 · Oʻlchov", "09 · Soni", "10 · Berildi", "15 · Narx", "Summa"].map((h) => (
                    <th key={h} className="border-b border-slate-200 px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.lines.map((l, i) => {
                  const it = itemById(db, l.itemId);
                  const berildi = stage >= 4;
                  return (
                    <tr key={i}>
                      <td className="border-b border-slate-200 px-3 py-2.5 text-[12.5px] text-slate-900">{it?.nomi}</td>
                      <td className="border-b border-slate-200 px-3 py-2.5 text-[12px] tabular-nums text-slate-500">{it?.kod}</td>
                      <td className="border-b border-slate-200 px-3 py-2.5 text-[12px] text-slate-700">{l.unit}</td>
                      <td className="border-b border-slate-200 px-3 py-2.5 text-[12px] tabular-nums text-slate-700">{l.soni}</td>
                      <td className="border-b border-slate-200 px-3 py-2.5 text-[12px] tabular-nums text-slate-700">{berildi ? l.soni : "—"}</td>
                      <td className="border-b border-slate-200 px-3 py-2.5 text-[12px] tabular-nums text-slate-700">{money(l.narx)}</td>
                      <td className="border-b border-slate-200 px-3 py-2.5 text-[12px] font-semibold tabular-nums text-slate-900">{money(l.narx * l.soni)}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan={6} className="px-3 py-2.5 text-right text-[12px] text-slate-500">Jami</td>
                  <td className="px-3 py-2.5 text-[13px] font-bold tabular-nums text-slate-900">{money(sum)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* imzolar */}
        <div className="mt-7">
          <p className="mb-3 text-[11px] uppercase tracking-wider text-slate-500">QR imzolar</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHAIN.map((n) => {
              const s = sigOf(n.f);
              const sw = s ? workerById(db, s.userId) : null;
              return s ? (
                <QrSig
                  key={n.f}
                  sigId={s.id}
                  hash={s.hash}
                  fio={sw ? fio(sw) : "—"}
                  lavozim={`${n.f} · ${n.l}`}
                  sana={fmtDT(s.sana)}
                  size={62}
                />
              ) : (
                <div key={n.f} className="rounded-lg border border-dashed border-slate-200 p-3">
                  <p className="text-[10.5px] text-slate-500">{n.f} · {n.l}</p>
                  <p className="mt-1 text-[12px] text-slate-400">imzo kutilmoqda</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* tarix */}
        <div className="mt-7">
          <p className="mb-3 text-[11px] uppercase tracking-wider text-slate-500">Harakatlar tarixi</p>
          <div className="space-y-2">
            {r.transitions.map((tr, i) => {
              const u = workerById(db, tr.userId);
              return (
                <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5">
                  <Badge color={STATUS_COLOR[tr.to]}>{STATUS_LABEL[tr.to]}</Badge>
                  <span className="text-[12.5px] text-slate-700">{u ? fio(u) : "tizim"}</span>
                  <span className="text-[11.5px] tabular-nums text-slate-500">{fmtDT(tr.sana)}</span>
                  {tr.izoh && <span className="w-full text-[12px] text-amber-700">Sabab: {tr.izoh}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </Panel>
    </>
  );
}

function F({ n, l, v, auto, muted }: { n: string; l: string; v: string; auto?: boolean; muted?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        <span className="mr-1.5 text-sky-600">{n}</span>
        {l}
      </p>
      <p className={`mt-1 text-[13px] ${muted ? "text-slate-400 italic" : "font-medium text-slate-900"}`}>{v}</p>
      {auto && <p className="mt-0.5 text-[10px] text-emerald-600">avtomatik</p>}
    </div>
  );
}
