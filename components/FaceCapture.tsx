"use client";

/* ------------------------------------------------------------------
   Face ID — kamera oynasi va AVTOMATIK kadr olish.

   Foydalanuvchi hech narsa bosmaydi: kamera ochilgach qisqa tayyorgarlik
   beriladi, soʻng kadrlar olinib serverga yuboriladi. Mos kelmasa
   avtomatik yana urinadi (jami 3 marta) — undan keyin qoʻlda boshqaruvga
   oʻtadi, chunki cheksiz urinish serverdagi kirish chegarasini (20/min)
   behuda yeb qoʻyadi.

   Bir nechta kadr jonlilik uchun: server kadrlar oʻzaro yaqin, ammo
   butunlay bir xil emasligini tekshiradi — ekranga tutilgan surat bilan
   kirib boʻlmaydi.

   Kamera boʻlmasa yoki ruxsat berilmasa — `onSkip` orqali PIN yoʻliga
   oʻtiladi. Hech qachon tupikka olib bormaydi.
------------------------------------------------------------------ */

import { useCallback, useEffect, useRef, useState } from "react";

/** Nechta kadr olinadi — backend'dagi FACE_FRAMES bilan mos */
const KADR_SONI = 3;
/** Kadrlar orasidagi tanaffus (ms) — harakat sezilishi uchun */
const KADR_ORALIQ = 300;
/** Yuboriladigan surat eni (px) */
const KENGLIK = 480;
/** Avtomatik necha marta urinadi */
const AVTO_MAX = 3;

type Holat = "sorayapti" | "tayyor" | "olinmoqda" | "xato";

