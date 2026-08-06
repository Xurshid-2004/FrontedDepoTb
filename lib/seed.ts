import type {
  AppRequest, Card, DB, Depo, Exam, Item, JournalEntry, Kip, Norm,
  Position, Stock, StockMove, Talon, Unit, Worker,
} from "./types";
import { addMonths, iso, makeHash } from "./logic";

/* ================= DEPO ================= */
const depo: Depo = {
  id: "d1",
  kod: "TCH-6",
  nomi: "Buxoro lokomotiv deposi",
  tashkilot: '"TEMIRYOʻLINFRATUZILMA" AJ',
  qishBoshi: "09-15",
  qishOxiri: "04-15",
};

/* ================= BUYUMLAR ================= */
type ItemDef = [key: string, nomi: string, unit: Unit, qishki: boolean, narx: number];
const ITEM_DEFS: ItemDef[] = [
  ["kostyum_xb", "Kostyum x/b", "dona", false, 420000],
  ["kostyum_paxta", "Paxta tolali kostyum", "dona", false, 465000],
  ["xalat_paxta", "Paxta tolali xalat", "dona", false, 310000],
  ["kostyum_payvand", "Payvandchi kostyumi", "dona", false, 640000],
  ["qolqob_qurama", "Qurama qoʻlqob", "juft", false, 18000],
  ["qolqob_brezent", "Brezent qoʻlqob", "juft", false, 26000],
  ["qolqop_rezina", "Rezina qoʻlqop", "juft", false, 32000],
  ["qolqop_dielektrik", "Dielektrik qoʻlqop", "juft", false, 145000],
  ["qolqob_maxsus", "Maxsus qoʻlqob (vibratsiyaga qarshi)", "juft", false, 88000],
  ["botinka_charm", "Charm botinka", "juft", false, 520000],
  ["etik_kirza", "Kirza etik", "juft", false, 390000],
  ["kozoynak", "Himoya koʻzoynagi", "dona", false, 54000],
  ["respirator", "Respirator", "dona", false, 22000],
  ["kaska", "Himoya kaskasi", "dona", false, 96000],
  ["quloqchin", "Shovqinga qarshi quloqchin", "dona", false, 74000],
  ["kurtka_gudok", "Issiq kurtka «Gudok»", "dona", true, 890000],
  ["kostyum_issiq", "Issiq kostyum (kurtka)", "dona", true, 810000],
  ["etik_issiq", "Issiq etik", "juft", true, 610000],
  ["etik_yufta", "Issiq yufta etik", "juft", true, 660000],
];

const items: Item[] = ITEM_DEFS.map(([key, nomi, unit, qishki, narx], i) => ({
  id: key,
  nomi,
  kod: `${String(10 + i).padStart(2, "0")}-${String(1000 + i * 7).slice(0, 4)}`,
  unit,
  qishki,
  narx,
}));

/* ================= 31-ILOVA: LAVOZIM → NORMA ================= */
/** [itemKey, muddatOy | null] — null = Ish. Chiqqun */
type N = [string, number | null];

const BASE_CHILANGAR: N[] = [
  ["kostyum_paxta", 12], ["qolqob_qurama", 2], ["botinka_charm", 12],
  ["respirator", null], ["kozoynak", null], ["kaska", null],
];
const QISH_CHILANGAR: N[] = [["kostyum_issiq", 36], ["etik_yufta", 24]];
const BASE_PAYVAND: N[] = [
  ["kostyum_payvand", 12], ["qolqob_brezent", 1], ["botinka_charm", 18], ["kozoynak", null],
];
const QISH_PAYVAND: N[] = [["kostyum_issiq", 24], ["etik_yufta", 24]];
const BASE_UNIVERSAL: N[] = [["kostyum_paxta", 12], ["botinka_charm", 24], ["qolqob_qurama", 2]];
const QISH_UNIVERSAL: N[] = [["kostyum_issiq", 36]];

type PosDef = { nomi: string; base: N[]; qish: N[] };

