"use client";

/* ------------------------------------------------------------------
   QR imzo tekshiruvi — YAGONA IMZO TIZIMI.

   Ilgari bu sahifa imzoni brauzerdagi lokal `store` boʻyicha, hatto
   id boshiga qarab «taxmin» qilib tasdiqlardi (xavfsiz emas edi).
   Endi HAQIQAT bitta joyda — Django `/api/v1/verify/<id>` endpointida.
   Sahifa faqat serverdan kelgan javobni koʻrsatadi.
------------------------------------------------------------------ */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { Btn, Panel } from "@/components/ui";

const DOC: Record<string, string> = {
  journal: "Yo D-26 nazorat jurnali",
  requisition: "Требование (Форма МУ№27)",
  card: "Shaxsiy kartochka MB-6",
  kip: "KIP maʼlumotnomasi",
  card_id: "Xodim ID kartasi",
};

interface Natija {
  ok: boolean;
  docType?: string;
  field?: string;
  sana?: string;
  hash?: string;
  bekor?: boolean;
  butun?: boolean;
  imzolagan?: { fio: string; lavozim: string };
  error?: string;
}

export default function Verify({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [holat, setHolat] = useState<"kutish" | "topildi" | "yoq">("kutish");
  const [r, setR] = useState<Natija | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${API_BASE}/api/v1/verify/${id}`, { signal: ctrl.signal })
      .then(async (resp) => {
        const data: Natija = await resp.json().catch(() => ({ ok: false }));
        if (resp.ok && data && data.docType) {
          setR(data);
          setHolat("topildi");
        } else {
          setR(data);
          setHolat("yoq");
        }
      })
      .catch(() => setHolat("yoq"));
    return () => ctrl.abort();
  }, [id]);

  const sana = r?.sana
    ? new Date(r.sana).toLocaleString("uz-UZ", { dateStyle: "medium", timeStyle: "short" })
    : "—";
  const haqiqiy = holat === "topildi" && !!r?.ok;

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(900px_500px_at_50%_-10%,rgba(27,111,224,.18),transparent_60%)]" />
      <div className="relative w-full max-w-[520px]">
        <Panel>
          <div className="mb-6 text-center">
            <span className="grid h-12 w-12 mx-auto place-items-center rounded-xl bg-gradient-to-br from-[#1b6fe0] to-[#38bdf8] text-[16px] font-black text-slate-900">
              TB
            </span>
            <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-slate-500">
              Raqamli imzoni tekshirish
            </p>
          </div>

          {holat === "kutish" ? (
            <p className="py-10 text-center text-[13px] text-slate-500">Tekshirilmoqda…</p>
          ) : haqiqiy ? (
            <>
              <div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-center">
                <p className="text-[26px]">✓</p>
                <p className="mt-2 text-[16px] font-semibold text-emerald-600">Imzo HAQIQIY</p>
                <p className="mt-1 text-[12px] text-emerald-700">
                  {r?.docType === "card_id"
                    ? "Karta haqiqiy — bu tabel raqamiga tegishli"
                    : "Hujjat imzolangandan keyin oʻzgartirilmagan"}
                </p>
              </div>

              <div className="space-y-3">
                <Row l="Imzolagan shaxs" v={r?.imzolagan?.fio || "TB tizimi foydalanuvchisi"} />
                <Row l="Lavozimi" v={r?.imzolagan?.lavozim || "—"} />
                <Row l="Hujjat turi" v={DOC[r?.docType ?? ""] ?? "Tizim hujjati"} />
                <Row l="Maydon" v={r?.field || "—"} />
                <Row l="Imzolangan vaqt" v={sana} />
                <Row l="Imzo identifikatori" v={id} mono />
              </div>

              <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">
                Xavfsizlik uchun bu sahifada shaxsiy maʼlumotlar (oʻlchamlar, narxlar)
                koʻrsatilmaydi.
              </p>
            </>
          ) : (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-center">
              <p className="text-[26px]">✕</p>
              <p className="mt-2 text-[16px] font-semibold text-red-600">
                {r?.bekor ? "Imzo BEKOR qilingan" : r?.butun === false ? "Imzo BUZILGAN" : "Imzo topilmadi"}
              </p>
              <p className="mt-1 text-[12px] text-red-600">
                {r?.bekor
                  ? "Bu imzo bekor qilingan — hujjat amaldagi emas"
                  : "QR kod notoʻgʻri yoki hujjat oʻzgartirilgan boʻlishi mumkin"}
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/"><Btn size="sm">Bosh sahifa</Btn></Link>
          </div>
        </Panel>
      </div>
    </main>
  );
}

function Row({ l, v, mono }: { l: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-2.5">
      <span className="shrink-0 text-[12px] text-slate-500">{l}</span>
      <span className={`text-right text-[12.5px] text-slate-900 ${mono ? "font-mono text-[11px] break-all" : ""}`}>{v}</span>
    </div>
  );
}
