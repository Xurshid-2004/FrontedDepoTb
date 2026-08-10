/* ------------------------------------------------------------------
   Word (.docx) eksport — Требование МУ№27 va MB-6 kartochka
   Tahrirlash kerak boʻlganda ishlatiladi. Chop etish uchun PDF afzal.
   Talab: npm install docx
------------------------------------------------------------------ */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
} from "docx";
import type { ReqData } from "./requisition";
import type { CardData } from "./card";
import { UNIT_RU } from "./requisition";

const W = 9360; // A4 foydalanish kengligi (DXA)

const P = (t: string, o: { b?: boolean; size?: number; al?: (typeof AlignmentType)[keyof typeof AlignmentType]; after?: number } = {}) =>
  new Paragraph({
    children: [new TextRun({ text: t, bold: o.b, size: o.size ?? 20 })],
    alignment: o.al,
    spacing: { after: o.after ?? 80 },
  });

function cell(t: string, o: { b?: boolean; w: number; shade?: string } = { w: 1000 }) {
  return new TableCell({
    width: { size: o.w, type: WidthType.DXA },
    shading: o.shade ? { type: ShadingType.CLEAR, fill: o.shade, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({ children: [new TextRun({ text: t, bold: o.b, size: 18 })] })],
  });
}

function tbl(headers: string[], rows: string[][], widths: number[]) {
  const sum = widths.reduce((a, b) => a + b, 0);
  widths[widths.length - 1] += W - sum;
  return new Table({
    columnWidths: widths,
    width: { size: W, type: WidthType.DXA },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => cell(h, { b: true, w: widths[i], shade: "E8EEF6" })),
      }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, { w: widths[i] })) })),
    ],
  });
}

const money = (n?: number) =>
  n == null ? "" : new Intl.NumberFormat("ru-RU").format(n).replace(/ /g, " ");

const imzoQatori = (label: string, s?: { fio: string; lavozim: string; sana?: string }) =>
  P(`${label}: ${s ? `${s.lavozim} — ${s.fio}${s.sana ? ` (${s.sana})` : ""}  [QR imzo]` : "____________________"}`, { size: 18 });

