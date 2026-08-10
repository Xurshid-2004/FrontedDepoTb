"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { daysBetween, fmt, fio, TODAY } from "@/lib/logic";
import {
  Badge, Btn, Empty, Field, Input, Modal, PageHead, Panel, Table, Td, Textarea, Tr, QrSig, useToast,
} from "@/components/ui";
import BookCard from "@/components/BookCard";
import IncidentFeed from "@/components/IncidentFeed";

export default function TbPage() {
  const { db, me, can, canFeature, addJournal, signJournal, addIncident } = useStore();
  const t = useToast();
  const [addFor, setAddFor] = useState<1 | 2 | null>(null);
  const [signFor, setSignFor] = useState<string | null>(null);
  const [izoh, setIzoh] = useState("");

  const [f, setF] = useState({ nomuvofiqlik: "", chora: "", masul: "", masulLavozim: "", muddat: "" });

  if (!me) return null;

  const save = () => {
    if (!addFor) return;
    addJournal({
      bosqich: addFor,
      sana: new Date().toISOString().slice(0, 10),
      komissiya: [{ fio: fio(me), lavozim: "TB muhandisi" }],
      nomuvofiqlik: f.nomuvofiqlik,
      chora: f.chora,
      masul: f.masul,
      masulLavozim: f.masulLavozim,
      muddat: f.muddat,
      bajarildi: false,
    });
    setAddFor(null);
    setF({ nomuvofiqlik: "", chora: "", masul: "", masulLavozim: "", muddat: "" });
    t.show("Yozuv jurnalga qoʻshildi");
  };

  return (
    <>
      {t.node}
      <PageHead
        title="TB — Nazorat jurnallari"
        sub="Maʼmuriy jamoatchilik nazoratining birinchi va ikkinchi bosqichi (shakl Yo D-26). Ikkala jurnal butunlay alohida yuritiladi."
        right={canFeature("doc.kitobcha") ? (
          <a href="/hujjatlar/kitobcha.html" target="_blank" rel="noopener noreferrer">
            <Btn size="sm" variant="primary">Jamoatchilik nazorati kitobchasi ↗</Btn>
          </a>
        ) : undefined}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {([1, 2] as const).map((b) => (
          <div key={b} className="h-[280px]">
            <BookCard
              title={`Maʼmuriy jamoatchilik nazoratining ${b === 1 ? "birinchi" : "ikkinchi"} bosqichini qayd qilish jurnali`}
              subtitle={`${b}-bosqich · ${db.journal.filter((j) => j.bosqich === b).length} yozuv · ${db.journal.filter((j) => j.bosqich === b && !j.bajarildi).length} ochiq`}
              accent={b === 1 ? "#38bdf8" : "#a78bfa"}
            >
              <JournalBody bosqich={b} onSign={setSignFor} />
            </BookCard>
          </div>
        ))}
      </div>

      {can("journal.write") && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Btn variant="primary" onClick={() => setAddFor(1)}>+ 1-bosqichga yozuv</Btn>
          <Btn variant="primary" onClick={() => setAddFor(2)}>+ 2-bosqichga yozuv</Btn>
        </div>
      )}

      {can("incident.tb.read") && (
        <div className="mt-6">
          <IncidentFeed
            db={db}
            entries={db.incidents.filter((i) => i.turi === "tb")}
            canWrite={can("incident.tb.write")}
            onAdd={(matn) => addIncident("tb", matn)}
            title="TB — baxtsiz xodisalar"
            subtitle="Tizimda roʻy bergan baxtsiz xodisalar haqida xabar — hammaga koʻrinadi"
            placeholder="Baxtsiz xodisa haqida qisqacha yozing..."
            accent="#ef4444"
          />
        </div>
      )}

      <Modal open={!!addFor} onClose={() => setAddFor(null)} title={`${addFor}-bosqich — yangi yozuv`}>
        <div className="space-y-4">
          <Field label="3. Aniqlangan nomuvofiqliklar">
            <Textarea value={f.nomuvofiqlik} onChange={(e) => setF({ ...f, nomuvofiqlik: e.target.value })} />
          </Field>
          <Field label="4. Chora-tadbirlar">
            <Textarea value={f.chora} onChange={(e) => setF({ ...f, chora: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="5. Javobgar shaxs (F.I.Sh.)">
              <Input value={f.masul} onChange={(e) => setF({ ...f, masul: e.target.value })} />
            </Field>
            <Field label="5. Lavozimi">
              <Input value={f.masulLavozim} onChange={(e) => setF({ ...f, masulLavozim: e.target.value })} />
            </Field>
          </div>
          <Field label="6. Bajarish muddati">
            <Input type="date" value={f.muddat} onChange={(e) => setF({ ...f, muddat: e.target.value })} />
          </Field>
          <p className="text-[11.5px] text-slate-500">
            1-ustun (sana) va 2-ustun (komissiya tarkibi) avtomatik toʻldiriladi.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Btn onClick={() => setAddFor(null)}>Bekor qilish</Btn>
            <Btn variant="primary" disabled={!f.nomuvofiqlik || !f.muddat} onClick={save}>Saqlash</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={!!signFor} onClose={() => setSignFor(null)} title="7-ustun — bajarilgani boʻyicha belgi">
        <div className="space-y-4">
          <Field label="Izoh" hint="Imzo QR kod koʻrinishida qoʻyiladi va tekshirish sahifasiga bogʻlanadi">
            <Textarea value={izoh} onChange={(e) => setIzoh(e.target.value)} placeholder="Bajarildi, tekshirildi" />
          </Field>
          <div className="flex justify-end gap-3">
            <Btn onClick={() => setSignFor(null)}>Bekor qilish</Btn>
            <Btn
              variant="ok"
              onClick={() => {
                signJournal(signFor!, izoh || "Bajarildi");
                setSignFor(null);
                setIzoh("");
                t.show("Yozuv imzolandi");
              }}
            >
              QR imzo bilan tasdiqlash
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

function JournalBody({ bosqich, onSign }: { bosqich: 1 | 2; onSign: (id: string) => void }) {
  const { db, can } = useStore();
  const rows = db.journal.filter((j) => j.bosqich === bosqich);

  if (rows.length === 0) return <Empty text="Yozuvlar yoʻq" />;

  return (
    <Table
      head={["1. Sana", "2. Komissiya", "3. Nomuvofiqlik", "4. Chora-tadbir", "5. Javobgar", "6. Muddat", "7. Belgi"]}
      min={900}
    >
      {rows.map((j) => {
        const d = daysBetween(TODAY(), j.muddat);
        const c = j.bajarildi ? "#22c55e" : d < 0 ? "#ef4444" : d <= 3 ? "#f59e0b" : "#38bdf8";
        const w = db.workers.find((x) => x.id === j.imzo?.userId);
        return (
          <Tr key={j.id}>
            <Td className="tabular-nums">{fmt(j.sana)}</Td>
            <Td>
              {j.komissiya.map((k, i) => (
                <div key={i} className="leading-tight">
                  <span className="text-slate-800">{k.fio}</span>
                  <span className="block text-[11px] text-slate-500">{k.lavozim}</span>
                </div>
              ))}
            </Td>
            <Td className="text-slate-800">{j.nomuvofiqlik}</Td>
            <Td>{j.chora}</Td>
            <Td>
              {j.masul}
              <span className="block text-[11px] text-slate-500">{j.masulLavozim}</span>
            </Td>
            <Td className="tabular-nums">{fmt(j.muddat)}</Td>
            <Td>
              {j.bajarildi && j.imzo ? (
                <QrSig
                  sigId={j.imzo.id}
                  hash={j.imzo.hash}
                  fio={w ? `${w.familiya} ${w.ism}` : "TB muhandisi"}
                  lavozim="TB muhandisi"
                  sana={fmt(j.imzo.sana)}
                  size={54}
                />
              ) : (
                <div className="space-y-2">
                  <Badge color={c}>{d < 0 ? `${-d} kun kechikdi` : `${d} kun qoldi`}</Badge>
                  {can("journal.sign") && (
                    <Btn size="sm" variant="ok" onClick={() => onSign(j.id)}>Imzolash</Btn>
                  )}
                </div>
              )}
            </Td>
          </Tr>
        );
      })}
    </Table>
  );
}
