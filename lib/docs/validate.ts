/* ------------------------------------------------------------------
   Hujjat toʻliqligini tekshirish
   Yuborishdan/chop etishdan oldin boʻsh qolgan majburiy maydonlarni
   koʻrsatadi. Har bir maydon blankadagi raqami bilan qaytariladi.
------------------------------------------------------------------ */

export interface Kamchilik {
  maydon: string;   // blankadagi raqam, masalan "05"
  nomi: string;     // tushunarli nom
  kim: string;      // kim toʻldirishi kerak
  ogir: boolean;    // true = hujjat chiqarilmaydi, false = ogohlantirish
}

export interface Tekshiruv {
  toliq: boolean;
  kamchiliklar: Kamchilik[];
  foiz: number;     // toʻldirilganlik darajasi
}

function natija(jami: number, k: Kamchilik[]): Tekshiruv {
  const ogir = k.filter((x) => x.ogir);
  return {
    toliq: ogir.length === 0,
    kamchiliklar: k,
    foiz: Math.round(((jami - k.length) / jami) * 100),
  };
}

/* ----------------- Требование МУ№27 ----------------- */
export function tekshirRequisition(d: {
  raqam?: string | null;
  royxatRaqam?: string | null;
  sana?: string | null;
  arizachiFio?: string | null;
  arizachiTabel?: string | null;
  omborMudiri?: string | null;
  lines?: { nomi?: string; olcham?: string; soralgan?: number; berilgan?: number | null; narx?: number }[];
  imzolar?: { depoBoshligi?: unknown; omborMudiri?: unknown; arizachi?: unknown; boshXisobchi?: unknown };
}): Tekshiruv {
  const k: Kamchilik[] = [];
  const add = (maydon: string, nomi: string, kim: string, ogir = true) =>
    k.push({ maydon, nomi, kim, ogir });

  if (!d.arizachiFio) add("02", "Ariza yuboruvchi F.I.Sh.", "Tizim");
  if (!d.arizachiTabel) add("20", "Tabel raqami", "Tizim");
  if (!d.omborMudiri) add("03", "Ombor mudiri F.I.Sh.", "Tizim");
  if (!d.sana) add("07", "Sana", "Bugalteriya");
  if (!d.royxatRaqam && !d.raqam) add("13", "Roʻyxatga olingan raqam", "Bugalteriya");

  if (!d.lines?.length) {
    add("06", "Buyumlar roʻyxati", "Bugalteriya");
  } else {
    d.lines.forEach((l, i) => {
      if (!l.nomi) add("06", `${i + 1}-satr: buyum nomi`, "Bugalteriya");
      if (!l.soralgan) add("09", `${i + 1}-satr: soʻralgan miqdor`, "Bugalteriya");
      if (l.berilgan == null) add("10", `${i + 1}-satr: berilgan miqdor`, "Ombor mudiri", false);
      if (!l.narx) add("15", `${i + 1}-satr: narx`, "Ombor mudiri", false);
    });
  }

  if (!d.imzolar?.arizachi) add("12", "Ariza yuboruvchi imzosi", "Ishchi");
  if (!d.imzolar?.boshXisobchi) add("14", "Bosh xisobchi imzosi", "Bosh xisobchi");
  if (!d.imzolar?.depoBoshligi) add("05", "Depo boshligʻi imzosi", "Depo boshligʻi");
  if (!d.imzolar?.omborMudiri) add("11", "Ombor mudiri imzosi", "Ombor mudiri");

  return natija(20, k);
}

/* ----------------- MB-6 kartochka ----------------- */
export function tekshirCard(d: {
  familiya?: string | null;
  ism?: string | null;
  otasi?: string | null;
  sex?: string | null;
  ishJoyi?: string | null;
  lavozim?: string | null;
  kirganSana?: string | null;
  olchamlar?: {
    jinsi?: string | null; boyi?: string | number | null;
    kiyim?: string | null; poyabzal?: string | null; boshKiyim?: string | null;
  } | null;
  normalar?: unknown[];
  imzolar?: { tb?: unknown; sex?: unknown; xisobchi?: unknown };
}): Tekshiruv {
  const k: Kamchilik[] = [];
  const add = (maydon: string, nomi: string, kim: string, ogir = true) =>
    k.push({ maydon, nomi, kim, ogir });

  if (!d.familiya) add("02", "Familiya", "TB muhandisi");
  if (!d.ism) add("03", "Ism", "TB muhandisi");
  if (!d.otasi) add("04", "Otasining ismi", "TB muhandisi", false);
  if (!d.sex) add("06", "Sex / boʻlim", "TB muhandisi");
  if (!d.ishJoyi) add("06", "Ish joyi", "TB muhandisi", false);
  if (!d.lavozim) add("07", "Kasb-lavozimi", "TB muhandisi");
  if (!d.kirganSana) add("08", "Ishga kirgan sana", "TB muhandisi");

  const o = d.olchamlar;
  if (!o?.jinsi) add("10", "Jinsi", "TB muhandisi");
  if (!o?.boyi) add("10", "Boʻyi", "TB muhandisi");
  if (!o?.kiyim) add("10", "Kiyim oʻlchami", "TB muhandisi");
  if (!o?.poyabzal) add("10", "Poyabzal oʻlchami", "TB muhandisi");
  if (!o?.boshKiyim) add("10", "Bosh kiyim oʻlchami", "TB muhandisi", false);

  if (!d.normalar?.length) add("11", "Beriladigan buyumlar roʻyxati", "TB muhandisi");

  if (!d.imzolar?.tb) add("16", "Mehnat muhofazasi imzosi", "TB muhandisi");
  if (!d.imzolar?.sex) add("17", "Sex boʻlimi boshligʻi imzosi", "Sex boshligʻi");
  if (!d.imzolar?.xisobchi) add("18", "Bosh xisobchi imzosi", "Bosh xisobchi");

  return natija(16, k);
}
