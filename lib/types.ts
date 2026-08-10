/* ------------------------------------------------------------------
   TB tizimi — domen turlari
------------------------------------------------------------------ */

export type Role =
  | "admin"
  | "depo_boshligi"
  | "bosh_xisobchi"
  | "bugalter"
  | "tb_xodim"
  | "ombor_mudiri"
  | "yoriqchi"
  | "sex_boshligi"
  | "ishchi";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  depo_boshligi: "Depo boshligʻi",
  bosh_xisobchi: "Bosh xisobchi",
  bugalter: "Bugalter",
  tb_xodim: "TB xodimi",
  ombor_mudiri: "Omborxona mudiri",
  yoriqchi: "Mashinist yoʻriqchisi",
  sex_boshligi: "Sex boʻlimi boshligʻi",
  ishchi: "Ishchi",
};

export type Unit = "dona" | "kg" | "metr" | "sm" | "juft";

export interface Depo {
  id: string;
  kod: string;
  nomi: string;
  tashkilot: string;
  qishBoshi: string; // MM-DD
  qishOxiri: string; // MM-DD
}

export interface Position {
  id: string;
  tartib: number;
  nomi: string;
  arxiv?: boolean; // soft-delete
}

export interface Item {
  id: string;
  nomi: string;
  kod: string; // nomenklatura
  unit: Unit;
  qishki: boolean;
  narx: number;
  arxiv?: boolean;
}

/** muddat: oy soni yoki null = "Ish. Chiqqun" */
export interface Norm {
  id: string;
  positionId: string;
  itemId: string;
  muddatOy: number | null;
  qishki: boolean;
}

export interface Worker {
  id: string;
  tabel: string;
  familiya: string;
  ism: string;
  otasi: string;
  positionId: string; // asosiy (birinchi) lavozim — eski kod bilan moslik uchun
  positionIds?: string[]; // barcha lavozimlar (bitta ham, bir nechta ham boʻlishi mumkin)
  sex: string;
  ishJoyi: string;
  kolonna?: string;
  kirganSana: string;
  jinsi: "erkak" | "ayol";
  boyi: number;
  kiyimOlchami: string;
  poyabzalOlchami: string;
  boshKiyimOlchami: string;
  telefon?: string;
  roles: Role[];
  yoriqchiId?: string;
  faol: boolean;
  imzoId?: string;

  /** FaceID surati manzili — surat bazada, javobda faqat havola keladi.
   *  (800 ta base64 suratni bitta javobda yuborish mumkin emas.) */
  faceUrl?: string | null;

  /** Faqat YOZISH uchun: yangi surat yuklashda base64 data URL yuboriladi.
   *  Serverdan hech qachon qaytmaydi. */
  faceImage?: string;

  /** PIN oʻrnatilganmi. Hash'ning OʻZI serverdan hech qachon chiqmaydi —
   *  PIN faqat Django tomonida tekshiriladi. */
  pinSet?: boolean;
  pinReset?: boolean; // true = keyingi kirishda majburiy yangi PIN oʻrnatiladi

  /** Face ID sozlanganmi. Yuz vektorining OʻZI serverdan chiqmaydi —
   *  taqqoslash faqat Django tomonida bajariladi. */
  faceBor?: boolean;
  /** Ishchi oʻzi roʻyxatdan oʻtgan payt (admin qoʻshgani — bu emas) */
  royxatdanOtgan?: string | null;
}

export type RequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "ACCOUNTANT_APPROVED"
  | "CHIEF_APPROVED"
  | "HEAD_APPROVED"
  | "ISSUED"
  | "RECEIVED"
  | "COMPLETED"
  | "REJECTED";

export interface RequestLine {
  itemId: string;
  soni: number;
  unit: Unit;
  narx: number;
}

export interface Transition {
  from: RequestStatus;
  to: RequestStatus;
  userId: string;
  sana: string;
  izoh?: string;
}

/** Bugalter qoʻlda toʻldiradigan Требование maydonlari (06-07-08-09-13-16-17-18-19).
 *  06/08/09 — qatorlar ichида (RequestLine.unit/soni), qolganlari header. */
export interface BugalterFields {
  sana07?: string;      // 07 — Требование sanasi
  royxat13?: string;    // 13 — №№ по складской картотеке (roʻyxat raqami)
  oy16?: string;        // 16 — Дата выдачи: месяц
  yil17?: string;       // 17 — Дата выдачи: год
  corr18?: string;      // 18 — Корреспондирующий счёт
  uchastok19?: string;  // 19 — Участок
}

