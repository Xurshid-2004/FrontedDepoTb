"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import {
  dashboardStats, daysBetween, fmt, fioShort, itemStates, kipTone,
  STATUS_COLOR, STATUS_LABEL, TODAY, itemById, workerById, money,
} from "@/lib/logic";
import { Badge, Btn, Empty, PageHead, Panel, Stat, Table, Td, Tr } from "@/components/ui";
import { Tilt, SpeedLines } from "@/components/Fx";

export default function Dash() {
  const { db, me, roles, can } = useStore();
  const s = useMemo(() => dashboardStats(db), [db]);

  if (!me) return null;

  const myItems = itemStates(db, me);
  const myKip = db.kips.filter((k) => k.workerId === me.id).sort((a, b) => (a.tugash < b.tugash ? 1 : -1))[0];

  const pending = db.requests.filter((r) => {
    if (r.status === "SUBMITTED") return can("request.approve1");
    if (r.status === "ACCOUNTANT_APPROVED") return can("request.approve2");
    if (r.status === "CHIEF_APPROVED") return can("request.approve3");
    if (r.status === "HEAD_APPROVED" || r.status === "RECEIVED") return can("request.issue");
    return false;
  });

  const kipYaqin = db.kips
    .filter((k) => kipTone(k.tugash).qism > 0)
    .sort((a, b) => (a.tugash > b.tugash ? 1 : -1));

  const jurnalYaqin = db.journal
    .filter((j) => !j.bajarildi)
    .sort((a, b) => (a.muddat > b.muddat ? 1 : -1))
    .slice(0, 5);

  const ombor = db.stock
    .map((st) => ({ st, it: itemById(db, st.itemId)! }))
    .filter((x) => x.it)
    .sort((a, b) => a.st.qoldiq - b.st.qoldiq)
    .slice(0, 5);

  return (
    <>
      <PageHead
        title={`Assalomu alaykum, ${me.ism}`}
        sub={`${db.depo.nomi} · ${db.depo.kod} · bugun ${fmt(TODAY())}`}
      />

      {/* modul kartalari */}
      <div className="mb-7 grid gap-5 md:grid-cols-2">
        <Tilt max={8} className="h-full">
          <Link href="/tb" className="block h-full">
            <div className="relative h-full overflow-hidden rounded-2xl bg-[linear-gradient(140deg,#1b6fe0_0%,#2f8ff0_45%,#38bdf8_100%)] p-6 shadow-[0_24px_60px_-26px_rgba(27,111,224,.85)]">
              <SpeedLines count={70} opacity={0.3} speed={1.1} meteorRate={0.05} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(255,255,255,.35),transparent_55%)]" />
              <p className="relative text-[10px] uppercase tracking-[0.32em] text-white/75">Modul 1</p>
              <h3 className="relative mt-3 text-[22px] font-bold text-white">TB — Texnika xavfsizligi</h3>
              <p className="relative mt-2 text-[13px] leading-relaxed text-white/80">
                Maʼmuriy jamoatchilik nazoratining 1- va 2-bosqich jurnallari (Yo D-26)
              </p>
              <div className="relative mt-6 flex gap-7">
                <Mini v={s.ochiqJurnal} l="Ochiq yozuv" c="#ffffff" />
                <Mini v={s.muddatYaqin} l="Muddat yaqin" c="#ffe6a8" />
                <Mini v={s.muddatOtgan} l="Muddati oʻtgan" c="#ffc9c9" />
              </div>
            </div>
          </Link>
        </Tilt>

        <Tilt max={8} className="h-full">
          <Link href="/ombor" className="block h-full">
            <div className="relative h-full overflow-hidden rounded-2xl bg-[linear-gradient(140deg,#a9640f_0%,#d9931f_45%,#f2b544_100%)] p-6 shadow-[0_24px_60px_-26px_rgba(217,147,31,.85)]">
              <SpeedLines count={70} opacity={0.28} speed={1.1} hue={44} meteorRate={0.05} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(255,255,255,.35),transparent_55%)]" />
              <p className="relative text-[10px] uppercase tracking-[0.32em] text-white/75">Modul 2</p>
              <h3 className="relative mt-3 text-[22px] font-bold text-white">Omborxona</h3>
              <p className="relative mt-2 text-[13px] leading-relaxed text-white/85">
                Maxsus kiyim, poyabzal va shaxsiy himoya vositalari aylanmasi
              </p>
              <div className="relative mt-6 flex gap-7">
                <Mini v={s.faolAriza} l="Faol ariza" c="#ffffff" />
                <Mini v={s.kelgan} l="Muddati kelgan" c="#fff1cf" />
                <Mini v={s.otgan} l="Muddati oʻtgan" c="#ffd4d4" />
              </div>
            </div>
          </Link>
        </Tilt>
      </div>

      {/* statistika */}
      <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Faol ishchilar" value={db.workers.filter((w) => w.faol).length} />
        <Stat label="Ombordagi buyum turi" value={db.items.length} color="#f2b544" />
        <Stat label="Mening tasdigʻimni kutmoqda" value={pending.length} color="#a78bfa" hint={pending.length ? "Arizalar boʻlimiga oʻting" : "Hozircha yoʻq"} />
        <Stat label="KIP — muddati yaqin/oʻtgan" value={s.kipYaqin + s.kipOtgan} color="#ef4444" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* mening buyumlarim */}
        <Panel className="xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">Mening buyumlarim</h3>
            <Link href="/ishchi"><Btn size="sm">Kabinet</Btn></Link>
          </div>
          {myItems.length === 0 ? (
            <Empty text="Lavozimingiz boʻyicha norma topilmadi" />
          ) : (
            <div className="space-y-2">
              {myItems.slice(0, 6).map((st) => {
                const it = itemById(db, st.itemId);
                const c =
                  st.holat === "yashil" ? "#22c55e" : st.holat === "sariq" ? "#f59e0b" : st.holat === "qizil" ? "#ef4444" : "#38bdf8";
                return (
                  <div key={st.itemId} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c }} />
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-800">{it?.nomi}</span>
                    <span className="shrink-0 text-[11px] tabular-nums" style={{ color: c }}>
                      {st.holat === "chiqqun" ? "Ish. Chiqqun" : st.keyingi ? fmt(st.keyingi) : "muddati keldi"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* jurnal muddatlari */}
        <Panel className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">Bajarilishi kutilayotgan chora-tadbirlar</h3>
            <Link href="/tb"><Btn size="sm">Jurnallar</Btn></Link>
          </div>
          {jurnalYaqin.length === 0 ? (
            <Empty text="Ochiq yozuv yoʻq" />
          ) : (
            <Table head={["Sana", "Nomuvofiqlik", "Masʼul", "Muddat", "Holat"]} min={640}>
              {jurnalYaqin.map((j) => {
                const d = daysBetween(TODAY(), j.muddat);
                const c = d < 0 ? "#ef4444" : d <= 3 ? "#f59e0b" : "#38bdf8";
                return (
                  <Tr key={j.id}>
                    <Td className="tabular-nums">{fmt(j.sana)}</Td>
                    <Td className="text-slate-800">{j.nomuvofiqlik}</Td>
                    <Td>{j.masul}</Td>
                    <Td className="tabular-nums">{fmt(j.muddat)}</Td>
                    <Td>
                      <Badge color={c}>{d < 0 ? `${-d} kun kechikdi` : `${d} kun qoldi`}</Badge>
                    </Td>
                  </Tr>
                );
              })}
            </Table>
          )}
        </Panel>

        {/* mening tasdigʻimni kutayotgan arizalar */}
        {pending.length > 0 && (
          <Panel className="xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-900">Mening tasdigʻimni kutmoqda</h3>
              <Link href="/arizalar"><Btn size="sm" variant="primary">Koʻrib chiqish</Btn></Link>
            </div>
            <Table head={["Raqam", "Ishchi", "Buyumlar", "Summa", "Holat"]} min={640}>
              {pending.slice(0, 6).map((r) => {
                const w = workerById(db, r.workerId);
                const sum = r.lines.reduce((a, l) => a + l.narx * l.soni, 0);
                return (
                  <Tr key={r.id}>
                    <Td className="font-semibold tabular-nums text-slate-900">{r.raqam}</Td>
                    <Td>{w ? fioShort(w) : "—"}</Td>
                    <Td>{r.lines.map((l) => itemById(db, l.itemId)?.nomi).join(", ")}</Td>
                    <Td className="tabular-nums">{money(sum)}</Td>
                    <Td>
                      <Badge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </Td>
                  </Tr>
                );
              })}
            </Table>
          </Panel>
        )}

        {/* KIP */}
        {(can("kip.read") || myKip) && (
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-900">KIP muddatlari</h3>
              {can("kip.write") && <Link href="/kip"><Btn size="sm">Kabinet</Btn></Link>}
            </div>
            {kipYaqin.length === 0 ? (
              <Empty text="Muddati yaqin KIP yoʻq" />
            ) : (
              <div className="space-y-2">
                {kipYaqin.slice(0, 6).map((k) => {
                  const w = workerById(db, k.workerId);
                  const t = kipTone(k.tugash);
                  return (
                    <div key={k.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: t.color }} />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-800">
                        {w ? fioShort(w) : "—"}
                      </span>
                      <span className="shrink-0 text-[11px]" style={{ color: t.color }}>{t.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        )}

        {/* ombor eng kam qoldiq */}
        {can("stock.read") && (
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-slate-900">Eng kam qoldiq</h3>
              <Link href="/ombor"><Btn size="sm">Ombor</Btn></Link>
            </div>
            <div className="space-y-2">
              {ombor.map(({ st, it }) => (
                <div key={st.itemId} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-800">{it.nomi}</span>
                  <span
                    className="shrink-0 text-[12px] font-semibold tabular-nums"
                    style={{ color: st.qoldiq < 30 ? "#ef4444" : st.qoldiq < 80 ? "#f59e0b" : "#22c55e" }}
                  >
                    {st.qoldiq} {it.unit}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>

      <p className="mt-8 text-center text-[11.5px] text-slate-400">
        Rolingiz: {roles.join(", ")}
      </p>
    </>
  );
}

function Mini({ v, l, c = "#ffffff" }: { v: number; l: string; c?: string }) {
  return (
    <div>
      <p className="text-[28px] font-bold leading-none tabular-nums" style={{ color: c }}>{v}</p>
      <p className="mt-1.5 text-[11px] text-white/75">{l}</p>
    </div>
  );
}
