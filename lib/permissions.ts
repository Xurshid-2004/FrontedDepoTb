import type { AccessState, Role } from "./types";

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
  | "admin.settings"
  | "incident.tb.write"
  | "incident.tb.read"
  | "incident.avariya.write"
  | "incident.avariya.read";

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
  "incident.tb.write", "incident.tb.read", "incident.avariya.write", "incident.avariya.read",
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
  "incident.tb.write": "TB: baxtsiz xodisa yozish",
  "incident.tb.read": "TB: baxtsiz xodisalarni koʻrish",
  "incident.avariya.write": "Yoʻriqchi: avariya yozish",
  "incident.avariya.read": "Yoʻriqchi: avariyalarni koʻrish",
};

export const ROLE_PERMS: Record<Role, Perm[]> = {
  admin: ALL_PERMS,
  depo_boshligi: [
    "journal.read", "journal.write", "journal.sign",
    "request.approve3", "stock.read", "card.read",
    "talon.read", "kip.read", "report.read", "report.download",
    "incident.tb.read", "incident.avariya.read",
  ],
  bosh_xisobchi: [
    "journal.read", "request.approve2", "stock.read", "card.read",
    "talon.read", "report.read", "report.download",
    "incident.tb.read", "incident.avariya.read",
  ],
  bugalter: [
    "journal.read", "request.approve1", "stock.read", "card.read",
    "talon.read", "report.read", "report.download",
    "incident.tb.read", "incident.avariya.read",
  ],
  tb_xodim: [
    "journal.read", "journal.write", "journal.sign",
    "request.create", "card.read", "card.create",
    "talon.read", "talon.write", "exam.write",
    "kip.read", "report.read", "report.download",
    "incident.tb.write", "incident.tb.read", "incident.avariya.read",
  ],
  ombor_mudiri: [
    "request.issue", "stock.read", "stock.write", "card.read",
    "report.read", "report.download",
    "incident.tb.read", "incident.avariya.read",
  ],
  yoriqchi: [
    "kip.read", "kip.write", "talon.read", "journal.read",
    "report.read", "report.download",
    "incident.avariya.write", "incident.avariya.read", "incident.tb.read",
  ],
  sex_boshligi: [
    "journal.read", "card.read", "stock.read", "talon.read", "kip.read",
    "incident.tb.read", "incident.avariya.read",
  ],
  ishchi: [
    "request.create", "request.receive", "card.read", "talon.read", "kip.read",
    "incident.tb.read", "incident.avariya.read",
  ],
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

/* ------------------------------------------------------------------
   FEATURE (koʻrinish) kalitlari — kartalar, nav boʻlimlari, hujjatlar
   Bular ruxsatdan alohida: admin ularni har rol/har ishchi uchun
   yoqadi yoki yashiradi. 1-bosqichda standart — hammasi yoniq.
------------------------------------------------------------------ */
export type FeatureKey =
  // bosh sahifa kartalari
  | "card.mehnat"        // Mehnat muhofazasi jamoatchilik nazorati
  | "card.ombor"         // Omborxona
  | "card.faolIshchilar" // Faol ishchilar
  | "card.buyumTuri"     // Ombordagi buyum turlari
  | "card.choraTadbir"   // Bajarilishi kutilayotgan chora-tadbirlar
  | "card.kip"           // KIP — muddati yaqin/oʻtgan
  // nav boʻlimlari
  | "nav.tb"             // TB — Nazorat jurnallari
  | "nav.ombor"          // Omborxona
  | "nav.kip"            // KIP — Yoʻriqchi
  | "nav.talon"          // Talonlar va TB imtixoni
  | "nav.hisobot"        // Hisobotlar
  | "nav.arizalar"       // Arizalar
  | "nav.hujjatlar"      // Hujjatlar boʻlimi (tabel boʻyicha qidiruv)
  | "nav.arxiv"          // Hujjatlar arxivi (yakuniy + blankalar)
  // hujjatlar
  | "doc.trebovanie"     // Требование (MU-27)
  | "doc.mb6"            // MB-6 kartochka
  | "doc.kitobcha";      // TB jamoatchilik nazorati kitobchasi

export const ALL_FEATURES: FeatureKey[] = [
  "card.mehnat", "card.ombor", "card.faolIshchilar", "card.buyumTuri", "card.choraTadbir", "card.kip",
  "nav.tb", "nav.ombor", "nav.kip", "nav.talon", "nav.hisobot", "nav.arizalar", "nav.hujjatlar", "nav.arxiv",
  "doc.trebovanie", "doc.mb6", "doc.kitobcha",
];

export const FEATURE_LABEL: Record<FeatureKey, string> = {
  "card.mehnat": "Karta: Mehnat muhofazasi jamoatchilik nazorati",
  "card.ombor": "Karta: Omborxona",
  "card.faolIshchilar": "Karta: Faol ishchilar",
  "card.buyumTuri": "Karta: Ombordagi buyum turlari",
  "card.choraTadbir": "Karta: Bajarilishi kutilayotgan chora-tadbirlar",
  "card.kip": "Karta: KIP — muddati yaqin/oʻtgan",
  "nav.tb": "Boʻlim: TB — Nazorat jurnallari",
  "nav.ombor": "Boʻlim: Omborxona",
  "nav.kip": "Boʻlim: KIP — Yoʻriqchi",
  "nav.talon": "Boʻlim: Talonlar va TB imtixoni",
  "nav.hisobot": "Boʻlim: Hisobotlar",
  "nav.arizalar": "Boʻlim: Arizalar",
  "nav.hujjatlar": "Boʻlim: Hujjatlar (tabel qidiruv)",
  "nav.arxiv": "Boʻlim: Hujjatlar arxivi",
  "doc.trebovanie": "Hujjat: Требование (MU-27)",
  "doc.mb6": "Hujjat: MB-6 kartochka",
  "doc.kitobcha": "Hujjat: TB jamoatchilik nazorati kitobchasi",
};

export const FEATURE_GROUPS: { title: string; keys: FeatureKey[] }[] = [
  { title: "Bosh sahifa kartalari", keys: ["card.mehnat", "card.ombor", "card.faolIshchilar", "card.buyumTuri", "card.choraTadbir", "card.kip"] },
  { title: "Boʻlimlar (menyu)", keys: ["nav.tb", "nav.ombor", "nav.kip", "nav.talon", "nav.hisobot", "nav.arizalar", "nav.hujjatlar", "nav.arxiv"] },
  { title: "Hujjatlar", keys: ["doc.trebovanie", "doc.mb6", "doc.kitobcha"] },
];

const ALL_CARDS: FeatureKey[] = ["card.mehnat", "card.ombor", "card.faolIshchilar", "card.buyumTuri", "card.choraTadbir", "card.kip"];
const ALL_DOCS: FeatureKey[] = ["doc.trebovanie", "doc.mb6", "doc.kitobcha"];

/** Har rol uchun standart koʻrinadigan feature'lar (2-bosqich tozalash).
 *  Roʻyxatda boʻlmagan kalit — shu rol uchun standart yashirin.
 *  Admin bularni «Koʻrinish» tabidan rol/shaxs boʻyicha ochib-yopishi mumkin. */
export const ROLE_FEATURES: Record<Role, FeatureKey[]> = {
  admin: [...ALL_FEATURES],
  depo_boshligi: [...ALL_FEATURES],
  bosh_xisobchi: [...ALL_FEATURES],
  sex_boshligi: [...ALL_FEATURES],
  // bugalter: faqat 2 karta + ombor/hisobot/arizalar
  bugalter: ["card.mehnat", "card.choraTadbir", "nav.ombor", "nav.hisobot", "nav.arizalar", "nav.hujjatlar", ...ALL_DOCS],
  // TB xodimi: barcha kartalar, KIP-yoʻriqchi boʻlimidan tashqari hamma boʻlim
  tb_xodim: [...ALL_CARDS, "nav.tb", "nav.ombor", "nav.talon", "nav.hisobot", "nav.arizalar", "nav.hujjatlar", ...ALL_DOCS],
  // Omborxona mudiri: ombor + buyum turlari kartalari
  ombor_mudiri: ["card.ombor", "card.buyumTuri", "nav.ombor", "nav.hisobot", "nav.arizalar", "nav.hujjatlar", ...ALL_DOCS],
  // Mashinist yoʻriqchisi: faqat KIP kartasi; TB jurnali va Talonlar yashirin
  yoriqchi: ["card.kip", "nav.kip", "nav.hisobot", "nav.arizalar", "nav.hujjatlar", ...ALL_DOCS],
  // Ishchi: bosh sahifada karta yoʻq; faqat arizalar boʻlimi
  ishchi: ["nav.arizalar", ...ALL_DOCS],
};

export type AccessKey = Perm | FeatureKey;

function roleDefault(role: Role, key: AccessKey, isFeature: boolean): boolean {
  if (isFeature) return ROLE_FEATURES[role].includes(key as FeatureKey);
  return ROLE_PERMS[role].includes(key as Perm);
}

/** Yakuniy ruxsat/koʻrinishni hisoblaydi.
 *  Ustuvorlik: shaxs override → lavozim override → rol override → rol standarti. */
export function resolveAccess(
  key: AccessKey,
  roles: Role[],
  uid: string | null | undefined,
  access: AccessState | undefined,
  isFeature: boolean,
  positionIds?: string[]
): boolean {
  // admin har doim hamma narsaga ega
  if (roles.includes("admin")) return true;
  if (uid && access?.userOverrides?.[uid] && key in access.userOverrides[uid]) {
    return !!access.userOverrides[uid][key];
  }
  if (positionIds && access?.positionOverrides) {
    for (const pid of positionIds) {
      const po = access.positionOverrides[pid];
      if (po && key in po) return !!po[key];
    }
  }
  return roles.some((r) => {
    const ro = access?.roleOverrides?.[r];
    if (ro && key in ro) return !!ro[key];
    return roleDefault(r, key, isFeature);
  });
}