export interface AppRequest {
  id: string;
  raqam: string; // TCH6-YYYY-NNNNN
  workerId: string;
  turi: "oddiy" | "yangi_ishchi";
  status: RequestStatus;
  lines: RequestLine[];
  yaratganId: string;
  yaratilgan: string;
  yakunlangan?: string;
  transitions: Transition[];
  imzolar: Signature[];
  bugField?: BugalterFields; // bugalter toʻldirgan maydonlar
}

export interface Signature {
  id: string;
  docType: "journal" | "requisition" | "card" | "kip";
  docId: string;
  field: string;
  userId: string;
  sana: string;
  hash: string;
}

export interface JournalEntry {
  id: string;
  bosqich: 1 | 2;
  sana: string;
  komissiya: { fio: string; lavozim: string }[];
  nomuvofiqlik: string;
  chora: string;
  masul: string;
  masulLavozim: string;
  muddat: string;
  bajarildi: boolean;
  bajarilganIzoh?: string;
  imzo?: Signature;
}

export interface CardIssue {
  id: string;
  itemId: string;
  sana: string;
  soni: number;
  yaroqlilik: number;
  imzoId?: string;
}

export interface CardReturn {
  id: string;
  itemId: string;
  sana: string;
  soni: number;
  yaroqlilik: number;
  ishchiImzoId?: string;
  omborImzoId?: string;
}

export interface Card {
  id: string;
  workerId: string;
  ochilgan: string;
  berilgan: CardIssue[];
  qaytarilgan: CardReturn[];
  imzolar: Record<string, Signature | undefined>;
}

export interface Stock {
  itemId: string;
  qoldiq: number;
}

export interface StockMove {
  id: string;
  itemId: string;
  turi: "kirim" | "chiqim";
  soni: number;
  sana: string;
  izoh: string;
  hujjatId?: string;
}

export interface Talon {
  workerId: string;
  raqam: 1 | 2 | 3;
  olingan: boolean;
  tarix: { amal: "olindi" | "qaytarildi"; sana: string; tbXodimId: string; sabab?: string }[];
}

export interface Exam {
  workerId: string;
  oxirgi: string;
  davriylikOy: number;
  natija: "otdi" | "otmadi" | "kutilmoqda";
}

export interface Kip {
  id: string;
  workerId: string;
  yoriqchiId: string;
  liniya: string;
  sana: string;
  muddatOy: number;
  tugash: string;
  imzoId?: string;
}

export interface Notification {
  id: string;
  workerId: string;
  turi: string;
  sarlavha: string;
  matn: string;
  sana: string;
  oqilgan: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  obyekt: string;
  amal: string;
  sana: string;
  izoh?: string;
}

/** Ruxsat/koʻrinish override tizimi.
 *  Kalit = Perm yoki FeatureKey (permissions.ts). Qiymat = true (yoq) / false (yashir).
 *  Ustuvorlik: userOverrides > roleOverrides > standart (ROLE_PERMS / ROLE_FEATURES). */
export interface AccessState {
  roleOverrides: Partial<Record<Role, Record<string, boolean>>>;
  positionOverrides: Record<string, Record<string, boolean>>; // positionId -> kalit -> qiymat
  userOverrides: Record<string, Record<string, boolean>>; // workerId -> kalit -> qiymat
}

/** TB xodimi kiritadigan "baxtsiz xodisa" yozuvi yoki mashinist yoʻriqchisi
 *  kiritadigan "avariya" yozuvi — matnli xabar, hammaga (ruxsati borlarga) koʻrinadi. */
export interface IncidentEntry {
  id: string;
  turi: "tb" | "avariya"; // tb = TB baxtsiz xodisalar, avariya = mashinist yoʻriqchisi avariyalari
  matn: string;
  authorId: string;
  sana: string; // ISO datetime
}

export interface DB {
  depo: Depo;
  positions: Position[];
  items: Item[];
  norms: Norm[];
  workers: Worker[];
  cards: Card[];
  requests: AppRequest[];
  journal: JournalEntry[];
  stock: Stock[];
  moves: StockMove[];
  talons: Talon[];
  exams: Exam[];
  kips: Kip[];
  notifications: Notification[];
  incidents: IncidentEntry[];
  audit: AuditLog[];
  lines: string[];
  units: Unit[];
  access: AccessState;
  seq: number;
}