const POS_DEFS: PosDef[] = [
  { nomi: "Teplovoz mashinisti va yordamchisi",
    base: [["kostyum_xb", 12], ["qolqob_qurama", 2], ["kozoynak", null], ["botinka_charm", 24]],
    qish: [["kurtka_gudok", 36], ["etik_issiq", 24]] },
  { nomi: "Elektrovoz mashinisti va yordamchisi",
    base: [["kostyum_xb", 12], ["qolqob_qurama", 2], ["kozoynak", null], ["botinka_charm", 24]],
    qish: [["kurtka_gudok", 36], ["etik_issiq", 24]] },
  { nomi: "Depo navbatchisi",
    base: [["kostyum_xb", 12], ["botinka_charm", 12]],
    qish: [["kurtka_gudok", 36], ["etik_issiq", 24]] },
  { nomi: "Taʼmirlash sexi farroshi",
    base: [["kostyum_paxta", 12], ["qolqob_qurama", 2], ["botinka_charm", 12], ["qolqop_rezina", null]],
    qish: [["kostyum_issiq", 36]] },
  { nomi: "Tayyorlov sexi chilangari", base: BASE_CHILANGAR, qish: QISH_CHILANGAR },
  { nomi: "Akkumulyatorchi", base: BASE_CHILANGAR, qish: QISH_CHILANGAR },
  { nomi: "Gaz va elektr payvandchisi", base: BASE_PAYVAND, qish: QISH_PAYVAND },
  { nomi: "PTO sexi chilangari", base: BASE_CHILANGAR, qish: QISH_CHILANGAR },
  { nomi: "Omborxona mudiri",
    base: [["xalat_paxta", 12], ["qolqob_qurama", 2], ["botinka_charm", 24]],
    qish: [["kostyum_issiq", 36]] },
  { nomi: "Dush va maʼmuriy bino farroshi",
    base: [["xalat_paxta", 12], ["qolqob_qurama", 2], ["botinka_charm", 12], ["qolqop_rezina", null]],
    qish: [] },
  { nomi: "Taʼmirlash sexi chilangari", base: BASE_CHILANGAR, qish: QISH_CHILANGAR },
  { nomi: "Maʼmuriy bino farroshi",
    base: [["xalat_paxta", 12], ["botinka_charm", 12], ["qolqop_rezina", null]], qish: [] },
  { nomi: "Kimyo laboratoriyasi ishchisi",
    base: [["xalat_paxta", 12], ["qolqob_qurama", 2], ["botinka_charm", 12], ["qolqop_rezina", null]],
    qish: [] },
  { nomi: "Temirchi",
    base: [["kostyum_paxta", 24], ["qolqob_brezent", 1], ["botinka_charm", 12], ["kozoynak", null], ["quloqchin", null]],
    qish: [] },
  { nomi: "Suvoqchi-boʻyoqchi", base: BASE_CHILANGAR, qish: [["kostyum_issiq", 36]] },
  { nomi: "Qozonxona gaz va elektr payvandchisi", base: BASE_PAYVAND, qish: QISH_PAYVAND },
  { nomi: "Qozonxona mashinisti", base: BASE_UNIVERSAL, qish: QISH_UNIVERSAL },
  { nomi: "Akfachi", base: BASE_UNIVERSAL, qish: QISH_UNIVERSAL },
  { nomi: "Duradgor", base: BASE_UNIVERSAL, qish: QISH_UNIVERSAL },
  { nomi: "Betonchi va gʻisht teruvchi",
    base: [["kostyum_paxta", 12], ["qolqob_qurama", 1], ["etik_kirza", 12], ["qolqob_maxsus", 2]],
    qish: [["kostyum_issiq", 36]] },
  { nomi: "Haydovchi",
    base: [["kostyum_paxta", 12], ["etik_kirza", 24], ["qolqob_qurama", 2]], qish: QISH_UNIVERSAL },
  { nomi: "Traktorchi", base: BASE_UNIVERSAL, qish: QISH_UNIVERSAL },
  { nomi: "Qorovul",
    base: [["kostyum_paxta", 24], ["botinka_charm", 24]], qish: [["kurtka_gudok", 36]] },
  { nomi: "Yongʻin xavfsizligi chilangari", base: BASE_UNIVERSAL, qish: QISH_UNIVERSAL },
  { nomi: "Tokar",
    base: [["kostyum_paxta", 12], ["qolqob_qurama", 2], ["botinka_charm", 12], ["kozoynak", null], ["kaska", null]],
    qish: [["kostyum_issiq", 36]] },
  { nomi: "Taʼmirlash sexi katta ustasi",
    base: [["kostyum_paxta", 12], ["qolqob_qurama", 2], ["botinka_charm", 12]],
    qish: [["kostyum_issiq", 36]] },
  { nomi: "Reostat sexi katta ustasi",
    base: [["kostyum_paxta", 12], ["qolqob_qurama", 2], ["botinka_charm", 12], ["qolqop_dielektrik", null]],
    qish: [["kostyum_issiq", 36]] },
  { nomi: "Mehnat muhofazasi muhandisi",
    base: [["kostyum_paxta", 12], ["botinka_charm", 12]],
    qish: [["kostyum_issiq", 36], ["etik_yufta", 24]] },
];

