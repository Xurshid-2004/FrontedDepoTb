"use client";

/* ------------------------------------------------------------------
   KitobKarta — yoʻriqnoma kitobining muqovasi (BookCard) + ichida
   faqat-oʻqish jadval. Hujjatlar va Arxiv boʻlimlari ishlatadi.
     • Muqova yuzida: kolonna nomi + instruktor F.I.Sh. (Yo D-26B),
       yoki "TNU-19 jurnali" (Yo D-26A — depo navbatchisi).
     • Ochilganda kitob qatorlari lazy yuklanadi (BookCard children
       faqat ochilganda mount boʻladi) va rasmiy shaklda koʻrsatiladi.
------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import BookCard from "./BookCard";
import { api } from "@/lib/api";
import type { YoriqnomaYozuv } from "@/lib/types";

export type KitobInfo = {
  id: string;
  turi: string; // "tnu19" | "instruktor"
  raqam: number;
  kolonnaNomi: string;
  kolonnaTuri?: string;
  instruktorFio?: string;
  yozuvSoni: number;
  joriyBet: number;
  sigim: number;
  arxiv: boolean;
};

const TUR_LABEL: Record<string, string> = {
  joriy: "JORIY", birlamchi: "Birlamchi", navbatdan: "Navbatdan tashqari", davriy: "Davriy",
};

const TH = "border border-slate-400 px-2 py-1.5 text-[10px] font-semibold uppercase leading-tight text-slate-700 align-middle text-center";
const TDC = "border border-slate-400 px-2 py-2 text-[12px] align-top text-slate-800";

/** Kichik faqat-koʻrish QR — /verify/<id> ga olib boradi. */
function QrKichik({ sigId, size = 46 }: { sigId?: string; size?: number }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!sigId) { setUrl(""); return; }
    const href = `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${sigId}`;
    QRCode.toDataURL(href, { margin: 0, width: size, errorCorrectionLevel: "M" }).then(setUrl).catch(() => {});
  }, [sigId, size]);
  if (!sigId) return <span className="text-slate-300">—</span>;
  return (
    <a href={`/verify/${sigId}`} target="_blank" rel="noreferrer" title="QR — imzoni tekshirish">
      {url
        ? <img src={url} width={size} height={size} alt="QR" className="inline-block rounded-[3px] bg-white p-[2px] ring-1 ring-slate-300" />
        : <span className="text-slate-400">…</span>}
    </a>
  );
}

