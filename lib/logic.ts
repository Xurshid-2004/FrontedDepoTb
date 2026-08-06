import type {
  AppRequest,
  Card,
  DB,
  Norm,
  RequestStatus,
  Role,
  Worker,
} from "./types";

/* ---------------- sana yordamchilari ---------------- */

export const TODAY = () => new Date();

export function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

const p2 = (n: number) => String(n).padStart(2, "0");

export function fmt(d: string | Date) {
  const x = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(x.getTime())) return "—";
  return `${p2(x.getDate())}.${p2(x.getMonth() + 1)}.${x.getFullYear()}`;
}

export function fmtDT(d: string | Date) {
  const x = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(x.getTime())) return "—";
  return `${fmt(x)} ${p2(x.getHours())}:${p2(x.getMinutes())}`;
}

export function addMonths(d: Date, m: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
}

export function daysBetween(a: Date | string, b: Date | string) {
  const A = typeof a === "string" ? new Date(a) : a;
  const B = typeof b === "string" ? new Date(b) : b;
  return Math.round((B.getTime() - A.getTime()) / 86400000);
}

export function money(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " soʻm";
}

/* ---------------- qishki mavsum ---------------- */

export function seasonOpen(db: DB, at: Date = TODAY()) {
  const y = at.getFullYear();
  const [sm, sd] = db.depo.qishBoshi.split("-").map(Number);
  const [em, ed] = db.depo.qishOxiri.split("-").map(Number);
  const start = new Date(y, sm - 1, sd);
  const end = new Date(y, em - 1, ed);
  // 15-sentabr → 15-aprel (yil chegarasidan oʻtadi)
  return at >= start || at <= end;
}

/* ---------------- normalar va muddat ---------------- */

export function normsFor(db: DB, positionId: string): Norm[] {
  return db.norms.filter((n) => n.positionId === positionId);
}

/** oxirgi berilgan sana */
export function lastIssue(card: Card | undefined, itemId: string): string | undefined {
  if (!card) return undefined;
  const list = card.berilgan.filter((b) => b.itemId === itemId).sort((a, b) => (a.sana < b.sana ? 1 : -1));
  return list[0]?.sana;
}

export type ItemState = {
  itemId: string;
  norm: Norm;
  oxirgi?: string;
  keyingi?: string;
  qolganKun?: number;
  holat: "yashil" | "sariq" | "qizil" | "chiqqun";
};

export function itemStates(db: DB, worker: Worker, at: Date = TODAY()): ItemState[] {
  const card = db.cards.find((c) => c.workerId === worker.id);
  return normsFor(db, worker.positionId).map((norm) => {
    const oxirgi = lastIssue(card, norm.itemId);
    if (norm.muddatOy === null) {
      return { itemId: norm.itemId, norm, oxirgi, holat: "chiqqun" as const };
    }
    if (!oxirgi) {
      return { itemId: norm.itemId, norm, holat: "sariq" as const, qolganKun: 0 };
    }
    const keyingi = iso(addMonths(new Date(oxirgi), norm.muddatOy));
    const qolganKun = daysBetween(at, keyingi);
    const holat = qolganKun > 30 ? "yashil" : qolganKun >= -30 ? "sariq" : "qizil";
    return { itemId: norm.itemId, norm, oxirgi, keyingi, qolganKun, holat };
  });
}

/** ariza yuborish mumkinmi */
export function canRequest(db: DB, worker: Worker, itemId: string, at: Date = TODAY()) {
  const st = itemStates(db, worker, at).find((s) => s.itemId === itemId);
  if (!st) return { ok: false, sabab: "Bu buyum sizning lavozimingiz normasida yoʻq" };
  const item = db.items.find((i) => i.id === itemId);
  if (item?.qishki && !seasonOpen(db, at)) {
    return { ok: false, sabab: "Qishki buyumlar arizasi 15-sentabrdan 15-aprelgacha qabul qilinadi" };
  }
  const ochiq = db.requests.some(
    (r) =>
      r.workerId === worker.id &&
      !["COMPLETED", "REJECTED"].includes(r.status) &&
      r.lines.some((l) => l.itemId === itemId)
  );
  if (ochiq) return { ok: false, sabab: "Bu buyum boʻyicha yakunlanmagan arizangiz bor" };
  if (st.holat === "chiqqun") return { ok: true };
  if (st.holat === "yashil")
    return { ok: false, sabab: `Olish muddati hali kelmagan. Keyingi sana: ${fmt(st.keyingi!)}` };
  return { ok: true };
}

/* ---------------- ariza state machine ---------------- */

export const FLOW: RequestStatus[] = [
  "SUBMITTED",
  "ACCOUNTANT_APPROVED",
  "CHIEF_APPROVED",
  "HEAD_APPROVED",
];

export const STATUS_LABEL: Record<RequestStatus, string> = {
  DRAFT: "Qoralama",
  SUBMITTED: "Bugalterda",
  ACCOUNTANT_APPROVED: "Bosh xisobchida",
  CHIEF_APPROVED: "Depo boshligʻida",
  HEAD_APPROVED: "Omborda",
  ISSUED: "Berildi — ishchi tasdigʻi kutilmoqda",
  RECEIVED: "Olindi — ombor tasdigʻi kutilmoqda",
  COMPLETED: "Yakunlandi",
  REJECTED: "Rad etildi",
};

