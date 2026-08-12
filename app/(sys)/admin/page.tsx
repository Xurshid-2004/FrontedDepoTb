"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStore, type ImportRow, type WorkerYozuv } from "@/lib/store";
import { fmt, fmtDT, fio, fioShort, iso, itemById, money, positionById, positionNames, TODAY } from "@/lib/logic";
import {
  ALL_PERMS, PERM_LABEL, ROLE_PERMS,
  ALL_FEATURES, FEATURE_LABEL, FEATURE_GROUPS, ROLE_FEATURES,
  type AccessKey, type FeatureKey, type Perm,
} from "@/lib/permissions";
import { ROLE_LABEL, type Norm, type Role, type Unit } from "@/lib/types";
import {
  Badge, Btn, Empty, Field, Input, Modal, PageHead, Panel, Select, Stat, Table, Td, Tr, useToast,
} from "@/components/ui";
import WorkerFace from "@/components/WorkerFace";

type Tab = "ishchilar" | "buyumlar" | "lavozimlar" | "normalar" | "ruxsatlar" | "korinish" | "parollar" | "sozlama" | "audit";

const TABS: { k: Tab; l: string }[] = [
  { k: "ishchilar", l: "Ishchilar" },
  { k: "buyumlar", l: "Buyumlar va narxlar" },
  { k: "lavozimlar", l: "Lavozimlar" },
  { k: "normalar", l: "31-ilova normalari" },
  { k: "ruxsatlar", l: "Ruxsatlar" },
  { k: "korinish", l: "Koʻrinish" },
  { k: "parollar", l: "Parollar" },
  { k: "sozlama", l: "Sozlamalar" },
  { k: "audit", l: "Audit-log" },
];

/* ------------ yordamchi: fayl → base64 data URL ------------ */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/* ------------ CSV/matn → import qatorlari ------------ */
function parseRows(text: string): ImportRow[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const p = l.split(/[,\t;]/).map((s) => s.trim());
      return { tabel: p[0] ?? "", familiya: p[1] ?? "", ism: p[2] ?? "", otasi: p[3] ?? "" } as ImportRow;
    })
    .filter((r) => r.tabel && r.familiya && r.ism);
}

/* ------------ tri-state ketma-ketligi: standart → yoq → yashir → standart ------------ */
function nextState(s: boolean | undefined): boolean | null {
  if (s === undefined) return true;
  if (s === true) return false;
  return null;
}

function TriCell({ state, def, onCycle }: { state: boolean | undefined; def: boolean; onCycle: () => void }) {
  const label = state === true ? "✓" : state === false ? "✕" : def ? "+" : "—";
  const color = state === true ? "#16a34a" : state === false ? "#dc2626" : def ? "#94a3b8" : "#cbd5e1";
  const title =
    state === undefined
      ? `Standart (${def ? "yoniq" : "yashirin"}) — bosib override qiling`
      : state
        ? "Majburan yoniq"
        : "Majburan yashirin";
  return (
    <button
      onClick={onCycle}
      title={title}
      className={`mx-auto grid h-7 w-7 place-items-center rounded-md hover:bg-slate-100 ${
        state !== undefined ? "ring-1 ring-inset" : ""
      }`}
      style={{ color, boxShadow: state !== undefined ? `inset 0 0 0 1px ${color}55` : undefined }}
    >
      <span className="text-[14px] font-bold leading-none">{label}</span>
    </button>
  );
}

