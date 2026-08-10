"use client";

import { use } from "react";
import { useStore } from "@/lib/store";
import { fmt, fio, itemById, normsFor, positionById } from "@/lib/logic";
import { Badge, Btn, Empty, PageHead, Panel, QrSig, Table, Td, Tr } from "@/components/ui";

export default function Kartochka({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, canFeature } = useStore();
  const w = db.workers.find((x) => x.id === id);
  const card = db.cards.find((c) => c.workerId === id);

  if (!w || !card) return <Empty text="Kartochka topilmadi" />;

  const pos = positionById(db, w.positionId);
  const norms = normsFor(db, w.positionId);
  const tb = db.workers.find((x) => x.roles.includes("tb_xodim"));
  const bx = db.workers.find((x) => x.roles.includes("bosh_xisobchi"));
  const sx = db.workers.find((x) => x.roles.includes("sex_boshligi"));

  return (
    <>
      <PageHead
        title={`Shaxsiy kartochka — ${fio(w)}`}
        sub={`Shakl MB-6 · tabel ${w.tabel} · ${pos?.nomi}`}
        right={
          <div className="flex flex-wrap gap-2">
            <Btn size="sm" variant="primary" onClick={() => window.print()}>Chop etish / PDF</Btn>
            {canFeature("doc.mb6") && (
              <a href="/hujjatlar/mb6.html" target="_blank" rel="noopener noreferrer">
                <Btn size="sm">Boʻsh blanka ↗</Btn>
              </a>
            )}
          </div>
        }
      />

      {canFeature("doc.mb6") && (
        <Panel className="mb-5" pad={false}>
          <div className="flex items-center justify-between px-5 py-3">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">MB-6 — elektron shakl (bosma)</p>
            <a href="/hujjatlar/mb6.html" target="_blank" rel="noopener noreferrer" className="text-[12px] text-sky-600 hover:underline">
              Yangi oynada ochish ↗
            </a>
          </div>
          <iframe
            src="/hujjatlar/mb6.html"
            title="MB-6 elektron shakl"
            className="h-[900px] w-full rounded-b-2xl border-0"
          />
        </Panel>
      )}

      <div className="print-area">
      <Panel className="mb-5">
        <div className="mb-5 border-b border-slate-200 pb-4 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Shakl MB-6</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Maxsus kiyim, poyabzal va himoya vositalarini hisobga olish shaxsiy kartochkasi
          </h2>
        </div>

        <p className="mb-3 text-[11px] uppercase tracking-wider text-slate-500">Old tomon</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <F n="01" l="Korxona" v={db.depo.nomi} auto />
          <F n="02" l="Familiya" v={w.familiya} />
          <F n="03" l="Ism" v={w.ism} />
          <F n="04" l="Otasining ismi" v={w.otasi} />
          <F n="06" l="Sex / boʻlim" v={`${w.sex} · ${w.ishJoyi}`} />
          <F n="07" l="Kasb-lavozimi" v={pos?.nomi ?? "—"} />
          <F n="08" l="Ishga kirgan sana" v={fmt(w.kirganSana)} />
          <F n="09" l="—" v="boʻsh qoladi" muted />
          <F n="10" l="Jinsi / boʻyi / oʻlchamlar" v={`${w.jinsi} · ${w.boyi} sm · kiyim ${w.kiyimOlchami} · poyabzal ${w.poyabzalOlchami} · bosh ${w.boshKiyimOlchami}`} />
          <F n="12" l="—" v="boʻsh qoladi" muted />
        </div>

        <p className="mb-3 mt-6 text-[11px] uppercase tracking-wider text-slate-500">
          11 · 13 · 14 · 15 — lavozim normasi
        </p>
        <Table head={["11 · Maxsus kiyim nomi", "20 · Kod", "13 · Oʻlchov", "14 · Miqdori", "15 · Kiyish muddati", "Turi"]} min={800}>
          {norms.map((n) => {
            const it = itemById(db, n.itemId);
            return (
              <Tr key={n.id}>
                <Td className="text-slate-900">{it?.nomi}</Td>
                <Td className="tabular-nums">{it?.kod}</Td>
                <Td>{it?.unit}</Td>
                <Td className="tabular-nums">1</Td>
                <Td className="tabular-nums">{n.muddatOy === null ? "Ish. Chiqqun" : `${n.muddatOy} oy`}</Td>
                <Td>{n.qishki ? <Badge color="#38bdf8">qishki</Badge> : <Badge color="#64748b">asosiy</Badge>}</Td>
              </Tr>
            );
          })}
        </Table>

        <p className="mb-3 mt-6 text-[11px] uppercase tracking-wider text-slate-500">16 · 17 · 18 — QR imzolar</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <QrSig sigId={`c16-${card.id}`} hash={card.id + "16"} fio={tb ? fio(tb) : "—"} lavozim="16 · TB xodimi (Mehnat muhofazasi)" sana={fmt(card.ochilgan)} size={60} />
          <QrSig sigId={`c17-${card.id}`} hash={card.id + "17"} fio={sx ? fio(sx) : "—"} lavozim="17 · Sex boshligʻi" sana={fmt(card.ochilgan)} size={60} />
          <QrSig sigId={`c18-${card.id}`} hash={card.id + "18"} fio={bx ? fio(bx) : "—"} lavozim="18 · Bosh hisobchi" sana={fmt(card.ochilgan)} size={60} />
        </div>
      </Panel>

      <Panel>
        <p className="mb-3 text-[11px] uppercase tracking-wider text-slate-500">Orqa tomon — «Berilgan»</p>
        {card.berilgan.length === 0 ? (
          <Empty text="Hali buyum berilmagan" />
        ) : (
          <Table head={["19 · Nomi", "20 · Kod", "21 · Sana", "22 · Soni", "23 · Yaroqlilik", "24 · —", "25 · Imzo"]} min={880}>
            {[...card.berilgan].sort((a, b) => (a.sana < b.sana ? 1 : -1)).map((b) => {
              const it = itemById(db, b.itemId);
              return (
                <Tr key={b.id}>
                  <Td className="text-slate-900">{it?.nomi}</Td>
                  <Td className="tabular-nums">{it?.kod}</Td>
                  <Td className="tabular-nums">{fmt(b.sana)}</Td>
                  <Td className="tabular-nums">{b.soni}</Td>
                  <Td className="tabular-nums">{b.yaroqlilik}%</Td>
                  <Td className="text-slate-400 italic">boʻsh</Td>
                  <Td>
                    <QrSig sigId={b.imzoId ?? b.id} hash={b.id} fio={fio(w)} lavozim="25 · Ishchi" sana={fmt(b.sana)} size={48} compact />
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}

        <p className="mb-3 mt-6 text-[11px] uppercase tracking-wider text-slate-500">Orqa tomon — «Qaytarilgan»</p>
        {card.qaytarilgan.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-[12.5px] text-slate-500">
            Bu boʻlim faqat buyum qaytarilganda toʻldiriladi
          </div>
        ) : (
          <Table head={["26 · Sana", "27 · Soni", "28 · Yaroqlilik", "29 · Topshiruvchi", "30 · Qabul qiluvchi"]} min={720}>
            {card.qaytarilgan.map((q) => (
              <Tr key={q.id}>
                <Td className="tabular-nums">{fmt(q.sana)}</Td>
                <Td className="tabular-nums">{q.soni}</Td>
                <Td className="tabular-nums">{q.yaroqlilik}%</Td>
                <Td>QR</Td>
                <Td>QR</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Panel>
      </div>
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
