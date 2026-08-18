"use client";
/* ------------------------------------------------------------------
   TB tizimi — Django backend bilan ishlovchi REST klient.

   Muhim qoidalar:
     • Bu yerda HECH QANDAY biznes qaror qabul qilinmaydi. Har bir amal
       serverga yuboriladi, server tekshiradi va yangilangan holatni
       qaytaradi.
     • localStorage'da FAQAT tokenlar saqlanadi. Ilova maʼlumoti
       (ishchilar, arizalar, ombor ...) hech qachon diskka yozilmaydi.
     • 401 kelganda access token bir marta yangilanadi va soʻrov
       qaytariladi.
------------------------------------------------------------------ */

import type { DB } from "./types";

/** Django manzili. Boʻsh boʻlsa — shu domendan (Caddy yoki Vercel rewrite
 *  soʻrovni Django'ga uzatadi).
 *
 *  Vercel'da NEXT_PUBLIC_API_BASE ataylab eʼtiborsiz qoldiriladi: panelda
 *  u eski, oʻchirilgan servis manziliga sozlangan qolib ketgan va soʻrovlar
 *  oʻsha yerga ketib 503 qaytarardi. U yerda manzil boʻsh boʻlishi kerak —
 *  qolganini next.config.mjs dagi rewrite hal qiladi. */
export const API_BASE = process.env.NEXT_PUBLIC_API_PROXY
  ? ""
  : (process.env.NEXT_PUBLIC_API_BASE ?? "");

const PREFIX = "/api/v1";
const AKEY = "tb_access";
const RKEY = "tb_refresh";

/** Soʻrov shundan uzoq kutmaydi.
 *
 *  fetch'da standart timeout YOʻQ. Server qayta ishga tushayotgan yoki
 *  osilib qolgan boʻlsa soʻrov abadiy tugamaydi — natijada boshlangʻich
 *  yuklash tugamay, ekran boʻsh qolardi. Endi har bir soʻrov albatta
 *  yakunlanadi (yo javob, yo xato). */
const TIMEOUT_MS = 30_000;

/** fetch + majburiy timeout */
async function fetchTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const soat = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(soat);
  }
}


/* ------------------------------------------------------------------
   Tokenlar — yagona localStorage ishlatiladigan joy
------------------------------------------------------------------ */