export default function Admin() {
  const {
    db, reset, upsertItem, upsertWorker, addUnit, removeUnit,
    addPosition, renamePosition, archivePosition,
    upsertNorm, removeNorm,
    setRoleAccess, setPositionAccess, setUserAccess, importWorkers,
    setWorkerPin, clearWorkerPin, resetWorkerFace, deleteWorker,
  } = useStore();
  const { me } = useStore();
  const t = useToast();
  const [tab, setTab] = useState<Tab>("ishchilar");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<string | null>(null);
  const [posFilter, setPosFilter] = useState<string>(db.positions[0]?.id ?? "");
  const [addWorker, setAddWorker] = useState(false);
  /** Tahrirlanayotgan ishchi id'si (null — tahrir rejimi yopiq) */
  const [editWorker, setEditWorker] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);
  const [addItem, setAddItem] = useState(false);
  const [userSel, setUserSel] = useState<string>("");
  const [userQ, setUserQ] = useState("");
  const [pinFor, setPinFor] = useState<string | null>(null);
  const [pinVal, setPinVal] = useState("");
  const [addNorm, setAddNorm] = useState(false);

  /** Roʻyxat uzun (300+ xodim) — standart holatda bir qismi koʻrsatiladi */
  const [hammasi, setHammasi] = useState(false);

  const topilgan = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return db.workers;
    return db.workers.filter(
      (w) =>
        fio(w).toLowerCase().includes(s) ||
        w.tabel.includes(s) ||
        positionNames(db, w).toLowerCase().includes(s)
    );
  }, [db, q]);

  const workers = useMemo(
    () => (hammasi || q.trim() ? topilgan : topilgan.slice(0, 60)),
    [topilgan, hammasi, q]
  );

  const item = edit ? db.items.find((i) => i.id === edit) : null;
  const activePos = db.positions.filter((p) => !p.arxiv);

  return (
    <>
      {t.node}
      <PageHead
        title="Administrator paneli"
        sub="Tizimni toʻliq boshqarish: ishchilar, buyumlar, lavozimlar, normalar, ruxsatlar va koʻrinish"
        right={
          <Btn
            size="sm"
            onClick={async () => {
              await reset();
              t.show("Maʼlumotlar serverdan yangilandi");
            }}
          >
            Yangilash
          </Btn>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((x) => (
          <button
            key={x.k}
            onClick={() => setTab(x.k)}
            className={`rounded-full px-4 py-2 text-[12.5px] font-medium transition ${
              tab === x.k
                ? "bg-sky-100 text-sky-700 ring-1 ring-sky-500"
                : "border border-slate-200 text-slate-500 hover:text-slate-900"
            }`}
          >
            {x.l}
          </button>
        ))}
      </div>

      {/* ===================== ISHCHILAR ===================== */}
      {tab === "ishchilar" && (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-4">
            <Stat label="Jami ishchi" value={db.workers.length} />
            <Stat label="Faol" value={db.workers.filter((w) => w.faol).length} color="#22c55e" />
            <Stat label="Lavozimlar" value={activePos.length} color="#a78bfa" />
            <Stat label="Kolonnalar" value={new Set(db.workers.map((w) => w.kolonna).filter(Boolean)).size} color="#f2b544" />
          </div>
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="min-w-[240px] flex-1">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="F.I.Sh., tabel yoki lavozim boʻyicha qidirish" />
            </div>
            <Btn variant="primary" onClick={() => setAddWorker(true)}>+ Yangi ishchi</Btn>
            <Btn variant="gold" onClick={() => setBulk(true)}>Ommaviy import</Btn>
          </div>

          {/* Nechtasi koʻrinayotgani — roʻyxat qisqartirilganda aytiladi */}
          <div className="mb-3 flex flex-wrap items-center gap-3 text-[12.5px] text-slate-500">
            <span>
              {q.trim()
                ? `Qidiruv natijasi: ${topilgan.length} ta`
                : `Jami ${topilgan.length} ta xodim · koʻrsatilmoqda ${workers.length} ta`}
            </span>
            {!q.trim() && topilgan.length > workers.length && (
              <Btn size="sm" onClick={() => setHammasi(true)}>Hammasini koʻrsatish</Btn>
            )}
            {!q.trim() && hammasi && topilgan.length > 60 && (
              <Btn size="sm" onClick={() => setHammasi(false)}>Qisqartirish</Btn>
            )}
          </div>

          <Panel pad={false}>
            <Table head={["", "Tabel", "F.I.Sh.", "Lavozim", "Sex", "Rollar", "Holat", "Amallar"]} min={1180}>
              {workers.map((w) => (
                <Tr key={w.id}>
                  <Td>
                    <WorkerFace url={w.faceUrl} familiya={w.familiya} size={36} />
                  </Td>
                  <Td className="tabular-nums text-slate-900">{w.tabel}</Td>
                  <Td>{fio(w)}</Td>
                  <Td>{positionNames(db, w)}</Td>
                  <Td>{w.sex || "—"}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {w.roles.map((r) => <Badge key={r}>{ROLE_LABEL[r]}</Badge>)}
                    </div>
                  </Td>
                  <Td><Badge color={w.faol ? "#22c55e" : "#ef4444"}>{w.faol ? "faol" : "arxiv"}</Badge></Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <Link href={`/kartochka/${w.id}`}><Btn size="sm">MB-6</Btn></Link>
                      <Btn size="sm" onClick={() => setEditWorker(w.id)}>Tahrir</Btn>
                      <Btn
                        size="sm"
                        variant="danger"
                        disabled={w.id === me?.id}
                        title={w.id === me?.id ? "Oʻzingizni oʻchira olmaysiz" : "Oʻchirish"}
                        onClick={async () => {
                          if (
                            !confirm(
                              `${fio(w)} (${w.tabel}) oʻchirilsinmi?\n\n` +
                              "Yozuv bazadan yoʻqolmaydi — arxivga oʻtadi va tarixi " +
                              "(arizalar, imzolar, kartochka) saqlanadi. Ishchi tizimga kira olmaydi."
                            )
                          ) return;
                          const xato = await deleteWorker(w.id);
                          t.show(xato ?? `${fio(w)} oʻchirildi`, xato ? "err" : "ok");
                        }}
                      >
                        Oʻchirish
                      </Btn>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
          </Panel>
          <p className="mt-4 text-[11.5px] text-slate-500">
            Prototip rejimi: yuz suratlari lokal saqlanadi. Haqiqiy Face ID tanish backend (face-service) ulangach faollashadi.
          </p>
        </>
      )}

      {/* ===================== BUYUMLAR ===================== */}
      {tab === "buyumlar" && (
        <>
          <div className="mb-4 flex justify-end">
            <Btn variant="primary" onClick={() => setAddItem(true)}>+ Yangi buyum</Btn>
          </div>
          <Panel pad={false}>
            <Table head={["Nomi", "Nomenklatura", "Oʻlchov", "Turi", "Narx", "Qoldiq", ""]} min={880}>
              {db.items.map((i) => {
                const st = db.stock.find((s) => s.itemId === i.id);
                return (
                  <Tr key={i.id}>
                    <Td className="text-slate-900">{i.nomi}</Td>
                    <Td className="tabular-nums">{i.kod}</Td>
                    <Td>{i.unit}</Td>
                    <Td>{i.qishki ? <Badge color="#38bdf8">qishki</Badge> : <Badge color="#64748b">asosiy</Badge>}</Td>
                    <Td className="tabular-nums">{money(i.narx)}</Td>
                    <Td className="tabular-nums">{st?.qoldiq ?? 0}</Td>
                    <Td><Btn size="sm" onClick={() => setEdit(i.id)}>Tahrirlash</Btn></Td>
                  </Tr>
                );
              })}
            </Table>
          </Panel>
          <p className="mt-4 text-[11.5px] text-slate-500">
            Har bir buyum narxi shu yerdan muntazam yangilanadi — Требование hujjatida avtomatik ishlatiladi.
          </p>
        </>
      )}

      {/* ===================== LAVOZIMLAR ===================== */}
      {tab === "lavozimlar" && <PositionsTab
        onAdd={(n) => { addPosition(n); t.show("Lavozim qoʻshildi"); }}
        onRename={(id, n) => { renamePosition(id, n); t.show("Nomi yangilandi"); }}
        onArchive={(id, a) => { archivePosition(id, a); t.show(a ? "Arxivlandi" : "Tiklandi", a ? "err" : "ok"); }}
      />}

      {/* ===================== NORMALAR ===================== */}
      {tab === "normalar" && (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[280px]">
              <Field label="Lavozim">
                <Select value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
                  {db.positions.map((p) => (
                    <option key={p.id} value={p.id}>{p.tartib}. {p.nomi}{p.arxiv ? " (arxiv)" : ""}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Btn
              onClick={async () => {
                const nomi = prompt("Yangi lavozim nomi:");
                if (nomi && nomi.trim()) {
                  const p = await addPosition(nomi.trim());
                  if (p) {
                    setPosFilter(p.id);
                    t.show("Lavozim qoʻshildi");
                  }
                }
              }}
            >+ Yangi lavozim</Btn>
            <Btn variant="primary" className="ml-auto" disabled={!posFilter} onClick={() => setAddNorm(true)}>
              + Buyum qoʻshish
            </Btn>
          </div>
          <Panel pad={false}>
            <Table head={["Buyum", "Muddat", "Mavsum", "Narx", ""]} min={720}>
              {db.norms.filter((n) => n.positionId === posFilter).map((n) => {
                const it = itemById(db, n.itemId);
                return (
                  <Tr key={n.id}>
                    <Td className="text-slate-900">{it?.nomi}</Td>
                    <Td className="tabular-nums">{n.muddatOy === null ? "Ish. Chiqqun" : `${n.muddatOy} oy`}</Td>
                    <Td>{n.qishki ? <Badge color="#38bdf8">qishki</Badge> : <Badge color="#64748b">asosiy</Badge>}</Td>
                    <Td className="tabular-nums">{money(it?.narx ?? 0)}</Td>
                    <Td>
                      <Btn
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm(`«${it?.nomi}» shu lavozim normasidan olib tashlansinmi?`)) {
                            removeNorm(n.id);
                            t.show("Buyum lavozim normasidan olib tashlandi", "err");
                          }
                        }}
                      >Olib tashlash</Btn>
                    </Td>
                  </Tr>
                );
              })}
            </Table>
          </Panel>
          <p className="mt-4 text-[11.5px] text-slate-500">
            Bu yerda tanlangan lavozim uchun qaysi buyumlar normaga kirishini boshqarasiz — qoʻshish yoki olib tashlash.
          </p>
        </>
      )}

      {/* ===================== RUXSATLAR ===================== */}
      {tab === "ruxsatlar" && (
        <AccessSection
          keys={ALL_PERMS}
          label={(k) => PERM_LABEL[k as Perm]}
          isFeature={false}
          db={db}
          userSel={userSel} setUserSel={setUserSel} userQ={userQ} setUserQ={setUserQ}
          setRoleAccess={setRoleAccess} setPositionAccess={setPositionAccess} setUserAccess={setUserAccess}
          note="«+» — standart yoniq, «—» — standart yashirin. Katakni bosib override qiling: ✓ majburan yoniq, ✕ majburan yashirin, yana bosilsa standartga qaytadi. Ustuvorlik: shaxs → lavozim → rol."
        />
      )}

      {/* ===================== KOʻRINISH ===================== */}
      {tab === "korinish" && (
        <AccessSection
          keys={ALL_FEATURES}
          groups={FEATURE_GROUPS}
          label={(k) => FEATURE_LABEL[k as FeatureKey]}
          isFeature
          db={db}
          userSel={userSel} setUserSel={setUserSel} userQ={userQ} setUserQ={setUserQ}
          setRoleAccess={setRoleAccess} setPositionAccess={setPositionAccess} setUserAccess={setUserAccess}
          note="Kartalar, boʻlimlar va hujjatlar qaysi rolda / qaysi lavozimda / qaysi ishchida koʻrinishini boshqaring."
        />
      )}

      {/* ===================== PAROLLAR ===================== */}
      {tab === "parollar" && (
        <>
          <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[12.5px] text-sky-800">
            Parollar shifrlangan (hash) — hech kim, hatto admin ham ochiq koʻra olmaydi. Siz faqat <b>tiklashingiz</b> (yangi PIN oʻrnatish) yoki <b>majburiy almashtirish</b>ni yoqishingiz mumkin. Bu — jahon xavfsizlik standarti.
          </div>
          <div className="mb-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="F.I.Sh. yoki tabel boʻyicha qidirish" />
          </div>
          <Panel pad={false}>
            <Table head={["Tabel", "F.I.Sh.", "Lavozim", "Parol holati", "Face ID", "Amallar"]} min={1040}>
              {workers.map((w) => {
                const holat = w.pinReset
                  ? { c: "#f59e0b", l: "majburiy almashtirish" }
                  : w.pinSet
                    ? { c: "#22c55e", l: "oʻrnatilgan" }
                    : { c: "#94a3b8", l: "oʻrnatilmagan" };
                return (
                  <Tr key={w.id}>
                    <Td className="tabular-nums text-slate-900">{w.tabel}</Td>
                    <Td>{fio(w)}</Td>
                    <Td>{positionNames(db, w)}</Td>
                    <Td><Badge color={holat.c}>{holat.l}</Badge></Td>
                    <Td>
                      <Badge color={w.faceBor ? "#22c55e" : "#94a3b8"}>
                        {w.faceBor ? "qayd etilgan" : "yoʻq"}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <Btn size="sm" variant="primary" onClick={() => { setPinFor(w.id); setPinVal(""); }}>PIN tiklash</Btn>
                        {w.pinSet && (
                          <Btn size="sm" variant="danger" onClick={() => { clearWorkerPin(w.id); t.show("Majburiy almashtirishga qoʻyildi", "err"); }}>
                            Majburiy almashtirish
                          </Btn>
                        )}
                        {w.faceBor && (
                          <Btn
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              if (confirm(`${fio(w)} — Face ID oʻchirilsinmi? Ishchi PIN bilan kirib, yuzini qaytadan qoʻshadi.`)) {
                                resetWorkerFace(w.id);
                                t.show("Face ID oʻchirildi", "err");
                              }
                            }}
                          >
                            Face ID oʻchirish
                          </Btn>
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Table>
          </Panel>
          <p className="mt-4 text-[11.5px] text-slate-500">
            Ishchi birinchi kirishda oʻzi PIN oʻrnatadi. "Majburiy almashtirish" — ishchi keyingi kirishda yangi PIN qoʻyishga majbur boʻladi.
          </p>
        </>
      )}

      {/* ===================== SOZLAMALAR ===================== */}
      {tab === "sozlama" && (
        <div className="grid gap-5 md:grid-cols-2">
          <Panel>
            <h3 className="mb-4 text-[15px] font-semibold text-slate-900">Depo</h3>
            <div className="space-y-3">
              <S l="Tashkilot" v={db.depo.tashkilot} />
              <S l="Depo nomi" v={db.depo.nomi} />
              <S l="Kod" v={db.depo.kod} />
              <S l="Qishki mavsum boshlanishi" v={db.depo.qishBoshi} />
              <S l="Qishki mavsum tugashi" v={db.depo.qishOxiri} />
              <S l="Liniya / stansiyalar" v={`${db.lines.length} ta`} />
            </div>
          </Panel>

          <Panel>
            <h3 className="mb-4 text-[15px] font-semibold text-slate-900">Oʻlchov birliklari</h3>
            <div className="mb-3 flex flex-wrap gap-2">
              {db.units.map((u) => (
                <span key={u} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[12px] text-slate-800">
                  {u}
                  <button
                    onClick={() => { removeUnit(u); t.show(`«${u}» oʻchirildi`, "err"); }}
                    className="text-slate-400 hover:text-red-600"
                    title="Oʻchirish"
                  >✕</button>
                </span>
              ))}
            </div>
            <UnitAdder onAdd={(u) => { addUnit(u); t.show("Birlik qoʻshildi"); }} />
          </Panel>

          <Panel className="md:col-span-2">
            <h3 className="mb-4 text-[15px] font-semibold text-slate-900">Tizim qoidalari</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <S l="Требование raqami" v="TCH6-YYYY-NNNNN (avtomatik)" />
              <S l="TB imtixon davriyligi" v="12 oy (individual belgilash mumkin)" />
              <S l="Imtixon eslatmasi" v="10 kun oldin" />
              <S l="Rad etish sababi" v="Majburiy (depo boshligʻidan tashqari)" />
              <S l="Oʻchirish siyosati" v="Soft-delete — hech narsa oʻchirilmaydi" />
              <S l="KIP ranglari" v="3 kun yashil · 2 kun sariq · bugun apelsin · oʻtgan toʻq qizil" />
            </div>
          </Panel>
        </div>
      )}

      {/* ===================== AUDIT ===================== */}
      {tab === "audit" && (
        db.audit.length === 0 ? (
          <Empty text="Audit yozuvlari hali yoʻq — tizimda amal bajaring" />
        ) : (
          <Panel pad={false}>
            <Table head={["Vaqt", "Foydalanuvchi", "Obyekt", "Amal", "Izoh"]} min={820}>
              {db.audit.map((a) => {
                const u = db.workers.find((w) => w.id === a.userId);
                return (
                  <Tr key={a.id}>
                    <Td className="tabular-nums">{fmtDT(a.sana)}</Td>
                    <Td className="text-slate-900">{u ? fioShort(u) : a.userId}</Td>
                    <Td>{a.obyekt}</Td>
                    <Td>{a.amal}</Td>
                    <Td>{a.izoh ?? "—"}</Td>
                  </Tr>
                );
              })}
            </Table>
          </Panel>
        )
      )}

      {/* ===================== MODALLAR ===================== */}

      {/* Buyum tahrirlash */}
      <Modal open={!!item} onClose={() => setEdit(null)} title="Buyumni tahrirlash">
        {item && (
          <div className="space-y-4">
            <Field label="Nomi"><Input defaultValue={item.nomi} id="i-nomi" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nomenklatura kodi"><Input defaultValue={item.kod} id="i-kod" /></Field>
              <Field label="Narx (soʻm)"><Input type="number" defaultValue={item.narx} id="i-narx" /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Oʻlchov birligi">
                <Select defaultValue={item.unit} id="i-unit">
                  {db.units.map((u) => <option key={u} value={u}>{u}</option>)}
                </Select>
              </Field>
              <Field label="Turi">
                <Select defaultValue={item.qishki ? "1" : "0"} id="i-qish">
                  <option value="0">asosiy</option>
                  <option value="1">qishki (mavsumiy)</option>
                </Select>
              </Field>
            </div>
            <div className="flex justify-end gap-3">
              <Btn onClick={() => setEdit(null)}>Bekor qilish</Btn>
              <Btn
                variant="primary"
                onClick={() => {
                  const g = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement)?.value;
                  upsertItem({
                    ...item,
                    nomi: g("i-nomi") || item.nomi,
                    kod: g("i-kod") || item.kod,
                    narx: Number(g("i-narx")) || item.narx,
                    unit: (g("i-unit") as Unit) || item.unit,
                    qishki: g("i-qish") === "1",
                  });
                  setEdit(null);
                  t.show("Buyum saqlandi");
                }}
              >Saqlash</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Yangi buyum */}
      <Modal open={addItem} onClose={() => setAddItem(false)} title="Yangi buyum qoʻshish">
        <NewItemForm
          units={db.units}
          onSave={(it) => {
            upsertItem(it);
            setAddItem(false);
            t.show("Buyum qoʻshildi");
          }}
          onCancel={() => setAddItem(false)}
        />
      </Modal>

      {/* 31-ilova: lavozimga buyum qoʻshish */}
      <Modal open={addNorm} onClose={() => setAddNorm(false)} title="Lavozim normasiga buyum qoʻshish">
        <NewNormForm
          positionId={posFilter}
          items={db.items.filter((i) => !db.norms.some((n) => n.positionId === posFilter && n.itemId === i.id))}
          onSave={(n) => {
            upsertNorm(n);
            setAddNorm(false);
            t.show("Buyum normaga qoʻshildi");
          }}
          onCancel={() => setAddNorm(false)}
        />
      </Modal>

      {/* Yangi ishchi */}
      <Modal open={addWorker} onClose={() => setAddWorker(false)} title="Yangi ishchi qoʻshish" width={640}>
        <NewWorkerForm
          positions={activePos}
          onSave={async (w) => {
            // Server saqlagandan keyingina modal yopiladi — xato boʻlsa
            // forma joyida qoladi va admin qiymatlarni tuzatadi.
            const xato = await upsertWorker(w);
            if (xato) return xato;
            setAddWorker(false);
            t.show(
              w.pin
                ? `${w.tabel} qoʻshildi — PIN: ${w.pin} (ishchiga yetkazing)`
                : `${w.tabel} qoʻshildi — birinchi kirishda oʻzi PIN oʻrnatadi`
            );
            return null;
          }}
          onCancel={() => setAddWorker(false)}
        />
      </Modal>

      {/* Ishchini tahrirlash */}
      <Modal
        open={!!editWorker}
        onClose={() => setEditWorker(null)}
        title="Ishchi maʼlumotini tahrirlash"
        width={640}
      >
        {(() => {
          const w = db.workers.find((x) => x.id === editWorker);
          if (!w) return null;
          return (
            <NewWorkerForm
              key={w.id}
              mavjud={w}
              positions={activePos}
              onSave={async (yangi) => {
                const xato = await upsertWorker(yangi);
                if (xato) return xato;
                setEditWorker(null);
                t.show(`${yangi.tabel} maʼlumoti yangilandi`);
                return null;
              }}
              onCancel={() => setEditWorker(null)}
            />
          );
        })()}
      </Modal>

      {/* Ommaviy import */}
      <Modal open={bulk} onClose={() => setBulk(false)} title="Ommaviy import" width={640}>
        <BulkImportForm
          positions={activePos}
          onImport={async (rows, pid) => {
            const n = await importWorkers(rows, pid);
            setBulk(false);
            t.show(n > 0 ? `${n} ta ishchi qoʻshildi` : "Yangi qator topilmadi", n > 0 ? "ok" : "err");
          }}
          onCancel={() => setBulk(false)}
        />
      </Modal>

      {/* PIN tiklash */}
      <Modal open={!!pinFor} onClose={() => setPinFor(null)} title="PIN tiklash">
        <div className="space-y-4">
          <p className="text-[12.5px] text-slate-600">
            Yangi 4 xonali PIN kiriting. U <b>bir marta</b> shu yerda koʻrsatiladi — ishchiga yetkazing. Soʻng shifrlanadi va hech kim koʻra olmaydi.
          </p>
          <Field label="Yangi PIN (4 xona)">
            <Input
              value={pinVal}
              onChange={(e) => setPinVal(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              placeholder="masalan: 4271"
            />
          </Field>
          <div className="flex justify-end gap-3">
            <Btn onClick={() => setPinFor(null)}>Bekor qilish</Btn>
            <Btn
              variant="primary"
              disabled={pinVal.length !== 4}
              onClick={async () => {
                const pin = pinVal;
                await setWorkerPin(pinFor!, pin);
                setPinFor(null);
                t.show(`PIN oʻrnatildi: ${pin} — ishchiga yetkazing (qayta koʻrsatilmaydi)`);
              }}
            >
              Saqlash
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ================= LAVOZIMLAR TAB ================= */
function PositionsTab({
  onAdd, onRename, onArchive,
}: {
  onAdd: (nomi: string) => void;
  onRename: (id: string, nomi: string) => void;
  onArchive: (id: string, arxiv: boolean) => void;
}) {
  const { db } = useStore();
  const [nomi, setNomi] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  return (
    <>
      <Panel className="mb-5">
        <h3 className="mb-3 text-[15px] font-semibold text-slate-900">Yangi lavozim</h3>
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[260px] flex-1">
            <Input value={nomi} onChange={(e) => setNomi(e.target.value)} placeholder="Lavozim nomi" />
          </div>
          <Btn
            variant="primary"
            disabled={!nomi.trim()}
            onClick={() => { onAdd(nomi.trim()); setNomi(""); }}
          >Qoʻshish</Btn>
        </div>
      </Panel>

      <Panel pad={false}>
        <Table head={["#", "Nomi", "Ishchilar", "Holat", ""]} min={720}>
          {db.positions.map((p) => {
            const cnt = db.workers.filter((w) => w.positionId === p.id).length;
            return (
              <Tr key={p.id}>
                <Td className="tabular-nums">{p.tartib}</Td>
                <Td className="text-slate-900">
                  {editId === p.id ? (
                    <Input value={editVal} onChange={(e) => setEditVal(e.target.value)} className="h-9" />
                  ) : (
                    p.nomi
                  )}
                </Td>
                <Td className="tabular-nums">{cnt}</Td>
                <Td><Badge color={p.arxiv ? "#ef4444" : "#22c55e"}>{p.arxiv ? "arxiv" : "faol"}</Badge></Td>
                <Td>
                  <div className="flex gap-2">
                    {editId === p.id ? (
                      <>
                        <Btn size="sm" variant="primary" onClick={() => { onRename(p.id, editVal); setEditId(null); }}>Saqlash</Btn>
                        <Btn size="sm" onClick={() => setEditId(null)}>Bekor</Btn>
                      </>
                    ) : (
                      <>
                        <Btn size="sm" onClick={() => { setEditId(p.id); setEditVal(p.nomi); }}>Tahrir</Btn>
                        <Btn size="sm" variant={p.arxiv ? "ok" : "danger"} onClick={() => onArchive(p.id, !p.arxiv)}>
                          {p.arxiv ? "Tiklash" : "Arxivlash"}
                        </Btn>
                      </>
                    )}
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Table>
      </Panel>
      <p className="mt-4 text-[11.5px] text-slate-500">
        Lavozim oʻchirilmaydi — soft-delete (arxivlash) orqali yashiriladi, tarixiy maʼlumot butunligi saqlanadi.
      </p>
    </>
  );
}

/* ================= RUXSAT / KOʻRINISH MATRITSASI ================= */
function AccessSection({
  keys, groups, label, isFeature, db, note,
  userSel, setUserSel, userQ, setUserQ, setRoleAccess, setPositionAccess, setUserAccess,
}: {
  keys: AccessKey[];
  groups?: { title: string; keys: FeatureKey[] }[];
  label: (k: AccessKey) => string;
  isFeature: boolean;
  db: ReturnType<typeof useStore>["db"];
  note: string;
  userSel: string; setUserSel: (v: string) => void;
  userQ: string; setUserQ: (v: string) => void;
  setRoleAccess: (role: Role, key: AccessKey, value: boolean | null) => void;
  setPositionAccess: (positionId: string, key: AccessKey, value: boolean | null) => void;
  setUserAccess: (workerId: string, key: AccessKey, value: boolean | null) => void;
}) {
  const roles = Object.keys(ROLE_LABEL) as Role[];
  const roleDef = (r: Role, k: AccessKey) =>
    isFeature ? ROLE_FEATURES[r].includes(k as FeatureKey) : ROLE_PERMS[r].includes(k as Perm);

  const groupedKeys = groups ?? [{ title: "", keys: keys as FeatureKey[] }];

  const [posSel, setPosSel] = useState<string>("");
  const selPosition = db.positions.find((p) => p.id === posSel) || null;

  const selWorker = db.workers.find((w) => w.id === userSel) || null;
  const foundWorkers = useMemo(() => {
    const s = userQ.trim().toLowerCase();
    if (!s) return [];
    return db.workers
      .filter((w) => fio(w).toLowerCase().includes(s) || w.tabel.includes(s))
      .slice(0, 8);
  }, [db.workers, userQ]);

  return (
    <div className="space-y-6">
      <p className="text-[12px] leading-relaxed text-slate-500">{note}</p>

      {/* ROL MATRITSASI */}
      <Panel pad={false}>
        <div className="border-b border-slate-200 px-4 py-3 text-[13px] font-semibold text-slate-900">
          Rol boʻyicha (standart)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" style={{ minWidth: 1100 }}>
            <thead>
              <tr className="bg-slate-100">
                <th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-100 px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                  {isFeature ? "Koʻrinish" : "Ruxsat"}
                </th>
                {roles.map((r) => (
                  <th key={r} className="border-b border-slate-200 px-2 py-2.5 text-center text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                    {ROLE_LABEL[r].split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedKeys.map((g) => (
                <React.Fragment key={g.title || "all"}>
                  {g.title && (
                    <tr>
                      <td colSpan={roles.length + 1} className="bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {g.title}
                      </td>
                    </tr>
                  )}
                  {g.keys.map((k) => (
                    <tr key={k} className="hover:bg-slate-50">
                      <td className="sticky left-0 z-10 border-b border-slate-200 bg-white px-3 py-2.5 text-[12px] text-slate-800">
                        {label(k)}
                      </td>
                      {roles.map((r) => {
                        const st = db.access.roleOverrides[r]?.[k];
                        const disabled = r === "admin";
                        return (
                          <td key={r} className="border-b border-slate-200 px-2 py-1.5 text-center">
                            {disabled ? (
                              <span className="text-emerald-600">✓</span>
                            ) : (
                              <TriCell
                                state={st}
                                def={roleDef(r, k)}
                                onCycle={() => setRoleAccess(r, k, nextState(st))}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* LAVOZIM BOʻYICHA */}
      <Panel>
        <h3 className="mb-3 text-[13px] font-semibold text-slate-900">Lavozim boʻyicha (override)</h3>
        <div className="mb-4 max-w-[420px]">
          <Select value={posSel} onChange={(e) => setPosSel(e.target.value)}>
            <option value="">— Lavozim tanlang —</option>
            {db.positions.map((p) => (
              <option key={p.id} value={p.id}>{p.tartib}. {p.nomi}{p.arxiv ? " (arxiv)" : ""}</option>
            ))}
          </Select>
        </div>

        {!selPosition ? (
          <Empty text="Override sozlash uchun lavozim tanlang — bu ustuvorlik roldan yuqori, shaxsdan past" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            {groupedKeys.map((g) => (
              <div key={g.title || "all"}>
                {g.title && (
                  <div className="bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{g.title}</div>
                )}
                {g.keys.map((k) => {
                  const st = db.access.positionOverrides[selPosition.id]?.[k];
                  return (
                    <div key={k} className="flex items-center gap-3 border-t border-slate-100 px-3 py-2">
                      <span className="flex-1 text-[12.5px] text-slate-800">{label(k)}</span>
                      <span className="text-[11px] text-slate-400">rol standartini bekor qiladi</span>
                      <TriCell state={st} def={false} onCycle={() => setPositionAccess(selPosition.id, k, nextState(st))} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* SHAXS BOʻYICHA */}
      <Panel>
        <h3 className="mb-3 text-[13px] font-semibold text-slate-900">Shaxs boʻyicha (override)</h3>
        <div className="relative mb-4 max-w-[420px]">
          <Input
            value={userQ}
            onChange={(e) => setUserQ(e.target.value)}
            placeholder="Ishchini qidiring — F.I.Sh. yoki tabel"
          />
          {foundWorkers.length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {foundWorkers.map((w) => (
                <button
                  key={w.id}
                  onClick={() => { setUserSel(w.id); setUserQ(""); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] hover:bg-slate-100"
                >
                  <span className="tabular-nums text-slate-400">{w.tabel}</span>
                  <span className="text-slate-900">{fio(w)}</span>
                  <span className="ml-auto text-slate-400">{positionById(db, w.positionId)?.nomi}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {!selWorker ? (
          <Empty text="Override sozlash uchun ishchini tanlang" />
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <WorkerFace url={selWorker.faceUrl} familiya={selWorker.familiya} size={40} />
              <div>
                <p className="text-[13px] font-semibold text-slate-900">{fio(selWorker)}</p>
                <p className="text-[11px] text-slate-500">
                  {selWorker.tabel} · {selWorker.roles.map((r) => ROLE_LABEL[r]).join(", ")}
                </p>
              </div>
              <Btn size="sm" className="ml-auto" onClick={() => setUserSel("")}>Yopish</Btn>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              {groupedKeys.map((g) => (
                <div key={g.title || "all"}>
                  {g.title && (
                    <div className="bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{g.title}</div>
                  )}
                  {g.keys.map((k) => {
                    const st = db.access.userOverrides[selWorker.id]?.[k];
                    // shaxs uchun standart = lavozim override (agar bor boʻlsa), boʻlmasa rol bazaviy holati
                    const workerPosIds = selWorker.positionIds?.length ? selWorker.positionIds : [selWorker.positionId];
                    const posOverride = workerPosIds
                      .map((pid) => db.access.positionOverrides[pid]?.[k])
                      .find((v) => v !== undefined);
                    const def = posOverride !== undefined
                      ? posOverride
                      : selWorker.roles.some((r) => {
                          const ro = db.access.roleOverrides[r]?.[k];
                          if (ro !== undefined) return ro;
                          return roleDef(r, k);
                        });
                    return (
                      <div key={k} className="flex items-center gap-3 border-t border-slate-100 px-3 py-2">
                        <span className="flex-1 text-[12.5px] text-slate-800">{label(k)}</span>
                        <span className="text-[11px] text-slate-400">{def ? "standart: yoniq" : "standart: yashirin"}</span>
                        <TriCell state={st} def={def} onCycle={() => setUserAccess(selWorker.id, k, nextState(st))} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}

/* ================= BIRLIK QOʻSHISH ================= */
function UnitAdder({ onAdd }: { onAdd: (u: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2">
      <Input value={v} onChange={(e) => setV(e.target.value)} placeholder="masalan: litr" className="h-10" />
      <Btn variant="primary" disabled={!v.trim()} onClick={() => { onAdd(v.trim()); setV(""); }}>+</Btn>
    </div>
  );
}

/* ================= YANGI BUYUM FORMA ================= */
function NewItemForm({
  units, onSave, onCancel,
}: {
  units: Unit[];
  onSave: (it: import("@/lib/types").Item) => void;
  onCancel: () => void;
}) {
  const [nomi, setNomi] = useState("");
  const [kod, setKod] = useState("");
  const [narx, setNarx] = useState("");
  const [unit, setUnit] = useState<Unit>(units[0] ?? "dona");
  const [qishki, setQishki] = useState(false);
  return (
    <div className="space-y-4">
      <Field label="Nomi"><Input value={nomi} onChange={(e) => setNomi(e.target.value)} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nomenklatura kodi"><Input value={kod} onChange={(e) => setKod(e.target.value)} /></Field>
        <Field label="Narx (soʻm)"><Input type="number" value={narx} onChange={(e) => setNarx(e.target.value)} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Oʻlchov birligi">
          <Select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
            {units.map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
        </Field>
        <Field label="Turi">
          <Select value={qishki ? "1" : "0"} onChange={(e) => setQishki(e.target.value === "1")}>
            <option value="0">asosiy</option>
            <option value="1">qishki (mavsumiy)</option>
          </Select>
        </Field>
      </div>
      <div className="flex justify-end gap-3">
        <Btn onClick={onCancel}>Bekor qilish</Btn>
        <Btn
          variant="primary"
          disabled={!nomi.trim()}
          onClick={() =>
            onSave({
              id: `it${Date.now()}`,
              nomi: nomi.trim(),
              kod: kod.trim() || `00-0000`,
              unit,
              qishki,
              narx: Number(narx) || 0,
            })
          }
        >Saqlash</Btn>
      </div>
    </div>
  );
}

/* ================= 31-ILOVA: LAVOZIMGA BUYUM QOʻSHISH ================= */
function NewNormForm({
  positionId, items, onSave, onCancel,
}: {
  positionId: string;
  items: import("@/lib/types").Item[];
  onSave: (n: Norm) => void;
  onCancel: () => void;
}) {
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [chiqqun, setChiqqun] = useState(false);
  const [muddat, setMuddat] = useState("12");
  const [qishki, setQishki] = useState(false);

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <Empty text="Barcha buyumlar allaqachon shu lavozim normasiga kiritilgan" />
        <div className="flex justify-end"><Btn onClick={onCancel}>Yopish</Btn></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Field label="Buyum">
        <Select value={itemId} onChange={(e) => setItemId(e.target.value)}>
          {items.map((i) => <option key={i.id} value={i.id}>{i.nomi}</option>)}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Turi">
          <Select value={qishki ? "1" : "0"} onChange={(e) => setQishki(e.target.value === "1")}>
            <option value="0">asosiy</option>
            <option value="1">qishki (mavsumiy)</option>
          </Select>
        </Field>
        <Field label="Muddat">
          <label className="mb-1.5 flex items-center gap-2 text-[12.5px] text-slate-700">
            <input type="checkbox" checked={chiqqun} onChange={(e) => setChiqqun(e.target.checked)} />
            Ish. Chiqqun (muddatsiz — yaroqsizlanguncha)
          </label>
          {!chiqqun && (
            <Input type="number" min={1} value={muddat} onChange={(e) => setMuddat(e.target.value)} />
          )}
        </Field>
      </div>
      <div className="flex justify-end gap-3">
        <Btn onClick={onCancel}>Bekor qilish</Btn>
        <Btn
          variant="primary"
          disabled={!itemId}
          onClick={() =>
            onSave({
              id: `n${Date.now()}${Math.random().toString(16).slice(2, 5)}`,
              positionId,
              itemId,
              muddatOy: chiqqun ? null : Number(muddat) || 1,
              qishki,
            })
          }
        >Qoʻshish</Btn>
      </div>
    </div>
  );
}

/* ================= YANGI ISHCHI FORMA ================= */
function NewWorkerForm({
  positions, onSave, onCancel, mavjud,
}: {
  positions: import("@/lib/types").Position[];
  /** Saqlansa null, xato boʻlsa xato matni qaytaradi */
  onSave: (w: WorkerYozuv) => Promise<string | null>;
  onCancel: () => void;
  /** Berilsa — tahrirlash rejimi (id bilan yuboriladi) */
  mavjud?: import("@/lib/types").Worker;
}) {
  const tahrir = !!mavjud;
  const [f, setF] = useState({
    tabel: mavjud?.tabel ?? "",
    familiya: mavjud?.familiya ?? "",
    ism: mavjud?.ism ?? "",
    otasi: mavjud?.otasi ?? "",
    sex: mavjud?.sex ?? "",
    jinsi: (mavjud?.jinsi ?? "erkak") as "erkak" | "ayol",
    boyi: mavjud?.boyi ? String(mavjud.boyi) : "",
    kiyimOlchami: mavjud?.kiyimOlchami ?? "",
    poyabzalOlchami: mavjud?.poyabzalOlchami ?? "",
    boshKiyimOlchami: mavjud?.boshKiyimOlchami ?? "",
    telefon: mavjud?.telefon ?? "",
  });
  const [posIds, setPosIds] = useState<string[]>(
    mavjud
      ? (mavjud.positionIds?.length ? mavjud.positionIds : [mavjud.positionId]).filter(Boolean)
      : positions[0] ? [positions[0].id] : []
  );
  const [roles, setRoles] = useState<Role[]>(mavjud?.roles ?? ["ishchi"]);
  const [face, setFace] = useState<string | undefined>();
  const [pin, setPin] = useState("");
  const [xato, setXato] = useState("");
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  const toggleRole = (r: Role) => setRoles((s) => (s.includes(r) ? s.filter((x) => x !== r) : [...s, r]));
  const togglePos = (id: string) => setPosIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {face ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={face} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-slate-400">Yuz surati</span>
          )}
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setFace(await fileToDataUrl(file));
            }}
          />
          <Btn size="sm" onClick={() => fileRef.current?.click()}>Face ID surat yuklash</Btn>
          {face && <Btn size="sm" variant="danger" className="ml-2" onClick={() => setFace(undefined)}>Olib tashlash</Btn>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tabel raqami"><Input value={f.tabel} onChange={(e) => set("tabel", e.target.value)} /></Field>
        <Field label="Familiya"><Input value={f.familiya} onChange={(e) => set("familiya", e.target.value)} /></Field>
        <Field label="Ism"><Input value={f.ism} onChange={(e) => set("ism", e.target.value)} /></Field>
        <Field label="Otasining ismi"><Input value={f.otasi} onChange={(e) => set("otasi", e.target.value)} /></Field>
        <Field label="Sex / boʻlim"><Input value={f.sex} onChange={(e) => set("sex", e.target.value)} /></Field>
        <Field label="Jinsi">
          <Select value={f.jinsi} onChange={(e) => set("jinsi", e.target.value)}>
            <option value="erkak">erkak</option>
            <option value="ayol">ayol</option>
          </Select>
        </Field>
        <Field label="Telefon"><Input value={f.telefon} onChange={(e) => set("telefon", e.target.value)} /></Field>
        <Field label="Boʻyi (sm)"><Input type="number" value={f.boyi} onChange={(e) => set("boyi", e.target.value)} /></Field>
        <Field label="Kiyim oʻlchami"><Input value={f.kiyimOlchami} onChange={(e) => set("kiyimOlchami", e.target.value)} /></Field>
        <Field label="Poyabzal oʻlchami"><Input value={f.poyabzalOlchami} onChange={(e) => set("poyabzalOlchami", e.target.value)} /></Field>
        <Field label="Bosh kiyim oʻlchami"><Input value={f.boshKiyimOlchami} onChange={(e) => set("boshKiyimOlchami", e.target.value)} /></Field>
      </div>

      <div>
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Lavozim(lar) — bir nechtasini tanlash mumkin
        </span>
        <div className="flex flex-wrap gap-2">
          {positions.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePos(p.id)}
              className={`rounded-full px-3 py-1.5 text-[12px] transition ${
                posIds.includes(p.id)
                  ? "bg-sky-100 text-sky-700 ring-1 ring-sky-500"
                  : "border border-slate-200 text-slate-500 hover:text-slate-900"
              }`}
            >
              {p.nomi}
            </button>
          ))}
        </div>
        {posIds.length === 0 && (
          <p className="mt-1.5 text-[11px] text-red-600">Kamida bitta lavozim tanlang</p>
        )}
      </div>

      <div>
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">Rollar</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => toggleRole(r)}
              className={`rounded-full px-3 py-1.5 text-[12px] transition ${
                roles.includes(r)
                  ? "bg-sky-100 text-sky-700 ring-1 ring-sky-500"
                  : "border border-slate-200 text-slate-500 hover:text-slate-900"
              }`}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {!tahrir && (
        <div>
          <Field
            label="Boshlangʻich PIN (ixtiyoriy, 4 xona)"
            hint="Boʻsh qoldirsangiz — ishchi tizimga birinchi kirganda tabel raqamini kiritib, PIN'ni oʻzi oʻrnatadi."
          >
            <Input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              placeholder="masalan: 4271"
            />
          </Field>
        </div>
      )}

      {tahrir && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-500">
          PIN va Face ID bu yerdan oʻzgartirilmaydi — ular «Parollar» boʻlimida
          tiklanadi. Shunda ishchining mavjud kirish maʼlumoti tasodifan
          buzilib ketmaydi.
        </p>
      )}

      {xato && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[12.5px] text-red-600">
          {xato}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Btn onClick={onCancel}>Bekor qilish</Btn>
        <Btn
          variant="primary"
          disabled={
            saqlanmoqda ||
            !f.tabel.trim() || !f.familiya.trim() || !f.ism.trim() ||
            roles.length === 0 || posIds.length === 0 ||
            (pin.length > 0 && pin.length !== 4)
          }
          onClick={async () => {
            setXato("");
            setSaqlanmoqda(true);
            try {
              // Yangi ishchida id yuborilmaydi — UUID'ni server yaratadi.
              // Tahrirda esa aynan shu id boʻyicha mavjud yozuv topiladi.
              const e = await onSave({
                ...(mavjud ? { id: mavjud.id } : {}),
                tabel: f.tabel.trim(),
                familiya: f.familiya.trim(),
                ism: f.ism.trim(),
                otasi: f.otasi.trim(),
                positionId: posIds[0],
                positionIds: posIds,
                sex: f.sex.trim(),
                ishJoyi: "Buxoro lokomotiv deposi",
                kirganSana: iso(TODAY()),
                jinsi: f.jinsi,
                boyi: Number(f.boyi) || 0,
                kiyimOlchami: f.kiyimOlchami.trim(),
                poyabzalOlchami: f.poyabzalOlchami.trim(),
                boshKiyimOlchami: f.boshKiyimOlchami.trim(),
                telefon: f.telefon.trim() || undefined,
                roles,
                faol: mavjud?.faol ?? true,
                faceImage: face,
                pin: tahrir ? undefined : pin || undefined,
              });
              if (e) setXato(e);
            } finally {
              setSaqlanmoqda(false);
            }
          }}
        >{saqlanmoqda ? "Saqlanmoqda…" : tahrir ? "Saqlash" : "Qoʻshish"}</Btn>
      </div>
    </div>
  );
}

/* ================= OMMAVIY IMPORT FORMA ================= */
function BulkImportForm({
  positions, onImport, onCancel,
}: {
  positions: import("@/lib/types").Position[];
  onImport: (rows: ImportRow[], positionId: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [pid, setPid] = useState(positions[0]?.id ?? "");
  const [faceMap, setFaceMap] = useState<Record<string, string>>({});
  const rows = useMemo(() => parseRows(text), [text]);
  const fileRef = useRef<HTMLInputElement>(null);
  const faceRef = useRef<HTMLInputElement>(null);

  const withFaces: ImportRow[] = rows.map((r) => ({ ...r, faceImage: faceMap[r.tabel], positionId: pid }));
  const matchedFaces = rows.filter((r) => faceMap[r.tabel]).length;

  return (
    <div className="space-y-4">
      <Field label="Umumiy lavozim (qatorda koʻrsatilmasa shu qoʻllanadi)">
        <Select value={pid} onChange={(e) => setPid(e.target.value)}>
          {positions.map((p) => <option key={p.id} value={p.id}>{p.nomi}</option>)}
        </Select>
      </Field>

      <Field label="Maʼlumot — har qatorda: tabel, familiya, ism, otasi" hint="Vergul, tab yoki nuqta-vergul bilan ajrating. Excel'dan koʻchirib qoʻyish mumkin.">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"10501, Rasulov, Baxtiyor, Anvarovich\n10502, Qodirov, Sanjar, Zokirovich"}
          className="h-40 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-[12.5px] leading-relaxed text-slate-900 outline-none focus:border-sky-500"
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) setText(await file.text());
          }}
        />
        <Btn size="sm" onClick={() => fileRef.current?.click()}>CSV / TXT yuklash</Btn>

        <input
          ref={faceRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            const map: Record<string, string> = {};
            for (const f of files) {
              const tabel = f.name.replace(/\.[^.]+$/, "").trim(); // fayl nomi = tabel raqami
              map[tabel] = await fileToDataUrl(f);
            }
            setFaceMap((prev) => ({ ...prev, ...map }));
          }}
        />
        <Btn size="sm" variant="gold" onClick={() => faceRef.current?.click()}>
          Yuz suratlari{Object.keys(faceMap).length ? ` (${Object.keys(faceMap).length})` : ""}
        </Btn>
      </div>

      <p className="text-[11.5px] text-slate-500">
        Yuz suratlarini <b>tabel raqami bilan nomlang</b> (masalan <code>10501.jpg</code>) — tizim tartibga qaramay avtomatik mos qiladi.
      </p>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] text-slate-600">
        Aniqlangan qatorlar: <b className="text-slate-900">{rows.length}</b>
        {Object.keys(faceMap).length > 0 && (
          <> · yuz surati mos keldi: <b className="text-slate-900">{matchedFaces}/{rows.length}</b></>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Btn onClick={onCancel}>Bekor qilish</Btn>
        <Btn variant="primary" disabled={rows.length === 0 || !pid} onClick={() => onImport(withFaces, pid)}>
          {rows.length} ta ishchini import qilish
        </Btn>
      </div>
    </div>
  );
}

/* ================= yordamchi ================= */
function S({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-2.5">
      <span className="shrink-0 text-[12px] text-slate-500">{l}</span>
      <span className="text-right text-[12.5px] text-slate-900">{v}</span>
    </div>
  );
}
