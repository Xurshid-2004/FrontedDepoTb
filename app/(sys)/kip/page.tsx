"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import {
  fmt, fio, fioShort, kipTone, lokoBrigada, positionById, positionNames, workerLokoBor,
} from "@/lib/logic";
import type { Worker } from "@/lib/types";
import {
  Badge, Btn, Empty, Field, Input, Modal, PageHead, Panel, Select, Stat, Table, Td, Tr, useToast,
} from "@/components/ui";
import IncidentFeed from "@/components/IncidentFeed";

const QISM = [
  { q: 1, l: "3 kun qoldi", c: "#22c55e" },
  { q: 2, l: "2 kun qoldi", c: "#f59e0b" },
  { q: 3, l: "Bugun tugaydi", c: "#f97316" },
  { q: 4, l: "Muddati oʻtdi", c: "#b91c1c" },
] as const;

/** KIP roʻyxati lavozim boʻyicha ikkita jadvalga ajraladi: avval teplovoz,
 *  keyin elektrovoz. Yuqoridagi tugmalar oʻz jadvaliga surib boradi. */
const JADVALLAR = [
  {
    turi: "teplovoz" as const,
    nomi: "Teplovoz",
    tugma: "Teplovoz jadvali",
    sub: "Teplovoz mashinisti va mashinist yordamchisi",
    c: "#f59e0b",
  },
  {
    turi: "elektrovoz" as const,
    nomi: "Elektrovoz",
    tugma: "Elektrovoz jadvali",
    sub: "Elektrovoz mashinisti va mashinist yordamchisi",
    c: "#1b6fe0",
  },
];

