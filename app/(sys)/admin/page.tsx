"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { fmt, fmtDT, fio, fioShort, itemById, money, positionById } from "@/lib/logic";
import { ALL_PERMS, PERM_LABEL, ROLE_PERMS } from "@/lib/permissions";
import { ROLE_LABEL, type Role, type Unit } from "@/lib/types";
import {
  Badge, Btn, Empty, Field, Input, Modal, PageHead, Panel, Select, Stat, Table, Td, Tr, useToast,
} from "@/components/ui";

type Tab = "ishchilar" | "buyumlar" | "normalar" | "ruxsatlar" | "sozlama" | "audit";

const TABS: { k: Tab; l: string }[] = [
  { k: "ishchilar", l: "Ishchilar" },
  { k: "buyumlar", l: "Buyumlar va narxlar" },
  { k: "normalar", l: "31-ilova normalari" },
  { k: "ruxsatlar", l: "Ruxsatlar matritsasi" },
  { k: "sozlama", l: "Sozlamalar" },
  { k: "audit", l: "Audit-log" },
];

export default function Admin() {
  const { db, reset, upsertItem, update } = useStore();
  const t = useToast();
  const [tab, setTab] = useState<Tab>("ishchilar");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<string | null>(null);
  const [posFilter, setPosFilter] = useState<string>(db.positions[0]?.id ?? "");

  const workers = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = db.workers;
    if (!s) return base.slice(0, 60);
    return base.filter(
      (w) =>
        fio(w).toLowerCase().includes(s) ||
        w.tabel.includes(s) ||
        (positionById(db, w.positionId)?.nomi ?? "").toLowerCase().includes(s)
    );
  }, [db, q]);

  const item = edit ? db.items.find((i) => i.id === edit) : null;

  return (
    <>
      {t.node}
      <PageHead
        title="Administrator paneli"
        sub="Tizimni toʻliq boshqarish: ishchilar, buyumlar, normalar, ruxsatlar va sozlamalar"
        right={
          <Btn
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm("Barcha maʼlumotlar boshlangʻich holatga qaytariladi. Davom etamizmi?")) {
                reset();
                t.show("Maʼlumotlar tiklandi", "err");
              }
            }}
          >
            Demo maʼlumotlarni tiklash
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

      {tab === "ishchilar" && (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-4">
            <Stat label="Jami ishchi" value={db.workers.length} />
            <Stat label="Faol" value={db.workers.filter((w) => w.faol).length} color="#22c55e" />
            <Stat label="Lavozimlar" value={db.positions.length} color="#a78bfa" />
            <Stat label="Kolonnalar" value={new Set(db.workers.map((w) => w.kolonna).filter(Boolean)).size} color="#f2b544" />
          </div>
          <div className="mb-4">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="F.I.Sh., tabel yoki lavozim boʻyicha qidirish" />
          </div>
          <Panel pad={false}>
            <Table head={["Tabel", "F.I.Sh.", "Lavozim", "Sex", "Kolonna", "Rollar", "Holat", ""]} min={1060}>
              {workers.map((w) => (
                <Tr key={w.id}>
                  <Td className="tabular-nums text-slate-900">{w.tabel}</Td>
                  <Td>{fio(w)}</Td>
                  <Td>{positionById(db, w.positionId)?.nomi}</Td>
                  <Td>{w.sex}</Td>
                  <Td>{w.kolonna ?? "—"}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {w.roles.map((r) => <Badge key={r}>{ROLE_LABEL[r]}</Badge>)}
                    </div>
                  </Td>
                  <Td><Badge color={w.faol ? "#22c55e" : "#ef4444"}>{w.faol ? "faol" : "arxiv"}</Badge></Td>
                  <Td><Link href={`/kartochka/${w.id}`}><Btn size="sm">MB-6</Btn></Link></Td>
                </Tr>
              ))}
            </Table>
          </Panel>
          <p className="mt-4 text-[11.5px] text-slate-500">
            Ommaviy import (Excel + yuz suratlari) va Face ID sozlamalari backend ulangach faollashadi.
          </p>
        </>
      )}

      {tab === "buyumlar" && (
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
      )}

      {tab === "normalar" && (
        <>
          <div className="mb-4">
            <Field label="Lavozim">
              <Select value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
                {db.positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.tartib}. {p.nomi}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Panel pad={false}>
            <Table head={["Buyum", "Muddat", "Mavsum", "Narx"]} min={640}>
              {db.norms.filter((n) => n.positionId === posFilter).map((n) => {
                const it = itemById(db, n.itemId);
                return (
                  <Tr key={n.id}>
                    <Td className="text-slate-900">{it?.nomi}</Td>
                    <Td className="tabular-nums">{n.muddatOy === null ? "Ish. Chiqqun" : `${n.muddatOy} oy`}</Td>
                    <Td>{n.qishki ? <Badge color="#38bdf8">qishki</Badge> : <Badge color="#64748b">asosiy</Badge>}</Td>
                    <Td className="tabular-nums">{money(it?.narx ?? 0)}</Td>
                  </Tr>
                );
              })}
            </Table>
          </Panel>
          <p className="mt-4 text-[11.5px] text-slate-500">
            Jamoa shartnomasiga 31-ilova asosida. «Navbatchi» buyumlar kelishuvga koʻra tizimga kiritilmagan.
          </p>
        </>
      )}

      {tab === "ruxsatlar" && (
        <Panel pad={false}>
          <Table head={["Ruxsat", ...(Object.keys(ROLE_LABEL) as Role[]).map((r) => ROLE_LABEL[r].split(" ")[0])]} min={1100}>
            {ALL_PERMS.map((p) => (
              <Tr key={p}>
                <Td className="text-slate-900">{PERM_LABEL[p]}</Td>
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                  <Td key={r} className="text-center">
                    {ROLE_PERMS[r].includes(p) ? (
                      <span className="text-emerald-600">+</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </Td>
                ))}
              </Tr>
            ))}
          </Table>
        </Panel>
      )}

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
              <S l="Oʻlchov birliklari" v={db.units.join(", ")} />
              <S l="Liniya / stansiyalar" v={`${db.lines.length} ta`} />
            </div>
          </Panel>
          <Panel>
            <h3 className="mb-4 text-[15px] font-semibold text-slate-900">Tizim qoidalari</h3>
            <div className="space-y-3">
              <S l="Требование raqami" v="TCH6-YYYY-NNNNN (avtomatik)" />
              <S l="TB imtixon davriyligi" v="12 oy (individual belgilash mumkin)" />
              <S l="Imtixon eslatmasi" v="10 kun oldin" />
              <S l="Rad etish sababi" v="Majburiy (depo boshligʻidan tashqari)" />
              <S l="Rad etilgan ariza" v="Butunlay yopiladi" />
              <S l="Oʻchirish siyosati" v="Soft-delete — hech narsa oʻchirilmaydi" />
              <S l="KIP ranglari" v="3 kun yashil · 2 kun sariq · bugun apelsin · oʻtgan toʻq qizil" />
            </div>
          </Panel>
        </div>
      )}

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

      <Modal open={!!item} onClose={() => setEdit(null)} title="Buyumni tahrirlash">
        {item && (
          <div className="space-y-4">
            <Field label="Nomi">
              <Input defaultValue={item.nomi} id="i-nomi" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nomenklatura kodi">
                <Input defaultValue={item.kod} id="i-kod" />
              </Field>
              <Field label="Narx (soʻm)">
                <Input type="number" defaultValue={item.narx} id="i-narx" />
              </Field>
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
              >
                Saqlash
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function S({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-2.5">
      <span className="shrink-0 text-[12px] text-slate-500">{l}</span>
      <span className="text-right text-[12.5px] text-slate-900">{v}</span>
    </div>
  );
}
