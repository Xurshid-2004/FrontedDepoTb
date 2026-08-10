"use client";

import { use } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  fmtDT, fio, itemById, positionById, STATUS_COLOR, STATUS_LABEL, stageIndex, workerById,
} from "@/lib/logic";
import { Badge, Btn, Empty, Field, Input, Modal, PageHead, Panel, Select, useToast } from "@/components/ui";
import { RequisitionDoc, type RequisitionHeader, type RequisitionItem } from "@/components/docs/RequisitionDoc";
import { useState } from "react";
import type { AppRequest, BugalterFields, RequestLine } from "@/lib/types";

const CHAIN = [
  { l: "Ishchi", f: "12" },
  { l: "Bugalter", f: "06" },
  { l: "Bosh xisobchi", f: "14" },
  { l: "Depo boshligʻi", f: "05" },
  { l: "Ombor mudiri", f: "11" },
];

export default function ArizaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, canFeature, can } = useStore();
  const r = db.requests.find((x) => x.id === id);

  if (!r) return <Empty text="Ariza topilmadi" />;
  const w = workerById(db, r.workerId);
  const ombor = db.workers.find((x) => x.roles.includes("ombor_mudiri"));
  const stage = stageIndex(r.status);
  const berildiBosqich = stage >= 4; // ombor bergan / yakunlangan
  const bg = r.bugField;

  const boshXis = db.workers.find((x) => x.roles.includes("bosh_xisobchi"));
  const depoBosh = db.workers.find((x) => x.roles.includes("depo_boshligi"));
  const [yy, mm, dd] = r.yaratilgan.split("-");

  const header: RequisitionHeader = {
    companyName: db.depo.nomi,
    reqNumber: r.raqam,
    toWhom: ombor ? fio(ombor) : "",
    throughWhom: "",
    requestedBy: w ? fio(w) : "",
    approvedBy: depoBosh ? fio(depoBosh) : "",
    chiefAccountant: boshXis ? fio(boshXis) : "",
    dateDay: bg?.sana07 ? bg.sana07.split("-")[2] : dd ?? "",
    dateMonth: bg?.sana07 ? bg.sana07.split("-")[1] : mm ?? "",
    dateYear: bg?.sana07 ? bg.sana07.split("-")[0].slice(2) : (yy ?? "").slice(2),
    issueDateMonth: bg?.oy16 ?? (berildiBosqich ? mm ?? "" : ""),
    issueDateYear: bg?.yil17 ?? (berildiBosqich ? (yy ?? "").slice(2) : ""),
    recipientCompanyCode: db.depo.kod,
    operationType: r.turi === "yangi_ishchi" ? "01" : "02",
    pantCode: "",
    corrAccount: bg?.corr18 ?? "",
    corrSubAccount: "",
    priceHeader: "",
    shopCode: bg?.uchastok19 ?? w?.sex ?? "",
    depreciationMethod: "",
    professionCode: w ? String(positionById(db, w.positionId)?.tartib ?? "") : "",
    recipientPersonnelNo: w?.tabel ?? "",
    transferorPersonnelNo: ombor?.tabel ?? "",
    documentUuid: r.id,
    verificationUrl: `/verify/${r.id}`,
    issuedSignature: berildiBosqich && ombor
      ? { signedBy: fio(ombor), role: "Omborxona mudiri", signedAt: fmtDT(r.yakunlangan ?? r.yaratilgan), digitalSignHash: `${r.id}-issued`, isSigned: true }
      : undefined,
    receivedSignature: r.status === "COMPLETED" && w
      ? { signedBy: fio(w), role: positionById(db, w.positionId)?.nomi ?? "Ishchi", signedAt: fmtDT(r.yakunlangan ?? r.yaratilgan), digitalSignHash: `${r.id}-received`, isSigned: true }
      : undefined,
  };

  const docItems: RequisitionItem[] = r.lines.map((l, i) => {
    const it = itemById(db, l.itemId);
    return {
      id: `${r.id}-${i}`,
      nomenclatNumWarehouse: it?.kod ?? "",
      nomenclatNumLowValue: "",
      nameAndSize: it?.nomi ?? "",
      unit: l.unit,
      qtyRequested: l.soni,
      qtyIssued: berildiBosqich ? l.soni : 0,
      price: l.narx,
      totalSum: l.narx * l.soni,
      warehouseCardNo: bg?.royxat13 ?? "",
      monthsInUse: "",
    };
  });

  // Bugalter shu arizani koʻrayaptimi va toʻldirish bosqichидami?
  const isBugalterStage = can("request.approve1") && r.status === "SUBMITTED";

  // 5 kishilik QR imzo — bugalter, bosh xisobchi, depo boshligʻi, ishchi, ombor mudiri
  const ORDER = ["SUBMITTED", "ACCOUNTANT_APPROVED", "CHIEF_APPROVED", "HEAD_APPROVED", "ISSUED", "RECEIVED", "COMPLETED"];
  const rank = ORDER.indexOf(r.status);
  const sigDate = (field: string) => {
    const sg = r.imzolar.find((s) => s.field === field);
    return sg ? fmtDT(sg.sana) : undefined;
  };
  const bugalter = db.workers.find((x) => x.roles.includes("bugalter"));
  const docSigs = [
    { role: "Bugalter", field: "06", name: bugalter ? fio(bugalter) : "—", signed: rank >= 1, sana: sigDate("06"), hash: `${r.id}-06` },
    { role: "Bosh xisobchi", field: "14", name: boshXis ? fio(boshXis) : "—", signed: rank >= 2, sana: sigDate("14"), hash: `${r.id}-14` },
    { role: "Depo boshligʻi", field: "05", name: depoBosh ? fio(depoBosh) : "—", signed: rank >= 3, sana: sigDate("05"), hash: `${r.id}-05` },
    { role: "Ishchi", field: "12", name: w ? fio(w) : "—", signed: rank >= 5, sana: sigDate("12"), hash: `${r.id}-12` },
    { role: "Omborxona mudiri", field: "11", name: ombor ? fio(ombor) : "—", signed: rank >= 4, sana: sigDate("11"), hash: `${r.id}-11` },
  ];

  const print = () => {
    if (typeof window !== "undefined") window.print();
  };

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

      {/* bugalter — qoʻlda toʻldirish + rad etish */}
      {isBugalterStage && <BugalterFill req={r} />}

      {/* hujjat — autentik Требование (Форма МУ№27) */}
      {canFeature("doc.trebovanie") ? (
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">Требование — bosma shakl (МУ №27)</p>
            <Btn size="sm" variant="primary" onClick={print}>Chop etish / PDF</Btn>
          </div>
          <div className="print-area overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <RequisitionDoc header={header} items={docItems} signatures={docSigs} />
          </div>
        </Panel>
      ) : (
        <Panel>
          <p className="text-center text-[12.5px] text-slate-500">Требование hujjati sizning rolingiz uchun yashirilgan (admin sozlamasi).</p>
        </Panel>
      )}

      {/* tarix */}
      <Panel className="mt-5">
        <div className="mt-1">
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

