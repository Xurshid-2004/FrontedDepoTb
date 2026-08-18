"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { daysBetween, fmt, fio, TODAY } from "@/lib/logic";
import {
  Badge, Btn, Empty, Field, Input, Modal, PageHead, Panel, Table, Td, Textarea, Tr, QrSig, useToast,
} from "@/components/ui";
import BookCard from "@/components/BookCard";
import IncidentFeed from "@/components/IncidentFeed";

/** ISO sana (YYYY-MM-DD) — kun qoʻshib ham beradi */
const isoSana = (kunQosh = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + kunQosh);
  return d.toISOString().slice(0, 10);
};

const boshForma = () => ({
  nomuvofiqlik: "",
  chora: "",
  masul: "",
  masulLavozim: "",
  // Muddat oldindan toʻldiriladi: ilgari boʻsh turgani uchun «Saqlash»
  // tugmasi jim oʻchiq qolar, foydalanuvchi esa sababini bilmasdi.
  muddat: isoSana(7),
});

export default function TbPage() {
  const {
    db, me, can, canFeature, addJournal, signJournal,
    addIncident, editIncident, deleteIncident, xato, tozalaXato,
  } = useStore();
  const t = useToast();
  const [addFor, setAddFor] = useState<1 | 2 | null>(null);
  const [signFor, setSignFor] = useState<string | null>(null);
  const [izoh, setIzoh] = useState("");
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const [tasdiqlanmoqda, setTasdiqlanmoqda] = useState(false);
  /** Forma xatosi — modal ichida koʻrsatiladi */
  const [formXato, setFormXato] = useState("");

  const [f, setF] = useState(boshForma);

  if (!me) return null;

  /** Komissiya tarkibiga kirituvchining haqiqiy lavozimi yoziladi */
  const lavozimim =
    db.positions.find((p) => p.id === me.positionId)?.nomi || "TB muhandisi";

  /** Kitob muqovasidagi sarlavha — shakl kodi emas, depo nomi turadi */
  const depoNomi = db.depo.nomi || "Buxoro lokomotiv deposi";

  /** Modalni ochish — forma har safar tozadan boshlanadi, aks holda
      1-bosqich uchun yozilgan matn 2-bosqich oynasida qolib ketardi. */
  const ochish = (b: 1 | 2) => {
    tozalaXato();
    setFormXato("");
    setF(boshForma());
    setAddFor(b);
  };

  const yopish = () => {
    if (saqlanmoqda) return; // saqlash ketayotganda oyna yopilmasin
    setAddFor(null);
    setFormXato("");
    tozalaXato();
    setF(boshForma());
  };

  const save = async () => {
    // Qaysi bosqichga yozilayotgani shu yerda qulflanadi: saqlash
    // davomida modal holati oʻzgarsa ham yozuv oʻz kitobiga tushadi.
    const bosqich = addFor;
    if (!bosqich || saqlanmoqda) return;

    // Tekshiruv jim emas: tugma oʻchirilmaydi, sabab yozib koʻrsatiladi
    if (!f.nomuvofiqlik.trim()) {
      setFormXato("3-ustun — aniqlangan nomuvofiqlik matni kiritilishi shart");
      return;
    }
    if (!f.muddat) {
      setFormXato("6-ustun — bajarish muddati koʻrsatilishi shart");
      return;
    }

    setFormXato("");
    tozalaXato();
    setSaqlanmoqda(true);
    const ok = await addJournal({
      bosqich,
      sana: isoSana(),
      komissiya: [{ fio: fio(me), lavozim: lavozimim }],
      nomuvofiqlik: f.nomuvofiqlik.trim(),
      chora: f.chora.trim(),
      masul: f.masul.trim(),
      masulLavozim: f.masulLavozim.trim(),
      muddat: f.muddat,
      bajarildi: false,
    });
    setSaqlanmoqda(false);

    // Server rad etsa — oyna yopilmaydi, kiritilgan matn joyida qoladi
    // va serverning aniq sababi shu yerda koʻrinadi.
    if (!ok) {
      setFormXato("Yozuv serverga saqlanmadi. Sababi pastda koʻrsatilgan — qayta urinib koʻring");
      return;
    }

    setAddFor(null);
    setF(boshForma());
    t.show(`Yozuv ${bosqich}-bosqich jurnaliga qoʻshildi`);
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
        {([1, 2] as const).map((b) => {
          // Har bir kitob FAQAT oʻz bosqichidagi yozuvlarni koʻrsatadi
          const yozuvlar = db.journal.filter((j) => j.bosqich === b);
          return (
            <div key={b} className="h-[280px]">
              <BookCard
                keng                          /* 7 ustunli jadval sigʻishi uchun */
                label={depoNomi}
                title={`Maʼmuriy jamoatchilik nazoratining ${b === 1 ? "birinchi" : "ikkinchi"} bosqichini qayd qilish jurnali`}
                subtitle={`${b}-bosqich · ${yozuvlar.length} yozuv · ${yozuvlar.filter((j) => !j.bajarildi).length} ochiq`}
                accent={b === 1 ? "#38bdf8" : "#a78bfa"}
              >
                <JournalBody bosqich={b} onSign={setSignFor} />
              </BookCard>
            </div>
          );
        })}
      </div>

      {can("journal.write") && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Btn variant="primary" onClick={() => ochish(1)}>+ 1-bosqichga yozuv</Btn>
          <Btn variant="primary" onClick={() => ochish(2)}>+ 2-bosqichga yozuv</Btn>
        </div>
      )}

      {can("incident.tb.read") && (
        <div className="mt-6">
          <IncidentFeed
            db={db}
            entries={db.incidents.filter((i) => i.turi === "tb")}
            canWrite={can("incident.tb.write")}
            onAdd={(matn) => addIncident("tb", matn)}
            onEdit={(id, matn) => editIncident(id, matn)}
            onDelete={(id) => deleteIncident(id)}
            meId={me.id}
            canManageAll={can("admin.users")}
            title="TB — baxtsiz xodisalar"
            subtitle="Tizimda roʻy bergan baxtsiz xodisalar haqida xabar — hammaga koʻrinadi"
            placeholder="Baxtsiz xodisa haqida qisqacha yozing..."
            accent="#ef4444"
          />
        </div>
      )}

      <Modal
        open={!!addFor}
        onClose={yopish}
        title={`${addFor ?? 1}-bosqich jurnali — yangi yozuv`}
      >
        <div className="space-y-4">
          <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[12px] text-sky-800">
            Yozuv <b>{addFor}-bosqich</b> kitobiga tushadi va u yerdagi mavjud
            yozuvlar ustiga qoʻshiladi.
          </p>

          <Field label="3. Aniqlangan nomuvofiqliklar *">
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
          <Field label="6. Bajarish muddati *">
            <Input type="date" value={f.muddat} onChange={(e) => setF({ ...f, muddat: e.target.value })} />
          </Field>
          <p className="text-[11.5px] text-slate-500">
            1-ustun (sana) va 2-ustun (komissiya tarkibi) avtomatik toʻldiriladi:{" "}
            {fio(me)} · {lavozimim}
          </p>

          {formXato && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
              {formXato}
            </p>
          )}
          {xato && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
              Server javobi: {xato}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Btn onClick={yopish} disabled={saqlanmoqda}>Bekor qilish</Btn>
            <Btn variant="primary" disabled={saqlanmoqda} onClick={save}>
              {saqlanmoqda ? "Saqlanmoqda…" : "Saqlash"}
            </Btn>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!signFor}
        onClose={() => { if (!tasdiqlanmoqda) { setSignFor(null); setIzoh(""); } }}
        title="Chora-tadbir bajarilganini tasdiqlash"
      >
        <div className="space-y-4">
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800">
            Tasdiqlansa — chora-tadbir <b>bajarildi</b> deb belgilanadi va
            7-ustunga sizning <b>F.I.Sh., lavozimingiz va QR imzoyingiz</b>
            qoʻyiladi. QR kod tekshirish sahifasiga bogʻlanadi.
          </p>

          <Field label="Izoh" hint="Hujjatda saqlanadi — nima qilinganini qisqacha yozing">
            <Textarea value={izoh} onChange={(e) => setIzoh(e.target.value)} placeholder="Bajarildi, tekshirildi" />
          </Field>

          <div className="flex justify-end gap-3">
            <Btn onClick={() => { setSignFor(null); setIzoh(""); }} disabled={tasdiqlanmoqda}>
              Bekor qilish
            </Btn>
            <Btn
              variant="ok"
              disabled={tasdiqlanmoqda}
              onClick={async () => {
                if (!signFor || tasdiqlanmoqda) return;
                setTasdiqlanmoqda(true);
                const ok = await signJournal(signFor, izoh.trim() || "Bajarildi");
                setTasdiqlanmoqda(false);
                if (!ok) {
                  t.show("Tasdiqlanmadi — qayta urinib koʻring");
                  return;
                }
                setSignFor(null);
                setIzoh("");
                t.show("Bajarildi deb tasdiqlandi — QR imzo qoʻyildi");
              }}
            >
              {tasdiqlanmoqda ? "Tasdiqlanmoqda…" : "Tasdiqlash va QR imzo qoʻyish"}
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

