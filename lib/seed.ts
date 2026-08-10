/* ------------------------------------------------------------------
   Demo hisoblar — FAQAT sinov muhitida koʻrsatiladi.

   Ilgari bu fayl 450 qatorlik soxta maʼlumot (ishchilar, arizalar,
   kartochkalar) yaratardi va ilova shundan ishga tushardi. Endi bunday
   emas: barcha maʼlumot Django bazasidan keladi.

   Boshlangʻich maʼlumotni yaratish uchun serverda:
       python manage.py seed --demo

   Demo tugmalarini koʻrsatish uchun .env.local ga qoʻying:
       NEXT_PUBLIC_DEMO=1
------------------------------------------------------------------ */

export type DemoAccount = { tabel: string; rol: string };

/** `manage.py seed --demo` yaratadigan hisoblar bilan mos */
const HISOBLAR: DemoAccount[] = [
  { tabel: "10001", rol: "Administrator" },
  { tabel: "10440", rol: "Depo boshligʻi" },
  { tabel: "10478", rol: "Bosh xisobchi" },
  { tabel: "10517", rol: "Bugalter" },
  { tabel: "10557", rol: "TB xodimi" },
  { tabel: "10598", rol: "Omborxona mudiri" },
  { tabel: "10683", rol: "Mashinist yoʻriqchisi" },
];

/** Productionda boʻsh roʻyxat — hech qanday tabel raqami koʻrsatilmaydi. */
export const DEMO_ACCOUNTS: DemoAccount[] =
  process.env.NEXT_PUBLIC_DEMO === "1" ? HISOBLAR : [];
