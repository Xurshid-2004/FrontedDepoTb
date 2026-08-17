"use client";

/* ------------------------------------------------------------------
   TB tizimi — ilova holati.

   ARXITEKTURA (Django backend):
     • Maʼlumot manbai — FAQAT server. Har bir amal Django'ga yuboriladi,
       server tekshiradi, bajaradi va yangilangan holatni qaytaradi.
     • localStorage'da ilova maʼlumoti SAQLANMAYDI. U yerda faqat kirish
       tokenlari turadi (lib/api.ts). Brauzerni tozalash maʼlumotni
       yoʻqotmaydi — hammasi bazada.
     • Amallar NAVBAT bilan bajariladi: ketma-ket chaqirilgan ikkita amal
       (masalan updateRequest → advance) tartibini saqlaydi.

   Sahifalar uchun interfeys deyarli oʻzgarmagan: db.workers, db.requests,
   can(...), advance(...) — hammasi avvalgidek ishlaydi.
------------------------------------------------------------------ */

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import type {
  AppRequest, BugalterFields, DB, IncidentEntry, Item, JournalEntry, Kip,
  Norm, Position, RequestLine, Role, Unit, Worker,
} from "./types";
import { workerPositionIds } from "./logic";
import { resolveAccess, type AccessKey, type FeatureKey, type Perm } from "./permissions";
import { api, ApiError, tokens, type MeUser } from "./api";

type Session = { workerId: string; roleAs: Role | null } | null;

/** Ishchini saqlash uchun yuboriladigan yozuv.
 *  Yangi ishchida `id` boʻlmaydi — UUID'ni server yaratadi.
 *  `pin` — admin belgilaydigan boshlangʻich PIN (ixtiyoriy). */
export type WorkerYozuv = Omit<Worker, "id"> & { id?: string; pin?: string };

/** Ommaviy import uchun bitta qator */
export type ImportRow = {
  tabel: string;
  familiya: string;
  ism: string;
  otasi?: string;
  positionId?: string;
  faceImage?: string;
};