function JournalBody({ bosqich, onSign }: { bosqich: 1 | 2; onSign: (id: string) => void }) {
  const { db, can } = useStore();

  // Faqat shu bosqich yozuvlari, eng yangisi tepada (server ham shu
  // tartibda qaytaradi — bu yerda kafolatlanadi).
  const rows = db.journal
    .filter((j) => j.bosqich === bosqich)
    .slice()
    .sort((a, b) => (a.sana < b.sana ? 1 : a.sana > b.sana ? -1 : 0));

  if (rows.length === 0) return <Empty text="Yozuvlar yoʻq" />;

  return (
    <Table
      head={[
        "1. Sana",
        "2. Komissiya (ish beruvchi)",
        "3. Nomuvofiqlik",
        "4. Chora-tadbir",
        "5. Javobgar (ish oluvchi)",
        "6. Muddat",
        "7. Bajarilgani boʻyicha belgi",
      ]}
      min={1180}
    >
      {rows.map((j) => {
        const d = daysBetween(TODAY(), j.muddat);
        const c = j.bajarildi ? "#22c55e" : d < 0 ? "#ef4444" : d <= 3 ? "#f59e0b" : "#38bdf8";
        const w = db.workers.find((x) => x.id === j.imzo?.userId);
        return (
          <Tr key={j.id}>
            <Td className="whitespace-nowrap tabular-nums">{fmt(j.sana)}</Td>
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
            <Td className="whitespace-nowrap tabular-nums">{fmt(j.muddat)}</Td>
            <Td>
              {j.bajarildi && j.imzo ? (
                // Tasdiqlangan: kim tasdiqlagani (F.I.Sh. + lavozim) va QR imzo.
                // QR tekshirish sahifasiga olib boradi.
                <div className="flex flex-col items-start gap-1.5">
                  <Badge color="#22c55e">Bajarildi</Badge>
                  <QrSig
                    sigId={j.imzo.id}
                    hash={j.imzo.hash}
                    // Imzodagi F.I.Sh. — serverdan (imzo qoʻyilgan paytdagi
                    // holicha). Eski yozuvlarda boʻlmasa — ishchilar
                    // roʻyxatidan topamiz.
                    fio={j.imzo.fio || (w ? `${w.familiya} ${w.ism} ${w.otasi}`.trim() : "—")}
                    lavozim={
                      j.imzo.lavozim ||
                      (w ? db.positions.find((p) => p.id === w.positionId)?.nomi ?? "" : "")
                    }
                    sana={fmt(j.imzo.sana)}
                    size={54}
                  />
                </div>
              ) : (
                // Badge ham, tugma ham inline element — flex-col boʻlmasa
                // bir qatorga tizilib, tor ustunda kesilib qolardi.
                <div className="flex flex-col items-start gap-2">
                  <Badge color={c}>{d < 0 ? `${-d} kun kechikdi` : `${d} kun qoldi`}</Badge>
                  {can("journal.sign") && (
                    <Btn size="sm" variant="ok" onClick={() => onSign(j.id)}>Tasdiqlash</Btn>
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
