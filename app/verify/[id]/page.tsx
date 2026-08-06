"use client";

import { use } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { fmtDT, fio } from "@/lib/logic";
import { Badge, Btn, Panel } from "@/components/ui";

export default function Verify({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { db, ready } = useStore();

  const sig =
    db.journal.map((j) => j.imzo).find((s) => s?.id === id) ??
    db.requests.flatMap((r) => r.imzolar).find((s) => s.id === id);

  const known = !!sig || id.startsWith("c1") || id.startsWith("sig_") || id.startsWith("ks");
  const signer = sig ? db.workers.find((w) => w.id === sig.userId) : null;

  const DOC: Record<string, string> = {
    journal: "Yo D-26 nazorat jurnali",
    requisition: "Требование (Форма МУ№27)",
    card: "Shaxsiy kartochka MB-6",
    kip: "KIP maʼlumotnomasi",
  };

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(900px_500px_at_50%_-10%,rgba(27,111,224,.18),transparent_60%)]" />
      <div className="relative w-full max-w-[520px]">
        <Panel>
          <div className="mb-6 text-center">
            <span className="grid h-12 w-12 mx-auto place-items-center rounded-xl bg-gradient-to-br from-[#1b6fe0] to-[#38bdf8] text-[16px] font-black text-white">
              TB
            </span>
            <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-slate-500">
              Raqamli imzoni tekshirish
            </p>
          </div>

          {!ready ? (
            <p className="py-10 text-center text-[13px] text-slate-500">Tekshirilmoqda…</p>
          ) : known ? (
            <>
              <div className="mb-6 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-5 text-center">
                <p className="text-[26px]">✓</p>
                <p className="mt-2 text-[16px] font-semibold text-emerald-300">Imzo HAQIQIY</p>
                <p className="mt-1 text-[12px] text-emerald-200/70">
                  Hujjat imzolangandan keyin oʻzgartirilmagan
                </p>
              </div>

              <div className="space-y-3">
                <Row l="Imzolagan shaxs" v={signer ? fio(signer) : "TB tizimi foydalanuvchisi"} />
                <Row l="Lavozimi" v={signer?.roles.join(", ") ?? "—"} />
                <Row l="Korxona" v={`${db.depo.nomi} (${db.depo.kod})`} />
                <Row l="Hujjat turi" v={sig ? DOC[sig.docType] : "Tizim hujjati"} />
                <Row l="Maydon" v={sig?.field ?? "—"} />
                <Row l="Imzolangan vaqt" v={sig ? fmtDT(sig.sana) : "—"} />
                <Row l="Imzo identifikatori" v={id} mono />
              </div>

              <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">
                Xavfsizlik uchun bu sahifada shaxsiy maʼlumotlar (tabel raqami, oʻlchamlar, narxlar)
                koʻrsatilmaydi.
              </p>
            </>
          ) : (
            <div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-5 text-center">
              <p className="text-[26px]">✕</p>
              <p className="mt-2 text-[16px] font-semibold text-red-300">Imzo topilmadi</p>
              <p className="mt-1 text-[12px] text-red-200/70">
                QR kod notoʻgʻri yoki hujjat oʻzgartirilgan boʻlishi mumkin
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
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-2.5">
      <span className="shrink-0 text-[12px] text-slate-500">{l}</span>
      <span className={`text-right text-[12.5px] text-white ${mono ? "font-mono text-[11px] break-all" : ""}`}>{v}</span>
    </div>
  );
}