const positions: Position[] = POS_DEFS.map((p, i) => ({
  id: `p${i + 1}`,
  tartib: i + 1,
  nomi: p.nomi,
}));

const norms: Norm[] = [];
POS_DEFS.forEach((p, i) => {
  const pid = `p${i + 1}`;
  p.base.forEach(([itemId, m], j) =>
    norms.push({ id: `n${pid}_${j}`, positionId: pid, itemId, muddatOy: m, qishki: false })
  );
  p.qish.forEach(([itemId, m], j) =>
    norms.push({ id: `n${pid}_q${j}`, positionId: pid, itemId, muddatOy: m, qishki: true })
  );
});

/* ================= ISHCHILAR ================= */
const FAM = ["Rasulov","Qodirov","Ergashev","Yoʻldoshev","Toshmatov","Norqulov","Hasanov","Aliyev","Saidov","Xolmatov","Islomov","Turdiyev","Jumayev","Bekmurodov","Nazarov","Sattorov","Umarov","Qurbonov","Mirzayev","Ochilov","Shodmonov","Bozorov","Xudoyberdiyev","Egamberdiyev"];
const ISM = ["Baxtiyor","Sanjar","Ulugʻbek","Aziz","Jasur","Shavkat","Doniyor","Sardor","Bekzod","Otabek","Farrux","Dilshod","Rustam","Akmal","Nodir","Javohir"];
const OTA = ["Anvarovich","Toshpoʻlatovich","Zokirovich","Baxodirovich","Alisherovich","Rustamovich","Salimovich","Abdullayevich"];
const SEX = ["Taʼmirlash sexi","Tayyorlov sexi","PTO sexi","Qozonxona","Maʼmuriy bino","Reostat sexi"];
const KOLONNA = ["El. mashinist / yordamchi","Teplovoz mashinist / yordamchi","Manyovr teplovoz"];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

const workers: Worker[] = [];
let tabel = 10400;

function mkWorker(
  posIdx: number,
  roles: Worker["roles"],
  i: number,
  opts: Partial<Worker> = {}
): Worker {
  tabel += 37 + (i % 11);
  const id = `w${workers.length + 1}`;
  return {
    id,
    tabel: String(tabel),
    familiya: pick(FAM, i * 3 + posIdx),
    ism: pick(ISM, i * 5 + posIdx),
    otasi: pick(OTA, i + posIdx),
    positionId: `p${posIdx}`,
    sex: pick(SEX, posIdx),
    ishJoyi: "Buxoro lokomotiv deposi",
    kolonna: posIdx <= 2 ? pick(KOLONNA, i) : undefined,
    kirganSana: iso(new Date(2019 + (i % 6), (i * 3) % 12, 1 + (i % 27))),
    jinsi: i % 9 === 0 ? "ayol" : "erkak",
    boyi: 168 + (i % 18),
    kiyimOlchami: String(48 + ((i % 5) * 2)),
    poyabzalOlchami: String(40 + (i % 6)),
    boshKiyimOlchami: String(55 + (i % 4)),
    telefon: `+998 9${i % 10} ${100 + i} ${1000 + i * 7}`,
    roles,
    faol: true,
    ...opts,
  };
}

