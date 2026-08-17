"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { fio, fmtDT } from "@/lib/logic";
import type { FeatureKey, Perm } from "@/lib/permissions";
import { Badge, Btn } from "./ui";
import { NavIcon } from "./NavIcons";

type NavItem = { href: string; label: string; perm?: Perm; feat?: FeatureKey; badge?: number };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { me, roles, db, can, canFeature, logout, setRoleAs, session, ready } = useStore();
  const path = usePathname();
  const router = useRouter();
  /** Yon panel ochiqmi. Sahifa ochilganda koʻrinadi, soʻng oʻzi yigʻiladi. */
  const [ochiq, setOchiq] = useState(true);
  /** Foydalanuvchi oʻzi ochdimi — faqat shunda qorong'i parda koʻrsatiladi */
  const [qolda, setQolda] = useState(false);
  /** Sichqoncha panel ustidami — ustida turganda yopilmaydi */
  const [ustida, setUstida] = useState(false);
  /** Sanoqni qayta boshlash uchun hisoblagich */
  const [tiklash, setTiklash] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  /* Yon panel 8 soniyadan keyin yigʻiladi — asosiy maydon butun ekranni
     egallaydi va jadvallar gorizontal scroll'siz sigʻadi.
     Sichqoncha panel ustida boʻlsa sanoq toʻxtaydi, olingach qaytadan
     boshlanadi — ishlatib turgan odamning oldida yopilib qolmaydi. */
  useEffect(() => {
    if (!ochiq || ustida) return;
    const t = setTimeout(() => {
      setOchiq(false);
      setQolda(false);
    }, 8000);
    return () => clearTimeout(t);
  }, [ochiq, ustida, tiklash]);

  const panelniOch = () => {
    setOchiq(true);
    setQolda(true);
    // Chiziq ochilgan panel ostida qolib `pointer-events-none` boʻladi —
    // uning `onMouseLeave`i ishlamaydi. Shuning uchun bayroqni shu yerda
    // tozalaymiz, aks holda avtomatik yopilish sanogʻi umuman
    // boshlanmay, panel doim ochiq qolardi.
    setUstida(false);
    setTiklash((n) => n + 1);
  };
  const panelniYop = () => {
    setOchiq(false);
    setQolda(false);
  };
  /** Boʻlimga oʻtganda panel yopilmaydi — 8 soniyalik sanoq qaytadan
   *  boshlanadi. Shunda ketma-ket bir necha boʻlimni koʻrish qulay. */
  const sanoqniTikla = () => setTiklash((n) => n + 1);

  /** Yon paneldagi havola bosilganda.
   *
   *  Katta ekranda panel yonda turadi va yopilmaydi — sanoq tiklanadi.
   *  Telefon va planshetda esa panel mazmun USTIDA turadi: yopilmasa,
   *  foydalanuvchi oʻzi ochgan boʻlimni koʻrmaydi. Shuning uchun u yerda
   *  havola bosilishi bilan panel yigʻiladi. */
  const bolimgaOtish = () => {
    sanoqniTikla();
    if (typeof window !== "undefined" && window.innerWidth < 1024) panelniYop();
  };

  // Kirilmagan boʻlsa — kirish sahifasiga. Bu ALBATTA effektda boʻlishi
  // kerak: render paytida router.replace() chaqirilsa React "Cannot update
  // a component while rendering a different component" xatosini beradi va
  // navigatsiya ishonchsiz boʻlib qoladi.
  useEffect(() => {
    if (ready && !me) router.replace("/");
  }, [ready, me, router]);

  const myNotifs = useMemo(
    () => db.notifications.filter((n) => n.workerId === me?.id).slice(0, 30),
    [db.notifications, me]
  );
  const unread = myNotifs.filter((n) => !n.oqilgan).length;

  const pending = useMemo(() => {
    if (!me) return 0;
    return db.requests.filter((r) => {
      if (r.status === "SUBMITTED") return can("request.approve1");
      if (r.status === "ACCOUNTANT_APPROVED") return can("request.approve2");
      if (r.status === "CHIEF_APPROVED") return can("request.approve3");
      if (r.status === "HEAD_APPROVED") return can("request.issue");
      if (r.status === "ISSUED") return r.workerId === me.id;
      if (r.status === "RECEIVED") return can("request.issue");
      return false;
    }).length;
  }, [db.requests, me, can]);

  /** Tizimdan chiqish — tokenlar tozalanadi va login sahifasiga qaytariladi */
  const chiqish = () => {
    logout();
    router.replace("/");
  };

  const navAll: NavItem[] = [
    { href: "/dash", label: "Boshqaruv paneli" },
    { href: "/tb", label: "TB — Nazorat jurnallari", perm: "journal.read", feat: "nav.tb" },
    { href: "/arizalar", label: "Arizalar", feat: "nav.arizalar", badge: pending },
    { href: "/ombor", label: "Omborxona", perm: "stock.read", feat: "nav.ombor" },
    { href: "/kip", label: "KIP — Yoʻriqchi", perm: "kip.read", feat: "nav.kip" },
    { href: "/talon", label: "Talonlar", perm: "talon.read", feat: "nav.talon" },
    { href: "/hisobot", label: "Hisobotlar", perm: "report.read", feat: "nav.hisobot" },
    { href: "/hujjatlar", label: "Hujjatlar", feat: "nav.hujjatlar" },
    { href: "/arxiv", label: "Arxiv", feat: "nav.arxiv" },
    { href: "/ishchi", label: "Mening kabinetim" },
    { href: "/admin", label: "Administrator", perm: "admin.users" },
  ];
  const nav: NavItem[] = navAll.filter((n) => (!n.perm || can(n.perm)) && (!n.feat || canFeature(n.feat)));

  // Manzil boʻyicha himoya. Havolani yashirish yetarli emas — manzilni
  // qoʻlda terib ochish mumkin. Server baribir rad etadi (403), ammo
  // foydalanuvchi buzuq sahifa va tushunarsiz xato oʻrniga aniq xabar
  // koʻrishi kerak.
  const joriyBolim = navAll.find((n) => n.href !== "/dash" && path.startsWith(n.href));
  const ruxsatYoq =
    !!joriyBolim &&
    ((!!joriyBolim.perm && !can(joriyBolim.perm)) ||
      (!!joriyBolim.feat && !canFeature(joriyBolim.feat)));

  // Holat yuklanmagan yoki foydalanuvchi yoʻq — yuqoridagi effekt
  // kirish sahifasiga yoʻnaltirguncha aylanma koʻrsatiladi.
  if (!ready || !me) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(27,111,224,.16),transparent_60%)]" />
      </div>

      {/* SIDEBAR */}
      <aside
        onMouseEnter={() => setUstida(true)}
        onMouseLeave={() => {
          setUstida(false);
          setTiklash((n) => n + 1);
        }}
        /* Kenglik telefon ekraniga moslashadi: 268 px tor telefonda ekranning
           deyarli hammasini egallardi. Katta ekranda avvalgi oʻlcham.

           `max-lg:-translate-x-full` — muhim: panel sahifa ochilganda
           OʻZI ochiladi (8 soniyaga). Katta ekranda u mazmunni yon tomonga
           surib joy ochadi, telefon va planshetda esa surish uchun joy
           yoʻq — u mazmunni toʻsib qoʻyardi. Shuning uchun kichik ekranda
           panel faqat foydalanuvchi OʻZI ochganda (`qolda`) koʻrinadi. */
        className={`fixed inset-y-0 left-0 z-50 w-[min(88vw,300px)] border-r border-slate-200/80 bg-white/95 pb-safe pt-safe shadow-[8px_0_40px_-30px_rgba(13,42,85,.5)] backdrop-blur-xl transition-transform duration-300 lg:w-[268px] ${
          ochiq ? "translate-x-0" : "-translate-x-full"
        } ${qolda ? "" : "max-lg:-translate-x-full"}`}
      >
        <div className="flex h-full flex-col">
          <Link href="/dash" className="flex items-center gap-3 border-b border-slate-200 px-5 py-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#1b6fe0] to-[#38bdf8] text-[15px] font-black text-white">
              TB
            </span>
            <span>
              <span className="block text-[13.5px] font-semibold leading-tight text-slate-900">
                {db.depo.nomi}
              </span>
              <span className="block text-[10.5px] text-slate-500">{db.depo.kod} · {db.depo.tashkilot}</span>
            </span>
          </Link>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {nav.map((n) => {
              const active = path === n.href || (n.href !== "/dash" && path.startsWith(n.href));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={bolimgaOtish}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] transition-all ${
                    active
                      ? "bg-gradient-to-r from-sky-100 to-sky-50 font-bold text-sky-900"
                      : "font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="navdot"
                      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-sky-400"
                    />
                  )}
                  <span className={`shrink-0 ${active ? "text-sky-700" : "text-slate-500"}`}>
                    <NavIcon href={n.href} size={22} />
                  </span>
                  <span className="flex-1">{n.label}</span>
                  {!!n.badge && (
                    <span className="rounded-full bg-sky-200 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                      {n.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-3">
            {/* Telefonda sarlavhada joy yoʻq — namoyish sahifasi shu yerda */}
            <Link
              href="/lab"
              onClick={bolimgaOtish}
              className="mb-3 block rounded-xl border border-slate-200 px-3 py-2.5 text-center text-[12.5px] font-semibold text-slate-600 transition active:bg-slate-100 md:hidden"
            >
              Effektlar
            </Link>

            {me.roles.length > 1 || me.roles.includes("admin") ? (
              <div className="mb-3">
                <p className="mb-1.5 px-1 text-[10px] uppercase tracking-wider text-slate-500">
                  Rolni almashtirish (faqat koʻrinish)
                </p>
                <select
                  value={session?.roleAs ?? ""}
                  onChange={(e) => setRoleAs((e.target.value || null) as Role | null)}
                  className={`h-9 w-full rounded-lg border px-2.5 text-[12px] outline-none ${
                    session?.roleAs
                      ? "border-amber-500 bg-amber-50 font-semibold text-amber-900"
                      : "border-slate-200 bg-white text-slate-900"
                  }`}
                >
                  <option value="">Asl rollarim</option>
                  {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-100 text-[12px] font-bold text-sky-700">
                {me.familiya.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-slate-900">
                  {me.familiya} {me.ism}
                </p>
                <p className="truncate text-[10.5px] text-slate-500">
                  {roles.map((r) => ROLE_LABEL[r]).join(", ")}
                </p>
              </div>
              <button
                onClick={chiqish}
                title="Tizimdan chiqish"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-500 hover:text-red-600"
              >
                ⏻
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* IKONKALAR CHIZIGʻI — panel yigʻilganda chap chekkada turadi.
          Har bir belgi oʻz boʻlimiga olib boradi va shu bilan birga yon
          panelni ochadi. Telefonda oʻrin tor, shuning uchun u yerda
          sarlavhadagi ☰ tugmasi ishlatiladi. */}
      <div
        onMouseEnter={() => setUstida(true)}
        onMouseLeave={() => setUstida(false)}
        /* Planshetda (md–lg) chiziq DOIM koʻrinadi: u yerda yon panel
           mazmunni surmaydi, ustidan ochiladi. Ilgari chiziq `ochiq`
           bayrogʻiga bogʻlangan edi va sahifa ochilgandagi 8 soniya
           davomida yoʻqolib turardi — soʻng birdan paydo boʻlib, mazmunni
           56 px oʻngga sakratardi. Faqat katta ekranda (lg+) chiziq yon
           panel bilan almashadi. */
        className={`fixed inset-y-0 left-0 z-40 hidden w-[56px] flex-col items-center gap-1 border-r border-slate-200/80 bg-white/92 pb-[calc(var(--safe-b)+0.75rem)] pt-[calc(var(--safe-t)+0.75rem)] backdrop-blur-xl transition-opacity duration-300 md:flex ${
          ochiq ? "lg:pointer-events-none lg:opacity-0" : "opacity-100"
        }`}
      >
        {/* Logotip — boʻlim almashtirmasdan panelni ochadi */}
        <button
          onClick={panelniOch}
          title="Yon panelni ochish"
          aria-label="Yon panelni ochish"
          className="mb-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#1b6fe0] to-[#38bdf8] text-[13px] font-black text-white transition hover:brightness-110"
        >
          TB
        </button>

        <div className="my-1 h-px w-7 bg-slate-200" />

        <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto">
          {nav.map((n) => {
            const active = path === n.href || (n.href !== "/dash" && path.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={panelniOch}
                title={n.label}
                aria-label={n.label}
                className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${
                  active
                    ? "bg-sky-100 text-sky-700 ring-1 ring-sky-400"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <NavIcon href={n.href} size={24} />
                {!!n.badge && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-white">
                    {n.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Chiqish — panel yigʻiq boʻlsa ham qoʻl ostida */}
        <button
          onClick={chiqish}
          title="Tizimdan chiqish"
          aria-label="Tizimdan chiqish"
          className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-500 hover:text-red-600"
        >
          ⏻
        </button>
      </div>

      {/* Qorong'i parda faqat foydalanuvchi oʻzi ochganda va kichik
          ekranda — avtomatik ochilishda mazmonni toʻsib qoʻymaydi */}
      {ochiq && qolda && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={panelniYop}
          aria-hidden
        />
      )}

      {/* MAIN
          telefon (<md) — chapda hech narsa yoʻq, navigatsiya pastda;
          planshet (md–lg) — doim 56 px ikonkalar chizigʻi;
          kompyuter (lg+) — panel ochiq boʻlsa 268 px, yigʻiq boʻlsa 56 px. */}
      <div
        className={`transition-[padding] duration-300 md:pl-[56px] ${
          ochiq ? "lg:pl-[268px]" : "lg:pl-[56px]"
        }`}
      >
        {/* Rol koʻrinishi almashtirilgan — buni sezmay qolish mumkin emas.
            Ilgari admin oʻzini ishchi rolida koʻrayotganini bilmay qolar
            va "admin panel ishchi panelga aylanib qoldi" degan chalkashlik
            chiqardi. Bu FAQAT koʻrinish: server har doim asl rolni
            ishlatadi, shuning uchun ruxsatlar oshib ketmaydi. */}
        {/* Ogohlantirish va sarlavha BITTA yopishqoq qatlamda turadi.
            Ilgari ikkalasi ham `sticky top-0` edi va scroll qilinganda
            ustma-ust tushib, sarlavhani berkitardi. */}
        <div className="sticky top-0 z-40 pt-safe">
          {session?.roleAs && (
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-400 px-4 py-2 text-center text-[11.5px] font-semibold text-amber-950 md:text-[12.5px]">
              <span>
                DEMO koʻrinish: siz «{ROLE_LABEL[session.roleAs]}» rolida koʻryapsiz.
                Asl rolingiz — {(me.roles as Role[]).map((r) => ROLE_LABEL[r]).join(", ")}
              </span>
              <button
                onClick={() => setRoleAs(null)}
                className="rounded-lg bg-amber-950 px-2.5 py-1 text-[11.5px] font-bold text-amber-50 transition hover:bg-amber-900"
              >
                Asl rolimga qaytish
              </button>
            </div>
          )}

          <header className="flex h-[var(--header-h)] items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur-xl md:gap-3 md:px-7">
            {/* Telefonda ikonkalar chizigʻi sigʻmaydi — u yerda menyu shu
                tugma orqali ochiladi. Katta ekranda chiziq oʻzi bor. */}
            <button
              onClick={() => (ochiq && qolda ? panelniYop() : panelniOch())}
              title="Menyu"
              aria-label="Menyu"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-[17px] text-slate-700 transition active:scale-95 active:bg-slate-100 md:hidden"
            >
              ☰
            </button>

            <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-slate-900 md:text-[13px] md:font-normal md:text-slate-500">
              {nav.find((n) => path.startsWith(n.href))?.label ?? "TB tizimi"}
            </p>

            <div className="relative shrink-0">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Bildirishnomalar"
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 transition active:scale-95 active:bg-slate-100 hover:border-sky-500 md:h-9 md:w-9"
              >
                ◔
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <>
                    {/* Tashqariga bosilganda yopiladi — telefonda roʻyxatni
                        yopish uchun aynan shu tugmani qidirib topish
                        noqulay edi */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setNotifOpen(false)}
                      aria-hidden
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      /* Kengligi ekrandan chiqmaydi: tor telefonda 340 px
                         oʻng chetdan tashqariga chiqib ketardi */
                      className="absolute right-0 top-12 z-50 max-h-[min(70dvh,460px)] w-[min(340px,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl md:top-11"
                    >
                      <p className="mb-2 px-1 text-[11px] uppercase tracking-wider text-slate-500">
                        Bildirishnomalar
                      </p>
                      {myNotifs.length === 0 && (
                        <p className="px-1 py-6 text-center text-[12px] text-slate-500">
                          Yangi xabar yoʻq
                        </p>
                      )}
                      {myNotifs.map((n) => (
                        <div key={n.id} className="rounded-xl px-2.5 py-2.5 hover:bg-slate-100">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[12.5px] font-semibold text-slate-900">{n.sarlavha}</p>
                            {n.turi === "reject" && <Badge color="#ef4444">rad</Badge>}
                          </div>
                          <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">{n.matn}</p>
                          <p className="mt-1 text-[10px] text-slate-400">{fmtDT(n.sana)}</p>
                        </div>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Namoyish sahifasi — telefonda joy tor, u yerda menyu ichida */}
            <Link href="/lab" className="hidden md:block">
              <Btn size="sm">Effektlar</Btn>
            </Link>

            <Btn
              size="sm"
              variant="danger"
              onClick={chiqish}
              title="Tizimdan chiqish"
              className="shrink-0"
            >
              <span aria-hidden>⏻</span>
              {/* Yozuv faqat keng ekranda — telefonda belgi yetarli */}
              <span className="hidden md:inline">Tizimdan chiqish</span>
            </Btn>
          </header>
        </div>

        {/* Panel yigʻilganda kenglik chegarasi ham kengayadi — shunda
            jadvallar gorizontal scroll'siz toʻliq sigʻadi */}
        <main
          className={`mx-auto w-full px-4 py-5 md:px-7 md:py-9 ${
            ochiq ? "max-w-[1320px]" : "max-w-[1800px]"
          }`}
        >
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {ruxsatYoq ? (
              <div className="mx-auto max-w-[560px] rounded-2xl border border-slate-200 bg-white p-8 text-center card-shadow">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-50 text-[24px]">
                  🔒
                </div>
                <h2 className="mt-4 text-[18px] font-bold text-slate-900">
                  Bu boʻlimga ruxsatingiz yoʻq
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                  «{joriyBolim?.label}» boʻlimi sizning rolingiz uchun ochilmagan.
                  <br />
                  Siz <b className="text-slate-700">{fio(me)}</b> ({me.tabel}) sifatida
                  kirgansiz — {roles.map((r) => ROLE_LABEL[r]).join(", ")}.
                </p>
                <p className="mt-3 text-[12px] text-slate-400">
                  Ruxsat kerak boʻlsa administratorga murojaat qiling. Boshqa hisob bilan
                  ishlamoqchi boʻlsangiz — tizimdan chiqing.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Link href="/dash">
                    <Btn variant="primary" size="sm">Boshqaruv paneliga</Btn>
                  </Link>
                  <Btn size="sm" variant="danger" onClick={chiqish}>
                    Tizimdan chiqish
                  </Btn>
                </div>
              </div>
            ) : (
              children
            )}
          </motion.div>
        </main>

        {/* Pastki matn telefonda navigatsiya paneli ostida qolib
            ketmasligi uchun qoʻshimcha boʻshliq qoldiriladi */}
        <footer className="border-t border-slate-200 px-4 pb-[calc(var(--tabbar-h)+var(--safe-b)+1.25rem)] pt-5 text-center text-[11px] leading-relaxed text-slate-400 md:px-7 md:pb-6 md:pt-6 md:text-[11.5px]">
          {db.depo.tashkilot} · {db.depo.nomi} ({db.depo.kod}) · TB tizimi prototipi ·{" "}
          {fio(me)}
        </footer>
      </div>

      {/* ================= PASTKI NAVIGATSIYA (faqat telefon) =================
          Telefonda yon panel mazmunni toʻsib qoʻyadi va uni har safar
          ochib-yopish qoʻshimcha ish. Eng koʻp ishlatiladigan boʻlimlar
          barmoq ostida — ekranning pastki chetida turadi.

          Roʻyxat `nav` bilan bir xil manbadan olinadi: ruxsati yoʻq boʻlim
          bu yerda ham koʻrinmaydi. «Yana» tugmasi toʻliq roʻyxatni (yon
          panelni) ochadi — hech bir boʻlim yashirin qolmaydi. */}
      <nav
        aria-label="Asosiy boʻlimlar"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur-xl md:hidden"
      >
        <div className="flex h-[var(--tabbar-h)] items-stretch">
          {nav.slice(0, 4).map((n) => {
            const active = path === n.href || (n.href !== "/dash" && path.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                /* `min-w-0` shart: usiz flex elementi oʻz mazmunidan
                   (yozuv kengligidan) kichrayolmaydi va oxirgi tugma
                   ekrandan chiqib ketadi. */
                className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 transition active:bg-slate-100 ${
                  active ? "text-sky-700" : "text-slate-500"
                }`}
              >
                <span className="relative">
                  <NavIcon href={n.href} size={22} />
                  {!!n.badge && (
                    <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-white">
                      {n.badge}
                    </span>
                  )}
                </span>
                {/* Yozuv qisqartiriladi: 5 ta ustunga «Boshqaruv paneli»
                    kabi uzun nom sigʻmaydi */}
                <span
                  className={`w-full truncate text-center text-[10px] leading-none ${
                    active ? "font-bold" : "font-medium"
                  }`}
                >
                  {QISQA[n.href] ?? n.label}
                </span>
                {active && (
                  <span className="absolute inset-x-4 top-0 h-[2.5px] rounded-b-full bg-sky-500" />
                )}
              </Link>
            );
          })}

          <button
            onClick={panelniOch}
            aria-label="Barcha boʻlimlar"
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 text-slate-500 transition active:bg-slate-100"
          >
            <span className="grid h-[22px] w-[22px] place-items-center">
              <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]" aria-hidden>
                <g fill="currentColor">
                  <circle cx="5" cy="12" r="1.9" />
                  <circle cx="12" cy="12" r="1.9" />
                  <circle cx="19" cy="12" r="1.9" />
                </g>
              </svg>
            </span>
            <span className="w-full truncate text-center text-[10px] font-medium leading-none">
              Yana
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}

/** Pastki paneldagi qisqa nomlar — toʻliq nom u yerga sigʻmaydi.
 *  Yon panelda va sarlavhada nomlar toʻliq holicha qoladi. */
const QISQA: Record<string, string> = {
  "/dash": "Bosh",
  "/tb": "Jurnal",
  "/arizalar": "Ariza",
  "/ombor": "Ombor",
  "/kip": "KIP",
  "/talon": "Talon",
  "/hisobot": "Hisobot",
  "/hujjatlar": "Hujjat",
  "/arxiv": "Arxiv",
  "/ishchi": "Kabinet",
  "/admin": "Admin",
};
