/* ------------------------------------------------------------------
   Йў Д-26 — Маъмурий жамоатчилик назоратини қайд қилиш ЖУРНАЛИ
   1-bosqich / 2-bosqich. Albom yoʻnalishi, koʻp qatorli kataklar.
------------------------------------------------------------------ */
import { newDoc, txt, box, line, qrSign, toBytes, A4_SIZE, MARGIN, GREY, type Doc } from "../pdf";
import type { ReqSign } from "./requisition";

export interface JournalRow {
  sana: string;
  komissiya: { fio: string; lavozim: string }[];
  nomuvofiqlik: string;
  chora: string;
  masulFio: string;
  masulLavozim: string;
  muddat: string;
  belgi: string;
  imzo?: ReqSign;
}

const SIZE = 6.8;
const LH = 8.4;
const PAD = 3;

/** Matnni ustun kengligiga qarab qatorlarga boʻlish */
function split(d: Doc, s: string, w: number, size = SIZE): string[] {
  const out: string[] = [];
  for (const para of (s ?? "").split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (d.f.widthOfTextAtSize(test, size) > w - PAD * 2 && line) { out.push(line); line = word; }
      else line = test;
    }
    out.push(line);
  }
  return out.length ? out : [""];
}

export async function journalPdf(
  bosqich: 1 | 2, tashkilot: string, depo: string, rows: JournalRow[]
): Promise<Uint8Array> {
  const d = await newDoc(true);                   // albom
  const W = A4_SIZE.h - MARGIN * 2;               // ≈ 774
  const PAGE_BOTTOM = MARGIN + 22;
  let y = A4_SIZE.w - MARGIN;

  const widths = [54, 116, 168, 168, 112, 58, 98];
  const head = [
    "Назоратни ўтказиш\nсанаси (1)",
    "Комиссия таркиби:\nФ.И.О., лавозими (2)",
    "Меҳнатни муҳофаза қилиш бўйича\nаниқланган номувофиқликлар (3)",
    "Чора-тадбирлар (4)",
    "Ижроси учун жавобгар\nшахслар (5)",
    "Бажариш\nмуддати (6)",
    "Бажарилгани бўйича\nбелги (7)",
  ];

  function header() {
    txt(d, "Йў Д-26", MARGIN + W - 40, y - 8, { size: 7, color: GREY });
    txt(d, tashkilot, MARGIN, y - 9, { size: 8, bold: true });
    txt(d, depo, MARGIN, y - 20, { size: 7.5 });
    y -= 40;
    const nom = bosqich === 1 ? "БИРИНЧИ" : "ИККИНЧИ";
    const t1 = `МАЪМУРИЙ ЖАМОАТЧИЛИК НАЗОРАТИНИНГ ${nom} БОСҚИЧИНИ`;
    txt(d, t1, MARGIN + (W - d.fb.widthOfTextAtSize(t1, 11)) / 2, y - 10, { size: 11, bold: true });
    y -= 15;
    const t2 = "ҚАЙД ҚИЛИШ ЖУРНАЛИ";
    txt(d, t2, MARGIN + (W - d.fb.widthOfTextAtSize(t2, 11)) / 2, y - 10, { size: 11, bold: true });
    y -= 26;
    const { h } = drawRow(head, true);
    y -= h;
  }

  function drawRow(cells: string[], isHead = false, imzo?: ReqSign) {
    const lines = cells.map((c, i) => split(d, c, widths[i], isHead ? 6.4 : SIZE));
    const h = Math.max(18, Math.max(...lines.map(l => l.length)) * LH + PAD * 2);
    box(d, MARGIN, y - h, W, h);
    let cx = MARGIN;
    lines.forEach((ls, i) => {
      if (i > 0) line(d, cx, y - h, cx, y);
      ls.forEach((s, li) =>
        txt(d, s, cx + PAD, y - PAD - LH * (li + 1) + 2.5, { size: isHead ? 6.4 : SIZE, bold: isHead }));
      cx += widths[i];
    });
    return { h, x7: MARGIN + widths.slice(0, 6).reduce((a, b) => a + b, 0) };
  }

  header();

  for (const r of rows) {
    const cells = [
      r.sana,
      r.komissiya.map(k => `${k.fio} — ${k.lavozim}`).join("\n"),
      r.nomuvofiqlik,
      r.chora,
      `${r.masulFio}${r.masulLavozim ? "\n" + r.masulLavozim : ""}`,
      r.muddat,
      r.imzo ? `${r.belgi}\n\n\n` : r.belgi,   // imzo uchun joy qoldiriladi
    ];
    // Sahifa toʻlsa yangisini ochish
    const probe = Math.max(18, Math.max(...cells.map((c, i) => split(d, c, widths[i]).length)) * LH + PAD * 2);
    const need = Math.max(probe, r.imzo ? 44 : probe);
    if (y - need < PAGE_BOTTOM) {
      d.page = d.pdf.addPage([A4_SIZE.h, A4_SIZE.w]);
      y = A4_SIZE.w - MARGIN;
      header();
    }

    const { h, x7 } = drawRow(cells, false);
    if (r.imzo) {
      await qrSign(d, x7 + PAD, y - h + 4, r.imzo, 20, {
        compact: true, qrX: x7 + widths[6] - 24, textW: widths[6] - 30,
      });
    }
    y -= h;
  }

  if (!rows.length) { drawRow(["", "", "", "", "", "", ""]); y -= 18; }

  txt(d, `Ҳужжат тизимда яратилган · ${new Date().toLocaleString("ru-RU")} · жами ${rows.length} ёзув`,
      MARGIN, MARGIN - 4, { size: 6, color: GREY });

  return toBytes(d);
}
