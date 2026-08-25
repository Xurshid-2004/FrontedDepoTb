"use client";

/* ------------------------------------------------------------------
   TB kitobchalari — yoʻriqnoma jurnallari.
     • TNU-19 (Yo D-26A) — depo navbatchisi. Smena + skan + tasdiqlash.
     • Yo D-26B — instruktor. Oʻz kolonnasi ishchisi uchun tur+mazmun tanlab
       skan qiladi; boshqa kolonna ishchisi bloklanadi.
   Har ikki kitob yagona imzo tizimida; har imzo /verify orqali (QR).
   Jadval koʻrinishi rasmiy TNU-19 shakliga moslangan: toʻr chiziqlar,
   raqamli ustunlar, imzolar — kichik QR kodlar (skan → shaxs maʼlumoti).
------------------------------------------------------------------ */

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useIdScanner } from "@/lib/useIdScanner";
import type { YoriqnomaYozuv } from "@/lib/types";
import {
  Badge, Btn, Empty, Field, PageHead, Panel, Select, Textarea, useToast,
} from "@/components/ui";

const TUR_LABEL: Record<string, string> = {
  joriy: "JORIY", birlamchi: "Birlamchi", navbatdan: "Navbatdan tashqari", davriy: "Davriy",
};

type Mode = "tnu19" | "instruktor";

/** Imzo QR kodi — faqat kod. Skan qilinganda /verify/<id> ochilib,
 *  imzolagan shaxsning F.I.Sh., lavozimi va vaqti chiqadi (backend). */
