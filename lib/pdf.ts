/* ------------------------------------------------------------------
   Hujjat PDF generatori — pdf-lib
   Blankalar asl koʻrinishida chiziladi, ichiga maʼlumot toʻldiriladi.
   Kirill va oʻzbek lotin uchun DejaVu Sans shrifti embed qilinadi.
------------------------------------------------------------------ */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { readFile } from "node:fs/promises";
import path from "node:path";

const A4 = { w: 595.28, h: 841.89 };
const M = 34;                       // chekka
const BLACK = rgb(0, 0, 0);
const GREY = rgb(0.45, 0.45, 0.45);

let cache: { reg: Buffer; bold: Buffer } | null = null;
async function fonts() {
  if (!cache) {
    const dir = path.join(process.cwd(), "assets", "fonts");
    cache = {
      reg: await readFile(path.join(dir, "DejaVuSans.ttf")),
      bold: await readFile(path.join(dir, "DejaVuSans-Bold.ttf")),
    };
  }
  return cache;
}

export interface Doc {
  page: PDFPage;
  pdf: PDFDocument;
  f: PDFFont;
  fb: PDFFont;
}

export async function newDoc(landscape = false): Promise<Doc> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const { reg, bold } = await fonts();
  const f = await pdf.embedFont(reg, { subset: true });
  const fb = await pdf.embedFont(bold, { subset: true });
  const page = pdf.addPage(landscape ? [A4.h, A4.w] : [A4.w, A4.h]);
  return { page, pdf, f, fb };
}

/* ------------------------- chizish yordamchilari ------------------------- */
export function txt(d: Doc, s: string, x: number, y: number, o: { size?: number; bold?: boolean; color?: RGB; max?: number } = {}) {
  const size = o.size ?? 8;
  const font = o.bold ? d.fb : d.f;
  let str = s ?? "";
  if (o.max) {
    while (str && font.widthOfTextAtSize(str, size) > o.max) str = str.slice(0, -1);
  }
  d.page.drawText(str, { x, y, size, font, color: o.color ?? BLACK });
}

/** Koʻp qatorli matn — qutiga sigʻdiradi */
export function wrap(d: Doc, s: string, x: number, y: number, w: number, o: { size?: number; lh?: number; bold?: boolean } = {}) {
  const size = o.size ?? 8, lh = o.lh ?? size + 2;
  const font = o.bold ? d.fb : d.f;
  const words = (s ?? "").split(/\s+/);
  let line = "", cy = y;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (font.widthOfTextAtSize(test, size) > w && line) {
      d.page.drawText(line, { x, y: cy, size, font, color: BLACK });
      cy -= lh; line = word;
    } else line = test;
  }
  if (line) { d.page.drawText(line, { x, y: cy, size, font, color: BLACK }); cy -= lh; }
  return cy;
}

export function box(d: Doc, x: number, y: number, w: number, h: number, thickness = 0.7) {
  d.page.drawRectangle({ x, y, width: w, height: h, borderColor: BLACK, borderWidth: thickness });
}

export function line(d: Doc, x1: number, y1: number, x2: number, y2: number, thickness = 0.7) {
  d.page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color: BLACK });
}

/** Jadval: ustun kengliklari va qatorlar */
export function table(
  d: Doc, x: number, yTop: number, widths: number[], rows: string[][],
  o: { rowH?: number; headBold?: boolean; size?: number } = {}
) {
  const rowH = o.rowH ?? 16, size = o.size ?? 7.5;
  const total = widths.reduce((a, b) => a + b, 0);
  let y = yTop;
  rows.forEach((r, ri) => {
    box(d, x, y - rowH, total, rowH);
    let cx = x;
    widths.forEach((w, ci) => {
      if (ci > 0) line(d, cx, y - rowH, cx, y);
      txt(d, r[ci] ?? "", cx + 3, y - rowH + 5, { size, bold: ri === 0 && (o.headBold ?? true), max: w - 6 });
      cx += w;
    });
    y -= rowH;
  });
  return y;
}

/** QR imzo bloki: lavozim, F.I.Sh., soʻng QR kod */
export async function qrSign(
  d: Doc, x: number, y: number,
  s: { lavozim: string; fio: string; url: string; sana?: string },
  size = 34,
  o: { qrX?: number; textW?: number; compact?: boolean } = {}
) {
  const tw = o.textW ?? 150;
  if (!o.compact) {
    txt(d, s.lavozim, x, y + size - 6, { size: 6.5, color: GREY, max: tw });
    txt(d, s.fio, x, y + size - 15, { size: 7.5, bold: true, max: tw });
    if (s.sana) txt(d, s.sana, x, y + size - 24, { size: 6, color: GREY });
  } else {
    txt(d, s.fio, x, y + size / 2 - 2, { size: 6, bold: true, max: tw });
    if (s.sana) txt(d, s.sana, x, y + 1, { size: 5, color: GREY, max: tw });
  }
  const png = await QRCode.toBuffer(s.url, { margin: 0, width: 200, errorCorrectionLevel: "M" });
  const img = await d.pdf.embedPng(png);
  d.page.drawImage(img, { x: o.qrX ?? x + 156, y, width: size, height: size });
}

/** «Asl surat» rejimi — skanerlangan blankani sahifa foniga qoʻyish.
 *  Ustiga maʼlumot chizilaveradi (chizilgan nusxadagi joylashuv saqlanadi). */
export async function blankaFon(d: Doc, fayl: string, xiralik = 1) {
  try {
    const buf = await readFile(path.join(process.cwd(), "public", "blanka", fayl));
    const img = fayl.toLowerCase().endsWith(".png")
      ? await d.pdf.embedPng(buf)
      : await d.pdf.embedJpg(buf);
    const { width: pw, height: ph } = d.page.getSize();
    // Sahifaga toʻliq sigʻdirish (nisbat saqlanadi)
    const k = Math.min(pw / img.width, ph / img.height);
    const w = img.width * k;
    const h = img.height * k;
    d.page.drawImage(img, {
      x: (pw - w) / 2,
      y: (ph - h) / 2,
      width: w,
      height: h,
      opacity: xiralik,
    });
  } catch {
    // Surat topilmasa — chizilgan blanka bilan davom etadi
  }
}

export async function toBytes(d: Doc): Promise<Uint8Array> {
  return d.pdf.save();
}

export const A4_SIZE = A4;
export const MARGIN = M;
export { BLACK, GREY };
