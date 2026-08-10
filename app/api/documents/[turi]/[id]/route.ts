/* ------------------------------------------------------------------
   Hujjat generatori — PDF / DOCX

     GET /api/documents/requisition/:id  — Требование МУ№27
     GET /api/documents/card/:id         — МБ-6 kartochka (ishchi id)
     GET /api/documents/journal/:bosqich — Йў Д-26 jurnal

   Maʼlumot Django backend'idan olinadi (/api/v1/state), chizish esa shu
   yerda — pdf-lib bilan — bajariladi, chunki blankalar piksel aniqligida
   sozlangan.

   Avtorizatsiya: foydalanuvchining Bearer tokeni Django'ga uzatiladi.
   Bu marshrut oʻzi hech qanday ruxsat qarorini qabul qilmaydi — kim
   nimani koʻrishi mumkinligini Django hal qiladi.
------------------------------------------------------------------ */
import { requisitionPdf, type ReqData, type ReqSign } from "@/lib/docs/requisition";
import { cardPdf, type CardData } from "@/lib/docs/card";
import { journalPdf, type JournalRow } from "@/lib/docs/journal";
import { requisitionDocx, cardDocx } from "@/lib/docs/word";
import { tekshirRequisition, tekshirCard } from "@/lib/docs/validate";
import { verifyUrl } from "@/lib/sign";
import type { DB, Signature, Worker } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DJANGO = process.env.DJANGO_URL ?? process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

const xato = (matn: string, kod = 400) =>
  Response.json({ error: matn }, { status: kod });