// rahbariyat va masʼul shaxslar
const admin = mkWorker(28, ["admin", "tb_xodim"], 1, {
  familiya: "Abduvaliyev", ism: "Ohun", otasi: "Olimjon oʻgʻli", tabel: "10001",
});
workers.push(admin);
const boshliq = mkWorker(28, ["depo_boshligi"], 2, { familiya: "Sattorov", ism: "Rustam", otasi: "Anvarovich" });
workers.push(boshliq);
const boshXis = mkWorker(28, ["bosh_xisobchi"], 3, { familiya: "Islomov", ism: "Dilshod", otasi: "Salimovich" });
workers.push(boshXis);
const bugalter = mkWorker(28, ["bugalter"], 4, { familiya: "Nazarova", ism: "Malika", otasi: "Anvarovna", jinsi: "ayol" });
workers.push(bugalter);
const tbXodim = mkWorker(28, ["tb_xodim"], 5, { familiya: "Ergashev", ism: "Ulugʻbek", otasi: "Zokirovich" });
workers.push(tbXodim);
const omborMudiri = mkWorker(9, ["ombor_mudiri"], 6, { familiya: "Xolmatov", ism: "Bekzod", otasi: "Rustamovich" });
workers.push(omborMudiri);
const sexBoshligi = mkWorker(26, ["sex_boshligi"], 7, { familiya: "Turdiyev", ism: "Akmal", otasi: "Baxodirovich" });
workers.push(sexBoshligi);
const yoriqchi1 = mkWorker(2, ["yoriqchi"], 8, { familiya: "Umarov", ism: "Farrux", otasi: "Alisherovich" });
workers.push(yoriqchi1);
const yoriqchi2 = mkWorker(1, ["yoriqchi"], 9, { familiya: "Qurbonov", ism: "Nodir", otasi: "Rustamovich" });
workers.push(yoriqchi2);

// mashinistlar (yoʻriqchilarga biriktiriladi)
const mashinistlar: Worker[] = [];
for (let i = 0; i < 14; i++) {
  const w = mkWorker(i % 2 === 0 ? 2 : 1, ["ishchi"], 10 + i, {
    yoriqchiId: i % 2 === 0 ? yoriqchi1.id : yoriqchi2.id,
  });
  workers.push(w);
  mashinistlar.push(w);
}

// boshqa kasblar
for (let i = 0; i < 26; i++) {
  const posIdx = 4 + (i % 24);
  workers.push(mkWorker(posIdx, ["ishchi"], 30 + i));
}

/* ================= KARTOCHKALAR + BERILGAN ================= */
const cards: Card[] = [];
const moves: StockMove[] = [];
const stockMap = new Map<string, number>();
items.forEach((it) => stockMap.set(it.id, 40 + ((it.narx / 1000) % 90 | 0)));

workers.forEach((w, wi) => {
  const wnorms = norms.filter((n) => n.positionId === w.positionId);
  const berilgan = wnorms
    .filter((n) => n.muddatOy !== null && (wi + n.itemId.length) % 4 !== 0)
    .map((n, j) => {
      const oyOldin = (n.muddatOy ?? 12) - ((wi * 5 + j * 7) % ((n.muddatOy ?? 12) + 6));
      const sana = iso(addMonths(new Date(), -Math.max(1, oyOldin)));
      return {
        id: `ci_${w.id}_${j}`,
        itemId: n.itemId,
        sana,
        soni: 1,
        yaroqlilik: 100 - ((wi + j) % 5) * 10,
        imzoId: `sig_${w.id}_${j}`,
      };
    });
  cards.push({
    id: `c${wi + 1}`,
    workerId: w.id,
    ochilgan: w.kirganSana,
    berilgan,
    qaytarilgan: [],
    imzolar: {},
  });
  berilgan.forEach((b) => {
    stockMap.set(b.itemId, (stockMap.get(b.itemId) ?? 0) - b.soni);
    moves.push({
      id: `mv_${b.id}`,
      itemId: b.itemId,
      turi: "chiqim",
      soni: b.soni,
      sana: b.sana,
      izoh: `Berildi: ${w.familiya} ${w.ism}`,
    });
  });
});