type Ctx = {
  db: DB;
  session: Session;
  me: Worker | null;
  roles: Role[];
  ready: boolean;
  /** Serverdan kelgan oxirgi xato — UI koʻrsatishi uchun */
  xato: string | null;
  tozalaXato: () => void;
  /** Amal bajarilmoqda (spinner uchun) */
  yuklanmoqda: boolean;

  can: (p: Perm) => boolean;
  canFeature: (f: FeatureKey) => boolean;

  login: (tabel: string, pin: string) => Promise<"ok" | "pin" | "xato">;
  /** Yuz bilan kirish — mos kelmasa {ok:false} qaytadi va PIN'ga oʻtiladi.
   *
   *  `status` — serverning javob kodi. U orqali «yuz mos kelmadi» (401,
   *  qayta urinish maʼnoli) bilan «bu hisobda yuz yoʻq / xizmat ishlamayapti»
   *  (qayta urinish befoyda) holatlari ajratiladi. */
  faceLogin: (
    tabel: string,
    frames: string[]
  ) => Promise<{ ok: boolean; xato?: string; status?: number }>;
  /** Roʻyxatdan oʻtish — frames boʻsh boʻlsa faqat PIN bilan */
  register: (
    tabel: string,
    pin: string,
    frames: string[]
  ) => Promise<{ ok: boolean; xato?: string; faceSaqlandi?: boolean; faceXabar?: string }>;
  logout: () => void;
  setRoleAs: (r: Role | null) => void;
  /** Holatni serverdan qayta yuklash */
  reset: () => Promise<void>;

  // amallar
  createRequest: (workerId: string, itemIds: string[], turi?: AppRequest["turi"]) => Promise<void>;
  updateRequest: (reqId: string, patch: { lines?: RequestLine[]; bugField?: BugalterFields }) => Promise<void>;
  advance: (reqId: string, izoh?: string) => Promise<void>;
  reject: (reqId: string, izoh: string) => Promise<void>;
  /** Jurnalga yozuv qoʻshadi. Server qabul qilsa `true` qaytadi. */
  addJournal: (e: Omit<JournalEntry, "id">) => Promise<boolean>;
  /** 7-ustunni tasdiqlaydi (QR imzo). Server qabul qilsa `true`. */
  signJournal: (id: string, izoh: string) => Promise<boolean>;
  stockIn: (itemId: string, soni: number, izoh: string) => Promise<void>;
  toggleTalon: (workerId: string, raqam: 1 | 2 | 3, sabab?: string) => Promise<void>;
  addKip: (k: Omit<Kip, "id" | "tugash" | "imzoId">) => Promise<void>;
  setExam: (workerId: string, sana: string, davriylikOy: number) => Promise<void>;
  upsertItem: (it: Item) => Promise<void>;
  upsertNorm: (n: Norm) => Promise<void>;
  removeNorm: (id: string) => Promise<void>;
  /** Yangi ishchida id boʻlmaydi — serverda UUID yaratiladi.
   *  `pin` berilsa boshlangʻich PIN oʻrnatiladi (ixtiyoriy).
   *  Saqlansa `null`, xato boʻlsa xato matni qaytadi. */
  upsertWorker: (w: WorkerYozuv) => Promise<string | null>;
  addPosition: (nomi: string) => Promise<Position | null>;
  renamePosition: (id: string, nomi: string) => Promise<void>;
  archivePosition: (id: string, arxiv: boolean) => Promise<void>;
  addUnit: (u: string) => Promise<void>;
  removeUnit: (u: Unit) => Promise<void>;
  setRoleAccess: (role: Role, key: AccessKey, value: boolean | null) => Promise<void>;
  setPositionAccess: (positionId: string, key: AccessKey, value: boolean | null) => Promise<void>;
  setUserAccess: (workerId: string, key: AccessKey, value: boolean | null) => Promise<void>;
  importWorkers: (rows: ImportRow[], positionId: string) => Promise<number>;
  setWorkerPin: (workerId: string, pin: string) => Promise<void>;
  clearWorkerPin: (workerId: string) => Promise<void>;
  /** Ishchining Face ID'sini oʻchirish (admin) */
  resetWorkerFace: (workerId: string) => Promise<void>;
  /** Ishchini oʻchirish (soft-delete). Xato boʻlsa matn qaytadi. */
  deleteWorker: (workerId: string) => Promise<string | null>;
  addIncident: (turi: IncidentEntry["turi"], matn: string) => Promise<void>;
};

const C = createContext<Ctx | null>(null);

/* ------------------------------------------------------------------
   Boshlangʻich boʻsh holat — server javobi kelgunicha shu ishlatiladi.
   Demo/seed maʼlumot ISHLATILMAYDI: ekranda hech qachon soxta yozuv
   koʻrinmasligi kerak.
------------------------------------------------------------------ */

function bosh(): DB {
  return {
    depo: { id: "", kod: "", nomi: "", tashkilot: "", qishBoshi: "09-15", qishOxiri: "04-15" },
    positions: [], items: [], norms: [], workers: [], cards: [], requests: [],
    journal: [], stock: [], moves: [], talons: [], exams: [], kips: [],
    notifications: [], incidents: [], audit: [],
    lines: [], units: [],
    access: { roleOverrides: {}, positionOverrides: {}, userOverrides: {} },
    seq: 0,
  };
}

/** Server javobida boʻsh kelishi mumkin boʻlgan maydonlarni toʻldiramiz. */
function normalize(d: DB): DB {
  const b = bosh();
  return {
    ...b,
    ...d,
    access: {
      roleOverrides: d.access?.roleOverrides ?? {},
      positionOverrides: d.access?.positionOverrides ?? {},
      userOverrides: d.access?.userOverrides ?? {},
    },
    lines: Array.isArray(d.lines) ? d.lines : [],
    units: Array.isArray(d.units) && d.units.length ? d.units : b.units,
    incidents: Array.isArray(d.incidents) ? d.incidents : [],
  };
}

