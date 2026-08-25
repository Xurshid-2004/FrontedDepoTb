"use client";

/* ------------------------------------------------------------------
   Fon rejimidagi ID-karta skaneri (keyboard-wedge).

   ID karta oʻquvchi qurilma klaviatura kabi ishlaydi: karta tutilganda
   butun matnni juda tez «yozib» yuboradi va odatda Enter bilan tugaydi.
   Bu hook global `keydown`ni tinglaydi, tez ketma-ket kelgan belgilarni
   buferga toʻplaydi va qisqa sukunatdan soʻng — agar matnda `ID:` boʻlsa —
   `onScan(payload)` chaqiradi. Hech qanday textarea yoki tugma kerak emas.

   Xususiyatlar:
     • Odam yozishiga xalaqit bermaydi — faqat skaner tezligidagi (juda
       qisqa tanaffusli) burst tan olinadi va shundagina `preventDefault`
       qilinadi, shunda textarealar «ID: …» matni bilan ifloslanmaydi.
     • Koʻp qatorli QR (ID:/IMZO: alohida qatorda) ham toʻgʻri ishlaydi:
       Enter belgilari buferga «\n» sifatida yigʻiladi, flush esa faqat
       toʻliq matn kelib boʻlgach (idle) sodir boʻladi.
     • `enabled=false` boʻlsa tinglovchi umuman ulanmaydi.
------------------------------------------------------------------ */

import { useEffect, useRef } from "react";

export type IdScannerOpts = {
  /** Tinglovchi yoqilganmi (masalan: aktiv smena bor va yozish ruxsati bor). */
  enabled: boolean;
  /** Toʻliq skaner matni kelganda chaqiriladi (trim qilingan). */
  onScan: (payload: string) => void;
  /** Buferning eng kam uzunligi — undan qisqasi eʼtiborsiz. */
  minLength?: number;
  /** Belgilar orasidagi maksimal tanaffus (ms). Undan tez — skaner. */
  charGapMs?: number;
  /** Sukunatdan soʻng buferni yuborish oraligʻi (ms). */
  idleFlushMs?: number;
};

/** Matn skaner payloadiga oʻxshaydimi (kamida `ID:` boʻlagi bormi). */
function skanngaOxshaydi(s: string): boolean {
  return /id:/i.test(s);
}

export function useIdScanner({
  enabled,
  onScan,
  minLength = 6,
  charGapMs = 50,
  idleFlushMs = 160,
}: IdScannerOpts): void {
  const bufRef = useRef("");
  const lastRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // onScan har renderda oʻzgarishi mumkin — eng soʻnggisini ref orqali
  // chaqiramiz (stale closure boʻlmasin, effekt esa qayta ulanmasin).
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;

    const now = () =>
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const tozala = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const flush = () => {
      const txt = bufRef.current;
      bufRef.current = "";
      tozala();
      const t = txt.trim();
      if (t.length >= minLength && skanngaOxshaydi(t)) {
        onScanRef.current(t);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      // Nusxa/qidiruv kabi kombinatsiyalarga aralashmaymiz.
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const t = now();
      const dt = t - lastRef.current;
      lastRef.current = t;

      let ch = "";
      if (e.key === "Enter") ch = "\n";
      else if (e.key === "Tab") ch = "\t";
      else if (e.key.length === 1) ch = e.key;
      else return; // Shift, Arrow, F1 ... — buferga qoʻshilmaydi

      // Uzoq tanaffus — oldingi (odam yozgan) matnni tashlaymiz, yangisi
      // boshlanadi. Skaner belgilari bir-biriga juda yaqin keladi.
      if (dt > charGapMs) bufRef.current = "";
      bufRef.current += ch;

      // Skaner tezligidagi burstmi yoki matn allaqachon «ID:» ni oʻz ichiga
      // olganmi — shundagina teginmaymiz, aks holda oddiy yozuvga xalaqit
      // bermaymiz.
      const burst = dt <= charGapMs && bufRef.current.length >= 2;
      if (burst || skanngaOxshaydi(bufRef.current)) {
        e.preventDefault();
        e.stopPropagation();
      }

      tozala();
      timerRef.current = setTimeout(flush, idleFlushMs);
    };

    // capture: true — inputlardan OLDIN ushlaymiz, shunda skaner matni
    // fokusdagi maydonga tushib ketmaydi.
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      tozala();
      bufRef.current = "";
      lastRef.current = 0;
    };
  }, [enabled, minLength, charGapMs, idleFlushMs]);
}