export default function KipPage() {
  const { db, me, can, addKip, addIncident, editIncident, deleteIncident } = useStore();
  const t = useToast();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [f, setF] = useState({ liniya: db.lines[0] ?? "", sana: new Date().toISOString().slice(0, 10), muddatOy: 1 });
  const [tab, setTab] = useState<"elektrovoz" | "teplovoz">("teplovoz");
  const [faqatMenikilar, setFaqatMenikilar] = useState(false);
  const elRef = useRef<HTMLDivElement>(null);
  const tpRef = useRef<HTMLDivElement>(null);
  const refs = { elektrovoz: elRef, teplovoz: tpRef };

  /* KIP roʻyxatiga FAQAT lokomotiv brigadasi kiradi: elektrovoz/teplovoz
     mashinistlari va ularning yordamchilari. Boshqa lavozimlar (chilangar,
     farrosh, muhandis ...) bu yerda umuman koʻrinmaydi.

     Ilgari roʻyxat «yoʻriqchisi biriktirilgan» ishchilar bilan cheklangan edi
     va biriktirish qilinmagan bazada jadval butunlay boʻsh chiqardi. Endi
     asos — lavozim; biriktirish esa faqat pastdagi filtr. */
  const lokoBarcha = useMemo(
    () => db.workers.filter((w) => lokoBrigada(db, w)),
    [db]
  );
  const mine = useMemo(
    () => (me ? lokoBarcha.filter((w) => w.yoriqchiId === me.id) : []),
    [lokoBarcha, me]
  );
  const scope = useMemo(
    () => (faqatMenikilar && mine.length ? mine : lokoBarcha),
    [faqatMenikilar, mine, lokoBarcha]
  );

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

  /* Lavozim boʻyicha ikkita jadval. Ikkala lavozimi bor ishchi (ham elektrovoz,
     ham teplovoz mashinisti) ikkalasida ham koʻrinadi.

     Tartib: avval KIP muddati yaqinlari (tugash sanasi boʻyicha), keyin KIP
     yozuvi yoʻqlar — familiya boʻyicha alifboda. */
  const guruh = useMemo(() => {
    const oxirgiKip = (wid: string) =>
      db.kips.filter((k) => k.workerId === wid).sort((a, b) => (a.tugash < b.tugash ? 1 : -1))[0];

    const tartibla = (rows: Worker[]) =>
      [...rows].sort((a, b) => {
        const ka = oxirgiKip(a.id)?.tugash ?? "";
        const kb = oxirgiKip(b.id)?.tugash ?? "";
        if (ka && kb) return ka < kb ? -1 : ka > kb ? 1 : 0;
        if (ka) return -1; // KIP borlar tepada
        if (kb) return 1;
        return fio(a).localeCompare(fio(b), "uz");
      });

    return {
      elektrovoz: tartibla(list.filter((w) => workerLokoBor(db, w, "elektrovoz"))),
      teplovoz: tartibla(list.filter((w) => workerLokoBor(db, w, "teplovoz"))),
    };
  }, [db, list]);

  // Qoʻlda scroll qilinganda ham tepadagi tugma koʻrinayotgan jadvalni koʻrsatadi
  useEffect(() => {
    const els = [elRef.current, tpRef.current].filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const turi = e.target.getAttribute("data-turi");
          if (e.isIntersecting && (turi === "elektrovoz" || turi === "teplovoz")) setTab(turi);
        }
      },
      { rootMargin: "-100px 0px -65% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [me]);

  if (!me) return null;

  const kipOf = (wid: string) =>
    db.kips.filter((k) => k.workerId === wid).sort((a, b) => (a.tugash < b.tugash ? 1 : -1))[0];

  const surish = (turi: "elektrovoz" | "teplovoz") => {
    setTab(turi);
    refs[turi].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const qatorlar = (rows: typeof list) =>
    rows.map((w) => {
      const k = kipOf(w.id);
      const tone = k ? kipTone(k.tugash) : null;
      return (
        <Tr key={w.id}>
          <Td className="font-medium text-slate-900">
            {fioShort(w)}
            <span className="block text-[11px] text-slate-500">tabel {w.tabel}</span>
          </Td>
          <Td>{positionNames(db, w) || positionById(db, w.positionId)?.nomi || "—"}</Td>
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
    });

  const BOSH = ["Ishchi", "Lavozim", "Kolonna", "Oxirgi KIP", "Muddat", "Tugash", "Holat", ""];

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
        sub={`Elektrovoz va teplovoz mashinistlari hamda yordamchilari — jami ${lokoBarcha.length} ta xodim${
          mine.length ? `, shundan ${mine.length} tasi menga biriktirilgan` : ""
        }. KIP: liniya/stansiya, sana, muddat (oy) va QR imzo.`}
        right={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="F.I.Sh., tabel, kolonna" className="h-11 w-full sm:h-10 sm:w-[250px]" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
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
                  <div key={w.id} className="rounded-lg bg-white/70 px-3 py-2">
                    <p className="truncate text-[12.5px] font-medium text-slate-900">{fioShort(w)}</p>
                    <p className="truncate text-[11px] text-slate-500">{k.liniya} · {fmt(k.tugash)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Jadvalga surib boruvchi tugmalar */}
      <div className="mb-4 flex flex-wrap gap-2.5">
        {JADVALLAR.map((j) => (
          <Btn
            key={j.turi}
            variant={tab === j.turi ? "primary" : "ghost"}
            onClick={() => surish(j.turi)}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: tab === j.turi ? "#fff" : j.c }}
            />
            {j.tugma}
            <span
              className="rounded-full px-2 py-0.5 text-[11.5px] font-bold tabular-nums"
              style={
                tab === j.turi
                  ? { background: "rgba(255,255,255,.25)", color: "#fff" }
                  : { background: `${j.c}1f`, color: j.c }
              }
            >
              {guruh[j.turi].length}
            </span>
          </Btn>
        ))}

        {/* Yoʻriqchi oʻziga biriktirilganlarni ajratib koʻrishi mumkin.
            Biriktirilgani boʻlmasa tugma umuman chiqmaydi — bosilsa boʻsh
            roʻyxat koʻrsatib chalkashtirmasin. */}
        {mine.length > 0 && (
          <Btn
            variant={faqatMenikilar ? "ok" : "ghost"}
            onClick={() => setFaqatMenikilar((v) => !v)}
            title="Menga biriktirilgan mashinistlar"
          >
            {faqatMenikilar ? "Menikilar" : "Faqat menikilar"}
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11.5px] font-bold tabular-nums text-emerald-600">
              {mine.length}
            </span>
          </Btn>
        )}
      </div>

      {/* 1. Teplovoz jadvali, 2. Elektrovoz jadvali — ketma-ket */}
      {JADVALLAR.map((j) => (
        <div
          key={j.turi}
          ref={refs[j.turi]}
          data-turi={j.turi}
          className="mb-6 scroll-mt-[80px] md:scroll-mt-[96px]"
        >
          <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
            <span className="h-3 w-3 rounded-full" style={{ background: j.c }} />
            <h2 className="text-[16px] font-bold tracking-tight text-slate-900 md:text-[17px]">
              {j.nomi}
            </h2>
            <Badge color={j.c}>{guruh[j.turi].length} ta ishchi</Badge>
            <span className="text-[12px] text-slate-500">{j.sub}</span>
          </div>
          <Panel pad={false}>
            {guruh[j.turi].length === 0 ? (
              <div className="p-4">
                <Empty
                  text={
                    q.trim()
                      ? `«${q.trim()}» boʻyicha ${j.nomi.toLowerCase()} jadvalida hech kim topilmadi`
                      : `«${j.sub}» lavozimi biriktirilgan xodim yoʻq. Xodimga bu lavozimni Administrator → Xodimlar boʻlimida belgilang.`
                  }
                />
              </div>
            ) : (
              <Table head={BOSH} min={1000}>
                {qatorlar(guruh[j.turi])}
              </Table>
            )}
          </Panel>
        </div>
      ))}

      {can("incident.avariya.read") && (
        <div className="mt-6">
          <IncidentFeed
            db={db}
            entries={db.incidents.filter((i) => i.turi === "avariya")}
            canWrite={can("incident.avariya.write")}
            onAdd={(matn) => addIncident("avariya", matn)}
            onEdit={(id, matn) => editIncident(id, matn)}
            onDelete={(id) => deleteIncident(id)}
            meId={me.id}
            canManageAll={can("admin.users")}
            title="Mashinist yoʻriqchisi — avariyalar"
            subtitle="Tizimda roʻy bergan avariyalar haqida xabar — hammaga koʻrinadi"
            placeholder="Avariya haqida qisqacha yozing..."
            accent="#f2b544"
          />
        </div>
      )}

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
          <p className="rounded-lg border border-sky-300 bg-sky-50 px-3.5 py-2.5 text-[12px] text-sky-700">
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
