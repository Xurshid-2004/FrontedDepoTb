"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { fio, fmtDT } from "@/lib/logic";
import type { Perm } from "@/lib/permissions";
import { Badge, Btn } from "./ui";

type NavItem = { href: string; label: string; perm?: Perm; icon: string; badge?: number };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { me, roles, db, can, logout, setRoleAs, session, ready } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

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

  const navAll: NavItem[] = [
    { href: "/dash", label: "Boshqaruv paneli", icon: "▦" },
    { href: "/tb", label: "TB — Nazorat jurnallari", perm: "journal.read", icon: "▤" },
    { href: "/arizalar", label: "Arizalar", icon: "▷", badge: pending },
    { href: "/ombor", label: "Omborxona", perm: "stock.read", icon: "▣" },
    { href: "/kip", label: "KIP — Yoʻriqchi", perm: "kip.read", icon: "◈" },
    { href: "/talon", label: "Talonlar", perm: "talon.read", icon: "◱" },
    { href: "/hisobot", label: "Hisobotlar", perm: "report.read", icon: "▧" },
    { href: "/ishchi", label: "Mening kabinetim", icon: "◉" },
    { href: "/admin", label: "Administrator", perm: "admin.users", icon: "⚙" },
  ];
  const nav: NavItem[] = navAll.filter((n) => !n.perm || can(n.perm));

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
      </div>
    );
  }

  if (!me) {
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(27,111,224,.16),transparent_60%)]" />
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[268px] border-r border-slate-200/80 bg-white/92 shadow-[8px_0_40px_-30px_rgba(13,42,85,.5)] backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
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
                  onClick={() => setOpen(false)}
                  className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] transition-all ${
                    active
                      ? "bg-gradient-to-r from-sky-100 to-sky-50 font-semibold text-sky-800"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="navdot"
                      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-sky-400"
                    />
                  )}
                  <span className="w-4 text-center opacity-70">{n.icon}</span>
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
            {me.roles.length > 1 || me.roles.includes("admin") ? (
              <div className="mb-3">
                <p className="mb-1.5 px-1 text-[10px] uppercase tracking-wider text-slate-500">
                  Rolni almashtirish (demo)
                </p>
                <select
                  value={session?.roleAs ?? ""}
                  onChange={(e) => setRoleAs((e.target.value || null) as Role | null)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] text-slate-900 outline-none"
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
                onClick={() => {
                  logout();
                  router.replace("/");
                }}
                title="Chiqish"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-500 hover:text-red-600"
              >
                ⏻
              </button>
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* MAIN */}
      <div className="lg:pl-[268px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-xl md:px-7">
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
          >
            ☰
          </button>
          <p className="flex-1 truncate text-[13px] text-slate-500">
            {nav.find((n) => path.startsWith(n.href))?.label ?? "TB tizimi"}
          </p>

          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-sky-500 hover:text-slate-900"
            >
              ◔
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-sky-400 px-1 text-[9px] font-bold text-[#05090f]">
                  {unread}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  className="absolute right-0 top-11 z-50 max-h-[70vh] w-[340px] overflow-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
                >
                  <p className="mb-2 px-1 text-[11px] uppercase tracking-wider text-slate-500">
                    Bildirishnomalar
                  </p>
                  {myNotifs.length === 0 && (
                    <p className="px-1 py-6 text-center text-[12px] text-slate-500">Yangi xabar yoʻq</p>
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
              )}
            </AnimatePresence>
          </div>

          <Link href="/lab">
            <Btn size="sm">Effektlar</Btn>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1320px] px-4 py-7 md:px-7 md:py-9">
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </main>

        <footer className="border-t border-slate-200 px-7 py-6 text-center text-[11.5px] text-slate-400">
          {db.depo.tashkilot} · {db.depo.nomi} ({db.depo.kod}) · TB tizimi prototipi ·{" "}
          {fio(me)}
        </footer>
      </div>
    </div>
  );
}
