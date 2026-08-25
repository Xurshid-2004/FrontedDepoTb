"use client";

/* ------------------------------------------------------------------
   Kolonnalar — instruktor (mashinist yoʻriqchisi) guruhlari.
   Faqat admin (kolonna.manage). Bu yerdan kolonna ochiladi, instruktor
   tayinlanadi va ishchilar biriktiriladi/koʻchiriladi. Instruktor
   yoʻriqnoma kitobi (Yo D-26B) shu kolonna boʻyicha ishlaydi.
------------------------------------------------------------------ */

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { fio } from "@/lib/logic";
import { KOLONNA_TURI_LABEL, type KolonnaTuri } from "@/lib/types";
import {
  Badge, Btn, Empty, Field, Input, Modal, PageHead, Panel, Select,
  Table, Td, Tr, useToast,
} from "@/components/ui";

const TURLAR: KolonnaTuri[] = [
  "elektrovoz", "teplovoz", "manyovr", "yuk", "yolovchi", "xojalik", "boshqa",
];

type Tahrir = {
  id?: string;
  nomi: string;
  turi: KolonnaTuri;
  instruktorId: string;
  izoh: string;
  faol: boolean;
};

const BOSH: Tahrir = { nomi: "", turi: "boshqa", instruktorId: "", izoh: "", faol: true };

