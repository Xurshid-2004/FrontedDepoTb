"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { fmt, itemById, money } from "@/lib/logic";
import {
  Badge, Btn, Field, Input, Modal, PageHead, Panel, Select, Stat, Table, Td, Tr, useToast,
} from "@/components/ui";
import DownloadButton from "@/components/DownloadButton";

export default function Ombor() {
  const { db, can, stockIn } = useStore();
  const t = useToast();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"qoldiq" | "harakat">("qoldiq");
  const [kirim, setKirim] = useState(false);
  const [f, setF] = useState({ itemId: db.items[0]?.id ?? "", soni: 50, izoh: "" });

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return db.stock
      .map((st) => ({ st, it: itemById(db, st.itemId)! }))
      .filter((x) => x.it && (!s || x.it.nomi.toLowerCase().includes(s) || x.it.kod.includes(s)))
      .sort((a, b) => a.st.qoldiq - b.st.qoldiq);
  }, [db, q]);

  const jamiQiymat = rows.reduce((a, x) => a + x.st.qoldiq * x.it.narx, 0);
  const kam = rows.filter((x) => x.st.qoldiq < 30).length;

  return (
    <>
      {t.node}
      <PageHead
        title="Omborxona"
        sub="Maxsus kiyim, poyabzal va shaxsiy himoya vositalari qoldigʻi, kirim-chiqim harakati"
        right={
          <>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buyum yoki kod" className="h-11 w-full sm:h-10 sm:w-[220px]" />
            {can("stock.write") && <Btn variant="primary" onClick={() => setKirim(true)}>+ Kirim</Btn>}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Buyum turlari" value={db.items.length} />
        <Stat label="Jami qoldiq" value={rows.reduce((a, x) => a + x.st.qoldiq, 0)} color="#f2b544" />
        <Stat label="Kam qolgan (< 30)" value={kam} color={kam ? "#ef4444" : "#22c55e"} />
        <Stat label="Ombor qiymati" value={money(jamiQiymat)} color="#a78bfa" />
      </div>

      <div className="mb-5 flex gap-2">
        {(["qoldiq", "harakat"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full px-4 py-2 text-[12.5px] font-medium transition ${
              tab === k ? "bg-amber-100 text-amber-700 ring-1 ring-amber-500" : "border border-slate-200 text-slate-500 hover:text-slate-900"
            }`}
          >
            {k === "qoldiq" ? "Qoldiq" : "Kirim / chiqim"}
          </button>
        ))}
      </div>

      <Panel pad={false}>
        {tab === "qoldiq" ? (
          <Table head={["Buyum", "Nomenklatura", "Oʻlchov", "Turi", "Qoldiq", "Narx", "Qiymat"]} min={860}>
            {rows.map(({ st, it }) => {
              const c = st.qoldiq < 30 ? "#ef4444" : st.qoldiq < 80 ? "#f59e0b" : "#22c55e";
              return (
                <Tr key={it.id}>
                  <Td className="font-medium text-slate-900">{it.nomi}</Td>
                  <Td className="tabular-nums">{it.kod}</Td>
                  <Td>{it.unit}</Td>
                  <Td>{it.qishki ? <Badge color="#38bdf8">qishki</Badge> : <Badge color="#64748b">asosiy</Badge>}</Td>
                  <Td><span className="font-semibold tabular-nums" style={{ color: c }}>{st.qoldiq}</span></Td>
                  <Td className="tabular-nums">{money(it.narx)}</Td>
                  <Td className="tabular-nums text-slate-900">{money(it.narx * st.qoldiq)}</Td>
                </Tr>
              );
            })}
          </Table>
        ) : (
          <Table head={["Sana", "Buyum", "Turi", "Soni", "Izoh"]} min={720}>
            {db.moves.slice(0, 60).map((m) => {
              const it = itemById(db, m.itemId);
              return (
                <Tr key={m.id}>
                  <Td className="tabular-nums">{fmt(m.sana)}</Td>
                  <Td className="text-slate-900">{it?.nomi}</Td>
                  <Td>
                    <Badge color={m.turi === "kirim" ? "#22c55e" : "#f59e0b"}>{m.turi}</Badge>
                  </Td>
                  <Td className="tabular-nums">{m.turi === "kirim" ? "+" : "−"}{m.soni}</Td>
                  <Td>{m.izoh}</Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </Panel>

      {can("report.download") && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <p className="text-[14px] font-semibold text-slate-900">Ombor qoldigʻi hisoboti</p>
            <p className="mt-1 text-[12px] text-slate-500">{rows.length} pozitsiya · PDF</p>
          </div>
          <DownloadButton />
        </div>
      )}

      <Modal open={kirim} onClose={() => setKirim(false)} title="Buyum kirim qilish">
        <div className="space-y-4">
          <Field label="Buyum">
            <Select value={f.itemId} onChange={(e) => setF({ ...f, itemId: e.target.value })}>
              {db.items.map((i) => (
                <option key={i.id} value={i.id}>{i.nomi}</option>
              ))}
            </Select>
          </Field>
          <Field label="Soni">
            <Input type="number" value={f.soni} onChange={(e) => setF({ ...f, soni: Number(e.target.value) })} />
          </Field>
          <Field label="Izoh / yetkazib beruvchi">
            <Input value={f.izoh} onChange={(e) => setF({ ...f, izoh: e.target.value })} placeholder="«OʻzTeksTaʼminot» MChJ" />
          </Field>
          <div className="flex justify-end gap-3">
            <Btn onClick={() => setKirim(false)}>Bekor qilish</Btn>
            <Btn
              variant="primary"
              disabled={f.soni <= 0}
              onClick={() => { stockIn(f.itemId, f.soni, f.izoh || "Kirim"); setKirim(false); t.show("Kirim qayd etildi"); }}
            >
              Kirim qilish
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}