items.forEach((it, i) => {
  moves.push({
    id: `mv_kirim_${it.id}`,
    itemId: it.id,
    turi: "kirim",
    soni: 120 + i * 5,
    sana: iso(addMonths(new Date(), -6)),
    izoh: "Yillik yetkazib berish — «OʻzTeksTaʼminot» MChJ",
  });
  stockMap.set(it.id, (stockMap.get(it.id) ?? 0) + 120 + i * 5);
});

const stock: Stock[] = items.map((it) => ({ itemId: it.id, qoldiq: Math.max(0, stockMap.get(it.id) ?? 0) }));

/* ================= JURNAL ================= */
const JN = [
  ["Taʼmirlash sexida yoritish darajasi meʼyordan past", "Qoʻshimcha 4 ta LED yoritgich oʻrnatish"],
  ["Akkumulyator boʻlimida soʻrgʻich ventilyatsiya kuchsiz", "Ventilyatorni almashtirish va kanalni tozalash"],
  ["PTO sexida himoya kaskalari yetishmayapti (4 dona)", "Omborxonaga talabnoma yuborish"],
  ["Payvandlash postida ekran oʻrnatilmagan", "Koʻchma himoya ekranini oʻrnatish"],
  ["Yongʻin oʻchirgichlar muddati oʻtgan (3 dona)", "Zaryadlash va qayta sertifikatlash"],
  ["Reostat sexida dielektrik gilam yirtilgan", "Yangi gilam bilan almashtirish"],
  ["Tayyorlov sexida elektr shchit qopqogʻi yopilmagan", "Qulf oʻrnatish, masʼulni tayinlash"],
  ["Dush xonasida issiq suv yoʻq", "Suv isitgichni taʼmirlash"],
];

const journal: JournalEntry[] = [];
[1, 2].forEach((bosqich) => {
  for (let i = 0; i < 8; i++) {
    const sana = iso(addMonths(new Date(), 0));
    const d = new Date();
    d.setDate(d.getDate() - i * 3 - (bosqich - 1));
    const muddat = new Date(d);
    muddat.setDate(muddat.getDate() + 7 - (i % 5) * 3);
    const bajarildi = i % 3 === 0;
    journal.push({
      id: `j${bosqich}_${i}`,
      bosqich: bosqich as 1 | 2,
      sana: iso(d),
      komissiya: [
        { fio: `${tbXodim.familiya} ${tbXodim.ism}`, lavozim: "TB muhandisi" },
        { fio: `${sexBoshligi.familiya} ${sexBoshligi.ism}`, lavozim: "Sex boshligʻi" },
      ],
      nomuvofiqlik: JN[(i + bosqich) % JN.length][0],
      chora: JN[(i + bosqich) % JN.length][1],
      masul: `${pick(FAM, i)} ${pick(ISM, i)}`,
      masulLavozim: i % 2 ? "Sex boshligʻi" : "Usta",
      muddat: iso(muddat),
      bajarildi,
      bajarilganIzoh: bajarildi ? "Bajarildi, tekshirildi" : undefined,
      imzo: bajarildi
        ? {
            id: `js_${bosqich}_${i}`,
            docType: "journal",
            docId: `j${bosqich}_${i}`,
            field: "07",
            userId: tbXodim.id,
            sana: iso(muddat),
            hash: makeHash(`j${bosqich}_${i}${tbXodim.id}`),
          }
        : undefined,
      // eslint-disable-next-line
    } as JournalEntry);
    void sana;
  }
});

/* ================= ARIZALAR ================= */
const STATUSES: AppRequest["status"][] = [
  "SUBMITTED", "ACCOUNTANT_APPROVED", "CHIEF_APPROVED", "HEAD_APPROVED",
  "ISSUED", "COMPLETED", "REJECTED", "COMPLETED", "SUBMITTED",
];