/** Django'dan butun holatni foydalanuvchi tokeni bilan olish */
async function holatOl(req: Request): Promise<DB | null> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth) return null;

  const res = await fetch(`${DJANGO}/api/v1/state`, {
    headers: { authorization: auth },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const d = (await res.json()) as { data?: DB };
  return d.data ?? null;
}

const fmt = (s?: string | null) => {
  if (!s) return "";
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const fio = (w?: Worker | null) =>
  w ? `${w.familiya} ${w.ism}${w.otasi ? " " + w.otasi : ""}`.trim() : "";

/** Imzo yozuvini blankaga chiqadigan koʻrinishga oʻgirish */
function imzoOl(db: DB, sig?: Signature): ReqSign | undefined {
  if (!sig) return undefined;
  const u = db.workers.find((w) => w.id === sig.userId);
  const lavozim = u
    ? db.positions.find((p) => p.id === u.positionId)?.nomi ?? ""
    : "";
  return { fio: fio(u), lavozim, sana: fmt(sig.sana), url: verifyUrl(sig.id) };
}

/** Arizadagi maʼlum maydon imzosi (05, 11, 12, 14 ...) */
const imzoField = (db: DB, sigs: Signature[], field: string) =>
  imzoOl(db, sigs.filter((s) => s.field === field).at(-1));

function wordJavob(buf: Buffer, name: string) {
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ turi: string; id: string }> }
) {
  const db = await holatOl(req);
  if (!db) return xato("Avtorizatsiya talab qilinadi", 401);

  const { turi, id } = await ctx.params;
  const url = new URL(req.url);

  /** blanka=chizma (standart) yoki blanka=surat (skanerlangan asl fon) */
  const rejim: "chizma" | "surat" =
    url.searchParams.get("blanka") === "surat" ? "surat" : "chizma";
  const format = url.searchParams.get("format") === "docx" ? "docx" : "pdf";
  const faqatTekshir = url.searchParams.get("tekshir") === "1";

  let bytes: Uint8Array;
  let name: string;

  /* ================= Требование МУ№27 ================= */
  if (turi === "requisition") {
    const r = db.requests.find((x) => x.id === id);
    if (!r) return xato("Ariza topilmadi", 404);

    const w = db.workers.find((x) => x.id === r.workerId);
    const omb = db.workers.find((x) => x.roles.includes("ombor_mudiri") && x.faol);
    const sigs = r.imzolar ?? [];

    const maketi: ReqData = {
      raqam: r.bugField?.royxat13 || r.raqam,
      depo: db.depo.nomi,
      sana: fmt(r.bugField?.sana07 || r.yaratilgan),
      arizachi: {
        fio: fio(w),
        tabel: w?.tabel ?? "",
        lavozim: db.positions.find((p) => p.id === w?.positionId)?.nomi ?? "",
      },
      omborMudiri: fio(omb),
      lines: r.lines.map((l) => {
        const it = db.items.find((x) => x.id === l.itemId);
        return {
          nomi: it?.nomi ?? "",
          kod: it?.kod,
          olcham: "",
          unit: l.unit,
          soralgan: l.soni,
          berilgan: r.status === "COMPLETED" ? l.soni : undefined,
          narx: l.narx,
        };
      }),
      imzolar: {
        depoBoshligi: imzoField(db, sigs, "05"),
        omborMudiri: imzoField(db, sigs, "11"),
        arizachi: imzoField(db, sigs, "12"),
        boshXisobchi: imzoField(db, sigs, "14"),
      },
      qoshimcha: {
        m16: r.bugField?.oy16,
        m17: r.bugField?.yil17,
        m18: r.bugField?.corr18,
        m19: r.bugField?.uchastok19,
      },
    };

    if (faqatTekshir) {
      return Response.json(
        tekshirRequisition({
          raqam: maketi.raqam,
          sana: maketi.sana,
          arizachiFio: maketi.arizachi.fio,
          arizachiTabel: maketi.arizachi.tabel,
          omborMudiri: maketi.omborMudiri,
          lines: maketi.lines,
          imzolar: maketi.imzolar,
        })
      );
    }

    if (format === "docx") {
      return wordJavob(await requisitionDocx(maketi), `Trebovanie_${r.raqam}.docx`);
    }

    bytes = await requisitionPdf(maketi, rejim);
    name = `Trebovanie_${r.raqam}.pdf`;

  /* ================= МБ-6 kartochka ================= */
  } else if (turi === "card") {
    const w = db.workers.find((x) => x.id === id);
    if (!w) return xato("Ishchi topilmadi", 404);

    const card = db.cards.find((c) => c.workerId === w.id);
    const pids = w.positionIds?.length ? w.positionIds : [w.positionId];

    const maketi: CardData = {
      depo: db.depo.nomi,
      familiya: w.familiya,
      ism: w.ism,
      otasi: w.otasi ?? "",
      sex: w.sex ?? "",
      ishJoyi: w.ishJoyi ?? "",
      lavozim: pids
        .map((p) => db.positions.find((x) => x.id === p)?.nomi)
        .filter(Boolean)
        .join(", "),
      kirganSana: fmt(w.kirganSana),
      olchamlar: {
        jinsi: w.jinsi ?? "",
        boyi: String(w.boyi ?? ""),
        kiyim: w.kiyimOlchami ?? "",
        poyabzal: w.poyabzalOlchami ?? "",
        boshKiyim: w.boshKiyimOlchami ?? "",
      },
      normalar: db.norms
        .filter((n) => pids.includes(n.positionId))
        .map((n) => {
          const it = db.items.find((x) => x.id === n.itemId);
          return {
            nomi: it?.nomi ?? "",
            kod: it?.kod ?? "",
            unit: it?.unit ?? "",
            miqdor: 1,
            muddat: n.muddatOy == null ? "Иш. Чиққун" : `${n.muddatOy} ой`,
          };
        }),
      imzolar: {
        tb: imzoOl(db, card?.imzolar?.["16"]),
        sex: imzoOl(db, card?.imzolar?.["17"]),
        xisobchi: imzoOl(db, card?.imzolar?.["18"]),
      },
      berilgan: (card?.berilgan ?? []).map((b) => {
        const it = db.items.find((x) => x.id === b.itemId);
        return {
          sana: fmt(b.sana),
          nomi: it?.nomi ?? "",
          kod: it?.kod ?? "",
          olcham: "-",
          soni: b.soni,
          yaroqlilik: b.yaroqlilik,
        };
      }),
      qaytarilgan: (card?.qaytarilgan ?? []).map((q) => {
        const it = db.items.find((x) => x.id === q.itemId);
        return {
          sana: fmt(q.sana),
          nomi: it?.nomi ?? "",
          olcham: "-",
          soni: q.soni,
          yaroqlilik: q.yaroqlilik,
        };
      }),
    };

    if (faqatTekshir) return Response.json(tekshirCard(maketi));

    if (format === "docx") {
      return wordJavob(await cardDocx(maketi), `MB6_${w.familiya}_${w.ism}.docx`);
    }

    bytes = await cardPdf(maketi, rejim);
    name = `MB6_${w.familiya}_${w.ism}.pdf`;

  /* ================= Йў Д-26 jurnal ================= */
  } else if (turi === "journal") {
    const bosqich: 1 | 2 = id === "2" ? 2 : 1;

    const rows: JournalRow[] = db.journal
      .filter((j) => j.bosqich === bosqich)
      .sort((a, b) => (a.sana < b.sana ? -1 : 1))
      .map((j) => ({
        sana: fmt(j.sana),
        komissiya: j.komissiya ?? [],
        nomuvofiqlik: j.nomuvofiqlik,
        chora: j.chora,
        masulFio: j.masul ?? "",
        masulLavozim: j.masulLavozim ?? "",
        muddat: fmt(j.muddat),
        belgi: j.bajarildi ? j.bajarilganIzoh || "Бажарилди" : "",
        imzo: imzoOl(db, j.imzo),
      }));

    if (faqatTekshir) {
      return Response.json({
        toliq: rows.length > 0,
        kamchiliklar: [],
        foiz: rows.length ? 100 : 0,
      });
    }

    bytes = await journalPdf(bosqich, db.depo.tashkilot, db.depo.nomi, rows);
    name = `Jurnal_${bosqich}-bosqich.pdf`;

  } else {
    return xato("Notoʻgʻri hujjat turi", 400);
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(name)}"`,
      "Cache-Control": "no-store",
    },
  });
}
