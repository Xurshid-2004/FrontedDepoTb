"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  fmt, fioShort, itemById, money, STATUS_COLOR, STATUS_LABEL, workerById, rejectReasonRequired,
} from "@/lib/logic";
import type { RequestStatus } from "@/lib/types";
import {
  Badge, Btn, Empty, Field, Input, Modal, PageHead, Panel, Table, Td, Textarea, Tr, useToast,
} from "@/components/ui";

const FILTERS: { k: "all" | "mine" | "pending" | "done"; l: string }[] = [
  { k: "pending", l: "Mening tasdigʻimda" },
  { k: "mine", l: "Mening arizalarim" },
  { k: "all", l: "Barchasi" },
  { k: "done", l: "Yakunlangan" },
];

export default function Arizalar() {
  const { db, me, roles, can, advance, reject } = useStore();
  const t = useToast();
  const [f, setF] = useState<"all" | "mine" | "pending" | "done">("pending");
  const [q, setQ] = useState("");
  const [rejFor, setRejFor] = useState<string | null>(null);
  const [sabab, setSabab] = useState("");

  const actionable = (s: RequestStatus) =>
    (s === "SUBMITTED" && can("request.approve1")) ||
    (s === "ACCOUNTANT_APPROVED" && can("request.approve2")) ||
    (s === "CHIEF_APPROVED" && can("request.approve3")) ||
    ((s === "HEAD_APPROVED" || s === "RECEIVED") && can("request.issue"));

  const list = useMemo(() => {
    let r = db.requests;
    if (f === "mine") r = r.filter((x) => x.workerId === me?.id);
    if (f === "pending") r = r.filter((x) => actionable(x.status) || (x.status === "ISSUED" && x.workerId === me?.id));
    if (f === "done") r = r.filter((x) => x.status === "COMPLETED" || x.status === "REJECTED");
    const s = q.trim().toLowerCase();
    if (s) {
      r = r.filter((x) => {
        const w = workerById(db, x.workerId);
        return (
          x.raqam.toLowerCase().includes(s) ||
          (w && (`${w.familiya} ${w.ism}`.toLowerCase().includes(s) || w.tabel.includes(s)))
        );
      });
    }
    return r;
  }, [db, f, q, me, roles]);

  if (!me) return null;

  return (
    <>
      {t.node}
      <PageHead
        title="Arizalar"
        sub="Ishchi → bugalter → bosh xisobchi → depo boshligʻi → ombor mudiri. Rad etilgan ariza butunlay yopiladi."
        right={
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Raqam, F.I.Sh. yoki tabel"
            className="h-10 w-[260px]"
          />
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((x) => (
          <button
            key={x.k}
            onClick={() => setF(x.k)}
            className={`rounded-full px-4 py-2 text-[12.5px] font-medium transition ${
              f === x.k
                ? "bg-sky-100 text-sky-700 ring-1 ring-sky-500"
                : "border border-slate-200 text-slate-500 hover:text-slate-900"
            }`}
          >
            {x.l}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty text="Bu filtr boʻyicha ariza topilmadi" />
      ) : (
        <Panel pad={false}>
          <Table head={["Raqam", "Ishchi", "Buyumlar", "Summa", "Holat", "Sana", ""]} min={980}>
            {list.map((r) => {
              const w = workerById(db, r.workerId);
              const sum = r.lines.reduce((a, l) => a + l.narx * l.soni, 0);
              const act = actionable(r.status);
              const mine = r.workerId === me.id;
              return (
                <Tr key={r.id}>
                  <Td className="font-semibold tabular-nums text-slate-900">
                    <Link href={`/arizalar/${r.id}`} className="hover:text-sky-700">{r.raqam}</Link>
                  </Td>
                  <Td>
                    {w ? fioShort(w) : "—"}
                    <span className="block text-[11px] text-slate-500">tabel {w?.tabel}</span>
                  </Td>
                  <Td>{r.lines.map((l) => itemById(db, l.itemId)?.nomi).join(", ")}</Td>
                  <Td className="tabular-nums">{money(sum)}</Td>
                  <Td><Badge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge></Td>
                  <Td className="tabular-nums">{fmt(r.yaratilgan)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      {act && (
                        <>
                          <Btn size="sm" variant="ok" onClick={() => { advance(r.id); t.show("Tasdiqlandi"); }}>
                            {r.status === "HEAD_APPROVED" ? "Berdim" : r.status === "RECEIVED" ? "Yakunlash" : "Tasdiqlash"}
                          </Btn>
                          {r.status !== "RECEIVED" && (
                            <Btn size="sm" variant="danger" onClick={() => setRejFor(r.id)}>Rad etish</Btn>
                          )}
                        </>
                      )}
                      {mine && r.status === "ISSUED" && (
                        <Btn size="sm" variant="primary" onClick={() => { advance(r.id); t.show("Olganingiz tasdiqlandi"); }}>
                          Oldim
                        </Btn>
                      )}
                      <Link href={`/arizalar/${r.id}`}><Btn size="sm">Требование</Btn></Link>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        </Panel>
      )}

      <Modal open={!!rejFor} onClose={() => setRejFor(null)} title="Arizani rad etish">
        <div className="space-y-4">
          <p className="rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-[12.5px] text-red-700">
            Rad etilgan ariza butunlay yopiladi va qayta koʻrib chiqilmaydi. Ishchiga sizning
            F.I.Sh. va sabab bilan bildirishnoma yuboriladi.
          </p>
          <Field
            label="Rad etish sababi"
            hint={rejectReasonRequired(roles) ? "Sizning rolingiz uchun majburiy" : "Depo boshligʻi uchun ixtiyoriy"}
          >
            <Textarea value={sabab} onChange={(e) => setSabab(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-3">
            <Btn onClick={() => setRejFor(null)}>Bekor qilish</Btn>
            <Btn
              variant="danger"
              disabled={rejectReasonRequired(roles) && sabab.trim().length < 5}
              onClick={() => { reject(rejFor!, sabab); setRejFor(null); setSabab(""); t.show("Ariza rad etildi", "err"); }}
            >
              Rad etish
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}
