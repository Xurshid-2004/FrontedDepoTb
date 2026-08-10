/* ------------------------------------------------------------------
   Шахсий карточка МБ-6 — old (01–20) va orqa (21–30) tomonlari
------------------------------------------------------------------ */
import { newDoc, txt, box, line, table, qrSign, toBytes, blankaFon, A4_SIZE, MARGIN, GREY } from "../pdf";
import type { ReqSign } from "./requisition";

export interface CardData {
  depo: string;                                   // 01
  familiya: string; ism: string; otasi: string;   // 02 03 04
  m05?: string;                                   // 05 — bosh xisobchi kiritadi
  sex: string; ishJoyi: string;                   // 06
  lavozim: string;                                // 07
  kirganSana: string;                             // 08
  olchamlar: {                                    // 10
    jinsi: string; boyi: string;
    kiyim: string; poyabzal: string; boshKiyim: string;
  };
  normalar: {                                     // 11, 13, 14, 15, 19, 20
    nomi: string; kod: string; unit: string; miqdor: number; muddat: string;
  }[];
  imzolar: { tb?: ReqSign; sex?: ReqSign; xisobchi?: ReqSign };  // 16 17 18
  berilgan: {                                     // 21–25
    sana: string; nomi: string; kod: string; olcham: string;
    soni: number; yaroqlilik: number; imzo?: ReqSign;
  }[];
  qaytarilgan: {                                  // 26–30
    sana: string; nomi: string; olcham: string; soni: number; yaroqlilik: number;
    imzoIshchi?: ReqSign; imzoOmbor?: ReqSign;
  }[];
}