const requests: AppRequest[] = [];
let seq = 0;
STATUSES.forEach((st, i) => {
  const w = workers[10 + i * 3] ?? workers[10 + i];
  const wnorms = norms.filter((n) => n.positionId === w.positionId).slice(0, 2);
  seq++;
  const sana = new Date();
  sana.setDate(sana.getDate() - (STATUSES.length - i) * 2);
  requests.push({
    id: `r${i + 1}`,
    raqam: `TCH6-${new Date().getFullYear()}-${String(seq).padStart(5, "0")}`,
    workerId: w.id,
    turi: i === 3 ? "yangi_ishchi" : "oddiy",
    status: st,
    lines: wnorms.map((n) => {
      const it = items.find((x) => x.id === n.itemId)!;
      return { itemId: n.itemId, soni: 1, unit: it.unit, narx: it.narx };
    }),
    yaratganId: i === 3 ? tbXodim.id : w.id,
    yaratilgan: iso(sana),
    transitions: [
      { from: "DRAFT", to: "SUBMITTED", userId: w.id, sana: iso(sana) },
      ...(st === "REJECTED"
        ? [{ from: "SUBMITTED" as const, to: "REJECTED" as const, userId: bugalter.id, sana: iso(sana), izoh: "Buyum olish muddati hali kelmagan" }]
        : []),
    ],
    imzolar: [],
  });
});

/* ================= TALON / IMTIXON / KIP ================= */
const talons: Talon[] = [];
workers.forEach((w, i) => {
  ([1, 2, 3] as const).forEach((r) => {
    const olingan = i % 7 === 0 && r === 1;
    talons.push({
      workerId: w.id,
      raqam: r,
      olingan,
      tarix: olingan
        ? [{ amal: "olindi", sana: iso(addMonths(new Date(), -1)), tbXodimId: tbXodim.id, sabab: "Signal koʻrsatkichini eʼtiborsiz qoldirish" }]
        : [],
    });
  });
});

const exams: Exam[] = workers.map((w, i) => ({
  workerId: w.id,
  oxirgi: iso(addMonths(new Date(), -(11 + (i % 3)))),
  davriylikOy: 12,
  natija: "otdi",
}));

const LINES = ["Buxoro — Qorakoʻl", "Buxoro — Navoiy", "Buxoro-1 stansiyasi", "Qiziltepa — Buxoro", "Kogon stansiyasi", "Buxoro — Olot"];

const kips: Kip[] = mashinistlar.map((w, i) => {
  const muddatOy = [1, 3, 6][i % 3];
  const sana = addMonths(new Date(), -muddatOy);
  sana.setDate(sana.getDate() + (i % 9) - 2);
  return {
    id: `k${i + 1}`,
    workerId: w.id,
    yoriqchiId: w.yoriqchiId!,
    liniya: pick(LINES, i),
    sana: iso(sana),
    muddatOy,
    tugash: iso(addMonths(sana, muddatOy)),
    imzoId: `ks${i}`,
  };
});

/* ================= EKSPORT ================= */
export function makeSeed(): DB {
  return {
    depo,
    positions,
    items,
    norms,
    workers,
    cards,
    requests,
    journal,
    stock,
    moves,
    talons,
    exams,
    kips,
    notifications: [],
    audit: [],
    lines: LINES,
    units: ["dona", "juft", "kg", "metr", "sm"],
    seq,
  };
}

export const DEMO_ACCOUNTS = [
  { tabel: admin.tabel, rol: "Administrator" },
  { tabel: boshliq.tabel, rol: "Depo boshligʻi" },
  { tabel: boshXis.tabel, rol: "Bosh xisobchi" },
  { tabel: bugalter.tabel, rol: "Bugalter" },
  { tabel: tbXodim.tabel, rol: "TB xodimi" },
  { tabel: omborMudiri.tabel, rol: "Omborxona mudiri" },
  { tabel: yoriqchi1.tabel, rol: "Mashinist yoʻriqchisi" },
  { tabel: mashinistlar[0].tabel, rol: "Ishchi (mashinist)" },
];
