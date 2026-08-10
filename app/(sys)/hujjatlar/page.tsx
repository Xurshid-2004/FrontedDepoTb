"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { fmt, fio, itemById, money, positionById, STATUS_COLOR, STATUS_LABEL } from "@/lib/logic";
import { Badge, Btn, Empty, Input, PageHead, Panel, Table, Td, Tr } from "@/components/ui";
import WorkerFace from "@/components/WorkerFace";

type View = "treb" | "mb6";

export default function Hujjatlar() {
  const { db, me, roles, canFeature } = useStore();
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("treb");

  const pureIshchi = !!me && roles.length === 1 && roles[0] === "ishchi";
  const showMb6 = canFeature("doc.mb6");
  const showTreb = canFeature("doc.trebovanie");
  const showKitob = canFeature("doc.kitobcha");

  const s = q.trim().toLowerCase();

  // Требованиеlar — barchasi (ishchi boʻlsa faqat oʻziniki)
  const reqs = useMemo(() => {
    let list = db.requests;
    if (pureIshchi && me) list = list.filter((r) => r.workerId === me.id);
    if (s) {
      list = list.filter((r) => {
        const w = db.workers.find((x) => x.id === r.workerId);
        return r.raqam.toLowerCase().includes(s) || (w && (fio(w).toLowerCase().includes(s) || w.tabel.includes(s)));
      });
    }
    return [...list].sort((a, b) => (a.yaratilgan < b.yaratilgan ? 1 : -1));
  }, [db.requests, db.workers, s, pureIshchi, me]);

  // MB-6 kartochkalar — barcha ishchi (ishchi boʻlsa faqat oʻzi)
  const workers = useMemo(() => {
    let list = db.workers.filter((w) => w.faol);
    if (pureIshchi && me) list = list.filter((w) => w.id === me.id);
    if (s) list = list.filter((w) => fio(w).toLowerCase().includes(s) || w.tabel.includes(s) ||
      (positionById(db, w.positionId)?.nomi ?? "").toLowerCase().includes(s));
    return list.slice(0, 200);
  }, [db, s, pureIshchi, me]);

  if (!me) return null;

  return (
    <>
      <PageHead
        title="Hujjatlar"
        sub="Barcha hujjatlar shu yerda — koʻrish, ochish va chop etish (PDF sifatida saqlash) mumkin."
      />

      {/* Boʻsh blankalar / shakllar */}
      {(showMb6 || showKitob) && (
        <Panel className="mb-5">
          <p className="mb-3 text-[11px] uppercase tracking-wider text-slate-500">Hujjat shakllari (boʻsh blankalar)</p>
          <div className="flex flex-wrap gap-3">
            {showMb6 && (
              <a href="/hujjatlar/mb6.html" target="_blank" rel="noopener noreferrer">
                <Btn variant="primary">MB-6 — shaxsiy kartochka ↗</Btn>
              </a>
            )}
            {showKitob && (
              <a href="/hujjatlar/kitobcha.html" target="_blank" rel="noopener noreferrer">
                <Btn variant="gold">Jamoatchilik nazorati kitobchasi ↗</Btn>
              </a>
            )}
          </div>
          <p className="mt-3 text-[11.5px] text-slate-500">
            Har shakl yangi oynada ochiladi — ichida <b>«Chop etish / Print»</b> tugmasi bor (chop qilish yoki PDF sifatida saqlash).
          </p>
        </Panel>
      )}

      {/* Qidiruv + koʻrinish tablari */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-[260px] flex-1">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tabel raqami, F.I.Sh. yoki hujjat raqami boʻyicha qidiring" />
        </div>
        {showTreb && (
          <button
            onClick={() => setView("treb")}
            className={`rounded-full px-4 py-2 text-[12.5px] font-medium transition ${
              view === "treb" ? "bg-sky-100 text-sky-700 ring-1 ring-sky-500" : "border border-slate-200 text-slate-500 hover:text-slate-900"
            }`}
          >
            Требованиеlar ({reqs.length})
          </button>
        )}
        {showMb6 && (
          <button
            onClick={() => setView("mb6")}
            className={`rounded-full px-4 py-2 text-[12.5px] font-medium transition ${
              view === "mb6" ? "bg-sky-100 text-sky-700 ring-1 ring-sky-500" : "border border-slate-200 text-slate-500 hover:text-slate-900"
            }`}
          >
            MB-6 kartochkalar ({workers.length})
          </button>
        )}
      </div>

      {/* Требованиеlar roʻyxati */}
      {showTreb && view === "treb" && (
        <Panel pad={false}>
          {reqs.length === 0 ? (
            <div className="p-5"><Empty text="Ariza topilmadi" /></div>
          ) : (
            <Table head={["Raqam", "Ishchi", "Tabel", "Buyumlar", "Summa", "Holat", "Sana", ""]} min={1000}>
              {reqs.map((r) => {
                const w = db.workers.find((x) => x.id === r.workerId);
                const sum = r.lines.reduce((a, l) => a + l.narx * l.soni, 0);
                return (
                  <Tr key={r.id}>
                    <Td className="font-semibold tabular-nums text-slate-900">{r.raqam}</Td>
                    <Td>{w ? fio(w) : "—"}</Td>
                    <Td className="tabular-nums">{w?.tabel ?? "—"}</Td>
                    <Td>{r.lines.map((l) => itemById(db, l.itemId)?.nomi).join(", ")}</Td>
                    <Td className="tabular-nums">{money(sum)}</Td>
                    <Td><Badge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge></Td>
                    <Td className="tabular-nums">{fmt(r.yaratilgan)}</Td>
                    <Td><Link href={`/arizalar/${r.id}`}><Btn size="sm" variant="primary">Ochish / Chop etish</Btn></Link></Td>
                  </Tr>
                );
              })}
            </Table>
          )}
        </Panel>
      )}

      {/* MB-6 kartochkalar roʻyxati */}
      {showMb6 && view === "mb6" && (
        <Panel pad={false}>
          {workers.length === 0 ? (
            <div className="p-5"><Empty text="Ishchi topilmadi" /></div>
          ) : (
            <Table head={["", "Tabel", "F.I.Sh.", "Lavozim", "Berilgan", "Ochilgan", ""]} min={940}>
              {workers.map((w) => {
                const card = db.cards.find((c) => c.workerId === w.id);
                return (
                  <Tr key={w.id}>
                    <Td>
                      <WorkerFace url={w.faceUrl} familiya={w.familiya} size={36} />
                    </Td>
                    <Td className="tabular-nums text-slate-900">{w.tabel}</Td>
                    <Td>{fio(w)}</Td>
                    <Td>{positionById(db, w.positionId)?.nomi}</Td>
                    <Td className="tabular-nums">{card?.berilgan.length ?? 0} ta</Td>
                    <Td className="tabular-nums">{card ? fmt(card.ochilgan) : "—"}</Td>
                    <Td><Link href={`/kartochka/${w.id}`}><Btn size="sm" variant="primary">Ochish / Chop etish</Btn></Link></Td>
                  </Tr>
                );
              })}
            </Table>
          )}
        </Panel>
      )}

      {!showTreb && !showMb6 && (
        <Empty text="Sizning rolingiz uchun hujjat turlari yashirilgan (admin sozlamasi)" />
      )}
    </>
  );
}