/* -------- TNU-19 (Yo D-26A) faqat-koʻrish jadvali -------- */
function TnuJadval({ rows }: { rows: YoriqnomaYozuv[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-400">
      <table className="w-full border-collapse" style={{ tableLayout: "fixed", minWidth: 1000 }}>
        <thead>
          <tr className="bg-slate-100">
            <th className={TH}>Sana</th>
            <th className={TH}>Oluvchining F.I.SH.</th>
            <th className={TH}>Kasbi, lavozimi</th>
            <th className={TH}>Turi</th>
            <th className={TH}>Qisqacha mazmuni</th>
            <th className={TH}>Beruvchining xulosasi</th>
            <th className={TH}>Beruvchining lavozimi, F.I.SH.</th>
            <th className={TH}>Beruvchining imzosi</th>
            <th className={TH}>Oluvchining imzosi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((y) => (
            <tr key={y.id}>
              <td className={`${TDC} tabular-nums`}>{y.sana}</td>
              <td className={`${TDC} break-words`}>{y.fio}</td>
              <td className={`${TDC} break-words`}>{y.lavozimQisqa}</td>
              <td className={`${TDC} text-center`}>{TUR_LABEL[y.yoriqTuri] ?? y.yoriqTuri}</td>
              <td className={`${TDC} whitespace-pre-line break-words`}>{y.mazmun}</td>
              <td className={`${TDC} whitespace-pre-line break-words`}>{y.xulosa}</td>
              <td className={`${TDC} break-words`}>{y.beruvchiLavozim}</td>
              <td className={`${TDC} text-center align-middle`}><QrKichik sigId={y.beruvchiImzoId} /></td>
              <td className={`${TDC} text-center align-middle`}><QrKichik sigId={y.oluvchiImzoId} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------- Instruktor (Yo D-26B) — har ishchiga alohida varaq -------- */
function InstruktorJadval({ rows }: { rows: YoriqnomaYozuv[] }) {
  const ishchilar = [...new Map(rows.map((y) => [y.ishchiId, true])).keys()];
  return (
    <div className="space-y-6">
      {ishchilar.map((iid) => {
        const g = rows.filter((y) => y.ishchiId === iid);
        const bosh = g[0];
        return (
          <div key={iid} className="rounded-lg border border-slate-400">
            <div className="border-b border-slate-400 bg-slate-50 px-3 py-2">
              <p className="text-[13px]">
                <span className="text-slate-500">Familiya, ismi, otasining ismi: </span>
                <span className="font-semibold text-slate-900">{bosh.fio}</span>
              </p>
              <p className="text-[13px]">
                <span className="text-slate-500">Kasbi (lavozimi): </span>
                <span className="font-semibold text-slate-900">{bosh.lavozimQisqa}</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ tableLayout: "fixed", minWidth: 760 }}>
                <colgroup>
                  <col style={{ width: "82px" }} />
                  <col style={{ width: "120px" }} />
                  <col />
                  <col style={{ width: "84px" }} />
                  <col style={{ width: "84px" }} />
                  <col style={{ width: "150px" }} />
                </colgroup>
                <thead>
                  <tr className="bg-slate-100">
                    <th className={TH} rowSpan={2}>Oʻtkazish sanasi</th>
                    <th className={TH} rowSpan={2}>Turi, sababi</th>
                    <th className={TH} rowSpan={2}>Oʻtkazish mavzusi (masalalar yoki yoʻriqnoma №)</th>
                    <th className={TH} colSpan={2}>Imzolar</th>
                    <th className={TH} rowSpan={2}>Oʻtkazuvchining F.I.Sh.</th>
                  </tr>
                  <tr className="bg-slate-100">
                    <th className={TH}>oʻtuvchi</th>
                    <th className={TH}>oʻtkazuvchi</th>
                  </tr>
                </thead>
                <tbody>
                  {g.map((y) => (
                    <tr key={y.id}>
                      <td className={`${TDC} tabular-nums`}>{y.sana}</td>
                      <td className={`${TDC} text-center`}>{TUR_LABEL[y.yoriqTuri] ?? y.yoriqTuri}</td>
                      <td className={`${TDC} whitespace-pre-line break-words`}>{y.mazmun}</td>
                      <td className={`${TDC} text-center align-middle`}><QrKichik sigId={y.oluvchiImzoId} /></td>
                      <td className={`${TDC} text-center align-middle`}><QrKichik sigId={y.beruvchiImzoId} /></td>
                      <td className={`${TDC} break-words`}>{y.beruvchiFio || y.beruvchiLavozim}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Ochilganda kitob qatorlarini yuklaydigan ichki qism. */
function KitobIchi({ info }: { info: KitobInfo }) {
  const [rows, setRows] = useState<YoriqnomaYozuv[] | null>(null);
  useEffect(() => {
    let tirik = true;
    api.yoriqnomaKitob(info.turi, info.id)
      .then((r) => { if (tirik) setRows(r.yozuvlar || []); })
      .catch(() => { if (tirik) setRows([]); });
    return () => { tirik = false; };
  }, [info.id, info.turi]);

  if (rows === null) return <p className="text-[13px] text-slate-500">Yuklanmoqda…</p>;
  if (rows.length === 0) return <p className="text-[13px] text-slate-500">Bu kitobda hali yozuv yoʻq.</p>;
  return info.turi === "tnu19" ? <TnuJadval rows={rows} /> : <InstruktorJadval rows={rows} />;
}

export default function KitobKarta({ info }: { info: KitobInfo }) {
  const isTnu = info.turi === "tnu19";
  const label = isTnu ? "TNU-19 · Yo D-26A" : "Yo D-26B";
  const title = isTnu ? `TNU-19 jurnali №${info.raqam}` : `${info.kolonnaNomi} №${info.raqam}`;
  const subtitle = isTnu
    ? `Depo navbatchisi jurnali · ${info.yozuvSoni} yozuv${info.arxiv ? " · ARXIV" : ""}`
    : `Instruktor: ${info.instruktorFio || "—"}${info.kolonnaTuri ? " · " + info.kolonnaTuri : ""} · ${info.yozuvSoni} yozuv${info.arxiv ? " · ARXIV" : ""}`;
  return (
    <BookCard title={title} subtitle={subtitle} label={label} keng accent={isTnu ? "#38bdf8" : "#f59e0b"}>
      <KitobIchi info={info} />
    </BookCard>
  );
}