export default function FaceCapture({
  title,
  hint,
  ishlayotgan,
  onCapture,
  onSkip,
  skipLabel,
  xato: tashqiXato,
}: {
  title: string;
  hint: string;
  /** Server javobini kutayotgan payt */
  ishlayotgan?: boolean;
  onCapture: (frames: string[]) => void;
  onSkip: () => void;
  skipLabel: string;
  /** Serverdan kelgan xato (yuz mos kelmadi va h.k.) */
  xato?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [holat, setHolat] = useState<Holat>("sorayapti");
  const [kameraXato, setKameraXato] = useState("");
  const [urinish, setUrinish] = useState(0);

  // onCapture har renderda yangi funksiya — refda saqlaymiz, aks holda
  // avtomatik urinish effekti cheksiz qayta ishga tushardi.
  const onCaptureRef = useRef(onCapture);
  onCaptureRef.current = onCapture;

  /* --- kamerani yoqish / oʻchirish --- */
  useEffect(() => {
    let bekor = false;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setKameraXato("Bu brauzer kamerani qoʻllab-quvvatlamaydi");
        setHolat("xato");
        return;
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (bekor) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play().catch(() => {});
        }
        setHolat("tayyor");
      } catch (e) {
        const nomi = e instanceof DOMException ? e.name : "";
        setKameraXato(
          nomi === "NotAllowedError"
            ? "Kameraga ruxsat berilmadi. Manzil satridagi kamera belgisidan ruxsat bering yoki PIN bilan kiring"
            : nomi === "NotFoundError"
              ? "Kamera topilmadi — PIN bilan kiring"
              : "Kamerani ochib boʻlmadi — PIN bilan kiring"
        );
        setHolat("xato");
      }
    })();

    // Komponent yopilganda kamera ALBATTA oʻchadi — indikator yonib qolmaydi
    return () => {
      bekor = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  /* --- kadrlarni olish --- */
  const ol = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    setHolat("olinmoqda");

    const nisbat = video.videoHeight / video.videoWidth;
    const c = document.createElement("canvas");
    c.width = KENGLIK;
    c.height = Math.round(KENGLIK * nisbat);
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const kadrlar: string[] = [];
    for (let i = 0; i < KADR_SONI; i++) {
      ctx.drawImage(video, 0, 0, c.width, c.height);
      kadrlar.push(c.toDataURL("image/jpeg", 0.85));
      if (i < KADR_SONI - 1) await new Promise((r) => setTimeout(r, KADR_ORALIQ));
    }

    onCaptureRef.current(kadrlar);
  }, []);

  /* --- server tekshiruvi tugadi, ammo biz hali shu yerdamiz => muvaffaqiyatsiz --- */
  const oldingiBand = useRef(false);
  useEffect(() => {
    if (oldingiBand.current && !ishlayotgan) setHolat("tayyor");
    oldingiBand.current = !!ishlayotgan;
  }, [ishlayotgan]);

  /* --- AVTOMATIK urinish --- */
  useEffect(() => {
    if (holat !== "tayyor" || ishlayotgan || urinish >= AVTO_MAX) return;
    // Birinchi urinishdan oldin biroz koʻproq kutamiz — odam joylashib olsin
    const kutish = urinish === 0 ? 1500 : 1000;
    const t = setTimeout(() => {
      setUrinish((u) => u + 1);
      void ol();
    }, kutish);
    return () => clearTimeout(t);
  }, [holat, ishlayotgan, urinish, ol]);

  const band = holat === "olinmoqda" || !!ishlayotgan;
  const avtoTugadi = urinish >= AVTO_MAX && !band;

  /* Tugma belgisi matnga qarab tanlanadi: «keyinroq», «hozir emas» kabi
     matnlarda soat, PIN yoʻlida esa qulf koʻrsatiladi. */
  const keyinroq = /keyin|hozir emas/i.test(skipLabel);

  const holatMatni = band
    ? holat === "olinmoqda"
      ? "Kadrlar olinmoqda — qimirlamang"
      : "Tekshirilmoqda…"
    : avtoTugadi
      ? "Yuz aniqlanmadi"
      : `Tayyorlaning… (${urinish + 1}/${AVTO_MAX})`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0">
        <h2 className="text-[20px] font-bold leading-tight tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-[12.5px] leading-snug text-slate-500">{hint}</p>
      </div>

      {holat === "xato" ? (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
          {kameraXato}
        </div>
      ) : (
        /* Kamera boʻsh joyni egallaydi (`flex-1`), eng kichik balandligi esa
           ekranga qarab oʻlchanadi: `clamp(8.5rem, 24dvh, 15rem)`.

           Ilgari bu qatʼiy 240 px (katta ekranda 150 px) edi. Past yoki
           kattalashtirilgan ekranda oyna kichraya olmasdi va pastdagi
           «PIN kod bilan kirish» tugmasini koʻrinmas qismga siqib chiqarardi —
           foydalanuvchi uni scroll qilib izlashiga toʻgʻri kelardi. */
        <div className="relative mx-auto mt-3 min-h-[clamp(8.5rem,24dvh,15rem)] w-full max-w-[300px] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
          <video
            ref={videoRef}
            playsInline
            muted
            /* Oyna effekti — odam oʻzini tabiiy koʻradi */
            className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
          />
          {/* Yuzni joylash doirasi */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div
              className={`h-[72%] w-[54%] rounded-[50%] border-2 transition-colors ${
                band ? "border-sky-400" : avtoTugadi ? "border-amber-400" : "border-white/70"
              } ${!band && !avtoTugadi ? "animate-pulse" : ""}`}
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-slate-900/70 py-1.5 text-center text-[11.5px] font-medium text-white">
            {holat === "sorayapti" ? "Kamera soʻralmoqda…" : holatMatni}
          </div>
        </div>
      )}

      {tashqiXato && (
        <p className="mt-2 shrink-0 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-center text-[12px] text-red-600">
          {tashqiXato}
        </p>
      )}

      <div className="sticky bottom-0 z-10 mt-3 shrink-0 space-y-2 border-t border-slate-100 bg-white/95 pb-0.5 pt-2.5 backdrop-blur-sm">
        {/* Avtomatik urinishlar tugagach — qoʻlda boshqaruv */}
        {avtoTugadi && holat !== "xato" && (
          <button
            type="button"
            onClick={() => setUrinish(0)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-sky-300 bg-white text-[14px] font-semibold text-sky-700 transition hover:bg-sky-50 active:scale-[.99]"
          >
            Qayta urinish
          </button>
        )}

        {/* Oʻtkazib yuborish — yoʻqolib ketmasligi uchun ajratilgan,
            toʻliq enli tugma koʻrinishida. Kamera ishlamasa yoki yuz
            tanilmasa foydalanuvchi shu yerdan chiqib ketadi. */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[10.5px] uppercase tracking-[0.2em] text-slate-400">yoki</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <button
          type="button"
          onClick={onSkip}
          /* Bu tugma HECH QACHON oʻchmaydi.

             Ilgari u kadr olinayotganda va server javobini kutayotganda
             (`disabled={band}`) bosilmasdi — kamera yuzni tanimay uzoq
             urinsa, xodim PIN'ga oʻtolmay kutib turishga majbur edi.
             Yuz bilan kirish — qulaylik, PIN esa asosiy yoʻl: undan
             chiqish imkoni doim ochiq turishi kerak.

             Yarim yoʻlda bosilsa, ketayotgan soʻrov natijasi eʼtiborsiz
             qoldiriladi (LoginCard'dagi `faceBekor`). */
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1b6fe0] to-[#38bdf8] text-[14.5px] font-bold text-white shadow-[0_10px_26px_-12px_rgba(56,189,248,.95)] transition hover:brightness-110 active:scale-[0.99]"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden>
            {keyinroq ? (
              /* soat — «keyinroq qoʻshaman» */
              <path
                d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              /* qulf — PIN kod bilan kirish */
              <path
                d="M6 10V7a6 6 0 1112 0v3M5 10h14v11H5V10zm7 4.5v2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
          {skipLabel}
        </button>
      </div>
    </div>
  );
}
