"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { fmt, fio, fioShort, kipTone, positionById } from "@/lib/logic";
import {
  Badge, Btn, Empty, Field, Input, Modal, PageHead, Panel, Select, Stat, Table, Td, Tr, useToast,
} from "@/components/ui";

const QISM = [
  { q: 1, l: "3 kun qoldi", c: "#22c55e" },
  { q: 2, l: "2 kun qoldi", c: "#f59e0b" },
  { q: 3, l: "Bugun tugaydi", c: "#f97316" },
  { q: 4, l: "Muddati oʻtdi", c: "#b91c1c" },
] as const;

export default function KipPage() {
  const { db, me, can, addKip } = useStore();
  const t = useToast();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [f, setF] = useState({ liniya: db.lines[0] ?? "", sana: new Date().toISOString().slice(0, 10), muddatOy: 1 });

  if (!me) return null;

  const mine = db.workers.filter((w) => w.yoriqchiId === me.id);
  const scope = mine.length ? mine : db.workers.filter((w) => w.yoriqchiId);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return scope;
    return scope.filter(
      (w) =>
        fio(w).toLowerCase().includes(s) ||
        w.tabel.includes(s) ||
        (w.kolonna ?? "").toLowerCase().includes(s)
    );
  }, [scope, q]);

  const kipOf = (wid: string) =>
    db.kips.filter((k) => k.workerId === wid).sort((a, b) => (a.tugash < b.tugash ? 1 : -1))[0];

  const buckets = QISM.map((x) => ({
    ...x,
    rows: scope.filter((w) => {
      const k = kipOf(w.id);
      return k && kipTone(k.tugash).qism === x.q;
    }),
  }));

  return (
    <>
      {t.node}
      <PageHead
        title="KIP — Mashinist yoʻriqchisi kabineti"
        sub={`Menga biriktirilgan ${mine.length} ta mashinist va yordamchi. KIP: liniya/stansiya, sana, muddat (oy) va QR imzo.`}
        right={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="F.I.Sh., tabel, kolonna" className="h-10 w-[250px]" />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {buckets.map((b) => (
          <Stat key={b.q} label={`${b.q}-qism · ${b.l}`} value={b.rows.length} color={b.c} />
        ))}
      </div>

      {/* 4 rangli jadval */}
      <div className="mb-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {buckets.map((b) => (
          <div key={b.q} className="rounded-2xl border p-4" style={{ borderColor: `${b.c}55`, background: `${b.c}10` }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: b.c }}>
              {b.q}-qism · {b.l}
            </p>
            <div className="mt-3 space-y-2">
              {b.rows.length === 0 && <p className="text-[12px] text-slate-500">Yoʻq</p>}
              {b.rows.map((w) => {
                const k = kipOf(w.id)!;
                return (
                  <div key={w.id} className="rounded-lg bg-black/25 px-3 py-2">
                    <p className="truncate text-[12.5px] font-medium text-white">{fioShort(w)}</p>
                    <p className="truncate text-[11px] text-slate-400">{k.liniya} · {fmt(k.tugash)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Panel pad={false}>
        <Table head={["Ishchi", "Lavozim", "Kolonna", "Oxirgi KIP", "Muddat", "Tugash", "Holat", ""]} min={1000}>
          {list.map((w) => {
            const k = kipOf(w.id);
            const tone = k ? kipTone(k.tugash) : null;
            return (
              <Tr key={w.id}>
                <Td className="font-medium text-white">
                  {fioShort(w)}
                  <span className="block text-[11px] text-slate-500">tabel {w.tabel}</span>
                </Td>
                <Td>{positionById(db, w.positionId)?.nomi}</Td>
                <Td>{w.kolonna ?? "—"}</Td>
                <Td>{k ? k.liniya : "—"}</Td>
                <Td className="tabular-nums">{k ? `${k.muddatOy} oy` : "—"}</Td>
                <Td className="tabular-nums">{k ? fmt(k.tugash) : "—"}</Td>
                <Td>{tone ? <Badge color={tone.color}>{tone.label}</Badge> : <Badge color="#64748b">KIP yoʻq</Badge>}</Td>
                <Td>
                  {can("kip.write") && (
                    <Btn size="sm" variant="primary" onClick={() => setOpen(w.id)}>Yangi KIP</Btn>
                  )}
                </Td>
              </Tr>
            );
          })}
        </Table>
      </Panel>

      <Modal open={!!open} onClose={() => setOpen(null)} title="Yangi KIP yozuvi">
        <div className="space-y-4">
          <Field label="1. Ishlagan liniyasi yoki stansiyasi">
            <Select value={f.liniya} onChange={(e) => setF({ ...f, liniya: e.target.value })}>
              {db.lines.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="2. Sanasi">
              <Input type="date" value={f.sana} onChange={(e) => setF({ ...f, sana: e.target.value })} />
            </Field>
            <Field label="3. Muddat (oy)">
              <Select value={f.muddatOy} onChange={(e) => setF({ ...f, muddatOy: Number(e.target.value) })}>
                {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} oy</option>)}
              </Select>
            </Field>
          </div>
          <p className="rounded-lg border border-sky-400/25 bg-sky-400/8 px-3.5 py-2.5 text-[12px] text-sky-200">
            4. Saqlaganingizda yozuv sizning QR imzoyingiz bilan tasdiqlanadi va ishchiga bildirishnoma yuboriladi.
          </p>
          <div className="flex justify-end gap-3">
            <Btn onClick={() => setOpen(null)}>Bekor qilish</Btn>
            <Btn
              variant="primary"
              onClick={() => {
                addKip({ workerId: open!, yoriqchiId: me.id, liniya: f.liniya, sana: f.sana, muddatOy: f.muddatOy });
                setOpen(null);
                t.show("KIP yozildi va imzolandi");
              }}
            >
              Yozish va imzolash
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}
