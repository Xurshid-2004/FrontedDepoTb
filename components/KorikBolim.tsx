"use client";

/* ------------------------------------------------------------------
   Koʻrik boʻlimi — «Tibbiy koʻrik» va «Psixolog» sahifalari shu bitta
   komponentdan foydalanadi (`turi` bilan ajraladi). Tuzilma «KIP —
   Yoʻriqchi» boʻlimiga yaqin: rang-barang holat kartalari + toʻliq
   roʻyxat + sana kiritish modali.

   Farqi faqat kiritishda:
     • tibbiy   — kadrlar QAYTA OʻTISH sanasini toʻgʻridan kiritadi;
     • psixolog — psixolog OʻTGAN sana + muddat (3/6/12) tanlaydi,
                  qayta oʻtish sanasi oʻz-oʻzidan hisoblanadi.

   Kim nimani koʻradi (server ham shu qoidada — build_state):
     • admin / <turi>.read.all → hamma;
     • mashinist yoʻriqchisi    → faqat oʻz kolonnasi;
     • boshqa har kim           → faqat oʻzi.
------------------------------------------------------------------ */

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { fio, fioShort, jonliRang, kolonnaNomi, fmt, lokoBrigada } from "@/lib/logic";
import { KORIK_LABEL, type Korik, type KorikTuri, type Worker } from "@/lib/types";
import {
  Badge, Btn, Empty, Field, Input, Modal, PageHead, Panel, Select, Stat, Table, Td, Tr, useToast,
} from "@/components/ui";

/* --- sana yordamchilari --- */
function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function bugun0(): Date {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}
function kunFarqi(tugash: string): number {
  const ms = parseISO(tugash).getTime() - bugun0().getTime();
  return Math.round(ms / 86_400_000);
}
function oyFarqi(tugash: string): number {
  const t = parseISO(tugash);
  const n = bugun0();
  return (t.getFullYear() - n.getFullYear()) * 12 + (t.getMonth() - n.getMonth());
}
function addMonthsISO(sana: string, oy: number): string {
  const d = parseISO(sana);
  const kun = d.getDate();
  const b = new Date(d.getFullYear(), d.getMonth() + oy + 1, 0); // keyingi oy oxiri
  d.setMonth(d.getMonth() + oy);
  if (d.getDate() < kun) d.setDate(Math.min(kun, b.getDate()));
  return d.toISOString().slice(0, 10);
}

/** Holat: qaysi kartaga tegishli va qanday koʻrinadi. */
type Tone = { label: string; color: string; qism: 0 | 1 | 2 | 3 };
function korikTone(tugash: string): Tone {
  const d = kunFarqi(tugash);
  if (d < 0) return { label: "Muddati oʻtdi", color: "#b91c1c", qism: 3 };
  const md = oyFarqi(tugash);
  if (md <= 0) return { label: d === 0 ? "Bugun tugaydi" : `Shu oy · ${d} kun`, color: "#f97316", qism: 2 };
  if (md === 1) return { label: "Keyingi oy", color: "#f59e0b", qism: 1 };
  return { label: `${d} kun qoldi`, color: "#0e9f6e", qism: 0 };
}

/** 3 ta karta — foydalanuvchi soʻragan tartibda. */
const QISM = [
  { q: 1 as const, l: "Keyingi oy tugaydi", c: "#f59e0b" },
  { q: 2 as const, l: "Shu oy tugaydi", c: "#f97316" },
  { q: 3 as const, l: "Muddati oʻtgan", c: "#b91c1c" },
];

const MUDDAT_TANLOV = [
  { val: "3", label: "3 oy" },
  { val: "6", label: "6 oy" },
  { val: "12", label: "12 oy (1 yil)" },
];