/* ===================== Требование МУ№27 ===================== */
export async function requisitionDocx(d: ReqData): Promise<Buffer> {
  const rows = d.lines.map((l, i) => [
    String(i + 1), l.nomi, l.kod ?? "", l.olcham ?? "-",
    UNIT_RU[l.unit] ?? l.unit, String(l.soralgan),
    l.berilgan != null ? String(l.berilgan) : "", money(l.narx),
  ]);
  const jami = d.lines.reduce((s, l) => s + (l.narx ?? 0) * (l.berilgan ?? l.soralgan), 0);
  rows.push(["", "ИТОГО", "", "", "", "", "", money(jami)]);

  const doc = new Document({
    styles: { default: { document: { run: { font: "Times New Roman", size: 20 } } } },
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      children: [
        P("Форма МУ№27", { size: 16, al: AlignmentType.RIGHT }),
        P("ТРЕБОВАНИЕ", { b: true, size: 30, al: AlignmentType.CENTER, after: 60 }),
        P("на выдачу спецодежды, спецобуви и предохранительных приспособлений",
          { size: 18, al: AlignmentType.CENTER, after: 200 }),
        P(`Предприятие (01): ${d.depo}          № (13): ${d.raqam}`),
        P(`Кому (02): ${d.arizachi.fio} — ${d.arizachi.lavozim}          Таб. № (20): ${d.arizachi.tabel}`),
        P(`Через кого (03): ${d.omborMudiri}          Дата (07): ${d.sana}`, { after: 200 }),
        tbl(
          ["№", "Наименование (06)", "Код", "Размер", "Ед. (08)", "Затр. (09)", "Отп. (10)", "Цена (15)"],
          rows,
          [500, 2600, 900, 800, 700, 900, 900, 1200]
        ),
        P("", { after: 240 }),
        P("Имзолар / Подписи", { b: true, size: 22 }),
        imzoQatori("(05) Депо бошлиғи", d.imzolar.depoBoshligi),
        imzoQatori("(14) Бош ҳисобчи", d.imzolar.boshXisobchi),
        imzoQatori("(11) Омбор мудири", d.imzolar.omborMudiri),
        imzoQatori("(12) Ариза юборувчи", d.imzolar.arizachi),
        P("", { after: 200 }),
        P(`Ҳужжат тизимда яратилган · ${new Date().toLocaleString("ru-RU")}`, { size: 14 }),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}

/* ===================== MB-6 kartochka ===================== */
export async function cardDocx(c: CardData): Promise<Buffer> {
  const normRows = c.normalar.map((n, i) => [
    String(i + 1), n.nomi, n.kod, n.unit, String(n.miqdor), n.muddat,
  ]);
  if (!normRows.length) normRows.push(["", "", "", "", "", ""]);

  const berilgan = c.berilgan.map((b) => [
    b.sana, b.nomi, b.olcham, String(b.soni), String(b.yaroqlilik),
    b.imzo ? `${b.imzo.fio} [QR]` : "",
  ]);
  if (!berilgan.length) berilgan.push(["", "", "", "", "", ""]);

  const qaytarilgan = c.qaytarilgan.map((q) => [
    q.sana, q.nomi, q.olcham, String(q.soni), String(q.yaroqlilik),
    q.imzoIshchi ? `${q.imzoIshchi.fio} [QR]` : "",
    q.imzoOmbor ? `${q.imzoOmbor.fio} [QR]` : "",
  ]);

  const doc = new Document({
    styles: { default: { document: { run: { font: "Times New Roman", size: 20 } } } },
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      children: [
        P("МБ-6", { size: 16, al: AlignmentType.RIGHT }),
        P("ШАХСИЙ КАРТОЧКА", { b: true, size: 28, al: AlignmentType.CENTER, after: 60 }),
        P("махсус кийим, махсус пойабзал ва ҳимоя воситаларини ҳисобга олиш",
          { size: 18, al: AlignmentType.CENTER, after: 200 }),
        P(`Корхона (01): ${c.depo}`),
        P(`Фамилия (02): ${c.familiya}     Исм (03): ${c.ism}     Отасининг исми (04): ${c.otasi}`),
        P(`Сех/бўлим (06): ${c.sex}     Иш жойи: ${c.ishJoyi}`),
        P(`Касб-лавозими (07): ${c.lavozim}     Ишга кирган сана (08): ${c.kirganSana}`, { after: 200 }),
        P("Ўлчамлари (10)", { b: true }),
        tbl(
          ["Жинси", "Бўйи", "Кийим", "Пойабзал", "Бош кийим"],
          [[c.olchamlar.jinsi, c.olchamlar.boyi, c.olchamlar.kiyim, c.olchamlar.poyabzal, c.olchamlar.boshKiyim]],
          [1600, 1400, 1900, 2100, 2360]
        ),
        P("", { after: 200 }),
        P("Бериладиган махсус кийим, пойабзал ва ҳимоя воситалари (11, 19)", { b: true }),
        tbl(["№", "Номи", "Код (20)", "Бирлик (13)", "Миқдор (14)", "Муддат (15)"],
          normRows, [500, 3200, 1400, 1200, 1200, 1860]),
        P("", { after: 200 }),
        imzoQatori("(16) Меҳнат муҳофазаси муҳандиси", c.imzolar.tb),
        imzoQatori("(17) Сех бўлими бошлиғи", c.imzolar.sex),
        imzoQatori("(18) Бош ҳисобчи", c.imzolar.xisobchi),
        new Paragraph({ text: "", pageBreakBefore: true }),
        P("БЕРИЛГАН", { b: true, size: 24 }),
        tbl(["Сана (21)", "Номи", "Ўлчам", "Сони (22)", "Яроқлилик % (23)", "Имзо (25)"],
          berilgan, [1200, 3000, 900, 1000, 1500, 1760]),
        P("", { after: 240 }),
        P("ҚАЙТАРИЛГАН", { b: true, size: 24 }),
        P("(бу бўлим фақат буюм қайтарилганда тўлдирилади)", { size: 16 }),
        tbl(["Сана (26)", "Номи", "Ўлчам", "Сони (27)", "Яроқлилик % (28)", "Ишчи (29)", "Омбор (30)"],
          qaytarilgan.length ? qaytarilgan : [["", "", "", "", "", "", ""]],
          [1100, 2400, 800, 900, 1300, 1400, 1460]),
        P("", { after: 200 }),
        P(`Ҳужжат тизимда яратилган · ${new Date().toLocaleString("ru-RU")}`, { size: 14 }),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}
