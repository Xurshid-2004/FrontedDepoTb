/* ------------------------------------------------------------------
   Требование — Форма МУ№27
   Blanka asl tuzilishida chiziladi, 01–20 maydonlar toʻldiriladi.
------------------------------------------------------------------ */
import { newDoc, txt, box, line, table, qrSign, toBytes, blankaFon, A4_SIZE, MARGIN, GREY } from "../pdf";

export interface ReqSign { lavozim: string; fio: string; url: string; sana?: string }

export interface ReqData {
  raqam: string;                 // 13 — roʻyxatga olingan raqam
  depo: string;                  // 01
  sana: string;                  // 07
  arizachi: { fio: string; tabel: string; lavozim: string };   // 02, 20
  omborMudiri: string;           // 03
  lines: {                       // 06, 08, 09, 10, 15
    nomi: string; kod?: string; olcham?: string;
    unit: string; soralgan: number; berilgan?: number; narx?: number;
  }[];
  imzolar: {
    depoBoshligi?: ReqSign;      // 05
    omborMudiri?: ReqSign;       // 11
    arizachi?: ReqSign;          // 12
    boshXisobchi?: ReqSign;      // 14
  };
  qoshimcha?: { m16?: string; m17?: string; m18?: string; m19?: string };
}

/** Oʻlchov birligini blanka tiliga (ruscha) oʻgirish */
export const UNIT_RU: Record<string, string> = {
  dona: "шт", juft: "пар", kg: "кг", metr: "м", sm: "см",
};

const money = (n?: number) =>
  n == null ? "" : new Intl.NumberFormat("ru-RU").format(n).replace(/ /g, " ");