export const tokens = {
  get access(): string | null {
    return typeof window === "undefined" ? null : localStorage.getItem(AKEY);
  },
  get refresh(): string | null {
    return typeof window === "undefined" ? null : localStorage.getItem(RKEY);
  },
  set(access: string | null, refresh?: string | null) {
    if (typeof window === "undefined") return;
    if (access) localStorage.setItem(AKEY, access);
    else localStorage.removeItem(AKEY);
    if (refresh !== undefined) {
      if (refresh) localStorage.setItem(RKEY, refresh);
      else localStorage.removeItem(RKEY);
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(AKEY);
    localStorage.removeItem(RKEY);
  },
};

/* ------------------------------------------------------------------
   Xato turi — UI shu xabarni koʻrsatadi
------------------------------------------------------------------ */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Ulanish/timeout xatosini oʻqiladigan xabarga aylantiradi */
function ulanishXatosi(e: unknown): ApiError {
  const uzildi = e instanceof DOMException && e.name === "AbortError";
  return new ApiError(
    uzildi
      ? "Server javob bermadi — qayta urinib koʻring"
      : "Serverga ulanib boʻlmadi. Internet aloqasini tekshiring",
    0
  );
}

/* ------------------------------------------------------------------
   Asosiy soʻrov yuboruvchi
------------------------------------------------------------------ */

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Bu manzillarda 401 — "maʼlumot notoʻgʻri" degani, "token eskirgan" emas.
 *
 * Ular uchun token yangilab qayta yuborish XATO boʻlardi: notoʻgʻri PIN
 * serverga IKKI marta borardi — audit ikki marta yozilar, kirish urinishi
 * chegarasi (20/min) ikki barobar tez tugardi.
 */
const QAYTA_URINILMAYDI = [
  "/auth/login",
  "/auth/check",
  "/auth/register",
  "/auth/face-login",
  "/auth/set-pin",
  "/auth/refresh",
];

let yangilanmoqda: Promise<boolean> | null = null;

/** Access token'ni yangilash — bir vaqtda faqat bitta urinish ketadi. */
async function refreshAccess(): Promise<boolean> {
  if (yangilanmoqda) return yangilanmoqda;

  yangilanmoqda = (async () => {
    const rt = tokens.refresh;
    if (!rt) return false;
    try {
      const res = await fetchTimeout(`${API_BASE}${PREFIX}/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refresh: rt }),
      });
      if (!res.ok) {
        tokens.clear();
        return false;
      }
      const d = (await res.json()) as { access?: string };
      if (!d.access) {
        tokens.clear();
        return false;
      }
      tokens.set(d.access);
      return true;
    } catch {
      return false;
    } finally {
      yangilanmoqda = null;
    }
  })();

  return yangilanmoqda;
}

async function so(
  path: string,
  method: Method = "GET",
  body?: unknown,
  qayta = true
): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  const at = tokens.access;
  if (at) headers.authorization = `Bearer ${at}`;

  let res: Response;
  try {
    res = await fetchTimeout(`${API_BASE}${PREFIX}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch (e) {
    throw ulanishXatosi(e);
  }

  // Token eskirgan — bir marta yangilab, qayta urinamiz.
  // Autentifikatsiya manzillari bundan mustasno (yuqoridagi izohga qarang).
  if (
    res.status === 401 &&
    qayta &&
    tokens.refresh &&
    !QAYTA_URINILMAYDI.some((p) => path.startsWith(p))
  ) {
    if (await refreshAccess()) return so(path, method, body, false);
  }

  const matn = await res.text();
  let d: unknown = null;
  if (matn) {
    try {
      d = JSON.parse(matn);
    } catch {
      d = null;
    }
  }

  if (!res.ok) {
    const xabar =
      (d as { error?: string } | null)?.error ??
      (res.status === 401
        ? "Sessiya tugadi — qaytadan kiring"
        : `Xato (${res.status})`);
    throw new ApiError(xabar, res.status);
  }

  return d;
}

/** Amal javobidan yangi holatni ajratib olish */
type AmalJavob = { ok: boolean; state: DB; [k: string]: unknown };

async function amal(path: string, method: Method, body?: unknown): Promise<AmalJavob> {
  return (await so(path, method, body)) as AmalJavob;
}

/* ------------------------------------------------------------------
   Foydalanuvchi turi — serverdan keladigan shakl
------------------------------------------------------------------ */

export type MeUser = {
  id: string;
  tabel: string;
  familiya: string;
  ism: string;
  otasi: string;
  fio: string;
  roles: string[];
  positionId: string;
  positionIds: string[];
  pinSet: boolean;
  pinReset: boolean;
  faceUrl: string | null;
  perms: string[];
  features: string[];
};

export type LoginJavob =
  | { kutilmoqda: "pin"; tabel: string }
  | { kutilmoqda: "tayyor"; user: MeUser };

/** Tabel raqamini tekshirish natijasi — kirish formasi shunga qarab yoʻl tanlaydi */
export type TabelHolat = {
  /** Kadrlar bazasida shunday tabel bormi */
  bor: boolean;
  /** Hali roʻyxatdan oʻtmagan — roʻyxatdan oʻtish oqimiga yuboriladi */
  royxatKerak: boolean;
  /** Admin majburiy PIN almashtirishga qoʻygan */
  pinKerak: boolean;
  /** Ishchining saqlangan yuz vektori bormi */
  faceBor: boolean;
  /** Yuz tanish xizmati umuman sozlanganmi */
  faceYoqilgan: boolean;
  /** Niqoblangan F.I.Sh. — "Abduvaliyev O. O." */
  fio: string;
};

/* ------------------------------------------------------------------
   API
------------------------------------------------------------------ */

export const api = {
  /* ---------------- autentifikatsiya ---------------- */

  /**
   * Tabel + PIN bilan kirish.
   * PIN SERVERDA tekshiriladi — brauzerda hech qanday hash yoʻq.
   *
   * PIN hali oʻrnatilmagan boʻlsa {kutilmoqda:"pin"} qaytadi.
   */
  async login(tabel: string, pin: string): Promise<LoginJavob> {
    const d = (await so("/auth/login", "POST", { tabel: tabel.trim(), pin })) as {
      needsPin?: boolean;
      access?: string;
      refresh?: string;
      user?: MeUser;
    };

    if (d.needsPin) return { kutilmoqda: "pin", tabel: tabel.trim() };

    tokens.set(d.access ?? null, d.refresh ?? null);
    return { kutilmoqda: "tayyor", user: d.user as MeUser };
  },

  /**
   * Tabel raqamini tekshirish — keyingi qadam nima ekanini server aytadi.
   * (Yuz bormi, roʻyxatdan oʻtganmi, PIN kerakmi.)
   */
  async tabelTekshir(tabel: string): Promise<TabelHolat> {
    const d = (await so("/auth/check", "POST", { tabel: tabel.trim() })) as Partial<TabelHolat>;
    return {
      bor: !!d.bor,
      royxatKerak: !!d.royxatKerak,
      pinKerak: !!d.pinKerak,
      faceBor: !!d.faceBor,
      faceYoqilgan: !!d.faceYoqilgan,
      fio: d.fio ?? "",
    };
  },

  /**
   * Yuz bilan kirish. Bir nechta kadr yuboriladi (jonlilik uchun).
   * Mos kelmasa ApiError koʻtariladi — chaqiruvchi PIN'ga oʻtadi.
   */
  async faceLogin(tabel: string, frames: string[]): Promise<MeUser> {
    const d = (await so("/auth/face-login", "POST", { tabel: tabel.trim(), frames })) as {
      access?: string;
      refresh?: string;
      user?: MeUser;
    };
    tokens.set(d.access ?? null, d.refresh ?? null);
    return d.user as MeUser;
  },

  /**
   * Roʻyxatdan oʻtish — faqat kadrlar bazasida BOR tabel raqami uchun.
   * `frames` boʻsh boʻlsa faqat PIN bilan oʻtiladi (kamera yoʻq holati).
   */
  async register(
    tabel: string,
    pin: string,
    frames: string[]
  ): Promise<{ user: MeUser; faceSaqlandi: boolean; faceXabar: string }> {
    const d = (await so("/auth/register", "POST", { tabel: tabel.trim(), pin, frames })) as {
      access?: string;
      refresh?: string;
      user?: MeUser;
      faceSaqlandi?: boolean;
      faceXabar?: string;
    };
    tokens.set(d.access ?? null, d.refresh ?? null);
    return {
      user: d.user as MeUser,
      faceSaqlandi: !!d.faceSaqlandi,
      faceXabar: d.faceXabar ?? "",
    };
  },

  /** Oʻz Face ID'sini qoʻshish / yangilash (kirgan foydalanuvchi) */
  setMyFace: (frames: string[]) =>
    so("/me/face", "POST", { frames }) as Promise<{ ok: boolean; faceBor: boolean }>,

  /** Birinchi marta PIN oʻrnatish — server tokenlarni ham qaytaradi. */
  async setPin(tabel: string, pin: string): Promise<MeUser> {
    const d = (await so("/auth/set-pin", "POST", { tabel: tabel.trim(), pin })) as {
      access?: string;
      refresh?: string;
      user?: MeUser;
    };
    tokens.set(d.access ?? null, d.refresh ?? null);
    return d.user as MeUser;
  },

  async logout(): Promise<void> {
    const rt = tokens.refresh;
    try {
      if (rt) await so("/auth/logout", "POST", { refresh: rt });
    } catch {
      // chiqishda xato boʻlsa ham tokenlar tozalanadi
    }
    tokens.clear();
  },

  async me(): Promise<MeUser> {
    return (await so("/me")) as MeUser;
  },

  /* ---------------- holat ---------------- */

  /** Butun ilova holati — real jadvallardan yigʻilgan */
  async getState(): Promise<DB> {
    const d = (await so("/state")) as { data: DB };
    return d.data;
  },

  /** Login sahifasi uchun ochiq minimal maʼlumot */
  async bootstrap(): Promise<{ depo: { kod: string; nomi: string; tashkilot: string } }> {
    return (await so("/bootstrap")) as { depo: { kod: string; nomi: string; tashkilot: string } };
  },

  /* ---------------- arizalar ---------------- */

  createRequest: (workerId: string, itemIds: string[], turi = "oddiy") =>
    amal("/requests", "POST", { workerId, itemIds, turi }),

  updateRequest: (reqId: string, patch: { lines?: unknown[]; bugField?: unknown }) =>
    amal(`/requests/${reqId}`, "PATCH", patch),

  advanceRequest: (reqId: string, izoh?: string) =>
    amal(`/requests/${reqId}/advance`, "POST", { izoh: izoh ?? "" }),

  rejectRequest: (reqId: string, izoh: string) =>
    amal(`/requests/${reqId}/reject`, "POST", { izoh }),

  /* ---------------- TB jurnali ---------------- */

  addJournal: (e: Record<string, unknown>) => amal("/journal", "POST", e),

  signJournal: (id: string, izoh: string) =>
    amal(`/journal/${id}/sign`, "POST", { izoh }),

  /* ---------------- omborxona ---------------- */

  stockIn: (itemId: string, soni: number, izoh: string) =>
    amal("/stock/in", "POST", { itemId, soni, izoh }),

  /* ---------------- talon / imtixon / KIP ---------------- */

  toggleTalon: (workerId: string, raqam: 1 | 2 | 3, sabab?: string) =>
    amal("/talons/toggle", "POST", { workerId, raqam, sabab: sabab ?? "" }),

  addKip: (k: Record<string, unknown>) => amal("/kips", "POST", k),

  setExam: (workerId: string, sana: string, davriylikOy: number) =>
    amal("/exams", "POST", { workerId, sana, davriylikOy }),

  /* ---------------- buyum / norma ---------------- */

  upsertItem: (it: Record<string, unknown>) => amal("/items", "PUT", it),
  upsertNorm: (n: Record<string, unknown>) => amal("/norms", "PUT", n),
  removeNorm: (id: string) => amal(`/norms/${id}`, "DELETE"),

  /* ---------------- ishchilar ---------------- */

  upsertWorker: (w: Record<string, unknown>) => amal("/workers", "PUT", w),

  importWorkers: (rows: unknown[], positionId: string) =>
    amal("/workers/import", "POST", { rows, positionId }),

  setWorkerPin: (workerId: string, pin: string) =>
    amal(`/workers/${workerId}/pin`, "POST", { pin }),

  clearWorkerPin: (workerId: string) => amal(`/workers/${workerId}/pin`, "DELETE"),

  /** Ishchining Face ID'sini oʻchirish (admin) — u qaytadan qoʻshadi */
  resetWorkerFace: (workerId: string) => amal(`/workers/${workerId}/face-reset`, "DELETE"),

  /** Ishchini oʻchirish — soft-delete, tarix saqlanadi */
  deleteWorker: (workerId: string) => amal(`/workers/${workerId}`, "DELETE"),

  adminResetPin: (target: { userId?: string; tabel?: string }, pin?: string) =>
    so("/admin/reset-pin", "POST", { ...target, pin }) as Promise<{ ok: boolean; mode: string }>,

  /* ---------------- lavozim / birlik / liniya ---------------- */

  addPosition: (nomi: string) => amal("/positions", "POST", { nomi }),

  updatePosition: (id: string, patch: { nomi?: string; arxiv?: boolean }) =>
    amal(`/positions/${id}`, "PATCH", patch),

  addUnit: (nomi: string) => amal("/units", "POST", { nomi }),
  removeUnit: (nomi: string) => amal("/units", "DELETE", { nomi }),

  addLine: (nomi: string) => amal("/lines", "POST", { nomi }),
  removeLine: (nomi: string) => amal("/lines", "DELETE", { nomi }),

  /* ---------------- ruxsatlar ---------------- */

  setAccess: (
    scope: "role" | "position" | "user",
    scopeId: string,
    key: string,
    value: boolean | null
  ) => amal("/access", "POST", { scope, scopeId, key, value }),

  /* ---------------- xodisalar / bildirishnomalar ---------------- */

  addIncident: (turi: "tb" | "avariya", matn: string) =>
    amal("/incidents", "POST", { turi, matn }),

  editIncident: (id: string, matn: string) =>
    amal(`/incidents/${id}`, "PATCH", { matn }),

  deleteIncident: (id: string) => amal(`/incidents/${id}`, "DELETE"),

  readNotification: (id?: string) => amal("/notifications/read", "POST", { id }),
};
