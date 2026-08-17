"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { addMonths, daysBetween, fmt, fmtDT, fio, fioShort, iso, positionById, TODAY } from "@/lib/logic";
import {
  Badge, Btn, Empty, Field, Input, Modal, PageHead, Panel, Select, Stat, Table, Td, Tr, useToast,
} from "@/components/ui";

const C = { 1: "#22c55e", 2: "#f59e0b", 3: "#ef4444" } as const;

export default function TalonPage() {
  const { db, can, toggleTalon, setExam } = useStore();
  const t = useToast();
  const [q, setQ] = useState("");
  const [act, setAct] = useState<{ wid: string; raqam: 1 | 2 | 3; olingan: boolean } | null>(null);
  const [sabab, setSabab] = useState("");
  const [examFor, setExamFor] = useState<string | null>(null);
  const [ef, setEf] = useState({ sana: new Date().toISOString().slice(0, 10), davr: 12 });

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = db.workers.filter((w) => w.faol);
    if (!s) return base.slice(0, 40);
    return base.filter((w) => fio(w).toLowerCase().includes(s) || w.tabel.includes(s));
  }, [db.workers, q]);

  const olingan = db.talons.filter((x) => x.olingan).length;
  const examOtgan = db.exams.filter((e) => daysBetween(TODAY(), iso(addMonths(new Date(e.oxirgi), e.davriylikOy))) < 0).length;
  const examYaqin = db.exams.filter((e) => {
    const d = daysBetween(TODAY(), iso(addMonths(new Date(e.oxirgi), e.davriylikOy)));
    return d >= 0 && d <= 10;
  }).length;

  return (
    <>
      {t.node}
      <PageHead
        title="Talonlar va TB imtixoni"
        sub="Guvohnoma ichidagi 1/2/3-sonli ogohlantirish talonlari. TB xodimi tizim ichida oladi yoki qaytarib beradi."
        right={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="F.I.Sh. yoki tabel" className="h-11 w-full sm:h-10 sm:w-[250px]" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Olingan talonlar" value={olingan} color={olingan ? "#ef4444" : "#22c55e"} />
        <Stat label="Imtixon muddati yaqin (10 kun)" value={examYaqin} color="#f59e0b" />
        <Stat label="Imtixon muddati oʻtgan" value={examOtgan} color="#ef4444" />
        <Stat label="Koʻrsatilgan ishchilar" value={list.length} />
      </div>

      {list.length === 0 ? (
        <Empty text="Ishchi topilmadi" />
      ) : (
        <Panel pad={false}>
          <Table head={["Ishchi", "Lavozim", "1-talon", "2-talon", "3-talon", "TB imtixoni", ""]} min={1020}>
            {list.map((w) => {
              const ts = db.talons.filter((x) => x.workerId === w.id).sort((a, b) => a.raqam - b.raqam);
              const e = db.exams.find((x) => x.workerId === w.id);
              const next = e ? iso(addMonths(new Date(e.oxirgi), e.davriylikOy)) : null;
              const d = next ? daysBetween(TODAY(), next) : null;
              return (
                <Tr key={w.id}>
                  <Td className="font-medium text-slate-900">
                    {fioShort(w)}
                    <span className="block text-[11px] text-slate-500">tabel {w.tabel}</span>
                  </Td>
                  <Td>{positionById(db, w.positionId)?.nomi}</Td>
                  {([1, 2, 3] as const).map((r) => {
                    const x = ts.find((y) => y.raqam === r);
                    const on = !!x?.olingan;
                    return (
                      <Td key={r}>
                        <button
                          disabled={!can("talon.write")}
                          onClick={() => setAct({ wid: w.id, raqam: r, olingan: on })}
                          /* Telefonda balandlik oshirildi — 31 px'lik
                             tugmaga barmoq bilan aniq tegish qiyin */
                          className="rounded-lg border px-3 py-2.5 text-[11.5px] font-semibold transition disabled:cursor-default sm:px-2.5 sm:py-1.5 sm:text-[11px]"
                          style={{
                            borderColor: on ? "#ef444466" : `${C[r]}55`,
                            background: on ? "rgba(239,68,68,.12)" : `${C[r]}12`,
                            /* Oq fonda och-pushti yozuv oʻqilmasdi */
                            color: on ? "#b91c1c" : C[r],
                          }}
                        >
                          {on ? "olingan" : "joyida"}
                        </button>
                      </Td>
                    );
                  })}
                  <Td>
                    {next ? (
                      <>
                        <span className="tabular-nums">{fmt(next)}</span>
                        <span className="block text-[11px]" style={{ color: d! < 0 ? "#ef4444" : d! <= 10 ? "#f59e0b" : "#22c55e" }}>
                          {d! < 0 ? `${-d!} kun kechikdi` : `${d} kun qoldi`}
                        </span>
                      </>
                    ) : "—"}
                  </Td>
                  <Td>
                    {can("exam.write") && (
                      <Btn size="sm" onClick={() => setExamFor(w.id)}>Imtixon</Btn>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Table>
        </Panel>
      )}

      <Modal open={!!act} onClose={() => setAct(null)} title={act?.olingan ? "Talonni qaytarish" : "Talonni olish"}>
        <div className="space-y-4">
          <p className="text-[13px] text-slate-700">
            {act?.raqam}-sonli talon {act?.olingan ? "ishchiga qaytariladi" : "ishchidan olinadi"}. Amal tarixda saqlanadi va ishchiga bildirishnoma boradi.
          </p>
          {!act?.olingan && (
            <Field label="Sababi (ixtiyoriy)">
              <Input value={sabab} onChange={(e) => setSabab(e.target.value)} placeholder="Qoidabuzarlik tavsifi" />
            </Field>
          )}
          <div className="flex justify-end gap-3">
            <Btn onClick={() => setAct(null)}>Bekor qilish</Btn>
            <Btn
              variant={act?.olingan ? "ok" : "danger"}
              onClick={() => {
                toggleTalon(act!.wid, act!.raqam, sabab || undefined);
                setAct(null);
                setSabab("");
                t.show(act?.olingan ? "Talon qaytarildi" : "Talon olindi", act?.olingan ? "ok" : "err");
              }}
            >
              {act?.olingan ? "Qaytarish" : "Olish"}
            </Btn>
          </div>
        </div>
      </Modal>

      <Modal open={!!examFor} onClose={() => setExamFor(null)} title="TB bilim sinash imtixoni">
        <div className="space-y-4">
          <Field label="Oxirgi imtixon sanasi">
            <Input type="date" value={ef.sana} onChange={(e) => setEf({ ...ef, sana: e.target.value })} />
          </Field>
          <Field label="Davriylik" hint="Belgilanmasa standart 12 oy qoʻllaniladi">
            <Select value={ef.davr} onChange={(e) => setEf({ ...ef, davr: Number(e.target.value) })}>
              {[6, 12, 24].map((m) => <option key={m} value={m}>{m} oy</option>)}
            </Select>
          </Field>
          <div className="flex justify-end gap-3">
            <Btn onClick={() => setExamFor(null)}>Bekor qilish</Btn>
            <Btn variant="primary" onClick={() => { setExam(examFor!, ef.sana, ef.davr); setExamFor(null); t.show("Imtixon maʼlumoti yangilandi"); }}>
              Saqlash
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}
