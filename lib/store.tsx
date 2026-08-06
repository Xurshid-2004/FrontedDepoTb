"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type {
  AppRequest, DB, Item, JournalEntry, Kip, Norm, RequestStatus, Role, Signature, Worker,
} from "./types";
import { makeSeed } from "./seed";
import {
  addMonths, iso, makeHash, nextStatus, TODAY,
} from "./logic";
import { can, type Perm } from "./permissions";

const KEY = "tb_db_v1";
const SKEY = "tb_session_v1";

type Session = { workerId: string; roleAs: Role | null } | null;

type Ctx = {
  db: DB;
  session: Session;
  me: Worker | null;
  roles: Role[];
  ready: boolean;
  can: (p: Perm) => boolean;
  login: (tabel: string) => Worker | null;
  logout: () => void;
  setRoleAs: (r: Role | null) => void;
  reset: () => void;
  update: (fn: (d: DB) => void) => void;
  // amallar
  createRequest: (workerId: string, itemIds: string[], turi?: AppRequest["turi"]) => AppRequest | null;
  advance: (reqId: string, izoh?: string) => void;
  reject: (reqId: string, izoh: string) => void;
  addJournal: (e: Omit<JournalEntry, "id">) => void;
  signJournal: (id: string, izoh: string) => void;
  stockIn: (itemId: string, soni: number, izoh: string) => void;
  toggleTalon: (workerId: string, raqam: 1 | 2 | 3, sabab?: string) => void;
  addKip: (k: Omit<Kip, "id" | "tugash" | "imzoId">) => void;
  setExam: (workerId: string, sana: string, davriylikOy: number) => void;
  upsertItem: (it: Item) => void;
  upsertNorm: (n: Norm) => void;
  removeNorm: (id: string) => void;
  upsertWorker: (w: Worker) => void;
};

const C = createContext<Ctx | null>(null);