export default function KolonnalarPage() {
  const { db, can, kolonnaUpsert, kolonnaAssign } = useStore();
  const t = useToast();

  const [form, setForm] = useState<Tahrir | null>(null);
  const [q, setQ] = useState("");
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);

  const boshqara = can("kolonna.manage");

  // Instruktor nomzodlari — yoʻriqchi roli borlar
  const instruktorlar = useMemo(
    () => db.workers.filter((w) => w.faol && (w.roles || []).includes("yoriqchi")),
    [db.workers]
  );
  const wById = useMemo(
    () => Object.fromEntries(db.workers.map((w) => [w.id, w])),
    [db.workers]
  );

  const izlangan = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return db.workers.filter((w) => w.faol).slice(0, 40);
    return db.workers
      .filter((w) => w.faol)
      .filter((w) =>
        `${w.tabel} ${fio(w)}`.toLowerCase().includes(s)
      )
      .slice(0, 40);
  }, [db.workers, q]);

  if (!boshqara) {
    return (
      <div className="p-6">
        <Empty text="Kolonnalarni boshqarish uchun ruxsatingiz yoʻq" />
      </div>
    );
  }

  async function saqla() {
    if (!form) return;
    if (!form.nomi.trim()) {
      t.show("Kolonna nomini kiriting");
      return;
    }
    setSaqlanmoqda(true);
    const id = await kolonnaUpsert({
      id: form.id,
      nomi: form.nomi.trim(),
      turi: form.turi,
      instruktorId: form.instruktorId || null,
      izoh: form.izoh,
      faol: form.faol,
    });
    setSaqlanmoqda(false);
    if (id) {
      t.show(form.id ? "Kolonna yangilandi" : "Kolonna yaratildi");
      setForm(null);
    } else {
      t.show("Saqlashda xatolik");
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] p-4 md:p-6">
      <PageHead
        title="Kolonnalar"
        sub="Instruktor guruhlari — kolonna ochish, instruktor tayinlash va ishchilarni biriktirish"
        right={<Btn variant="primary" onClick={() => setForm({ ...BOSH })}>+ Yangi kolonna</Btn>}
      />

      {/* Kolonnalar roʻyxati */}
      <Panel className="mb-6">
        {db.kolonnalar.length === 0 ? (
          <Empty text="Hali kolonna yoʻq — «Yangi kolonna» tugmasi bilan oching" />
        ) : (
          <Table head={["Nomi", "Turi", "Instruktor", "Ishchilar", ""]}>
            {db.kolonnalar.map((k) => {
              const instr = k.instruktorId ? wById[k.instruktorId] : null;
              return (
                <Tr key={k.id}>
                  <Td>
                    <span className="font-semibold">{k.nomi}</span>
                    {!k.faol && <Badge color="#ef4444" className="ml-2">nofaol</Badge>}
                    {k.izoh ? <div className="text-[11px] text-slate-500">{k.izoh}</div> : null}
                  </Td>
                  <Td>{KOLONNA_TURI_LABEL[k.turi]}</Td>
                  <Td>{instr ? fio(instr) : <span className="text-slate-400">—</span>}</Td>
                  <Td><Badge>{k.ishchiSoni}</Badge></Td>
                  <Td>
                    <Btn size="sm" onClick={() => setForm({
                      id: k.id, nomi: k.nomi, turi: k.turi,
                      instruktorId: k.instruktorId ?? "", izoh: k.izoh ?? "", faol: k.faol,
                    })}>Tahrirlash</Btn>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </Panel>

      {/* Ishchilarni biriktirish / koʻchirish */}
      <Panel>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-[14px] font-semibold">Ishchilarni kolonnaga biriktirish</h3>
          <Input
            placeholder="Tabel yoki F.I.Sh. boʻyicha qidirish"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-[280px]"
          />
        </div>
        {izlangan.length === 0 ? (
          <Empty text="Ishchi topilmadi" />
        ) : (
          <Table head={["Tabel", "F.I.Sh.", "Kolonna"]}>
            {izlangan.map((w) => (
              <Tr key={w.id}>
                <Td className="font-mono">{w.tabel}</Td>
                <Td>{fio(w)}</Td>
                <Td>
                  <Select
                    value={w.kolonnaId ?? ""}
                    onChange={(e) => kolonnaAssign(w.id, e.target.value || null)}
                    className="min-w-[200px]"
                  >
                    <option value="">— biriktirilmagan —</option>
                    {db.kolonnalar.filter((k) => k.faol).map((k) => (
                      <option key={k.id} value={k.id}>{k.nomi}</option>
                    ))}
                  </Select>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Panel>

      {/* Yaratish / tahrirlash modali */}
      {form && (
        <Modal open title={form.id ? "Kolonnani tahrirlash" : "Yangi kolonna"} onClose={() => setForm(null)}>
          <div className="space-y-4">
            <Field label="Kolonna nomi">
              <Input
                value={form.nomi}
                onChange={(e) => setForm({ ...form, nomi: e.target.value })}
                placeholder="masalan: 17-Manyovr kolonnasi"
                autoFocus
              />
            </Field>
            <Field label="Turi">
              <Select value={form.turi} onChange={(e) => setForm({ ...form, turi: e.target.value as KolonnaTuri })}>
                {TURLAR.map((tt) => (
                  <option key={tt} value={tt}>{KOLONNA_TURI_LABEL[tt]}</option>
                ))}
              </Select>
            </Field>
            <Field label="Instruktor (mashinist yoʻriqchisi)">
              <Select value={form.instruktorId} onChange={(e) => setForm({ ...form, instruktorId: e.target.value })}>
                <option value="">— tanlanmagan —</option>
                {instruktorlar.map((w) => (
                  <option key={w.id} value={w.id}>{w.tabel} — {fio(w)}</option>
                ))}
              </Select>
            </Field>
            <Field label="Izoh (ixtiyoriy)">
              <Input value={form.izoh} onChange={(e) => setForm({ ...form, izoh: e.target.value })} />
            </Field>
            {form.id && (
              <label className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={form.faol}
                  onChange={(e) => setForm({ ...form, faol: e.target.checked })}
                />
                Faol
              </label>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Btn onClick={() => setForm(null)}>Bekor</Btn>
              <Btn variant="primary" onClick={saqla} disabled={saqlanmoqda}>
                {saqlanmoqda ? "Saqlanmoqda…" : "Saqlash"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