/* ------------------------------------------------------------------ */

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(bosh);
  const [meUser, setMeUser] = useState<MeUser | null>(null);
  const [roleAs, setRoleAsState] = useState<Role | null>(null);
  const [ready, setReady] = useState(false);
  const [xato, setXato] = useState<string | null>(null);
  const [band, setBand] = useState(0);

  /* --- amallar navbati: tartibni saqlash uchun --- */
  const navbat = useRef<Promise<unknown>>(Promise.resolve());

  const yugur = useCallback(
    <T,>(fn: () => Promise<T>, holatOl?: (r: T) => DB | undefined): Promise<T | null> => {
      const keyingi = navbat.current.then(async () => {
        setBand((n) => n + 1);
        try {
          const r = await fn();
          const yangi = holatOl ? holatOl(r) : (r as { state?: DB })?.state;
          if (yangi) setDb(normalize(yangi));
          return r;
        } catch (e) {
          const xabar = e instanceof ApiError ? e.message : "Kutilmagan xato";
          setXato(xabar);
          if (e instanceof ApiError && e.status === 401) {
            tokens.clear();
            setMeUser(null);
          }
          return null;
        } finally {
          setBand((n) => n - 1);
        }
      });
      navbat.current = keyingi;
      return keyingi as Promise<T | null>;
    },
    []
  );

  /* --- boshlangʻich yuklash --- */
  const yukla = useCallback(async () => {
    if (!tokens.access && !tokens.refresh) {
      setMeUser(null);
      setDb(bosh());
      setReady(true);
      return;
    }
    try {
      const [u, state] = await Promise.all([api.me(), api.getState()]);
      setMeUser(u);
      setDb(normalize(state));
    } catch (e) {
      // Token eskirgan yoki server yoʻq — chiqib turamiz
      if (e instanceof ApiError && e.status === 401) tokens.clear();
      setMeUser(null);
      setDb(bosh());
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void yukla();
  }, [yukla]);

  /* --- oynalar orasidagi devor ---------------------------------------
     Tokenlar localStorage'da, u esa BITTA domenning barcha oynalari
     uchun umumiy. Yaʼni bir oynada boshqa hisob bilan kirilsa, qolgan
     oynalar ham jimgina oʻsha hisobga oʻtib qolardi: ekranda admin
     paneli turadi, soʻrovlar esa ishchi nomidan ketadi.

     `storage` hodisasi FAQAT boshqa oynalarda ishlaydi — shuning uchun
     kirish/chiqish sodir boʻlgan oynaning oʻzi qayta yuklanmaydi.
  ------------------------------------------------------------------ */
  useEffect(() => {
    const kuzat = (e: StorageEvent) => {
      // null — localStorage.clear() chaqirilgan
      if (e.key !== null && e.key !== "tb_access" && e.key !== "tb_refresh") return;
      setReady(false);
      void yukla();
    };
    window.addEventListener("storage", kuzat);
    return () => window.removeEventListener("storage", kuzat);
  }, [yukla]);

  /* --- joriy foydalanuvchi (toʻliq Worker obyekti sifatida) --- */
  const me = useMemo<Worker | null>(() => {
    if (!meUser) return null;
    return db.workers.find((w) => w.id === meUser.id) ?? null;
  }, [db.workers, meUser]);

  const session = useMemo<Session>(
    () => (meUser ? { workerId: meUser.id, roleAs } : null),
    [meUser, roleAs]
  );

  const roles = useMemo<Role[]>(() => {
    if (!meUser) return [];
    if (roleAs) return [roleAs];
    return (meUser.roles as Role[]) ?? [];
  }, [meUser, roleAs]);

  const myPositionIds = me ? workerPositionIds(me) : undefined;

  /* ---------------- kirish / chiqish ---------------- */

  /** Kirish muvaffaqiyatli — foydalanuvchi va toʻliq holat oʻrnatiladi */
  const kirdi = useCallback(async (u: MeUser) => {
    setMeUser(u);
    setDb(normalize(await api.getState()));
    setReady(true);
  }, []);

  const login: Ctx["login"] = useCallback(async (tabel, pin) => {
    setXato(null);
    try {
      const r = await api.login(tabel, pin);
      if (r.kutilmoqda === "pin") return "pin";
      await kirdi(r.user);
      return "ok";
    } catch (e) {
      setXato(e instanceof ApiError ? e.message : "Kirishda xato");
      return "xato";
    }
  }, [kirdi]);

  const faceLogin: Ctx["faceLogin"] = useCallback(async (tabel, frames) => {
    setXato(null);
    try {
      await kirdi(await api.faceLogin(tabel, frames));
      return { ok: true };
    } catch (e) {
      // Yuz mos kelmasa bu ODATIY holat — chaqiruvchi PIN'ga oʻtadi,
      // shuning uchun global xatoga yozilmaydi.
      return {
        ok: false,
        xato: e instanceof ApiError ? e.message : "Yuz tekshirilmadi",
        status: e instanceof ApiError ? e.status : undefined,
      };
    }
  }, [kirdi]);

  const register: Ctx["register"] = useCallback(async (tabel, pin, frames) => {
    setXato(null);
    try {
      const r = await api.register(tabel, pin, frames);
      await kirdi(r.user);
      return { ok: true, faceSaqlandi: r.faceSaqlandi, faceXabar: r.faceXabar };
    } catch (e) {
      return {
        ok: false,
        xato: e instanceof ApiError ? e.message : "Roʻyxatdan oʻtishda xato",
      };
    }
  }, [kirdi]);

  const logout: Ctx["logout"] = useCallback(() => {
    void api.logout();
    setMeUser(null);
    setRoleAsState(null);
    setDb(bosh());
  }, []);

  const setRoleAs: Ctx["setRoleAs"] = useCallback((r) => setRoleAsState(r), []);

  const reset: Ctx["reset"] = useCallback(async () => {
    await yukla();
  }, [yukla]);

  /* ---------------- amallar ---------------- */

  const bekor = async () => {};   // tur mosligi uchun

  const value: Ctx = {
    db,
    session,
    me,
    roles,
    ready,
    xato,
    tozalaXato: () => setXato(null),
    yuklanmoqda: band > 0,

    can: (p) => resolveAccess(p, roles, meUser?.id, db.access, false, myPositionIds),
    canFeature: (f) => resolveAccess(f, roles, meUser?.id, db.access, true, myPositionIds),

    login,
    faceLogin,
    register,
    logout,
    setRoleAs,
    reset,

    /* --- arizalar --- */
    createRequest: async (workerId, itemIds, turi = "oddiy") => {
      await yugur(() => api.createRequest(workerId, itemIds, turi));
    },
    updateRequest: async (reqId, patch) => {
      await yugur(() => api.updateRequest(reqId, patch as Record<string, unknown>));
    },
    advance: async (reqId, izoh) => {
      await yugur(() => api.advanceRequest(reqId, izoh));
    },
    reject: async (reqId, izoh) => {
      await yugur(() => api.rejectRequest(reqId, izoh));
    },

    /* --- jurnal --- */
    addJournal: async (e) => {
      // `yugur` xato boʻlsa null qaytaradi — chaqiruvchi shundan
      // muvaffaqiyatni biladi va soxta «saqlandi» xabari chiqmaydi.
      const r = await yugur(() => api.addJournal(e as unknown as Record<string, unknown>));
      return !!r?.ok;
    },
    signJournal: async (id, izoh) => {
      const r = await yugur(() => api.signJournal(id, izoh));
      return !!r?.ok;
    },

    /* --- ombor --- */
    stockIn: async (itemId, soni, izoh) => {
      await yugur(() => api.stockIn(itemId, soni, izoh));
    },

    /* --- talon / KIP / imtixon --- */
    toggleTalon: async (workerId, raqam, sabab) => {
      await yugur(() => api.toggleTalon(workerId, raqam, sabab));
    },
    addKip: async (k) => {
      await yugur(() => api.addKip(k as unknown as Record<string, unknown>));
    },
    setExam: async (workerId, sana, davriylikOy) => {
      await yugur(() => api.setExam(workerId, sana, davriylikOy));
    },

    /* --- buyum / norma --- */
    upsertItem: async (it) => {
      await yugur(() => api.upsertItem(it as unknown as Record<string, unknown>));
    },
    upsertNorm: async (n) => {
      await yugur(() => api.upsertNorm(n as unknown as Record<string, unknown>));
    },
    removeNorm: async (id) => {
      await yugur(() => api.removeNorm(id));
    },

    /* --- ishchilar --- */
    upsertWorker: async (w) => {
      // Xato matnini forma joyida koʻrsatish uchun ushlab qolamiz —
      // yugur() uni global holatga yozadi va null qaytaradi.
      const tut: { xabar: string | null } = { xabar: null };
      const r = await yugur(() =>
        api.upsertWorker(w as unknown as Record<string, unknown>).catch((e: unknown) => {
          tut.xabar = e instanceof ApiError ? e.message : "Kutilmagan xato";
          throw e;
        })
      );
      return r === null ? tut.xabar ?? "Ishchi saqlanmadi" : null;
    },
    importWorkers: async (rows, positionId) => {
      const r = await yugur(() => api.importWorkers(rows, positionId));
      return (r as { added?: number } | null)?.added ?? 0;
    },
    setWorkerPin: async (workerId, pin) => {
      await yugur(() => api.setWorkerPin(workerId, pin));
    },
    clearWorkerPin: async (workerId) => {
      await yugur(() => api.clearWorkerPin(workerId));
    },
    resetWorkerFace: async (workerId) => {
      await yugur(() => api.resetWorkerFace(workerId));
    },
    deleteWorker: async (workerId) => {
      // Server rad etishi mumkin (oxirgi admin, oʻzini oʻchirish) —
      // sababni foydalanuvchiga aynan koʻrsatamiz.
      const tut: { xabar: string | null } = { xabar: null };
      const r = await yugur(() =>
        api.deleteWorker(workerId).catch((e: unknown) => {
          tut.xabar = e instanceof ApiError ? e.message : "Kutilmagan xato";
          throw e;
        })
      );
      return r === null ? tut.xabar ?? "Oʻchirilmadi" : null;
    },

    /* --- lavozim / birlik --- */
    addPosition: async (nomi) => {
      const r = await yugur(() => api.addPosition(nomi));
      const id = (r as { id?: string } | null)?.id;
      const state = (r as { state?: DB } | null)?.state;
      if (!id || !state) return null;
      return state.positions.find((p) => p.id === id) ?? null;
    },
    renamePosition: async (id, nomi) => {
      await yugur(() => api.updatePosition(id, { nomi }));
    },
    archivePosition: async (id, arxiv) => {
      await yugur(() => api.updatePosition(id, { arxiv }));
    },
    addUnit: async (u) => {
      await yugur(() => api.addUnit(u));
    },
    removeUnit: async (u) => {
      await yugur(() => api.removeUnit(u));
    },

    /* --- ruxsatlar --- */
    setRoleAccess: async (role, key, value) => {
      await yugur(() => api.setAccess("role", role, key, value));
    },
    setPositionAccess: async (positionId, key, value) => {
      await yugur(() => api.setAccess("position", positionId, key, value));
    },
    setUserAccess: async (workerId, key, value) => {
      await yugur(() => api.setAccess("user", workerId, key, value));
    },

    /* --- xodisalar --- */
    addIncident: async (turi, matn) => {
      await yugur(() => api.addIncident(turi, matn));
    },
  };

  void bekor;

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useStore() {
  const c = useContext(C);
  if (!c) throw new Error("useStore StoreProvider ichida ishlatilishi kerak");
  return c;
}
