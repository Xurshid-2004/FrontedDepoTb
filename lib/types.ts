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
  positionId: string;
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
  audit: AuditLog[];
  lines: string[];
  units: Unit[];
  seq: number;
}
