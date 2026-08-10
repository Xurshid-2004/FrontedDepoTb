"use client";

/* ------------------------------------------------------------------
   Ishchi surati (FaceID).

   Nega alohida komponent kerak:
     • Surat endi butun holat bilan birga yuborilmaydi — 800 ta base64
       surat bitta javobda yuzlab megabayt boʻlar edi.
     • Surat himoyalangan endpointdan (/api/v1/workers/:id/face) olinadi,
       <img src> esa Authorization sarlavhasini yubora olmaydi. Shuning
       uchun suratni token bilan fetch qilib, blob havolasiga aylantiramiz.
     • Biometrik maʼlumot ochiq qolmasligi kerak.

   Surat boʻlmasa — familiyaning ikki harfi koʻrsatiladi (avvalgidek).
------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { API_BASE, tokens } from "@/lib/api";

/** Bir seans davomida yuklangan suratlar — takror soʻrov yuborilmaydi */
const kesh = new Map<string, string>();

export default function WorkerFace({
  url,
  familiya,
  size = 36,
  className = "",
}: {
  url?: string | null;
  familiya: string;
  /** Piksel oʻlchami (kvadrat) */
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(() => (url ? kesh.get(url) ?? null : null));

  useEffect(() => {
    if (!url) {
      setSrc(null);
      return;
    }
    const bor = kesh.get(url);
    if (bor) {
      setSrc(bor);
      return;
    }

    let bekor = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}${url}`, {
          headers: tokens.access ? { authorization: `Bearer ${tokens.access}` } : {},
          cache: "no-store",
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const obj = URL.createObjectURL(blob);
        kesh.set(url, obj);
        if (!bekor) setSrc(obj);
      } catch {
        // surat yuklanmasa — harfli oʻrindosh koʻrsatiladi
      }
    })();

    return () => {
      bekor = true;
    };
  }, [url]);

  const olcham = { width: size, height: size };

  if (!src) {
    return (
      <span
        style={olcham}
        className={`grid place-items-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500 ${className}`}
      >
        {familiya.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      style={olcham}
      className={`rounded-lg object-cover ring-1 ring-slate-200 ${className}`}
    />
  );
}