function QrImzo({ sigId, size = 58 }: { sigId?: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!sigId || !ref.current) return;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/verify/${sigId}`
        : `/verify/${sigId}`;
    QRCode.toCanvas(ref.current, url, {
      width: size, margin: 0, errorCorrectionLevel: "M",
      color: { dark: "#0d1b2a", light: "#ffffff" },
    }).catch(() => {});
  }, [sigId, size]);

  if (!sigId) return <span className="text-slate-300">—</span>;
  return (
    <a
      href={`/verify/${sigId}`}
      target="_blank"
      rel="noreferrer"
      title="QR — imzoni tekshirish"
      className="inline-block"
    >
      <canvas
        ref={ref}
        width={size}
        height={size}
        className="rounded-[3px] bg-white p-[2px] ring-1 ring-slate-300"
      />
    </a>
  );
}

/** Beruvchi imzosi katagi: imzo boʻlsa QR, boʻlmasa «Tasdiqlayman». */
function BeruvchiImzo({ y, yozaBiladi, onOk, tasdiqla, tShow }: any) {
  if (y.beruvchiImzoId) return <QrImzo sigId={y.beruvchiImzoId} />;
  if (yozaBiladi) {
    return (
      <Btn
        size="sm"
        variant="primary"
        onClick={async () => { await tasdiqla(y.id); tShow("Tasdiqlandi"); onOk(); }}
      >
        Tasdiqlayman
      </Btn>
    );
  }
  return <Badge color="#f59e0b">Kutilmoqda</Badge>;
}

/* Jadval katak uslublari — rasmiy shakldagidek toʻr chiziqlar */
const TH = "border border-slate-400 px-2 py-1.5 text-[10px] font-semibold uppercase leading-tight text-slate-700 align-middle text-center";
const TDC = "border border-slate-400 px-2 py-2 text-[12px] align-top text-slate-800";

export default function TbKitobchalariPage() {
  const {
    db, roles, can, smenaBoshla, smenaYop, yoriqnomaSkan, yoriqnomaTasdiqla,
  } = useStore();
  const t = useToast();

  const yq = db.yoriqnoma;
  const hasNavb = roles.includes("depo_navbatchisi") || roles.includes("admin");
  const hasInstr = !!yq?.instruktorKolonna;
  const isInstrRole = roles.includes("yoriqchi");
  // Mashinist yoʻriqchisi doim Yo D-26B (instruktor) rejimida ochiladi —
  // kolonna biriktirilmagan boʻlsa ham TNU-19ga tushib qolmaydi.
  const [mode, setMode] = useState<Mode>((hasInstr || isInstrRole) && !hasNavb ? "instruktor" : "tnu19");

  const yozaBiladi = can("yoriqnoma.write");
  const [rows, setRows] = useState<YoriqnomaYozuv[]>([]);
  const [ish, setIsh] = useState(false);
  const [kitoblar, setKitoblar] = useState<Awaited<ReturnType<typeof api.yoriqnomaKitoblar>>["kitoblar"]>([]);
  const [selKitob, setSelKitob] = useState<string>(""); // "" = aktiv kitob

  const yukla = useCallback(async (m: Mode, kitobId?: string) => {
    try {
      const r = await api.yoriqnomaKitob(m, kitobId || undefined);
      setRows(r.yozuvlar || []);
    } catch { /* jim */ }
  }, []);

  useEffect(() => { yukla(mode, selKitob); }, [yukla, mode, selKitob, yq?.aktivKitob?.yozuvSoni, yq?.aktivInstruktorKitob?.yozuvSoni]);

  useEffect(() => {
    api.yoriqnomaKitoblar().then((r) => setKitoblar(r.kitoblar || [])).catch(() => {});
  }, [yq?.aktivKitob?.yozuvSoni, yq?.aktivInstruktorKitob?.yozuvSoni]);

  // Joriy rejimga tegishli kitoblar (TNU-19 yoki instruktor)
  const rejimKitoblar = kitoblar.filter((k) => (mode === "tnu19" ? k.turi === "tnu19" : k.turi === "instruktor"));

  /* Chop etish — rasmiy TNU-19 shakli: toʻr, raqamli ustunlar, QR imzolar. */
  async function chopEt() {
    const w = window.open("", "_blank", "width=1200,height=850");
    if (!w) return;

    const origin = window.location.origin;
    const qr = async (id?: string) =>
      id ? await QRCode.toDataURL(`${origin}/verify/${id}`, { margin: 0, width: 120, errorCorrectionLevel: "M" }).catch(() => "") : "";
    const esc = (s: unknown) => String(s ?? "").replace(/</g, "&lt;");
    const nl = (s: unknown) => esc(s).replace(/\n/g, "<br>");
    const imgOrDash = (data: string) =>
      data ? `<img src="${data}" style="width:52px;height:52px" alt="QR"/>` : "—";

    const isTnu = mode === "tnu19";

    const styleCommon = `
        body{font-family:Arial,sans-serif;font-size:11px;padding:14px;color:#111}
        h2{font-size:14px;margin:0 0 10px;text-align:center}
        table{width:100%;border-collapse:collapse;table-layout:fixed}
        th,td{border:1px solid #333;padding:4px 5px;text-align:left;vertical-align:top;word-break:break-word;overflow-wrap:anywhere}
        th{background:#eee;font-size:9.5px;text-transform:uppercase;text-align:center;line-height:1.2}
        td.mazmun{white-space:pre-line}
        td.imzo{text-align:center;vertical-align:middle}
        td.raqam{text-align:center;font-weight:bold;background:#f6f6f6}
        .varaq{page-break-after:always}
        .varaq:last-child{page-break-after:auto}
        .varaq-boshi{font-size:12px;margin:0 0 4px}
        .footer{text-align:right;font-size:10px;margin-top:4px}
        @media print{@page{size:landscape;margin:8mm}}`;

    let body = "";

    if (isTnu) {
      const bosh = ["Sana", "Yoʻl-yoʻriq oluvchining F.I.SH.", "Kasbi, lavozimi", "Yoʻl-yoʻriqning turi",
        "Yoʻl-yoʻriqning qisqacha mazmuni", "Yoʻl-yoʻriq beruvchining xulosasi",
        "Yoʻl-yoʻriq beruvchining lavozimi, F.I.SH.", "Yoʻl-yoʻriq beruvchining imzosi",
        "Yoʻl-yoʻriq oluvchining imzosi"];
      const qatorlar = await Promise.all(rows.map(async (y) => {
        const bImzo = imgOrDash(await qr(y.beruvchiImzoId));
        const oImzo = imgOrDash(await qr(y.oluvchiImzoId));
        const cells = [esc(y.sana), esc(y.fio), esc(y.lavozimQisqa), esc(TUR_LABEL[y.yoriqTuri] ?? y.yoriqTuri),
          nl(y.mazmun), nl(y.xulosa), esc(y.beruvchiLavozim), bImzo, oImzo];
        return `<tr>${cells.map((c, i) => `<td class="${i === 4 || i === 5 ? "mazmun" : (i >= 7 ? "imzo" : "")}">${c}</td>`).join("")}</tr>`;
      }));
      const raqamlar = bosh.map((_, i) => `<td class="raqam">${i + 1}</td>`).join("");
      body = `<h2>TNU-19 shakli — Yoʻl-yoʻriq koʻrsatishni roʻyxatga olish jurnali</h2>
        <table><thead><tr>${bosh.map((h) => `<th>${h}</th>`).join("")}</tr><tr>${raqamlar}</tr></thead>
        <tbody>${qatorlar.join("")}</tbody></table>`;
    } else {
      // Instruktor (Yo D-26) — har ishchiga alohida varaq: boshda F.I.Sh + Kasbi,
      // jadval asl shaklga mos (Imzolar guruhlangan: oʻtuvchi | oʻtkazuvchi).
      const guruh = new Map();
      rows.forEach((y) => {
        if (!guruh.has(y.ishchiId)) guruh.set(y.ishchiId, { fio: y.fio, lavozim: y.lavozimQisqa, list: [] });
        guruh.get(y.ishchiId).list.push(y);
      });
      const varaqlar = await Promise.all([...guruh.values()].map(async (g) => {
        const qatorlar = await Promise.all(g.list.map(async (y) => {
          const oImzo = imgOrDash(await qr(y.oluvchiImzoId));
          const bImzo = imgOrDash(await qr(y.beruvchiImzoId));
          return `<tr>
            <td>${esc(y.sana)}</td>
            <td>${esc(TUR_LABEL[y.yoriqTuri] ?? y.yoriqTuri)}</td>
            <td class="mazmun">${nl(y.mazmun)}</td>
            <td class="imzo">${oImzo}</td>
            <td class="imzo">${bImzo}</td>
            <td>${esc(y.beruvchiFio || y.beruvchiLavozim)}</td>
          </tr>`;
        }));
        return `<div class="varaq">
          <p class="varaq-boshi">Familiya, ismi, otasining ismi: <b>${esc(g.fio)}</b></p>
          <p class="varaq-boshi">Kasbi (lavozimi): <b>${esc(g.lavozim)}</b></p>
          <table>
            <colgroup><col style="width:82px"><col style="width:120px"><col><col style="width:70px"><col style="width:70px"><col style="width:150px"></colgroup>
            <thead>
              <tr>
                <th rowspan="2">Yoʻl-yoʻriqdan oʻtkazish sanasi</th>
                <th rowspan="2">Yoʻl-yoʻriqning turi, sababi</th>
                <th rowspan="2">Yoʻl-yoʻriqdan oʻtkazish mavzusi (masalalar yoki yoʻriqnomaning raqami)</th>
                <th colspan="2">Imzolar</th>
                <th rowspan="2">Yoʻl-yoʻriqdan oʻtkazuvchining familiyasi, ismi va otasining ismi</th>
              </tr>
              <tr><th>yoʻl-yoʻriqdan oʻtuvchi</th><th>yoʻl-yoʻriqdan oʻtkazuvchi</th></tr>
            </thead>
            <tbody>${qatorlar.join("")}</tbody>
          </table>
          <p class="footer">"Yo D"-26</p>
        </div>`;
      }));
      body = `<h2>Yo D-26 — Instruktor yoʻriqnoma jurnali</h2>${varaqlar.join("")}`;
    }

    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${isTnu ? "TNU-19 shakli" : "Yo D-26 — Instruktor jurnali"}</title>
      <style>${styleCommon}</style></head><body>
      ${body}
      <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
      </body></html>`);
    w.document.close();
  }

  if (!can("yoriqnoma.read")) {
    return <div className="p-6"><Empty text="Bu boʻlim uchun ruxsatingiz yoʻq" /></div>;
  }

  return (
    <div className="mx-auto max-w-[1200px] p-4 md:p-6">
      <PageHead
        title="TB kitobchalari"
        sub="Yoʻriqnoma jurnallari — ID karta skani orqali toʻldiriladi, imzolar QR bilan tasdiqlanadi"
      />

      {/* Rejim tanlash (ikkala rol boʻlsa) */}
      {hasNavb && hasInstr && (
        <div className="mb-4 flex gap-2">
          <Btn size="sm" variant={mode === "tnu19" ? "primary" : "ghost"} onClick={() => setMode("tnu19")}>
            TNU-19 (navbatchi)
          </Btn>
          <Btn size="sm" variant={mode === "instruktor" ? "primary" : "ghost"} onClick={() => setMode("instruktor")}>
            Yo D-26 (instruktor)
          </Btn>
        </div>
      )}

      {mode === "tnu19" ? (
        <TnuBolim {...{ db, yozaBiladi, ish, setIsh, t, smenaBoshla, smenaYop, yoriqnomaSkan, refresh: () => yukla("tnu19") }} />
      ) : (
        <InstruktorBolim {...{ db, yozaBiladi, ish, setIsh, t, yoriqnomaSkan, refresh: () => yukla("instruktor") }} />
      )}

      {/* Jadval — rasmiy TNU-19 shakli */}
      <Panel>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[14px] font-semibold">
            {mode === "tnu19" ? "TNU-19 shakli" : "Yo D-26 shakli"} — jurnal qatorlari
          </h3>
          <div className="flex items-center gap-2">
            <Select value={selKitob} onChange={(e) => setSelKitob(e.target.value)} className="min-w-[220px]">
              <option value="">Aktiv kitob</option>
              {rejimKitoblar.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.kolonnaNomi} №{k.raqam}{k.arxiv ? " (arxiv)" : ""} · {k.yozuvSoni}
                </option>
              ))}
            </Select>
            <Btn size="sm" onClick={chopEt} disabled={rows.length === 0}>Chop etish (PDF)</Btn>
          </div>
        </div>

        {rows.length === 0 ? (
          <Empty text="Hali qator yoʻq" />
        ) : mode === "tnu19" ? (
          <div className="overflow-x-auto rounded-lg border border-slate-400">
            <table className="w-full border-collapse" style={{ tableLayout: "fixed", minWidth: 1000 }}>
              <colgroup>
                <col style={{ width: "66px" }} />
                <col style={{ width: "132px" }} />
                <col style={{ width: "92px" }} />
                <col style={{ width: "78px" }} />
                <col />
                <col style={{ width: "120px" }} />
                <col style={{ width: "130px" }} />
                <col style={{ width: "84px" }} />
                <col style={{ width: "84px" }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-100">
                  <th className={TH}>Sana</th>
                  <th className={TH}>Yoʻl-yoʻriq oluvchining F.I.SH.</th>
                  <th className={TH}>Kasbi, lavozimi</th>
                  <th className={TH}>Yoʻl-yoʻriqning turi</th>
                  <th className={TH}>Yoʻl-yoʻriqning qisqacha mazmuni</th>
                  <th className={TH}>Yoʻl-yoʻriq beruvchining xulosasi</th>
                  <th className={TH}>Yoʻl-yoʻriq beruvchining lavozimi, F.I.SH.</th>
                  <th className={TH}>Yoʻl-yoʻriq beruvchining imzosi</th>
                  <th className={TH}>Yoʻl-yoʻriq oluvchining imzosi</th>
                </tr>
                <tr className="bg-slate-50 text-[10px] font-semibold text-slate-500">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <th key={n} className="border border-slate-400 py-0.5 text-center">{n}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((y) => (
                  <tr key={y.id} className="hover:bg-slate-50/60">
                    <td className={`${TDC} tabular-nums`}>{y.sana}</td>
                    <td className={`${TDC} break-words`}>{y.fio}</td>
                    <td className={`${TDC} break-words`}>{y.lavozimQisqa}</td>
                    <td className={`${TDC} text-center`}>{TUR_LABEL[y.yoriqTuri] ?? y.yoriqTuri}</td>
                    <td className={`${TDC} whitespace-pre-line break-words`}>{y.mazmun}</td>
                    <td className={`${TDC} whitespace-pre-line break-words`}>{y.xulosa}</td>
                    <td className={`${TDC} break-words`}>{y.beruvchiLavozim}</td>
                    <td className={`${TDC} text-center align-middle`}>
                      <BeruvchiImzo y={y} yozaBiladi={yozaBiladi} onOk={() => yukla("tnu19")} tasdiqla={yoriqnomaTasdiqla} tShow={t.show} />
                    </td>
                    <td className={`${TDC} text-center align-middle`}>
                      <QrImzo sigId={y.oluvchiImzoId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Instruktor (Yo D-26) — har ishchiga alohida varaq (asl shakl):
             varaq boshida F.I.Sh + Kasbi, jadval «Imzolar» guruhlangan. */
          <div className="space-y-6">
            {[...new Map(rows.map((y) => [y.ishchiId, true])).keys()].map((iid) => {
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
                          <th className={TH} rowSpan={2}>Yoʻl-yoʻriqdan oʻtkazish sanasi</th>
                          <th className={TH} rowSpan={2}>Yoʻl-yoʻriqning turi, sababi</th>
                          <th className={TH} rowSpan={2}>Yoʻl-yoʻriqdan oʻtkazish mavzusi (masalalar yoki yoʻriqnoma №)</th>
                          <th className={TH} colSpan={2}>Imzolar</th>
                          <th className={TH} rowSpan={2}>Yoʻl-yoʻriqdan oʻtkazuvchining F.I.Sh.</th>
                        </tr>
                        <tr className="bg-slate-100">
                          <th className={TH}>yoʻl-yoʻriqdan oʻtuvchi</th>
                          <th className={TH}>yoʻl-yoʻriqdan oʻtkazuvchi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.map((y) => (
                          <tr key={y.id} className="hover:bg-slate-50/60">
                            <td className={`${TDC} tabular-nums`}>{y.sana}</td>
                            <td className={`${TDC} text-center`}>{TUR_LABEL[y.yoriqTuri] ?? y.yoriqTuri}</td>
                            <td className={`${TDC} whitespace-pre-line break-words`}>{y.mazmun}</td>
                            <td className={`${TDC} text-center align-middle`}>
                              <QrImzo sigId={y.oluvchiImzoId} />
                            </td>
                            <td className={`${TDC} text-center align-middle`}>
                              <BeruvchiImzo y={y} yozaBiladi={yozaBiladi} onOk={() => yukla("instruktor")} tasdiqla={yoriqnomaTasdiqla} tShow={t.show} />
                            </td>
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
        )}
      </Panel>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ---------------- TNU-19 boʻlimi (navbatchi) ---------------- */

function TnuBolim({ db, yozaBiladi, ish, setIsh, t, smenaBoshla, smenaYop, yoriqnomaSkan, refresh }: any) {
  const smena = db.yoriqnoma?.aktivSmena ?? null;
  const kitob = db.yoriqnoma?.aktivKitob ?? null;
  const [tur, setTur] = useState<"kunduzgi" | "tungi">("kunduzgi");
  const [mazmun, setMazmun] = useState("");
  const [xulosa, setXulosa] = useState("");

  useEffect(() => {
    if (smena) { setMazmun(smena.mazmun); setXulosa(smena.xulosa); setTur(smena.tur); }
  }, [smena?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saqla() {
    setIsh(true); await smenaBoshla(tur, mazmun, xulosa); setIsh(false);
    t.show(smena ? "Smena yangilandi" : "Smena boshlandi");
  }

  // Fon skaneri: ID karta oʻquvchi qurilma matnni yuborganda avtomatik chaqiriladi.
  const skanBajar = useCallback(async (payload: string) => {
    if (!payload) return;
    setIsh(true);
    const r = await yoriqnomaSkan(payload);
    setIsh(false);
    if ("id" in r) { t.show("Qator qoʻshildi — ishchi imzosi qoʻyildi"); refresh(); }
    else t.show(r.xato);
  }, [yoriqnomaSkan, t, refresh, setIsh]);

  // Faqat aktiv smena bor va yozish ruxsati boʻlsa skaner yoqiladi.
  useIdScanner({ enabled: !!smena && !!yozaBiladi, onScan: skanBajar });

  if (!yozaBiladi) {
    return <Panel className="mb-6"><p className="text-[13px] text-slate-500">Bu jurnalni faqat koʻra olasiz.</p></Panel>;
  }

  return !smena ? (
    <Panel className="mb-6">
      <h3 className="mb-3 text-[14px] font-semibold">Smenani boshlash</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Smena turi">
          <Select value={tur} onChange={(e) => setTur(e.target.value as any)}>
            <option value="kunduzgi">Kunduzgi (08:00–20:00)</option>
            <option value="tungi">Tungi (20:00–08:00)</option>
          </Select>
        </Field>
        <div />
        <Field label="5-ustun: qisqacha mazmun (smena boshida 1 marta)">
          <Textarea rows={2} value={mazmun} onChange={(e) => setMazmun(e.target.value)} />
        </Field>
        <Field label="6-ustun: beruvchining xulosasi">
          <Textarea rows={2} value={xulosa} onChange={(e) => setXulosa(e.target.value)} />
        </Field>
      </div>
      <div className="mt-3 flex justify-end"><Btn variant="primary" onClick={saqla} disabled={ish}>Smenani boshlash</Btn></div>
    </Panel>
  ) : (
    <>
      <Panel className="mb-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[14px] font-semibold">
            Aktiv smena — {tur === "kunduzgi" ? "Kunduzgi" : "Tungi"}
            {kitob && <Badge className="ml-2">Kitob №{kitob.raqam} · bet {kitob.joriyBet}/{kitob.sigim}</Badge>}
          </h3>
          <Btn size="sm" onClick={smenaYop}>Smenani yopish</Btn>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="5-ustun: mazmun"><Textarea rows={2} value={mazmun} onChange={(e) => setMazmun(e.target.value)} /></Field>
          <Field label="6-ustun: xulosa"><Textarea rows={2} value={xulosa} onChange={(e) => setXulosa(e.target.value)} /></Field>
        </div>
        <div className="mt-2 flex justify-end"><Btn size="sm" onClick={saqla} disabled={ish}>Saqlash</Btn></div>
      </Panel>
      <SkanerHolat ish={ish} />
    </>
  );
}

/* ---------------- Fon skaneri holat koʻrsatkichi ---------------- */

function SkanerHolat({ ish, izoh }: { ish: boolean; izoh?: string }) {
  return (
    <Panel className="mb-6">
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          {!ish && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          )}
          <span className={`relative inline-flex h-3 w-3 rounded-full ${ish ? "bg-amber-500" : "bg-emerald-500"}`} />
        </span>
        <div className="flex-1">
          <h3 className="text-[14px] font-semibold">
            {ish ? "Skanerlanmoqda…" : "Skaner tayyor"}
          </h3>
          <p className="text-[12px] text-slate-500">
            {izoh ?? "ID kartani oʻquvchiga tuting — qator avtomatik qoʻshiladi. Tugma bosish shart emas."}
          </p>
        </div>
      </div>
    </Panel>
  );
}

/* ---------------- Instruktor boʻlimi (Yo D-26B) ---------------- */

function InstruktorBolim({ db, yozaBiladi, ish, setIsh, t, yoriqnomaSkan, refresh }: any) {
  const kol = db.yoriqnoma?.instruktorKolonna ?? null;
  const kitob = db.yoriqnoma?.aktivInstruktorKitob ?? null;
  const [tur, setTur] = useState<"davriy" | "birlamchi" | "navbatdan">("davriy");
  const [mazmun, setMazmun] = useState("");

  // Fon skaneri: mazmun toʻldirilgan boʻlsa, ID karta oʻqilishi bilan qator qoʻshiladi.
  const skanBajar = useCallback(async (payload: string) => {
    if (!payload) return;
    if (!mazmun.trim()) { t.show("Avval mazmun kiriting"); return; }
    setIsh(true);
    const r = await yoriqnomaSkan(payload, { kitobTuri: "instruktor", yoriqTuri: tur, mazmun });
    setIsh(false);
    if ("id" in r) { t.show("Qator qoʻshildi — ishchi imzosi qoʻyildi"); refresh(); }
    else t.show(r.xato);
  }, [mazmun, tur, yoriqnomaSkan, t, refresh, setIsh]);

  // Kolonna biriktirilgan va yozish ruxsati boʻlsa skaner yoqiladi.
  useIdScanner({ enabled: !!kol && !!yozaBiladi, onScan: skanBajar });

  if (!kol) {
    return <Panel className="mb-6"><Empty text="Sizga kolonna biriktirilmagan — admin biriktirishi kerak" /></Panel>;
  }
  if (!yozaBiladi) {
    return <Panel className="mb-6"><p className="text-[13px] text-slate-500">Bu kitobni faqat koʻra olasiz.</p></Panel>;
  }

  return (
    <Panel className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[14px] font-semibold">
          Kolonna: {kol.nomi}
          {kitob && <Badge className="ml-2">Kitob №{kitob.raqam} · {kitob.yozuvSoni} yozuv</Badge>}
        </h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Yoʻriqnoma turi">
          <Select value={tur} onChange={(e) => setTur(e.target.value as any)}>
            <option value="davriy">Davriy</option>
            <option value="birlamchi">Birlamchi</option>
            <option value="navbatdan">Navbatdan tashqari</option>
          </Select>
        </Field>
        <Field label="Mazmuni (yoki Ctrl+V)">
          <Textarea rows={2} value={mazmun} onChange={(e) => setMazmun(e.target.value)} />
        </Field>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        Faqat oʻz kolonnangizdagi ishchi qabul qilinadi. Skan bilan ishchi QR imzosi darhol qoʻyiladi.
      </p>
      <div className="mt-3">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="relative flex h-3 w-3">
            {mazmun.trim() && !ish && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex h-3 w-3 rounded-full ${
              ish ? "bg-amber-500" : mazmun.trim() ? "bg-emerald-500" : "bg-slate-300"
            }`} />
          </span>
          <p className="text-[12px] text-slate-600">
            {ish
              ? "Skanerlanmoqda…"
              : mazmun.trim()
                ? "Skaner tayyor — ID kartani oʻquvchiga tuting, qator avtomatik qoʻshiladi."
                : "Avval mazmun kiriting — soʻng ID kartani skanerlang."}
          </p>
        </div>
      </div>
    </Panel>
  );
}