export async function requisitionPdf(
  d0: ReqData,
  rejim: "chizma" | "surat" = "chizma"
): Promise<Uint8Array> {
  const d = await newDoc();
  const W = A4_SIZE.w - MARGIN * 2;
  let y = A4_SIZE.h - MARGIN;

  // «Asl surat» rejimida skanerlangan blanka fonga qoʻyiladi
  if (rejim === "surat") await blankaFon(d, "trebovanie.jpg", 0.22);

  /* --- Sarlavha --- */
  txt(d, "Форма МУ№27", A4_SIZE.w - MARGIN - 70, y - 8, { size: 7, color: GREY });
  y -= 18;
  txt(d, "ТРЕБОВАНИЕ", MARGIN + W / 2 - 40, y - 10, { size: 13, bold: true });
  y -= 24;
  txt(d, "на выдачу спецодежды, спецобуви и предохранительных приспособлений",
      MARGIN + 60, y - 8, { size: 7.5 });
  y -= 22;

  /* --- 01 Depo --- */
  txt(d, "Предприятие (01):", MARGIN, y - 8, { size: 7.5, color: GREY });
  txt(d, d0.depo, MARGIN + 82, y - 8, { size: 8.5, bold: true });
  line(d, MARGIN + 78, y - 10, MARGIN + 330, y - 10, 0.5);

  txt(d, "№ (13):", MARGIN + 350, y - 8, { size: 7.5, color: GREY });
  txt(d, d0.raqam, MARGIN + 385, y - 8, { size: 8.5, bold: true });
  line(d, MARGIN + 382, y - 10, MARGIN + W, y - 10, 0.5);
  y -= 22;

  /* --- 02 / 20 / 03 / 07 --- */
  txt(d, "Кому (02):", MARGIN, y - 8, { size: 7.5, color: GREY });
  txt(d, `${d0.arizachi.fio} — ${d0.arizachi.lavozim}`, MARGIN + 50, y - 8, { size: 8, max: 250 });
  line(d, MARGIN + 46, y - 10, MARGIN + 310, y - 10, 0.5);

  txt(d, "Таб. № (20):", MARGIN + 330, y - 8, { size: 7.5, color: GREY });
  txt(d, d0.arizachi.tabel, MARGIN + 388, y - 8, { size: 8, bold: true });
  line(d, MARGIN + 384, y - 10, MARGIN + W, y - 10, 0.5);
  y -= 18;

  txt(d, "Через кого (03):", MARGIN, y - 8, { size: 7.5, color: GREY });
  txt(d, d0.omborMudiri, MARGIN + 74, y - 8, { size: 8, max: 230 });
  line(d, MARGIN + 70, y - 10, MARGIN + 310, y - 10, 0.5);

  txt(d, "Дата (07):", MARGIN + 330, y - 8, { size: 7.5, color: GREY });
  txt(d, d0.sana, MARGIN + 378, y - 8, { size: 8, bold: true });
  line(d, MARGIN + 374, y - 10, MARGIN + W, y - 10, 0.5);
  y -= 24;

  /* --- 04 (toʻldirilmaydi) --- */
  txt(d, "(04) — не заполняется", MARGIN, y - 6, { size: 6.5, color: GREY });
  y -= 16;

  /* --- Jadval 06 · 08 · 09 · 10 · 15 --- */
  const widths = [20, 160, 54, 46, 40, 52, 52, 60];
  const head = ["№", "Наименование (06)", "Код", "Размер", "Ед. (08)", "Затр. (09)", "Отп. (10)", "Цена (15)"];
  const rows: string[][] = [head];
  d0.lines.forEach((l, i) => rows.push([
    String(i + 1), l.nomi, l.kod ?? "", l.olcham ?? "-", UNIT_RU[l.unit] ?? l.unit,
    String(l.soralgan), l.berilgan != null ? String(l.berilgan) : "",
    money(l.narx),
  ]));
  const jami = d0.lines.reduce((s, l) => s + (l.narx ?? 0) * (l.berilgan ?? l.soralgan), 0);
  rows.push(["", "ИТОГО", "", "", "", "", "", money(jami)]);
  y = table(d, MARGIN, y, widths, rows, { rowH: 17, size: 7.5 });
  y -= 26;

  /* --- 16–19 --- */
  const extra = [
    ["(16)", d0.qoshimcha?.m16 ?? ""],
    ["(17)", d0.qoshimcha?.m17 ?? ""],
    ["(18)", d0.qoshimcha?.m18 ?? ""],
    ["(19)", d0.qoshimcha?.m19 ?? ""],
  ];
  extra.forEach(([k, v], i) => {
    const cx = MARGIN + (i % 2) * (W / 2);
    const cy = y - Math.floor(i / 2) * 18;
    txt(d, k, cx, cy - 8, { size: 7, color: GREY });
    txt(d, v, cx + 24, cy - 8, { size: 8, max: W / 2 - 40 });
    line(d, cx + 20, cy - 10, cx + W / 2 - 14, cy - 10, 0.4);
  });
  y -= 52;

  /* --- Imzolar: 05 · 11 · 12 · 14 --- */
  txt(d, "Имзолар / Подписи", MARGIN, y - 8, { size: 8, bold: true });
  y -= 16;
  box(d, MARGIN, y - 96, W, 96, 0.5);

  const cells: [string, ReqSign | undefined][] = [
    ["(05) Депо бошлиғи", d0.imzolar.depoBoshligi],
    ["(14) Бош ҳисобчи", d0.imzolar.boshXisobchi],
    ["(11) Омбор мудири", d0.imzolar.omborMudiri],
    ["(12) Ариза юборувчи", d0.imzolar.arizachi],
  ];
  for (let i = 0; i < cells.length; i++) {
    const [label, s] = cells[i];
    const cx = MARGIN + 8 + (i % 2) * (W / 2);
    const cy = y - 44 - Math.floor(i / 2) * 46;
    txt(d, label, cx, cy + 34, { size: 6.5, color: GREY });
    if (s) await qrSign(d, cx, cy - 4, s, 32);
    else line(d, cx, cy + 4, cx + W / 2 - 24, cy + 4, 0.4);
  }

  txt(d, `Ҳужжат тизимда яратилган · ${new Date().toLocaleString("ru-RU")}`,
      MARGIN, MARGIN - 6, { size: 6, color: GREY });

  return toBytes(d);
}