export default function KorikBolim({ turi, brand }: { turi: KorikTuri; brand: string }) {
  const { db, me, roles, can, setKorik, deleteKorik } = useStore();
  const t = useToast();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<{ worker: Worker; korik?: Korik } | null>(null);
  const [ochir, setOchir] = useState<{ worker: Worker; korik: Korik } | null>(null);
  const [f, setF] = useState<{ sana: string; tugash: string; muddat: string }>({
    sana: "",
    tugash: "",
    muddat: "6",
  });

  const nom = KORIK_LABEL[turi];
  const canAll = can(`${turi}.read.all` as never);
  const canWrite = can(`${turi}.write` as never);

  const meKol = db.yoriqnoma?.instruktorKolonna ?? null;
  const kolonnaRejim = roles.includes("yoriqchi") && !canAll && !canWrite;

  const korikOf = (wid: string): Korik | undefined =>
    db.koriklar.find((k) => k.workerId === wid && k.turi === turi);

  /* Koʻrsatiladigan ishchilar — koʻrinish doirasiga mos.
     Server maʼlumotni allaqachon cheklagan; bu yerda roʻyxat rows ham
     shunga qarab tuziladi. */
  const scope = useMemo(() => {
    // Psixolog imtixonini faqat mashinist va yordamchilari oʻtadi —
    // shuning uchun bu boʻlim roʻyxatida faqat loko-brigada koʻrinadi.
    // Tibbiy koʻrik hammaga tegishli, u cheklanmaydi.
    let faol = db.workers.filter((w) => w.faol);
    if (turi === "psixolog") faol = faol.filter((w) => lokoBrigada(db, w));
    if (canAll || canWrite) return faol;
    if (kolonnaRejim) {
      const oz = meKol ? faol.filter((w) => w.kolonnaId === meKol.id) : [];
      if (me && !oz.some((w) => w.id === me.id)) {
        const meW = faol.find((w) => w.id === me.id);
        if (meW) return [meW, ...oz];
      }
      return oz;
    }
    return me ? faol.filter((w) => w.id === me.id) : [];
  }, [db, db.workers, canAll, canWrite, kolonnaRejim, meKol, me, turi]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    let rows = scope;
    if (s) {
      rows = rows.filter(
        (w) =>
          fio(w).toLowerCase().includes(s) ||
          w.tabel.includes(s) ||
          (w.kolonna ?? "").toLowerCase().includes(s)
      );
    }
    // Tartib: muddati borlar tugash sanasi boʻyicha (yaqinlari tepada),
    // keyin muddat kiritilmaganlar — familiya boʻyicha.
    return [...rows].sort((a, b) => {
      const ka = korikOf(a.id)?.tugash ?? "";
      const kb = korikOf(b.id)?.tugash ?? "";
      if (ka && kb) return ka < kb ? -1 : ka > kb ? 1 : 0;
      if (ka) return -1;
      if (kb) return 1;
      return fio(a).localeCompare(fio(b), "uz");
    });
  }, [scope, q, db.koriklar, turi]);

  const buckets = QISM.map((x) => ({
    ...x,
    rows: scope.filter((w) => {
      const k = korikOf(w.id);
      return k && korikTone(k.tugash).qism === x.q;
    }),
  }));

  if (!me) return null;

  const boshqara = () => canWrite;

  const yangiOch = (w: Worker) => {
    const bugun = new Date().toISOString().slice(0, 10);
    setF({ sana: turi === "psixolog" ? bugun : "", tugash: "", muddat: "6" });
    setOpen({ worker: w });
  };
  const tahrirOch = (w: Worker, k: Korik) => {
    setF({
      sana: k.sana ?? "",
      tugash: k.tugash,
      muddat: k.muddatOy ? String(k.muddatOy) : "6",
    });
    setOpen({ worker: w, korik: k });
  };

  const saqlab = () => {
    if (!open) return;
    const wid = open.worker.id;
    if (turi === "psixolog") {
      if (!f.sana) return;
      setKorik({ turi, workerId: wid, sana: f.sana, muddatOy: Number(f.muddat) });
      t.show(open.korik ? "Psixolog yozuvi yangilandi" : "Psixolog yozuvi saqlandi");
    } else {
      if (!f.tugash) return;
      setKorik({ turi, workerId: wid, tugash: f.tugash, sana: f.sana || null });
      t.show(open.korik ? "Tibbiy koʻrik yangilandi" : "Tibbiy koʻrik saqlandi");
    }
    setOpen(null);
  };

  const psixTugash = f.sana ? addMonthsISO(f.sana, Number(f.muddat)) : "";

  const BOSH = ["Ishchi", "Kolonna", turi === "psixolog" ? "Oʻtgan sana" : "Kiritilgan", "Qayta oʻtish", "Holat", ""];

  const qatorlar = () =>
    list.map((w) => {
      const k = korikOf(w.id);
      const tone = k ? korikTone(k.tugash) : null;
      return (
        <Tr key={w.id}>
          <Td className="font-medium text-slate-900">
            {fio(w)}
            <span className="block text-[11px] text-slate-500">tabel {w.tabel}</span>
          </Td>
          <Td>{kolonnaNomi(db, w)}</Td>
          <Td className="tabular-nums">{k?.sana ? fmt(k.sana) : "—"}</Td>
          <Td className="tabular-nums">{k ? fmt(k.tugash) : "—"}</Td>
          <Td>
            {tone ? (
              <Badge color={tone.color}>{tone.label}</Badge>
            ) : (
              <Badge color="#64748b">Kiritilmagan</Badge>
            )}
          </Td>
          <Td>
            {canWrite && (
              <div className="flex flex-col items-end gap-1.5">
                <Btn size="sm" variant="primary" onClick={() => (k ? tahrirOch(w, k) : yangiOch(w))}>
                  {k ? "Yangilash" : "Sana kiritish"}
                </Btn>
                {k && boshqara() && (
                  <button
                    onClick={() => setOchir({ worker: w, korik: k })}
                    className="rounded-lg border border-red-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-red-500 transition hover:bg-red-50"
                  >
                    Oʻchirish
                  </button>
                )}
              </div>
            )}
          </Td>
        </Tr>
      );
    });

  const sub = kolonnaRejim
    ? meKol
      ? `Kolonna: ${meKol.nomi} — faqat oʻz kolonnangiz maʼlumotlari.`
      : "Sizga hali kolonna biriktirilmagan."
    : canAll || canWrite
      ? `Jami ${scope.length} ta xodim. Qayta oʻtish sanasi va muddat holati.`
      : "Sizning shaxsiy koʻrik maʼlumotingiz.";

  return (
    <>
      {t.node}
      <PageHead
        title={`${nom} — nazorat`}
        sub={sub}
        right={
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="F.I.Sh., tabel, kolonna"
            className="h-11 w-full sm:h-10 sm:w-[250px]"
          />
        }
      />

      {/* Sanoq kartalari */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        {buckets.map((b) => (
          <Stat key={b.q} label={b.l} value={b.rows.length} color={b.c} />
        ))}
      </div>

      {/* 3 rangli roʻyxat kartasi */}
      <div className="mb-7 grid gap-4 md:grid-cols-3">
        {buckets.map((b) => (
          <div key={b.q} className="rounded-2xl border p-4" style={{ borderColor: `${b.c}55`, background: `${b.c}10` }}>
            <p className="text-[12.5px] font-bold uppercase tracking-wider" style={{ color: b.c }}>
              {b.l}
            </p>
            <div className="mt-3 space-y-1.5">
              {b.rows.length === 0 && <p className="text-[13.5px] text-slate-500">Yoʻq</p>}
              {b.rows.map((w) => {
                const k = korikOf(w.id)!;
                const ichki = (
                  <>
                    <p className="truncate text-[15px] font-bold leading-tight" style={{ color: jonliRang(w.id) }}>
                      {fio(w)}
                    </p>
                    <p className="truncate text-[12px] leading-tight text-slate-500">
                      tabel {w.tabel} · {kolonnaNomi(db, w)} · {fmt(k.tugash)}
                    </p>
                  </>
                );
                return (
                  <div key={w.id} className="rounded-lg bg-white/70 px-2.5 py-1.5">
                    {canWrite ? (
                      <button
                        type="button"
                        onClick={() => tahrirOch(w, k)}
                        title="Sanani yangilash"
                        className="block w-full cursor-pointer text-left transition hover:opacity-80"
                      >
                        {ichki}
                      </button>
                    ) : (
                      ichki
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Toʻliq roʻyxat */}
      <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
        <span className="h-3 w-3 rounded-full" style={{ background: brand }} />
        <h2 className="text-[16px] font-bold tracking-tight text-slate-900 md:text-[17px]">Toʻliq roʻyxat</h2>
        <Badge color={brand}>{list.length} ta xodim</Badge>
      </div>
      <Panel pad={false}>
        {list.length === 0 ? (
          <div className="p-4">
            <Empty text={q.trim() ? `«${q.trim()}» boʻyicha hech kim topilmadi` : "Koʻrsatiladigan xodim yoʻq"} />
          </div>
        ) : (
          <Table head={BOSH} min={900}>
            {qatorlar()}
          </Table>
        )}
      </Panel>

      {/* Kiritish / yangilash modali */}
      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={
          open
            ? `${open.korik ? "Yangilash" : "Kiritish"} — ${fioShort(open.worker)}`
            : nom
        }
      >
        <div className="space-y-4">
          {turi === "psixolog" ? (
            <>
              <Field label="1. Oʻtgan (imtixon) sanasi">
                <Input type="date" value={f.sana} onChange={(e) => setF({ ...f, sana: e.target.value })} />
              </Field>
              <Field label="2. Muddat" hint="Keyingi imtixongacha — psixolog belgilaydi">
                <Select value={f.muddat} onChange={(e) => setF({ ...f, muddat: e.target.value })}>
                  {MUDDAT_TANLOV.map((m) => (
                    <option key={m.val} value={m.val}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {psixTugash && (
                <p className="rounded-lg border border-violet-300 bg-violet-50 px-3.5 py-2.5 text-[12.5px] text-violet-700">
                  Qayta oʻtish sanasi: <b>{fmt(psixTugash)}</b> — tizim shu sanaga bir oy qolganda ogohlantiradi.
                </p>
              )}
            </>
          ) : (
            <>
              <Field label="1. Qayta oʻtishi kerak boʻlgan sana" hint="Kadrlar toʻgʻridan-toʻgʻri kiritadi">
                <Input type="date" value={f.tugash} onChange={(e) => setF({ ...f, tugash: e.target.value })} />
              </Field>
              <Field label="2. Oʻtgan sana (ixtiyoriy)">
                <Input type="date" value={f.sana} onChange={(e) => setF({ ...f, sana: e.target.value })} />
              </Field>
              <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-[12.5px] text-emerald-700">
                Tizim qayta oʻtish sanasiga bir oy qolganda ishchini ogohlantiradi va roʻyxatga chiqaradi.
              </p>
            </>
          )}
          <div className="flex justify-end gap-3">
            <Btn onClick={() => setOpen(null)}>Bekor qilish</Btn>
            <Btn
              variant="primary"
              disabled={turi === "psixolog" ? !f.sana : !f.tugash}
              onClick={saqlab}
            >
              Saqlash
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Oʻchirish */}
      <Modal open={!!ochir} onClose={() => setOchir(null)} title="Yozuv oʻchirilsinmi?">
        <div className="space-y-4">
          {ochir && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[12.5px] text-slate-700">
              <p className="font-semibold text-slate-900">{fioShort(ochir.worker)}</p>
              <p className="mt-1 text-slate-600">
                {nom} · qayta oʻtish: {fmt(ochir.korik.tugash)}
              </p>
            </div>
          )}
          <p className="text-[12px] text-slate-500">Yozuv oʻchiriladi va QR imzo bekor qilinadi.</p>
          <div className="flex justify-end gap-3">
            <Btn onClick={() => setOchir(null)}>Bekor qilish</Btn>
            <Btn
              variant="danger"
              onClick={() => {
                if (ochir) deleteKorik(ochir.worker.id, turi);
                setOchir(null);
                t.show("Yozuv oʻchirildi");
              }}
            >
              Oʻchirish
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}
