"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  addMonths, daysBetween, fmt, fioShort, iso, itemById, itemStates, kipTone, money,
  positionById, STATUS_LABEL, TODAY, workerById,
} from "@/lib/logic";
import { Badge, Btn, Empty, Field, Input, PageHead, Panel, Select, Stat, Table, Td, Tr } from "@/components/ui";
import DownloadButton from "@/components/DownloadButton";

type Kind =
  | "berilgan" | "qoldiq" | "muddat" | "arizalar" | "kirim"
  | "jurnal" | "kip" | "talon" | "imtixon" | "xarajat";

const KINDS: { k: Kind; l: string }[] = [
  { k: "berilgan", l: "Berilgan buyumlar" },
  { k: "qoldiq", l: "Ombor qoldigʻi" },
  { k: "muddat", l: "Muddati kelgan / oʻtgan" },
  { k: "arizalar", l: "Arizalar" },
  { k: "kirim", l: "Kirim" },
  { k: "jurnal", l: "Yo D-26 jurnal" },
  { k: "kip", l: "KIP" },
  { k: "talon", l: "Talonlar" },
  { k: "imtixon", l: "TB imtixoni" },
  { k: "xarajat", l: "Xarajat (lavozim boʻyicha)" },
];

export default function Hisobot() {
  const { db, me, roles } = useStore();
  const [kind, setKind] = useState<Kind>("berilgan");
  const [from, setFrom] = useState(iso(addMonths(TODAY(), -1)));
  const [to, setTo] = useState(iso(TODAY()));

  const inRange = (d: string) => d >= from && d <= to;

  // Yoʻriqchi (boshqa yuqori rolsiz) — faqat oʻziga biriktirilgan mashinist/yordamchilar
  const onlyYoriqchi =
    roles.includes("yoriqchi") &&
    !roles.some((r) => ["admin", "depo_boshligi", "bosh_xisobchi", "bugalter", "tb_xodim", "ombor_mudiri"].includes(r));
  const myWorkerIds = useMemo(
    () => (onlyYoriqchi ? new Set(db.workers.filter((w) => w.yoriqchiId === me?.id).map((w) => w.id)) : null),
    [db.workers, onlyYoriqchi, me]
  );
  const allowW = (wid: string) => !myWorkerIds || myWorkerIds.has(wid);

  // TB imtixoni — 3 toifa (1 oy qoldi / bugun oxirgi kun / muddati oʻtgan)
  const imtixonRows = useMemo(() => {
    return db.exams
      .filter((e) => allowW(e.workerId))
      .map((e) => {
        const next = iso(addMonths(new Date(e.oxirgi), e.davriylikOy));
        return { e, next, d: daysBetween(TODAY(), next) };
      })
      .sort((a, b) => a.d - b.d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.exams, myWorkerIds]);
  const imtixonCats = {
    oy: imtixonRows.filter((r) => r.d > 0 && r.d <= 30).length,
    bugun: imtixonRows.filter((r) => r.d === 0).length,
    otgan: imtixonRows.filter((r) => r.d < 0).length,
  };

  const data = useMemo(() => {
    switch (kind) {
      case "berilgan": {
        const rows: { sana: string; w: string; pos: string; item: string; soni: number; narx: number }[] = [];
        db.cards.filter((c) => allowW(c.workerId)).forEach((c) => {
          const w = workerById(db, c.workerId);
          c.berilgan.filter((b) => inRange(b.sana)).forEach((b) => {
            const it = itemById(db, b.itemId);
            rows.push({
              sana: b.sana,
              w: w ? fioShort(w) : "—",
              pos: w ? positionById(db, w.positionId)?.nomi ?? "" : "",
              item: it?.nomi ?? "",
              soni: b.soni,
              narx: it?.narx ?? 0,
            });
          });
        });
        return rows.sort((a, b) => (a.sana < b.sana ? 1 : -1));
      }
      case "kirim":
        return db.moves.filter((m) => m.turi === "kirim" && inRange(m.sana));
      case "arizalar":
        return db.requests.filter((r) => inRange(r.yaratilgan) && allowW(r.workerId));
      case "jurnal":
        return db.journal.filter((j) => inRange(j.sana));
      case "kip":
        return db.kips.filter((k) => inRange(k.sana) && allowW(k.workerId));
      default:
        return [];
    }
  }, [db, kind, from, to]);

  const muddat = useMemo(
    () =>
      db.workers
        .filter((w) => w.faol && allowW(w.id))
        .flatMap((w) =>
          itemStates(db, w)
            .filter((s) => s.holat === "sariq" || s.holat === "qizil")
            .map((s) => ({ w, s }))
        ),
    [db]
  );

  const xarajat = useMemo(() => {
    const map = new Map<string, number>();
    db.cards.filter((c) => allowW(c.workerId)).forEach((c) => {
      const w = workerById(db, c.workerId);
      if (!w) return;
      const pos = positionById(db, w.positionId)?.nomi ?? "—";
      c.berilgan.filter((b) => inRange(b.sana)).forEach((b) => {
        const it = itemById(db, b.itemId);
        map.set(pos, (map.get(pos) ?? 0) + (it?.narx ?? 0) * b.soni);
      });
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [db, from, to]);

  const jamiSumma =
    kind === "berilgan"
      ? (data as { soni: number; narx: number }[]).reduce((a, r) => a + r.soni * r.narx, 0)
      : kind === "xarajat"
      ? xarajat.reduce((a, x) => a + x[1], 0)
      : 0;

  return (
    <>
      <PageHead
        title="Hisobotlar"
        sub="Sana oraligʻi boʻyicha shakllantiriladi va PDF/Excel koʻrinishida yuklab olinadi"
      />

      <Panel className="mb-6">
        {/* Telefonda: hisobot turi butun enda (nomlari uzun — yarim
            ustunga sigʻmay qirqilardi), ikkita sana yonma-yon, tugma
            esa pastda toʻliq enda. Katta ekranda avvalgidek — bir qator. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <Field label="Hisobot turi">
              <Select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
                {KINDS.map((k) => <option key={k.k} value={k.k}>{k.l}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Sanadan">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Sanagacha">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <div className="col-span-2 flex items-end lg:col-span-1">
            <DownloadButton />
          </div>
        </div>
      </Panel>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Yozuvlar"
          value={kind === "muddat" ? muddat.length : kind === "xarajat" ? xarajat.length : kind === "imtixon" ? imtixonRows.length : (data as unknown[]).length}
        />
        <Stat label="Davr" value={`${fmt(from)} — ${fmt(to)}`} color="#a78bfa" />
        <Stat label="Jami summa" value={jamiSumma ? money(jamiSumma) : "—"} color="#f2b544" />
      </div>

      <Panel pad={false}>
        {kind === "berilgan" && (
          <Table head={["Sana", "Ishchi", "Lavozim", "Buyum", "Soni", "Narx", "Summa"]} min={900}>
            {(data as { sana: string; w: string; pos: string; item: string; soni: number; narx: number }[]).map((r, i) => (
              <Tr key={i}>
                <Td className="tabular-nums">{fmt(r.sana)}</Td>
                <Td className="text-slate-900">{r.w}</Td>
                <Td>{r.pos}</Td>
                <Td>{r.item}</Td>
                <Td className="tabular-nums">{r.soni}</Td>
                <Td className="tabular-nums">{money(r.narx)}</Td>
                <Td className="tabular-nums text-slate-900">{money(r.narx * r.soni)}</Td>
              </Tr>
            ))}
          </Table>
        )}

        {kind === "qoldiq" && (
          <Table head={["Buyum", "Kod", "Oʻlchov", "Qoldiq", "Narx", "Qiymat"]} min={760}>
            {db.stock.map((st) => {
              const it = itemById(db, st.itemId);
              if (!it) return null;
              return (
                <Tr key={st.itemId}>
                  <Td className="text-slate-900">{it.nomi}</Td>
                  <Td className="tabular-nums">{it.kod}</Td>
                  <Td>{it.unit}</Td>
                  <Td className="tabular-nums">{st.qoldiq}</Td>
                  <Td className="tabular-nums">{money(it.narx)}</Td>
                  <Td className="tabular-nums text-slate-900">{money(it.narx * st.qoldiq)}</Td>
                </Tr>
              );
            })}
          </Table>
        )}

        {kind === "muddat" && (
          <Table head={["Ishchi", "Tabel", "Lavozim", "Buyum", "Keyingi sana", "Holat"]} min={860}>
            {muddat.map(({ w, s }, i) => (
              <Tr key={i}>
                <Td className="text-slate-900">{fioShort(w)}</Td>
                <Td className="tabular-nums">{w.tabel}</Td>
                <Td>{positionById(db, w.positionId)?.nomi}</Td>
                <Td>{itemById(db, s.itemId)?.nomi}</Td>
                <Td className="tabular-nums">{s.keyingi ? fmt(s.keyingi) : "—"}</Td>
                <Td>
                  <Badge color={s.holat === "qizil" ? "#ef4444" : "#f59e0b"}>
                    {s.holat === "qizil" ? `${-(s.qolganKun ?? 0)} kun kechikdi` : "muddati keldi"}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Table>
        )}

        {kind === "arizalar" && (
          <Table head={["Raqam", "Sana", "Ishchi", "Holat", "Sabab"]} min={800}>
            {(data as typeof db.requests).map((r) => {
              const w = workerById(db, r.workerId);
              const rej = r.transitions.find((x) => x.to === "REJECTED");
              return (
                <Tr key={r.id}>
                  <Td className="tabular-nums text-slate-900">{r.raqam}</Td>
                  <Td className="tabular-nums">{fmt(r.yaratilgan)}</Td>
                  <Td>{w ? fioShort(w) : "—"}</Td>
                  <Td>{STATUS_LABEL[r.status]}</Td>
                  <Td>{rej?.izoh ?? "—"}</Td>
                </Tr>
              );
            })}
          </Table>
        )}

        {kind === "kirim" && (
          <Table head={["Sana", "Buyum", "Soni", "Izoh"]} min={640}>
            {(data as typeof db.moves).map((m) => (
              <Tr key={m.id}>
                <Td className="tabular-nums">{fmt(m.sana)}</Td>
                <Td className="text-slate-900">{itemById(db, m.itemId)?.nomi}</Td>
                <Td className="tabular-nums">+{m.soni}</Td>
                <Td>{m.izoh}</Td>
              </Tr>
            ))}
          </Table>
        )}

        {kind === "jurnal" && (
          <Table head={["Bosqich", "Sana", "Nomuvofiqlik", "Masʼul", "Muddat", "Holat"]} min={900}>
            {(data as typeof db.journal).map((j) => (
              <Tr key={j.id}>
                <Td>{j.bosqich}-bosqich</Td>
                <Td className="tabular-nums">{fmt(j.sana)}</Td>
                <Td className="text-slate-900">{j.nomuvofiqlik}</Td>
                <Td>{j.masul}</Td>
                <Td className="tabular-nums">{fmt(j.muddat)}</Td>
                <Td>
                  <Badge color={j.bajarildi ? "#22c55e" : daysBetween(TODAY(), j.muddat) < 0 ? "#ef4444" : "#f59e0b"}>
                    {j.bajarildi ? "bajarildi" : "ochiq"}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Table>
        )}

        {kind === "kip" && (
          <Table head={["Ishchi", "Liniya / stansiya", "Sana", "Muddat", "Tugash", "Holat"]} min={860}>
            {(data as typeof db.kips).map((k) => {
              const w = workerById(db, k.workerId);
              const tone = kipTone(k.tugash);
              return (
                <Tr key={k.id}>
                  <Td className="text-slate-900">{w ? fioShort(w) : "—"}</Td>
                  <Td>{k.liniya}</Td>
                  <Td className="tabular-nums">{fmt(k.sana)}</Td>
                  <Td className="tabular-nums">{k.muddatOy} oy</Td>
                  <Td className="tabular-nums">{fmt(k.tugash)}</Td>
                  <Td><Badge color={tone.color}>{tone.label}</Badge></Td>
                </Tr>
              );
            })}
          </Table>
        )}

        {kind === "talon" && (
          <Table head={["Ishchi", "Talon", "Holat", "Oxirgi amal"]} min={700}>
            {db.talons.filter((x) => x.tarix.length && allowW(x.workerId)).map((x, i) => {
              const w = workerById(db, x.workerId);
              const last = x.tarix[0];
              return (
                <Tr key={i}>
                  <Td className="text-slate-900">{w ? fioShort(w) : "—"}</Td>
                  <Td>{x.raqam}-sonli</Td>
                  <Td><Badge color={x.olingan ? "#ef4444" : "#22c55e"}>{x.olingan ? "olingan" : "joyida"}</Badge></Td>
                  <Td>{last ? `${last.amal} · ${fmt(last.sana)}${last.sabab ? ` · ${last.sabab}` : ""}` : "—"}</Td>
                </Tr>
              );
            })}
          </Table>
        )}

        {kind === "imtixon" && (
          <>
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-amber-700">1 oy qoldi</p>
                <p className="mt-1 text-[26px] font-bold tabular-nums text-amber-600">{imtixonCats.oy}</p>
              </div>
              <div className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-orange-700">Bugun oxirgi kun</p>
                <p className="mt-1 text-[26px] font-bold tabular-nums text-orange-600">{imtixonCats.bugun}</p>
              </div>
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-red-700">Muddati oʻtgan</p>
                <p className="mt-1 text-[26px] font-bold tabular-nums text-red-600">{imtixonCats.otgan}</p>
              </div>
            </div>
            <Table head={["Ishchi", "Tabel", "Oxirgi imtixon", "Davriylik", "Keyingi", "Toifa"]} min={820}>
              {imtixonRows.map(({ e, next, d }) => {
                const w = workerById(db, e.workerId);
                const cat =
                  d < 0
                    ? { c: "#ef4444", l: `Muddati oʻtgan (${-d} kun)` }
                    : d === 0
                      ? { c: "#f97316", l: "Bugun oxirgi kun" }
                      : d <= 30
                        ? { c: "#f59e0b", l: `1 oy ichida (${d} kun)` }
                        : { c: "#22c55e", l: `${d} kun qoldi` };
                return (
                  <Tr key={e.workerId}>
                    <Td className="text-slate-900">{w ? fioShort(w) : "—"}</Td>
                    <Td className="tabular-nums">{w?.tabel}</Td>
                    <Td className="tabular-nums">{fmt(e.oxirgi)}</Td>
                    <Td className="tabular-nums">{e.davriylikOy} oy</Td>
                    <Td className="tabular-nums">{fmt(next)}</Td>
                    <Td><Badge color={cat.c}>{cat.l}</Badge></Td>
                  </Tr>
                );
              })}
            </Table>
          </>
        )}

        {kind === "xarajat" && (
          <Table head={["Lavozim", "Xarajat", "Ulush"]} min={520}>
            {xarajat.map(([pos, sum]) => (
              <Tr key={pos}>
                <Td className="text-slate-900">{pos}</Td>
                <Td className="tabular-nums">{money(sum)}</Td>
                <Td>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <span
                      className="block h-full rounded-full bg-amber-400"
                      style={{ width: `${jamiSumma ? (sum / jamiSumma) * 100 : 0}%` }}
                    />
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