/* ============ BUGALTER — Требованиени qoʻlда toʻldirish + rad etish ============ */
function BugalterFill({ req }: { req: AppRequest }) {
  const { db, updateRequest, advance, reject } = useStore();
  const t = useToast();
  const [fields, setFields] = useState<BugalterFields>(() => ({
    sana07: req.bugField?.sana07 ?? req.yaratilgan,
    royxat13: req.bugField?.royxat13 ?? "",
    oy16: req.bugField?.oy16 ?? req.yaratilgan.split("-")[1],
    yil17: req.bugField?.yil17 ?? req.yaratilgan.split("-")[0].slice(2),
    corr18: req.bugField?.corr18 ?? "",
    uchastok19: req.bugField?.uchastok19 ?? "",
  }));
  const [edits, setEdits] = useState<Record<string, { soni: string; unit: string }>>(() =>
    Object.fromEntries(req.lines.map((l) => [l.itemId, { soni: String(l.soni), unit: l.unit }]))
  );
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [rejAll, setRejAll] = useState(false);
  const [sabab, setSabab] = useState("");

  const setF = (k: keyof BugalterFields, v: string) => setFields((s) => ({ ...s, [k]: v }));
  const toggleRej = (id: string) =>
    setRejected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const kept = req.lines.filter((l) => !rejected.has(l.itemId));
  const buildLines = (): RequestLine[] =>
    kept.map((l) => ({
      ...l,
      soni: Number(edits[l.itemId]?.soni ?? l.soni) || l.soni,
      unit: (edits[l.itemId]?.unit ?? l.unit) as RequestLine["unit"],
    }));

  const need = ["sana07", "royxat13", "oy16", "yil17", "corr18", "uchastok19"] as const;
  const fieldsOk = need.every((k) => (fields[k] ?? "").toString().trim() !== "");
  const linesOk =
    kept.length > 0 &&
    kept.every((l) => (Number(edits[l.itemId]?.soni ?? l.soni) || 0) > 0 && (edits[l.itemId]?.unit ?? l.unit).toString().trim() !== "");
  const valid = fieldsOk && linesOk;

  const save = () => {
    updateRequest(req.id, { lines: buildLines(), bugField: fields });
    t.show("Saqlandi");
  };
  const approve = () => {
    if (!valid) return;
    updateRequest(req.id, { lines: buildLines(), bugField: fields });
    advance(req.id);
    t.show("Tasdiqlandi — bosh xisobchiga yuborildi");
  };

  return (
    <>
      {t.node}
      <Panel className="mb-5 ring-1 ring-sky-200">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-slate-900">Bugalter — Требованиени toʻldirish</h3>
          <Badge color={valid ? "#22c55e" : "#f59e0b"}>{valid ? "toʻldirilgan" : "toʻldirilmagan"}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="07 · Sana"><Input type="date" value={fields.sana07 ?? ""} onChange={(e) => setF("sana07", e.target.value)} /></Field>
          <Field label="13 · Roʻyxat raqami (kartoteka)"><Input value={fields.royxat13 ?? ""} onChange={(e) => setF("royxat13", e.target.value)} /></Field>
          <Field label="16 · Chiqarilgan oy"><Input value={fields.oy16 ?? ""} onChange={(e) => setF("oy16", e.target.value)} placeholder="08" /></Field>
          <Field label="17 · Chiqarilgan yil"><Input value={fields.yil17 ?? ""} onChange={(e) => setF("yil17", e.target.value)} placeholder="26" /></Field>
          <Field label="18 · Korresp. schet"><Input value={fields.corr18 ?? ""} onChange={(e) => setF("corr18", e.target.value)} /></Field>
          <Field label="19 · Uchastok"><Input value={fields.uchastok19 ?? ""} onChange={(e) => setF("uchastok19", e.target.value)} /></Field>
        </div>

        <p className="mb-2 mt-5 text-[11px] uppercase tracking-wider text-slate-500">
          06 · Maxsulotlar · 08 birlik · 09 soni — rad etilgan maxsulot Требованиеdan chiqadi
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-100">
                {["06 · Nomi", "08 · Birlik", "09 · Soni", ""].map((h) => (
                  <th key={h} className="border-b border-slate-200 px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {req.lines.map((l) => {
                const it = itemById(db, l.itemId);
                const rej = rejected.has(l.itemId);
                return (
                  <tr key={l.itemId} className={rej ? "opacity-45" : ""}>
                    <td className="border-b border-slate-200 px-3 py-2 text-[12.5px] text-slate-900">
                      {it?.nomi}{rej && <span className="ml-2 text-[11px] font-medium text-red-600">(rad etildi)</span>}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2">
                      <Select
                        value={edits[l.itemId]?.unit ?? l.unit}
                        disabled={rej}
                        onChange={(e) => setEdits((s) => ({ ...s, [l.itemId]: { soni: s[l.itemId]?.soni ?? String(l.soni), unit: e.target.value } }))}
                      >
                        {db.units.map((u) => <option key={u} value={u}>{u}</option>)}
                      </Select>
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2">
                      <Input
                        type="number"
                        className="h-9 w-24"
                        disabled={rej}
                        value={edits[l.itemId]?.soni ?? String(l.soni)}
                        onChange={(e) => setEdits((s) => ({ ...s, [l.itemId]: { unit: s[l.itemId]?.unit ?? l.unit, soni: e.target.value } }))}
                      />
                    </td>
                    <td className="border-b border-slate-200 px-3 py-2">
                      <button
                        onClick={() => toggleRej(l.itemId)}
                        className={`rounded-lg border px-3 py-1.5 text-[12px] transition ${
                          rej ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                        }`}
                      >
                        {rej ? "Qaytarish" : "Rad etish"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {kept.length === 0 && (
          <p className="mt-2 text-[12px] text-red-600">Barcha maxsulot rad etildi — tasdiqlab boʻlmaydi. Arizani butunlay rad eting.</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Btn onClick={save}>Saqlash</Btn>
          <Btn variant="ok" disabled={!valid} onClick={approve} title={valid ? "" : "Barcha maydonlarni toʻldiring"}>
            Tasdiqlash (QR imzo)
          </Btn>
          <Btn variant="danger" onClick={() => setRejAll(true)}>Arizani rad etish</Btn>
          {!valid && <span className="text-[11.5px] text-amber-700">Tasdiqlash uchun barcha maydonlar toʻldirilishi shart.</span>}
        </div>
      </Panel>

      <Modal open={rejAll} onClose={() => setRejAll(false)} title="Arizani rad etish">
        <div className="space-y-4">
          <Field label="Rad etish sababi (majburiy)">
            <Input value={sabab} onChange={(e) => setSabab(e.target.value)} placeholder="Sabab" />
          </Field>
          <div className="flex justify-end gap-3">
            <Btn onClick={() => setRejAll(false)}>Bekor</Btn>
            <Btn variant="danger" disabled={!sabab.trim()} onClick={() => { reject(req.id, sabab.trim()); setRejAll(false); t.show("Ariza rad etildi", "err"); }}>
              Rad etish
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}