export async function cardPdf(
  c: CardData,
  rejim: "chizma" | "surat" = "chizma"
): Promise<Uint8Array> {
  const d = await newDoc();
  const W = A4_SIZE.w - MARGIN * 2;
  let y = A4_SIZE.h - MARGIN;

  if (rejim === "surat") await blankaFon(d, "mb6-old.jpg", 0.22);

  /* ================= OLD TOMON ================= */
  txt(d, "МБ-6", A4_SIZE.w - MARGIN - 30, y - 8, { size: 7, color: GREY });
  y -= 16;
  txt(d, "ШАХСИЙ КАРТОЧКА", MARGIN + W / 2 - 55, y - 10, { size: 12, bold: true });
  y -= 20;
  txt(d, "махсус кийим, махсус пойабзал ва ҳимоя воситаларини ҳисобга олиш",
      MARGIN + 48, y - 8, { size: 7.5 });
  y -= 22;

  const fld = (label: string, val: string, x: number, w: number, yy: number, num?: string) => {
    txt(d, num ? `${label} (${num})` : label, x, yy - 7, { size: 6.5, color: GREY });
    txt(d, val, x + 2, yy - 18, { size: 8.5, bold: true, max: w - 6 });
    line(d, x, yy - 21, x + w, yy - 21, 0.5);
  };

  fld("Корхона", c.depo, MARGIN, W, y, "01");
  y -= 28;
  fld("Фамилия", c.familiya, MARGIN, 170, y, "02");
  fld("Исм", c.ism, MARGIN + 180, 160, y, "03");
  fld("Отасининг исми", c.otasi, MARGIN + 350, W - 350, y, "04");
  y -= 28;
  fld("Сех / бўлим", c.sex, MARGIN, 170, y, "06");
  fld("Иш жойи", c.ishJoyi, MARGIN + 180, 160, y, "06");
  fld("Ҳисобчи белгиси", c.m05 ?? "", MARGIN + 350, W - 350, y, "05");
  y -= 28;
  fld("Касб-лавозими", c.lavozim, MARGIN, 260, y, "07");
  fld("Ишга кирган сана", c.kirganSana, MARGIN + 270, 120, y, "08");
  txt(d, "(09) — бўш", MARGIN + 400, y - 18, { size: 6.5, color: GREY });
  y -= 30;

  /* --- 10 antropometriya --- */
  txt(d, "Ўлчамлари (10)", MARGIN, y - 8, { size: 7.5, bold: true });
  y -= 12;
  y = table(d, MARGIN, y,
    [90, 70, 100, 110, W - 370],
    [["Жинси", "Бўйи", "Кийим ўлчами", "Пойабзал ўлчами", "Бош кийим ўлчами"],
     [c.olchamlar.jinsi, c.olchamlar.boyi, c.olchamlar.kiyim, c.olchamlar.poyabzal, c.olchamlar.boshKiyim]],
    { rowH: 17 });
  y -= 18;

  /* --- 11/13/14/15/19/20 normalar --- */
  txt(d, "Бериладиган махсус кийим, пойабзал ва ҳимоя воситалари (11, 19)",
      MARGIN, y - 8, { size: 7.5, bold: true });
  y -= 12;
  const rows: string[][] = [
    ["№", "Номи (11 / 19)", "Код (20)", "Бирлик (13)", "Миқдор (14)", "Муддат (15)"],
  ];
  c.normalar.forEach((n, i) =>
    rows.push([String(i + 1), n.nomi, n.kod, n.unit, String(n.miqdor), n.muddat]));
  if (!c.normalar.length) rows.push(["", "", "", "", "", ""]);
  y = table(d, MARGIN, y, [22, 210, 78, 60, 60, W - 430], rows, { rowH: 16 });
  y -= 8;
  txt(d, "(12) — ҳужжатда бўш қолдирилади", MARGIN, y - 6, { size: 6.5, color: GREY });
  y -= 24;

  /* --- 16/17/18 imzolar --- */
  box(d, MARGIN, y - 54, W, 54, 0.5);
  const sigs: [string, ReqSign | undefined][] = [
    ["(16) Меҳнат муҳофазаси", c.imzolar.tb],
    ["(17) Сех бўлими бошлиғи", c.imzolar.sex],
    ["(18) Бош ҳисобчи", c.imzolar.xisobchi],
  ];
  for (let i = 0; i < 3; i++) {
    const [label, s] = sigs[i];
    const cx = MARGIN + 8 + i * (W / 3);
    txt(d, label, cx, y - 12, { size: 6.5, color: GREY });
    if (s) await qrSign(d, cx, y - 50, { ...s }, 30);
    else line(d, cx, y - 40, cx + W / 3 - 24, y - 40, 0.4);
  }

  /* ================= ORQA TOMON ================= */
  const p2 = d.pdf.addPage([A4_SIZE.w, A4_SIZE.h]);
  const d2 = { ...d, page: p2 };
  if (rejim === "surat") await blankaFon(d2, "mb6-orqa.jpg", 0.22);
  let y2 = A4_SIZE.h - MARGIN;

  txt(d2, "МБ-6 — орқа томони", MARGIN, y2 - 8, { size: 7, color: GREY });
  txt(d2, `${c.familiya} ${c.ism} ${c.otasi}`, A4_SIZE.w - MARGIN - 200, y2 - 8,
      { size: 8, bold: true, max: 200 });
  y2 -= 26;

  /* --- Berilgan 21–25 --- */
  txt(d2, "БЕРИЛГАН", MARGIN, y2 - 9, { size: 10, bold: true });
  y2 -= 16;
  const bw = [56, 150, 40, 40, 56, 30, W - 372];
  const br: string[][] = [["Сана (21)", "Номи", "Ўлчам", "Сони", "Яроқ.%", "(24)", "Имзо (25)"]];
  c.berilgan.forEach(b => br.push([b.sana, b.nomi, b.olcham, String(b.soni), String(b.yaroqlilik), "", ""]));
  for (let i = c.berilgan.length; i < 12; i++) br.push(["", "", "", "", "", "", ""]);
  const bTop = y2;
  y2 = table(d2, MARGIN, y2, bw, br, { rowH: 16 });

  // Imzolarni qatorlar ustiga qoʻyish (ixcham koʻrinish)
  const x25 = MARGIN + bw.slice(0, 6).reduce((a, b) => a + b, 0);
  let rowY = bTop - 16;
  for (const b of c.berilgan) {
    rowY -= 16;
    if (b.imzo) await qrSign(d2, x25 + 3, rowY + 2, b.imzo, 12, { compact: true, qrX: x25 + bw[6] - 15, textW: bw[6] - 22 });
  }

  y2 -= 22;

  /* --- Qaytarilgan 26–30 --- */
  txt(d2, "ҚАЙТАРИЛГАН", MARGIN, y2 - 9, { size: 10, bold: true });
  txt(d2, "(бу бўлим фақат буюм қайтарилганда тўлдирилади)", MARGIN + 90, y2 - 9,
      { size: 6.5, color: GREY });
  y2 -= 16;
  const qw = [56, 140, 40, 40, 56, 72, W - 404];
  const qr: string[][] = [["Сана (26)", "Номи", "Ўлчам", "Сони", "Яроқ.%", "Ишчи (29)", "Омбор (30)"]];
  c.qaytarilgan.forEach(q => qr.push([q.sana, q.nomi, q.olcham, String(q.soni), String(q.yaroqlilik), "", ""]));
  for (let i = c.qaytarilgan.length; i < 8; i++) qr.push(["", "", "", "", "", "", ""]);
  const qTop = y2;
  table(d2, MARGIN, y2, qw, qr, { rowH: 16 });

  const x29 = MARGIN + qw.slice(0, 5).reduce((a, b) => a + b, 0);
  const x30 = x29 + qw[5];
  let qRowY = qTop - 16;
  for (const q of c.qaytarilgan) {
    qRowY -= 16;
    if (q.imzoIshchi) await qrSign(d2, x29 + 3, qRowY + 2, q.imzoIshchi, 12, { compact: true, qrX: x29 + qw[5] - 15, textW: qw[5] - 22 });
    if (q.imzoOmbor)  await qrSign(d2, x30 + 3, qRowY + 2, q.imzoOmbor, 12, { compact: true, qrX: x30 + qw[6] - 15, textW: qw[6] - 22 });
  }

  txt(d2, `Ҳужжат тизимда яратилган · ${new Date().toLocaleString("ru-RU")}`,
      MARGIN, MARGIN - 6, { size: 6, color: GREY });

  return toBytes(d);
}