export const STATUS_COLOR: Record<RequestStatus, string> = {
  DRAFT: "#64748b",
  SUBMITTED: "#38bdf8",
  ACCOUNTANT_APPROVED: "#38bdf8",
  CHIEF_APPROVED: "#38bdf8",
  HEAD_APPROVED: "#f2b544",
  ISSUED: "#f2b544",
  RECEIVED: "#f2b544",
  COMPLETED: "#22c55e",
  REJECTED: "#ef4444",
};

/** kim shu holatda harakat qila oladi */
export function actorRoleFor(status: RequestStatus): Role | null {
  switch (status) {
    case "SUBMITTED":
      return "bugalter";
    case "ACCOUNTANT_APPROVED":
      return "bosh_xisobchi";
    case "CHIEF_APPROVED":
      return "depo_boshligi";
    case "HEAD_APPROVED":
      return "ombor_mudiri";
    default:
      return null;
  }
}

export function nextStatus(s: RequestStatus): RequestStatus | null {
  const map: Partial<Record<RequestStatus, RequestStatus>> = {
    SUBMITTED: "ACCOUNTANT_APPROVED",
    ACCOUNTANT_APPROVED: "CHIEF_APPROVED",
    CHIEF_APPROVED: "HEAD_APPROVED",
    HEAD_APPROVED: "ISSUED",
    ISSUED: "RECEIVED",
    RECEIVED: "COMPLETED",
  };
  return map[s] ?? null;
}

/** rad etish sababi majburiymi (depo boshligʻidan tashqari — ha) */
export function rejectReasonRequired(roles: Role[]) {
  return !roles.includes("depo_boshligi");
}

export function stageIndex(s: RequestStatus) {
  const order: RequestStatus[] = [
    "SUBMITTED",
    "ACCOUNTANT_APPROVED",
    "CHIEF_APPROVED",
    "HEAD_APPROVED",
    "ISSUED",
    "RECEIVED",
    "COMPLETED",
  ];
  return order.indexOf(s);
}

/* ---------------- KIP ranglari ---------------- */

export type KipTone = { label: string; color: string; qism: 1 | 2 | 3 | 4 | 0 };

export function kipTone(tugash: string, at: Date = TODAY()): KipTone {
  const d = daysBetween(at, tugash);
  if (d < 0) return { label: "Muddati oʻtdi", color: "#b91c1c", qism: 4 };
  if (d === 0) return { label: "Bugun tugaydi", color: "#f97316", qism: 3 };
  if (d <= 2) return { label: `${d} kun qoldi`, color: "#f59e0b", qism: 2 };
  if (d <= 3) return { label: `${d} kun qoldi`, color: "#22c55e", qism: 1 };
  return { label: `${d} kun qoldi`, color: "#38bdf8", qism: 0 };
}

/* ---------------- QR imzo ---------------- */

export function makeHash(input: string) {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (Math.imul(h2 ^ input.charCodeAt(i), 0x85ebca6b) + i) >>> 0;
  }
  return (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).toUpperCase();
}

export function fio(w: Worker) {
  return `${w.familiya} ${w.ism} ${w.otasi}`;
}

export function fioShort(w: Worker) {
  return `${w.familiya} ${w.ism[0]}.${w.otasi[0]}.`;
}

/* ---------------- Требование raqami ---------------- */

export function nextReqNo(db: DB) {
  const y = new Date().getFullYear();
  return `TCH6-${y}-${String(db.seq + 1).padStart(5, "0")}`;
}

/* ---------------- statistika ---------------- */

export function dashboardStats(db: DB) {
  const ochiqJurnal = db.journal.filter((j) => !j.bajarildi).length;
  const muddatYaqin = db.journal.filter(
    (j) => !j.bajarildi && daysBetween(TODAY(), j.muddat) >= 0 && daysBetween(TODAY(), j.muddat) <= 3
  ).length;
  const muddatOtgan = db.journal.filter((j) => !j.bajarildi && daysBetween(TODAY(), j.muddat) < 0).length;

  const faolAriza = db.requests.filter((r) => !["COMPLETED", "REJECTED"].includes(r.status)).length;

  let kelgan = 0;
  let otgan = 0;
  for (const w of db.workers.filter((w) => w.faol)) {
    const st = itemStates(db, w);
    if (st.some((s) => s.holat === "sariq")) kelgan++;
    if (st.some((s) => s.holat === "qizil")) otgan++;
  }

  const kipOtgan = db.kips.filter((k) => kipTone(k.tugash).qism === 4).length;
  const kipYaqin = db.kips.filter((k) => [1, 2, 3].includes(kipTone(k.tugash).qism)).length;

  return { ochiqJurnal, muddatYaqin, muddatOtgan, faolAriza, kelgan, otgan, kipOtgan, kipYaqin };
}

export function workerById(db: DB, id: string) {
  return db.workers.find((w) => w.id === id);
}
export function itemById(db: DB, id: string) {
  return db.items.find((i) => i.id === id);
}
export function positionById(db: DB, id: string) {
  return db.positions.find((p) => p.id === id);
}
export function reqById(db: DB, id: string) {
  return db.requests.find((r) => r.id === id);
}
