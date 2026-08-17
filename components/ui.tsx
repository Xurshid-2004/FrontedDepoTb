"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";

/* ---------------- Ekran oʻlchami ----------------
   Telefonmi yoki yoʻq — faqat koʻrinishni tanlash uchun. Serverda va
   birinchi renderda DOIM `false`: aks holda server va brauzer turlicha
   chizib, React gidratatsiya xatosini beradi. Haqiqiy qiymat brauzer
   ishga tushgach oʻrnatiladi.                                        */
export function useIsMobile(bp = 768) {
  const [mobil, setMobil] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`);
    const sync = () => setMobil(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [bp]);
  return mobil;
}

/* ---------------- Card ---------------- */
export function Panel({
  children,
  className = "",
  pad = true,
}: {
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white card-shadow ${
        pad ? "p-4 sm:p-5 md:p-6" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------------- Button ---------------- */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "ok" | "gold";
  size?: "sm" | "md";
};
export function Btn({ variant = "ghost", size = "md", className = "", ...p }: BtnProps) {
  const base =
    "inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-35 active:scale-[.98]";
  // Telefonda tugma balandligi barmoq uchun oshiriladi (kamida 40–44 px):
  // 36 px'lik tugmaga aniq tegish qiyin va yonidagisi bosilib ketadi.
  // Katta ekranda avvalgi ixcham oʻlchamlar saqlanadi.
  const sz =
    size === "sm"
      ? "h-10 px-3.5 text-[12.5px] md:h-9"
      : "h-12 px-5 text-[13.5px] md:h-11";
  const v = {
    primary:
      "bg-gradient-to-r from-[#1b6fe0] to-[#38bdf8] text-white shadow-[0_10px_30px_-12px_rgba(56,189,248,.9)] hover:brightness-110",
    ghost: "border border-slate-200 text-slate-800 hover:border-sky-500 hover:text-slate-900",
    danger: "border border-red-300 bg-red-50 text-red-600 hover:bg-red-100",
    ok: "border border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    gold: "border border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-400/20",
  }[variant];
  return <button {...p} className={`${base} ${sz} ${v} ${className}`} />;
}

/* ---------------- Badge ---------------- */
export function Badge({
  children,
  color = "#38bdf8",
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}
      style={{ background: `${color}1f`, color, border: `1px solid ${color}44` }}
    >
      {children}
    </span>
  );
}

/* ---------------- Field ---------------- */
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-slate-900 outline-none transition focus:border-sky-500 focus:shadow-[0_0_0_4px_rgba(56,189,248,.12)] placeholder:text-slate-400";

export function Input(p: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={`${inputCls} ${p.className ?? ""}`} />;
}

export function Textarea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...p}
      className={`${inputCls} h-auto min-h-[92px] resize-y py-2.5 leading-relaxed ${p.className ?? ""}`}
    />
  );
}

export function Select(p: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...p}
      className={`${inputCls} appearance-none bg-white pr-9 ${p.className ?? ""}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        backgroundSize: "16px",
      }}
    />
  );
}

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}) {
  const mobil = useIsMobile();

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Oyna ochiq turganda orqadagi sahifa surilmaydi. Telefonda bu ayniqsa
  // seziladi: varaq ichida scroll qilmoqchi boʻlganda orqadagi roʻyxat
  // ham birga sirgʻalib, joyi yoʻqolib qolardi.
  //
  // Avvalgi qiymat saqlanib, yopilganda tiklanadi — shuning uchun ichma-ich
  // ochilgan oynalar ham bir-birining holatini buzmaydi.
  useEffect(() => {
    if (!open) return;
    const avvalgi = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = avvalgi;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Telefonda oyna pastdan koʻtariladi va ekran eniga toʻliq
              yoyiladi — barmoq shu yerda, mazmun esa keng joy oladi.
              Planshet/kompyuterda avvalgidek markazda turadi. */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={mobil ? { y: "100%" } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={mobil ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={mobil ? { y: "100%" } : { opacity: 0, y: 14, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            style={{ maxWidth: mobil ? undefined : width }}
            className="max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl border border-slate-200 bg-white px-5 pb-[max(1.25rem,var(--safe-b))] pt-3 shadow-2xl sm:max-h-[88dvh] sm:rounded-2xl sm:p-6"
          >
            {/* Pastki varaq belgisi — bu oyna pastdan chiqqanini va uni
                yopish mumkinligini bir qarashda bildiradi */}
            <div className="mb-3 flex justify-center sm:hidden">
              <span className="sheet-grabber" />
            </div>

            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 className="text-[16px] font-semibold text-slate-900 sm:text-[17px]">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Yopish"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:text-slate-900 sm:h-8 sm:w-8"
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Table ----------------
   Katta ekranda — oddiy jadval. Telefonda — har bir qator alohida karta
   boʻlib, har katak yonida oʻz ustuni nomi turadi.

   Buning uchun katakka ustun nomi kerak. Nom `Table`dan `Td`ga kontekst
   orqali yetkaziladi: sahifalardagi kodni oʻzgartirish shart emas va
   HTML tuzilishi ham avvalgidek qoladi — faqat `data-label` atributi
   qoʻshiladi, koʻrinishni esa CSS hal qiladi (`.table-cards`).          */

/** Jadval sarlavhalari — `Td` oʻz ustuni nomini shu yerdan oladi */
const HeadCtx = React.createContext<React.ReactNode[]>([]);
/** Katakning qator ichidagi tartib raqami */
const ColCtx = React.createContext<number>(-1);

export function Table({
  head,
  children,
  min = 760,
}: {
  head: React.ReactNode[];
  children: React.ReactNode;
  /** Eng kichik kenglik — katta ekranda ustunlar qisilib ketmasligi
   *  uchun. Telefonda bu chegara ishlamaydi: u yerda jadval kartalarga
   *  aylanadi va gorizontal surish umuman kerak boʻlmaydi. */
  min?: number;
}) {
  return (
    <HeadCtx.Provider value={head}>
      <div className="table-cards overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-left" style={{ minWidth: min }}>
          <thead>
            <tr className="bg-slate-100">
              {head.map((h, i) => (
                <th
                  key={i}
                  className="border-b border-slate-200 px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </HeadCtx.Provider>
  );
}

export function Td({
  children,
  className = "",
  colSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  const head = useContext(HeadCtx);
  const col = useContext(ColCtx);

  // Nom faqat oddiy matn boʻlsa olinadi. Sarlavhada belgi yoki element
  // turgan boʻlsa (masalan tanlash katakchasi) — nom qoʻyilmaydi va
  // katak kartada butun enni egallaydi.
  const h = col >= 0 ? head[col] : undefined;
  const label =
    colSpan || colSpan === 0
      ? undefined
      : typeof h === "string" || typeof h === "number"
        ? String(h)
        : undefined;

  return (
    <td
      colSpan={colSpan}
      data-label={label}
      className={`border-b border-slate-200 px-3 py-3 align-top text-[12.5px] text-slate-700 ${className}`}
    >
      {children}
    </td>
  );
}

export function Tr({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  // `toArray` boʻsh (shartli) kataklarni chetlab oʻtadi va fragmentlarni
  // yoyadi — shuning uchun tartib raqamlari haqiqatda chiziladigan
  // kataklarga toʻgʻri keladi.
  const cells = React.Children.toArray(children);
  return (
    <tr
      onClick={onClick}
      className={`transition-colors hover:bg-slate-50 ${onClick ? "cursor-pointer" : ""}`}
    >
      {cells.map((cell, i) => (
        <ColCtx.Provider key={i} value={i}>
          {cell}
        </ColCtx.Provider>
      ))}
    </tr>
  );
}

/* ---------------- QR imzo ---------------- */
export function QrSig({
  sigId,
  hash,
  fio,
  lavozim,
  sana,
  size = 74,
  compact = false,
}: {
  sigId: string;
  hash: string;
  fio: string;
  lavozim: string;
  sana?: string;
  size?: number;
  compact?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/verify/${sigId}?h=${hash}`
        : `/verify/${sigId}`;
    if (ref.current) {
      QRCode.toCanvas(ref.current, url, {
        width: size,
        margin: 0,
        errorCorrectionLevel: "M",
        color: { dark: "#0d1b2a", light: "#ffffff" },
      }).catch(() => {});
    }
  }, [sigId, hash, size]);

  return (
    <div className={`flex items-center gap-2.5 ${compact ? "" : "rounded-lg border border-slate-200 bg-white p-2"}`}>
      <canvas ref={ref} className="shrink-0 rounded-[3px] bg-white p-[3px] ring-1 ring-slate-200" width={size} height={size} />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[10.5px] text-slate-500">{lavozim}</p>
        <p className="truncate text-[11.5px] font-semibold text-slate-900">{fio}</p>
        {sana && <p className="mt-0.5 text-[10px] tabular-nums text-slate-500">{sana}</p>}
      </div>
    </div>
  );
}

/* ---------------- Empty ---------------- */
export function Empty({ text, icon = "○" }: { text: string; icon?: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 px-4 py-10 sm:py-14">
      <p className="text-center text-[13px] text-slate-500">
        <span className="mb-2 block text-2xl opacity-40">{icon}</span>
        {text}
      </p>
    </div>
  );
}

/* ---------------- Page head ---------------- */
export function PageHead({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 md:mb-7 md:gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-[21px] font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl md:text-[28px]">
          {title}
        </h1>
        {sub && (
          <p className="mt-1.5 max-w-[720px] text-[12.5px] leading-relaxed text-slate-500 md:text-[13px]">
            {sub}
          </p>
        )}
      </div>
      {/* Telefonda amal tugmalari sarlavha ostiga toʻliq enda tushadi —
          siqilib, bir-birining ustiga chiqib ketmaydi */}
      {right && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-2.5">{right}</div>
      )}
    </div>
  );
}

/* ---------------- Stat ---------------- */
export function Stat({
  label,
  value,
  color = "#38bdf8",
  hint,
}: {
  label: string;
  value: React.ReactNode;
  color?: string;
  hint?: string;
}) {
  return (
    <Panel className="relative overflow-hidden">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: color }} />
      <p className="text-[10.5px] uppercase tracking-wider text-slate-500 sm:text-[11px]">{label}</p>
      <p className="mt-1.5 text-[25px] font-bold leading-none tabular-nums text-slate-900 sm:mt-2 sm:text-[30px]">
        {value}
      </p>
      {hint && <p className="mt-2 text-[11.5px] leading-snug text-slate-500">{hint}</p>}
    </Panel>
  );
}

/* ---------------- Toast ---------------- */
export function useToast() {
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "err" } | null>(null);
  const show = (text: string, tone: "ok" | "err" = "ok") => {
    setMsg({ text, tone });
    setTimeout(() => setMsg(null), 3200);
  };
  const node = (
    <AnimatePresence>
      {msg && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          /* Telefonda pastki menyu bor — xabar uning ustida chiqadi,
             aks holda menyu xabarni toʻsib qoʻyardi. Kengligi ham
             cheklangan: uzun matn ekrandan chiqib ketmaydi. */
          className="fixed bottom-[calc(var(--tabbar-h)+var(--safe-b)+12px)] left-1/2 z-[95] w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2 rounded-xl border-2 px-4 py-3 text-center text-[13px] font-semibold shadow-2xl backdrop-blur md:bottom-6 md:w-auto"
          style={{
            /* Ochiq fonda oq-yashil matn oʻqilmasdi — rang toʻqroq
               olindi, fon esa yengil. */
            background: msg.tone === "ok" ? "#ecfdf5" : "#fef2f2",
            borderColor: msg.tone === "ok" ? "#6ee7b7" : "#fca5a5",
            color: msg.tone === "ok" ? "#065f46" : "#991b1b",
          }}
        >
          {msg.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
  return { show, node };
}
