import type { Role } from "./types";

/** resurs.amal koʻrinishidagi ruxsatlar */
export type Perm =
  | "journal.read"
  | "journal.write"
  | "journal.sign"
  | "request.create"
  | "request.approve1"
  | "request.approve2"
  | "request.approve3"
  | "request.issue"
  | "request.receive"
  | "stock.read"
  | "stock.write"
  | "card.read"
  | "card.create"
  | "talon.read"
  | "talon.write"
  | "exam.write"
  | "kip.read"
  | "kip.write"
  | "report.read"
  | "report.download"
  | "admin.users"
  | "admin.norms"
  | "admin.settings";

export const ALL_PERMS: Perm[] = [
  "journal.read", "journal.write", "journal.sign",
  "request.create", "request.approve1", "request.approve2", "request.approve3",
  "request.issue", "request.receive",
  "stock.read", "stock.write",
  "card.read", "card.create",
  "talon.read", "talon.write", "exam.write",
  "kip.read", "kip.write",
  "report.read", "report.download",
  "admin.users", "admin.norms", "admin.settings",
];

export const PERM_LABEL: Record<Perm, string> = {
  "journal.read": "Jurnalni koʻrish",
  "journal.write": "Jurnalga yozuv qoʻshish",
  "journal.sign": "Jurnal 7-ustunini imzolash",
  "request.create": "Ariza yuborish",
  "request.approve1": "Ariza tasdiqlash — 1-bosqich",
  "request.approve2": "Ariza tasdiqlash — 2-bosqich",
  "request.approve3": "Ariza tasdiqlash — 3-bosqich",
  "request.issue": "Ombordan berish",
  "request.receive": "Olganlikni tasdiqlash",
  "stock.read": "Ombor qoldigʻini koʻrish",
  "stock.write": "Buyum kirim qilish",
  "card.read": "Kartochkani koʻrish",
  "card.create": "Kartochka ochish",
  "talon.read": "Talonlarni koʻrish",
  "talon.write": "Talon olish / qaytarish",
  "exam.write": "Imtixon sanasini belgilash",
  "kip.read": "KIP koʻrish",
  "kip.write": "KIP yozish",
  "report.read": "Hisobotlarni koʻrish",
  "report.download": "Hisobotlarni yuklab olish",
  "admin.users": "Foydalanuvchilarni boshqarish",
  "admin.norms": "Normalarni tahrirlash",
  "admin.settings": "Tizim sozlamalari",
};

export const ROLE_PERMS: Record<Role, Perm[]> = {
  admin: ALL_PERMS,
  depo_boshligi: [
    "journal.read", "journal.write", "journal.sign",
    "request.approve3", "stock.read", "card.read",
    "talon.read", "kip.read", "report.read", "report.download",
  ],
  bosh_xisobchi: [
    "journal.read", "request.approve2", "stock.read", "card.read",
    "talon.read", "report.read", "report.download",
  ],
  bugalter: [
    "journal.read", "request.approve1", "stock.read", "card.read",
    "talon.read", "report.read", "report.download",
  ],
  tb_xodim: [
    "journal.read", "journal.write", "journal.sign",
    "request.create", "card.read", "card.create",
    "talon.read", "talon.write", "exam.write",
    "kip.read", "report.read", "report.download",
  ],
  ombor_mudiri: [
    "request.issue", "stock.read", "stock.write", "card.read",
    "report.read", "report.download",
  ],
  yoriqchi: [
    "kip.read", "kip.write", "talon.read", "journal.read",
    "report.read", "report.download",
  ],
  sex_boshligi: ["journal.read", "card.read", "stock.read", "talon.read", "kip.read"],
  ishchi: ["request.create", "request.receive", "card.read", "talon.read", "kip.read"],
};

export function can(roles: Role[], perm: Perm, extra?: Record<string, boolean>): boolean {
  if (extra && perm in extra) return extra[perm];
  return roles.some((r) => ROLE_PERMS[r].includes(perm));
}

export function permsOf(roles: Role[]): Perm[] {
  const s = new Set<Perm>();
  roles.forEach((r) => ROLE_PERMS[r].forEach((p) => s.add(p)));
  return ALL_PERMS.filter((p) => s.has(p));
}