function load(): DB {
  if (typeof window === "undefined") return makeSeed();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {}
  return makeSeed();
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(() => makeSeed());
  const [session, setSession] = useState<Session>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDb(load());
    try {
      const s = localStorage.getItem(SKEY);
      if (s) setSession(JSON.parse(s));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {}
  }, [db, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      if (session) localStorage.setItem(SKEY, JSON.stringify(session));
      else localStorage.removeItem(SKEY);
    } catch {}
  }, [session, ready]);

  const update = useCallback((fn: (d: DB) => void) => {
    setDb((prev) => {
      const next: DB = JSON.parse(JSON.stringify(prev));
      fn(next);
      return next;
    });
  }, []);

  const me = useMemo(
    () => (session ? db.workers.find((w) => w.id === session.workerId) ?? null : null),
    [db.workers, session]
  );

  const roles: Role[] = useMemo(() => {
    if (!me) return [];
    if (session?.roleAs) return [session.roleAs];
    return me.roles;
  }, [me, session]);

  const audit = (d: DB, obyekt: string, amal: string, izoh?: string) => {
    d.audit.unshift({
      id: `a${Date.now()}${Math.random().toString(16).slice(2, 6)}`,
      userId: session?.workerId ?? "system",
      obyekt,
      amal,
      sana: new Date().toISOString(),
      izoh,
    });
    d.audit = d.audit.slice(0, 400);
  };

  const notify = (d: DB, workerId: string, sarlavha: string, matn: string, turi = "info") => {
    d.notifications.unshift({
      id: `nt${Date.now()}${Math.random().toString(16).slice(2, 6)}`,
      workerId,
      turi,
      sarlavha,
      matn,
      sana: new Date().toISOString(),
      oqilgan: false,
    });
    d.notifications = d.notifications.slice(0, 200);
  };

  const sign = (d: DB, docType: Signature["docType"], docId: string, field: string): Signature => ({
    id: `sg${Date.now()}${Math.random().toString(16).slice(2, 6)}`,
    docType,
    docId,
    field,
    userId: session?.workerId ?? "system",
    sana: new Date().toISOString(),
    hash: makeHash(`${docType}${docId}${field}${session?.workerId}${Date.now()}`),
  });

  /* -------------------- amallar -------------------- */

  const login: Ctx["login"] = (tabel) => {
    const w = db.workers.find((x) => x.tabel === tabel.trim() && x.faol);
    if (!w) return null;
    setSession({ workerId: w.id, roleAs: null });
    return w;
  };

  const logout = () => setSession(null);
  const setRoleAs = (r: Role | null) => setSession((s) => (s ? { ...s, roleAs: r } : s));
  const reset = () => {
    setDb(makeSeed());
    setSession(null);
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(SKEY);
    } catch {}
  };

  const createRequest: Ctx["createRequest"] = (workerId, itemIds, turi = "oddiy") => {
    let created: AppRequest | null = null;
    update((d) => {
      d.seq += 1;
      const r: AppRequest = {
        id: `r${Date.now()}`,
        raqam: `TCH6-${new Date().getFullYear()}-${String(d.seq).padStart(5, "0")}`,
        workerId,
        turi,
        status: "SUBMITTED",
        lines: itemIds.map((id) => {
          const it = d.items.find((x) => x.id === id)!;
          return { itemId: id, soni: 1, unit: it.unit, narx: it.narx };
        }),
        yaratganId: session?.workerId ?? workerId,
        yaratilgan: iso(TODAY()),
        transitions: [
          { from: "DRAFT", to: "SUBMITTED", userId: session?.workerId ?? workerId, sana: new Date().toISOString() },
        ],
        imzolar: [sign(d, "requisition", `r${Date.now()}`, "12")],
      };
      d.requests.unshift(r);
      created = r;
      audit(d, `ariza ${r.raqam}`, "yaratildi");
      notify(d, workerId, "Ariza yuborildi", `${r.raqam} — bugalteriya koʻrigida`);
    });
    return created;
  };

  const advance: Ctx["advance"] = (reqId, izoh) => {
    update((d) => {
      const r = d.requests.find((x) => x.id === reqId);
      if (!r) return;
      const to = nextStatus(r.status);
      if (!to) return;
      const fieldMap: Partial<Record<RequestStatus, string>> = {
        SUBMITTED: "06",
        ACCOUNTANT_APPROVED: "14",
        CHIEF_APPROVED: "05",
        HEAD_APPROVED: "11",
        ISSUED: "12",
      };
      const f = fieldMap[r.status];
      if (f) r.imzolar.push(sign(d, "requisition", r.id, f));
      r.transitions.push({
        from: r.status,
        to,
        userId: session?.workerId ?? "system",
        sana: new Date().toISOString(),
        izoh,
      });
      r.status = to;

      if (to === "COMPLETED") {
        r.yakunlangan = iso(TODAY());
        const card = d.cards.find((c) => c.workerId === r.workerId);
        r.lines.forEach((l) => {
          const s = d.stock.find((x) => x.itemId === l.itemId);
          if (s) s.qoldiq = Math.max(0, s.qoldiq - l.soni);
          d.moves.unshift({
            id: `mv${Date.now()}${l.itemId}`,
            itemId: l.itemId,
            turi: "chiqim",
            soni: l.soni,
            sana: iso(TODAY()),
            izoh: `Ariza ${r.raqam}`,
            hujjatId: r.id,
          });
          card?.berilgan.push({
            id: `ci${Date.now()}${l.itemId}`,
            itemId: l.itemId,
            sana: iso(TODAY()),
            soni: l.soni,
            yaroqlilik: 100,
            imzoId: sign(d, "card", card.id, "25").id,
          });
        });
        notify(d, r.workerId, "Ariza yakunlandi", `${r.raqam} — buyumlar kartochkangizga qayd etildi`);
      } else {
        notify(d, r.workerId, "Ariza holati oʻzgardi", `${r.raqam} — keyingi bosqichga oʻtdi`);
      }
      audit(d, `ariza ${r.raqam}`, `holat → ${to}`, izoh);
    });
  };

  const reject: Ctx["reject"] = (reqId, izoh) => {
    update((d) => {
      const r = d.requests.find((x) => x.id === reqId);
      if (!r) return;
      const who = d.workers.find((w) => w.id === session?.workerId);
      r.transitions.push({
        from: r.status,
        to: "REJECTED",
        userId: session?.workerId ?? "system",
        sana: new Date().toISOString(),
        izoh,
      });
      r.status = "REJECTED";
      notify(
        d,
        r.workerId,
        "Ariza rad etildi",
        `${r.raqam} — ${who ? `${who.familiya} ${who.ism}` : "masʼul shaxs"} tomonidan. Sabab: ${izoh || "koʻrsatilmagan"}`,
        "reject"
      );
      audit(d, `ariza ${r.raqam}`, "rad etildi", izoh);
    });
  };

  const addJournal: Ctx["addJournal"] = (e) => {
    update((d) => {
      d.journal.unshift({ ...e, id: `j${Date.now()}` });
      audit(d, `jurnal ${e.bosqich}-bosqich`, "yozuv qoʻshildi");
    });
  };

  const signJournal: Ctx["signJournal"] = (id, izoh) => {
    update((d) => {
      const j = d.journal.find((x) => x.id === id);
      if (!j) return;
      j.bajarildi = true;
      j.bajarilganIzoh = izoh;
      j.imzo = sign(d, "journal", id, "07");
      audit(d, `jurnal yozuvi ${id}`, "bajarildi va imzolandi");
    });
  };

  const stockIn: Ctx["stockIn"] = (itemId, soni, izoh) => {
    update((d) => {
      const s = d.stock.find((x) => x.itemId === itemId);
      if (s) s.qoldiq += soni;
      else d.stock.push({ itemId, qoldiq: soni });
      d.moves.unshift({
        id: `mv${Date.now()}`,
        itemId,
        turi: "kirim",
        soni,
        sana: iso(TODAY()),
        izoh,
      });
      audit(d, `ombor ${itemId}`, `kirim +${soni}`, izoh);
    });
  };

  const toggleTalon: Ctx["toggleTalon"] = (workerId, raqam, sabab) => {
    update((d) => {
      const t = d.talons.find((x) => x.workerId === workerId && x.raqam === raqam);
      if (!t) return;
      const amal = t.olingan ? "qaytarildi" : "olindi";
      t.olingan = !t.olingan;
      t.tarix.unshift({
        amal,
        sana: new Date().toISOString(),
        tbXodimId: session?.workerId ?? "system",
        sabab,
      });
      notify(
        d,
        workerId,
        amal === "olindi" ? "Talon olindi" : "Talon qaytarildi",
        `${raqam}-sonli talon ${amal}${sabab ? `. Sabab: ${sabab}` : ""}`
      );
      audit(d, `talon ${raqam} / ${workerId}`, amal, sabab);
    });
  };

  const addKip: Ctx["addKip"] = (k) => {
    update((d) => {
      const id = `k${Date.now()}`;
      const tugash = iso(addMonths(new Date(k.sana), k.muddatOy));
      d.kips.unshift({ ...k, id, tugash, imzoId: sign(d, "kip", id, "04").id });
      notify(d, k.workerId, "Yangi KIP", `${k.liniya} · ${k.muddatOy} oy · tugash: ${tugash}`);
      audit(d, `KIP ${id}`, "yozildi");
    });
  };

  const setExam: Ctx["setExam"] = (workerId, sana, davriylikOy) => {
    update((d) => {
      const e = d.exams.find((x) => x.workerId === workerId);
      if (e) {
        e.oxirgi = sana;
        e.davriylikOy = davriylikOy;
        e.natija = "otdi";
      } else {
        d.exams.push({ workerId, oxirgi: sana, davriylikOy, natija: "otdi" });
      }
      notify(d, workerId, "TB imtixoni", `Keyingi imtixon: ${iso(addMonths(new Date(sana), davriylikOy))}`);
      audit(d, `imtixon ${workerId}`, "yangilandi");
    });
  };

  const upsertItem: Ctx["upsertItem"] = (it) =>
    update((d) => {
      const i = d.items.findIndex((x) => x.id === it.id);
      if (i >= 0) d.items[i] = it;
      else {
        d.items.push(it);
        d.stock.push({ itemId: it.id, qoldiq: 0 });
      }
      audit(d, `buyum ${it.nomi}`, "saqlandi");
    });

  const upsertNorm: Ctx["upsertNorm"] = (n) =>
    update((d) => {
      const i = d.norms.findIndex((x) => x.id === n.id);
      if (i >= 0) d.norms[i] = n;
      else d.norms.push(n);
      audit(d, `norma ${n.id}`, "saqlandi");
    });

  const removeNorm: Ctx["removeNorm"] = (id) =>
    update((d) => {
      d.norms = d.norms.filter((n) => n.id !== id);
      audit(d, `norma ${id}`, "oʻchirildi");
    });

  const upsertWorker: Ctx["upsertWorker"] = (w) =>
    update((d) => {
      const i = d.workers.findIndex((x) => x.id === w.id);
      if (i >= 0) d.workers[i] = w;
      else {
        d.workers.push(w);
        d.cards.push({ id: `c${w.id}`, workerId: w.id, ochilgan: iso(TODAY()), berilgan: [], qaytarilgan: [], imzolar: {} });
        ([1, 2, 3] as const).forEach((r) => d.talons.push({ workerId: w.id, raqam: r, olingan: false, tarix: [] }));
      }
      audit(d, `ishchi ${w.tabel}`, "saqlandi");
    });

  const value: Ctx = {
    db, session, me, roles, ready,
    can: (p) => can(roles, p),
    login, logout, setRoleAs, reset, update,
    createRequest, advance, reject,
    addJournal, signJournal, stockIn, toggleTalon, addKip, setExam,
    upsertItem, upsertNorm, removeNorm, upsertWorker,
  };

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useStore() {
  const c = useContext(C);
  if (!c) throw new Error("useStore StoreProvider ichida ishlatilishi kerak");
  return c;
}
