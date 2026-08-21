"use client";

/* ------------------------------------------------------------------
   Kirish va roʻyxatdan oʻtish.

   OQIMLAR
   -------
   Kirish:      tabel → (yuz bor boʻlsa) Face ID → mos kelmasa PIN
   Roʻyxat:     tabel → Face ID (ixtiyoriy) → yangi PIN → tizimga kiradi

   Har bir qaror SERVERDA qabul qilinadi (/auth/check). Brauzer
   ishchilar roʻyxatini ham, PIN hash'ini ham, yuz vektorini ham
   hech qachon koʻrmaydi.

   Roʻyxatdan faqat kadrlar bazasida BOR tabel raqami oʻta oladi —
   yaʼni admin qoʻshgan yoki ommaviy import qilgan ishchi.
------------------------------------------------------------------ */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Locomotive from "./Locomotive";
import PinPad from "./PinPad";
import FaceCapture from "./FaceCapture";
import { TouchRipple } from "./Fx";
import { useIsMobile } from "./ui";
import { useStore } from "@/lib/store";
import { api, ApiError, type TabelHolat } from "@/lib/api";

type Mode = "login" | "register";
/**
 * `face-setup` — PIN bilan kirgandan KEYIN koʻrsatiladigan ixtiyoriy qadam.
 *
 * Nega kerak: kirishda Face ID faqat yuz avval qayd etilgan boʻlsa soʻraladi
 * (`faceBor && faceYoqilgan`). Yuz tanish keyinroq yoqilgani uchun allaqachon
 * roʻyxatdan oʻtgan xodimlarning HAMMASIDA `faceBor: false` edi — yaʼni ular
 * uchun Face ID hech qachon soʻralmasdi va tizim bu haqda ogohlantirmasdi ham.
 * Yagona yoʻl «Mening kabinetim» sahifasidagi panel edi, lekin undan xabardor
 * boʻlish imkoni yoʻq. Endi xodim kirgan zahoti taklif koʻradi.
 */
type Stage = "form" | "face" | "pin" | "face-setup";

const EASE = [0.76, 0, 0.24, 1] as const;

export default function LoginCard({ onAuthed }: { onAuthed: () => void }) {
  const { login, faceLogin, register } = useStore();

  /* Telefonda karta bitta ustun boʻladi. Login va roʻyxat oqimlari
     orasidagi «sirgʻalish» animatsiyasi ikki ustunli maket uchun
     oʻylangan: bitta ustunda u mazmunni ekrandan chiqarib yuboradi va
     ekran boʻsh qolib koʻrinadi. Shuning uchun kichik ekranda surish
     oʻchiriladi — bosqichlar oddiy almashadi. */
  const mobil = useIsMobile();

  const [mode, setMode] = useState<Mode>("login");
  const [stage, setStage] = useState<Stage>("form");
  const [tabel, setTabel] = useState("");
  const [blind, setBlind] = useState(false);

  /** Serverning tabel haqidagi javobi — keyingi qadam shunga qarab tanlanadi */
  const [holat, setHolat] = useState<TabelHolat | null>(null);
  /** Roʻyxatdan oʻtishda olingan yuz kadrlari (boʻsh boʻlishi mumkin) */
  const [kadrlar, setKadrlar] = useState<string[]>([]);

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [faceErr, setFaceErr] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [tekshirmoqda, setTekshirmoqda] = useState(false);
  const [faceBand, setFaceBand] = useState(false);

  const canSubmit = stage === "form" && !tekshirmoqda && tabel.trim().length >= 3;

  /** Yuz bosqichidan chiqilganini bildiradi.
   *
   *  «PIN kod bilan kirish» tugmasi endi kadr olinayotganda ham bosiladi.
   *  Shuning uchun serverga ketgan `faceLogin` javobi xodim allaqachon PIN
   *  terayotganda qaytishi mumkin — u holda javob eʼtiborsiz qoldiriladi,
   *  aks holda ekran oʻz-oʻzidan almashib yoki xabar chiqib chalkashtirardi.
   *  `state` emas, `ref`: qiymat oʻsha zahoti kerak, qayta render kutmasdan. */
  const faceBekor = useRef(false);

  /** Xato chiqqanda uni koʻrinadigan joyga surib qoʻyamiz — past
      ekranda karta ichidagi scroll uni yashirib qoʻymasin. */
  const xatoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (err) xatoRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [err]);

  const boshdan = (m: Mode) => {
    faceBekor.current = false;
    setMode(m);
    setStage("form");
    setHolat(null);
    setKadrlar([]);
    setErr("");
    setInfo("");
    setFaceErr("");
    setPinErr("");
    setBlind(false);
  };

  /* ---------------- 1-qadam: tabel raqamini tekshirish ---------------- */

  const submit = async () => {
    setTekshirmoqda(true);
    setErr("");
    setInfo("");
    try {
      const r = await api.tabelTekshir(tabel);

      // Tabel raqami SERVERDAGI kadrlar bazasidan tekshiriladi.
      // Topilmasa — foydalanuvchi shu yerning oʻzida, aniq matn bilan
      // xabardor qilinadi va keyingi bosqichga oʻtkazilmaydi.
      if (!r.bor) {
        setErr(
          `${tabel.trim()} — bunday tabel raqami kadrlar bazasida yoʻq. ` +
          (mode === "register"
            ? "Avval depo kadrlar boʻlimi sizni bazaga kiritishi kerak"
            : "Raqamni tekshirib qayta kiriting yoki depo kadrlar boʻlimiga murojaat qiling")
        );
        return;
      }

      setHolat(r);

      if (mode === "login") {
        // Hali roʻyxatdan oʻtmagan — roʻyxat oqimiga oʻtkazamiz.
        // Birinchi qadam DOIM PIN: xodim tabel raqamini teradi va oʻziga
        // parol (PIN) yaratadi. Face ID — keyingi, ixtiyoriy qadam.
        if (r.royxatKerak) {
          setMode("register");
          setInfo(`${r.fio} — siz hali roʻyxatdan oʻtmagansiz. Oʻzingizga PIN parol yarating`);
          setStage("pin");
          return;
        }
        // Tartib: tabel → Face ID → PIN.
        //
        // Yuz tanish xizmati yoqilgan boʻlsa DOIM avval Face ID soʻraladi.
        // Ilgari bu qadam faqat yuzi allaqachon qayd etilgan xodimga
        // koʻrsatilardi (`faceBor`), qolganlar toʻgʻridan-toʻgʻri PIN'ga
        // tushardi va Face ID borligini bilmasdi ham.
        //
        // Yuzi yoʻq xodim uchun server darrov «bu hisob uchun sozlanmagan»
        // deb javob beradi — u holda kutib turmasdan PIN'ga oʻtiladi
        // (`yuzOlindi`ga qarang), soʻng kirgach Face ID qayd etish
        // taklif qilinadi.
        //
        // Xizmat umuman sozlanmagan boʻlsa (`faceYoqilgan: false` —
        // serverda FACE_SERVICE_URL yoʻq) kamera ochilmaydi: u yerda
        // solishtirish uchun hech narsa yoʻq va bu faqat vaqt oladi.
        faceBekor.current = false;
        setStage(r.faceYoqilgan ? "face" : "pin");
        return;
      }

      // --- roʻyxatdan oʻtish ---
      if (!r.royxatKerak) {
        setErr(
          "Bu tabel raqami allaqachon roʻyxatdan oʻtgan. «Kirish» boʻlimidan foydalaning"
        );
        return;
      }
      setInfo(`${r.fio} — maʼlumot tasdiqlandi. Endi oʻzingizga PIN parol yarating`);
      setStage("pin");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Serverga ulanib boʻlmadi");
    } finally {
      setTekshirmoqda(false);
    }
  };

  const onEnter = () => {
    if (canSubmit) void submit();
  };

  /* ---------------- 2-qadam: yuz ---------------- */

  const yuzOlindi = async (frames: string[]) => {
    setFaceErr("");

    // Roʻyxatdan oʻtishda kadrlar saqlanadi, tekshiruv PIN bilan birga ketadi
    if (mode === "register") {
      setKadrlar(frames);
      setStage("pin");
      return;
    }

    // Kirishda — darrov serverda solishtiriladi
    setFaceBand(true);
    try {
      const r = await faceLogin(tabel.trim(), frames);

      // Xodim kutmasdan «PIN kod bilan kirish»ni bosgan boʻlsa — javob
      // endi kerak emas: u PIN terayotgan boʻlishi mumkin.
      if (faceBekor.current) return;

      if (r.ok) {
        onAuthed();
        return;
      }

      // Qayta urinishning maʼnosi bormi?
      //
      // Yoʻq — agar bu hisobda saqlangan yuz boʻlmasa (401) yoki yuz
      // tanish xizmati javob bermayotgan boʻlsa (503). Bunday holatda
      // kamera yana ikki marta urinib, xodimni 10 soniya kutdirardi va
      // baribir shu natijani berardi. Shuning uchun darrov 3-bosqichga —
      // PIN'ga oʻtamiz va sababni aytamiz.
      const foydasiz = r.status === 503 || (r.status === 401 && !holat?.faceBor);
      if (foydasiz) {
        setInfo(r.xato ?? "Yuz bilan kirib boʻlmadi — PIN bilan kiring");
        setFaceErr("");
        setStage("pin");
        return;
      }

      // Ha — yuz qayd etilgan, ammo mos kelmadi (yorugʻlik, burchak).
      // FaceCapture oʻzi yana urinadi, soʻng qoʻlda boshqaruvni beradi.
      setFaceErr(r.xato ?? "Yuz mos kelmadi");
    } finally {
      setFaceBand(false);
    }
  };

  /* ---------------- 3-qadam: PIN ---------------- */

  /** Roʻyxatdan oʻtish: PIN toʻlgach hisob yaratiladi */
  const royxatTasdiq = async (pin: string): Promise<boolean> => {
    const r = await register(tabel.trim(), pin, kadrlar);
    if (r.ok) {
      if (r.faceXabar) setInfo(r.faceXabar);
      return true;
    }
    setPinErr(r.xato ?? "Roʻyxatdan oʻtilmadi");
    return false;
  };

  /** Kirish: PIN serverda tekshiriladi */
  const kirishTasdiq = async (pin: string): Promise<boolean> => {
    try {
      // Admin majburiy almashtirishga qoʻygan boʻlsa — avval yangisi oʻrnatiladi
      if (holat?.pinKerak) {
        await api.setPin(tabel.trim(), pin);
        return true;
      }
      return (await login(tabel.trim(), pin)) === "ok";
    } catch (e) {
      setPinErr(e instanceof ApiError ? e.message : "Xato yuz berdi");
      return false;
    }
  };

  /**
   * PIN tekshiruvidan keyin: darrov kiritamizmi yoki Face ID taklif qilamizmi.
   *
   * Roʻyxatdan oʻtishda yuz allaqachon soʻralgan (`face` bosqichi) — takrorlamaymiz.
   */
  const pinTugadi = () => {
    if (!royxat && holat?.faceYoqilgan && !holat.faceBor) {
      // Yangi bosqich — bayroq tozalanadi. Aks holda yuz bosqichida
      // qoʻyilgan «bekor» qiymati bu yerda ham saqlanib qolib, saqlash
      // tugagach `onAuthed()` chaqirilmasdi va xodim ichkariga kirolmasdi.
      faceBekor.current = false;
      setInfo("");
      setPinErr("");
      setStage("face-setup");
      return;
    }
    onAuthed();
  };

  /** Kirgandan keyingi ixtiyoriy qadam: yuzni qayd etib, ichkariga oʻtish */
  const yuzQaydEt = async (frames: string[]) => {
    setFaceErr("");
    setFaceBand(true);
    try {
      await api.setMyFace(frames);
      if (faceBekor.current) return;   // «Hozir emas» bosilgan — kirish oʻsha yerda hal boʻlgan
      onAuthed();
    } catch (e) {
      if (faceBekor.current) return;
      // Saqlanmasa ham xodimni tizimdan tashqarida qoldirmaymiz —
      // PIN allaqachon tekshirilgan, u kirishga haqli.
      setFaceErr(e instanceof ApiError ? e.message : "Saqlanmadi — keyinroq urinib koʻring");
    } finally {
      setFaceBand(false);
    }
  };

  const royxat = mode === "register";

  return (
    <TouchRipple className="relative w-full max-w-[1120px] rounded-[28px]">
      <div className="glass-strong relative w-full overflow-hidden rounded-[28px]">
        {/* diagonal koʻk panel — login/registratsiya almashganda sirgʻaladi */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 hidden w-[62%] md:block"
          initial={{ left: royxat ? "-10%" : "48%" }}
          animate={{ left: royxat ? "-10%" : "48%" }}
          transition={{ duration: 0.85, ease: EASE }}
        >
          <div
            className="h-full w-full overflow-hidden"
            style={{
              clipPath: royxat
                ? "polygon(0 0, 100% 0, 82% 100%, 0 100%)"
                : "polygon(18% 0, 100% 0, 100% 100%, 0 100%)",
            }}
          >
            <img src="/ichi.jpg" alt="" className="animate-kenburns h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(28,92,158,.92)_0%,rgba(35,120,190,.86)_45%,rgba(74,159,216,.8)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(255,255,255,.42),transparent_58%)]" />
          </div>
        </motion.div>

        {/* Karta ekranga QATʼIY sigʻadi — sahifada ham, karta ichida ham
            scroll boʻlmaydi. Balandlik shu yerda cheklanadi, mazmun esa
            ichkarida moslashadi (kamera qolgan joyni egallab, kerak
            boʻlsa kichrayadi). */}
        {/* Balandlik: ekranga sigʻadi, ammo avvalgidan kengroq — mazmun
            (xato xabari, «Hisobingiz yoʻqmi?», xavfsizlik eslatmasi)
            koʻrinmas qismga tushib qolmasin. */}
        {/* Telefonda: yuqorida ixcham koʻk sarlavha, ostida forma
            (`auto` + `1fr` — forma qolgan joyni egallaydi va kerak
            boʻlsa oʻz ichida suriladi). Balandlik ekranga qarab
            hisoblanadi, pastdagi © yozuvi uchun ham joy qoladi.
            Katta ekranda: avvalgidek ikki ustun. */}
        <div className="relative grid max-h-[min(760px,calc(var(--kirish-h,100dvh)-4.5rem))] grid-rows-[auto_minmax(0,1fr)] overflow-hidden md:h-[min(760px,calc(var(--kirish-h,100dvh)-3rem))] md:max-h-none md:grid-cols-2 md:grid-rows-none">
          {/* CHAP: forma */}
          <motion.div
            className="order-2 flex min-h-0 flex-col px-5 py-4 md:order-1 md:px-11 md:py-[clamp(1rem,2.2dvh,1.75rem)]"
            animate={{ x: mobil ? 0 : royxat ? "100%" : 0, opacity: 1 }}
            transition={{ duration: 0.85, ease: EASE }}
          >
            {/* --- tashkilot sarlavhasi --- */}
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3 md:pb-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#1b6fe0] to-[#38bdf8] text-[14px] font-black text-white">
                TB
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold leading-tight text-slate-900">
                  Oʻzbekiston temir yoʻllari AJ
                </p>
                <p className="truncate text-[11px] leading-tight text-slate-500">
                  Buxoro lokomotiv deposi · TCH-6
                </p>
              </div>
            </div>

            {/* --- qadamlar --- */}
            <Qadamlar joriy={stage} royxat={royxat} holat={holat} />

            {/* Bosqichlar oddiy shartli render bilan almashadi.
                AnimatePresence + mode="wait" bu yerda keraksiz murakkablik
                edi: kirish oynasi hech qanday holatda boʻsh qolmasligi
                kerak, animatsiya esa shunchaki bezak.

                min-h-0 — flex bolasining standart `min-height:auto` qiymati
                kichrayishga yoʻl qoʻymaydi va mazmun tashqariga chiqib
                ketadi. Shusiz kamera kartani cho'zib yuborardi. */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-1">
              {/* ---------- 1: TABEL ---------- */}
              {stage === "form" && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Harflar orasi telefonda kichraytirildi — 0.35em bilan
                      bu satr ikkiga boʻlinib, ortiqcha joy egallardi */}
                  <p className="text-[10px] uppercase tracking-[0.18em] text-sky-700 md:text-[11px] md:tracking-[0.35em]">
                    TCH-6 · Buxoro lokomotiv deposi
                  </p>
                  <h1 className="mt-2 text-[25px] font-bold tracking-tight text-slate-900 md:mt-3 md:text-3xl">
                    {royxat ? "Roʻyxatdan oʻtish" : "Tizimga kirish"}
                  </h1>
                  <p className="mt-1.5 text-[13px] text-slate-500 md:mt-2 md:text-sm">
                    {royxat
                      ? "Tabel raqamingiz kadrlar bazasi bilan solishtiriladi"
                      : "Tabel raqamingizni kiriting"}
                  </p>

                  <div className="mt-5 md:mt-8">
                    <Field
                      label="Tabel raqami"
                      value={tabel}
                      // Raqam tahrirlanganda eski xato yoʻqoladi — ekranda
                      // «topilmadi» yozuvi qolib, chalkashtirmasin
                      onChange={(v) => {
                        setTabel(v);
                        if (err) setErr("");
                      }}
                      placeholder="masalan: 10427"
                      inputMode="numeric"
                      autoFocus
                      onEnter={onEnter}
                    />
                  </div>

                  {/* Xato AYNAN maydon ostida — tugmadan pastda boʻlsa,
                      past ekranda kartaning koʻrinmas qismiga tushib
                      qolardi va foydalanuvchi «hech narsa boʻlmadi» deb
                      oʻylardi. */}
                  {err && (
                    <div ref={xatoRef}>
                      <Xabar turi="err">{err}</Xabar>
                    </div>
                  )}

                  {/* «Davom etish» karta pastida yopishib turadi.

                      Telefonda tabel maydoniga bosilganda ekran klaviaturasi
                      koʻrinadigan joyning yarmini egallaydi va tugma uning
                      ostida qolib ketardi — sahifa scroll'i yopiq boʻlgani
                      uchun unga yetib ham boʻlmasdi. Endi tugma doim koʻzda:
                      mazmun kerak boʻlsa uning ORQASIDAN suriladi. */}
                  <div className="sticky bottom-0 z-10 -mx-1 mt-5 bg-white/95 px-1 pb-1 pt-2 backdrop-blur-sm md:static md:mx-0 md:mt-6 md:bg-transparent md:p-0 md:backdrop-blur-none">
                    <button
                      type="button"
                      disabled={!canSubmit}
                      onClick={submit}
                      /* Matn oq rangda: koʻk gradient ustida toʻq matn
                         oʻqilmasdi va tugma «oʻchiq» boʻlib koʻrinardi */
                      className="relative flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#1b6fe0] to-[#38bdf8] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(56,189,248,.9)] transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {tekshirmoqda ? "Tekshirilmoqda…" : "Davom etish"}
                    </button>
                  </div>

                  {/* Rejimni almashtirish. Savol va tugma bitta qatorda turadi —
                      ilgari ular ustma-ust edi va past ekranda ikki qator
                      boʻshliqni behuda egallardi. Tor ekranda qatorlarga
                      boʻlinadi (`flex-wrap`), tugma esa hech qachon siqilib
                      ketmaydi (`shrink-0`). */}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 md:mt-7">
                    <p className="text-[13.5px] font-medium text-slate-600">
                      {royxat ? "Hisobingiz bormi?" : "Hisobingiz yoʻqmi?"}
                    </p>
                    <button
                      type="button"
                      onClick={() => boshdan(royxat ? "login" : "register")}
                      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#0f7a4f] to-[#22c55e] px-4 text-[14px] font-bold text-white shadow-[0_8px_22px_-10px_rgba(34,197,94,.9)] transition hover:brightness-110 active:scale-[.98]"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
                        {royxat ? (
                          /* kirish — eshikka kiruvchi strelka */
                          <path
                            d="M10 17l5-5-5-5M15 12H3m6-9h9a2 2 0 012 2v14a2 2 0 01-2 2H9"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ) : (
                          /* roʻyxat — yangi xodim qoʻshish */
                          <path
                            d="M15 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M8.5 8.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19 8v6M22 11h-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                      </svg>
                      {royxat ? "Tizimga kirish" : "Roʻyxatdan oʻtish"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ---------- 2: YUZ ---------- */}
              {stage === "face" && (
                <motion.div
                  key="face"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  /* Kamera qolgan balandlikni egallashi uchun bu bosqich
                     toʻliq flex ustun boʻlishi kerak */
                  className="flex min-h-0 flex-1 flex-col"
                >
                  {info && <Xabar turi="info">{info}</Xabar>}
                  <FaceCapture
                    title={royxat ? "Face ID qayd etish" : "Face ID bilan kirish"}
                    hint={
                      royxat
                        ? "Yuzingiz keyingi kirishlarda shu surat bilan solishtiriladi"
                        : "Kameraga toʻgʻri qarang — bir necha kadr olinadi"
                    }
                    ishlayotgan={faceBand}
                    xato={faceErr}
                    onCapture={yuzOlindi}
                    onSkip={() => {
                      // Kadr olinayotgan yoki server javobi kutilayotgan
                      // boʻlsa ham chiqib ketish mumkin — natija eʼtiborsiz
                      // qoladi va xodim PIN terishni davom ettiradi.
                      faceBekor.current = true;
                      setFaceBand(false);
                      setFaceErr("");
                      if (royxat) setKadrlar([]);
                      setStage("pin");
                    }}
                    skipLabel={
                      royxat ? "Face ID'ni keyinroq qoʻshaman" : "PIN kod bilan kirish"
                    }
                  />
                </motion.div>
              )}

              {/* ---------- 4: kirgandan keyin Face ID taklifi ---------- */}
              {stage === "face-setup" && (
                <motion.div
                  key="face-setup"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <FaceCapture
                    title="Face ID qoʻshasizmi?"
                    hint="Bir marta qayd etsangiz, keyingi kirishlarda PIN terish shart emas"
                    ishlayotgan={faceBand}
                    xato={faceErr}
                    onCapture={yuzQaydEt}
                    /* Oʻtkazib yuborilsa ham xodim tizimga kiradi — PIN
                       allaqachon tekshirilgan. Taklif keyingi kirishda
                       qaytadan koʻrsatiladi (faceBor hamon false). */
                    onSkip={() => {
                      faceBekor.current = true;
                      setFaceBand(false);
                      onAuthed();
                    }}
                    skipLabel="Hozir emas — tizimga kirish"
                  />
                </motion.div>
              )}

              {/* ---------- 3: PIN ---------- */}
              {stage === "pin" && (
                <motion.div
                  key="pin"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  onFocus={() => setBlind(true)}
                >
                  {info && <Xabar turi="info">{info}</Xabar>}

                  <PinPad
                    key={`${tabel}-${mode}-${kadrlar.length}`}
                    label={royxat ? "Yangi PIN oʻrnating" : holat?.pinKerak ? "Yangi PIN oʻrnating" : "PIN kodni kiriting"}
                    hint={
                      royxat
                        ? kadrlar.length
                          ? "Face ID ishlamagan holatda shu PIN bilan kirasiz"
                          : "Har kirishda shu kod soʻraladi"
                        : holat?.pinKerak
                          ? "Administrator PIN'ni almashtirishni soʻragan"
                          : "Har kirishda shu kod soʻraladi"
                    }
                    /* PIN SERVERDA tekshiriladi — brauzerda hash yoʻq */
                    verify={royxat ? royxatTasdiq : kirishTasdiq}
                    onError={() =>
                      setPinErr((p) => p || (royxat ? "Roʻyxatdan oʻtilmadi" : "PIN notoʻgʻri — qayta urining"))
                    }
                    onDone={pinTugadi}
                  />

                  {pinErr && <Xabar turi="err">{pinErr}</Xabar>}

                  {/* Yuz bosqichiga qaytish — kadr sifati yomon boʻlsa */}
                  {royxat && holat?.faceYoqilgan && (
                    <button
                      type="button"
                      onClick={() => {
                        faceBekor.current = false;
                        setPinErr("");
                        setStage("face");
                      }}
                      className="mt-5 block w-full text-center text-[12.5px] font-medium text-sky-700 underline-offset-4 hover:underline"
                    >
                      {kadrlar.length ? "Yuzni qayta olish" : "Face ID qoʻshish"}
                    </button>
                  )}

                  <Orqaga onClick={() => boshdan(mode)} />
                </motion.div>
              )}
            </div>

            {/* --- xavfsizlik eslatmasi --- */}
            {/* PIN terilayotganda telefonda yashiriladi: ekran klaviaturasi
                joyning yarmini egallaydi va bu izoh matni kataklarni pastga
                surib yuborardi. Katta ekranda oʻz oʻrnida qoladi. */}
            <div
              className={`mt-4 shrink-0 border-t border-slate-200 pt-3 md:mt-6 md:pt-3.5 [@media(max-height:700px)]:hidden ${
                stage === "pin" ? "hidden md:block" : ""
              }`}
            >
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" aria-hidden>
                  <path
                    d="M12 2l7 3v6c0 4.5-3 8.6-7 11-4-2.4-7-6.5-7-11V5l7-3z"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path d="M9 12l2 2 4-4" fill="none" stroke="#22c55e" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Himoyalangan ulanish · barcha kirish urinishlari qayd etiladi
              </p>
              <p className="mt-1 text-center text-[11px] text-slate-400">
                Kirishda muammo boʻlsa — depo kadrlar boʻlimiga murojaat qiling
              </p>
            </div>
          </motion.div>

          {/* OʻNG: mascot.
              Telefonda lokomotiv koʻrsatilmaydi — u ekranning yarmini
              egallardi, rasm foni esa oq (shaffof emas) boʻlgani uchun
              koʻk kartada oq toʻrtburchak boʻlib chiqardi. Uning oʻrniga
              ixcham koʻk sarlavha: matn oʻsha-oʻsha, ammo oʻqiladi
              (ilgari oq matn oq karta ustida koʻrinmasdi) va joy 5 barobar
              kam ketadi. Katta ekranda hammasi avvalgidek. */}
          <motion.div
            className="order-1 flex items-center gap-4 bg-[linear-gradient(135deg,#1c5c9e_0%,#2f8ff0_58%,#4a9fd8_100%)] px-5 py-3.5 md:order-2 md:flex-col md:justify-center md:gap-0 md:bg-none md:px-7 md:py-10"
            animate={{ x: mobil ? 0 : royxat ? "-100%" : 0 }}
            transition={{ duration: 0.85, ease: EASE }}
          >
            <div className="hidden md:block">
              <Locomotive blind={blind || stage === "pin"} size={220} />
            </div>

            {/* Telefondagi ixcham belgi — lokomotiv oʻrnida */}
            <span
              aria-hidden
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/20 text-[14px] font-black text-white ring-1 ring-white/40 md:hidden"
            >
              TB
            </span>

            <div className="min-w-0 md:mt-6 md:flex md:flex-col md:items-center">
              <p className="text-[14.5px] font-semibold leading-snug text-white md:max-w-[280px] md:text-center md:text-lg">
                {stage === "pin"
                  ? "Faralar oʻchdi — kodingizni koʻrmayapman"
                  : stage === "face"
                    ? "Kameraga tabassum qiling"
                    : royxat
                      ? "Yangi ishchimisiz?"
                      : "Xush kelibsiz!"}
              </p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-white/85 md:mt-2 md:max-w-[300px] md:text-center md:text-[13px]">
                {stage === "pin"
                  ? "PIN shifrlangan holda saqlanadi — hech kim koʻra olmaydi"
                  : stage === "face"
                    ? "Surat emas, faqat raqamli belgi saqlanadi"
                    : "Texnika xavfsizligi va omborxona — bitta tizimda"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </TouchRipple>
  );
}

/* ================= yordamchi koʻrinishlar ================= */

/** Qadamlar chizigʻi — foydalanuvchi qayerdaligini va nima qolganini koʻradi */
function Qadamlar({
  joriy,
  royxat,
  holat,
}: {
  joriy: Stage;
  royxat: boolean;
  holat: TabelHolat | null;
}) {
  // Roʻyxatdan oʻtishda tartib: tabel → PIN → (ixtiyoriy) Face ID.
  //
  // Kirishda: tabel → Face ID → PIN. Yuz tanish xizmati serverda
  // sozlanmagan boʻlsa Face ID qadami umuman chizilmaydi — boʻlmaydigan
  // bosqichni koʻrsatish chalgʻitadi.
  let qadam: { k: Stage; l: string }[];
  if (royxat) {
    qadam = [
      { k: "form", l: "Tabel raqami" },
      { k: "pin", l: "PIN parol yaratish" },
      { k: "face", l: "Face ID (ixtiyoriy)" },
    ];
  } else if (holat?.faceYoqilgan) {
    // Yuz tanish yoqilgan — tartib doim bir xil:
    // tabel → Face ID → PIN (zaxira yoʻl).
    //
    // Yuzi hali qayd etilmagan xodim ham shu chiziqni koʻradi: u Face ID
    // bosqichidan oʻtolmaydi va 3-bosqichga — PIN'ga tushadi.
    qadam = [
      { k: "form", l: "Tabel raqami" },
      { k: "face", l: "Face ID" },
      { k: "pin", l: "PIN bilan kirish" },
    ];
  } else {
    // Yuz tanish oʻchiq — faqat PIN
    qadam = [
      { k: "form", l: "Tabel raqami" },
      { k: "pin", l: "Kirish" },
    ];
  }
  // `face-setup` — kirgandan KEYINGI ixtiyoriy qadam, roʻyxatda yoʻq.
  // Unda barcha bosqichlar bajarilgan deb koʻrsatiladi, aks holda
  // chiziq boʻshab qolardi (findIndex -1 qaytaradi).
  const n = joriy === "face-setup" ? qadam.length : qadam.findIndex((q) => q.k === joriy);

  return (
    <ol className="flex items-center gap-1.5 py-[clamp(0.5rem,1.4dvh,0.75rem)] md:py-[clamp(0.5rem,1.6dvh,1rem)]" aria-label="Kirish bosqichlari">
      {qadam.map((q, i) => {
        const otgan = i < n;
        const faol = i === n;
        return (
          <li key={q.k} className="flex flex-1 items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <div
                className={`h-1 rounded-full transition-colors ${
                  otgan ? "bg-sky-500" : faol ? "bg-sky-400" : "bg-slate-200"
                }`}
              />
              <p
                className={`mt-1.5 truncate text-[10.5px] transition-colors ${
                  faol ? "font-semibold text-sky-700" : otgan ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {i + 1}. {q.l}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Xabar({ turi, children }: { turi: "err" | "info"; children: React.ReactNode }) {
  const xato = turi === "err";
  const uslub = xato
    ? "border-red-300 bg-red-50 text-red-700"
    : "border-sky-300 bg-sky-50 text-sky-800";
  return (
    <div
      role={xato ? "alert" : undefined}
      className={`mt-4 flex items-start gap-2 rounded-xl border-2 px-3.5 py-3 text-[13px] leading-relaxed ${uslub}`}
    >
      {xato && (
        <svg viewBox="0 0 24 24" className="mt-[1px] h-4 w-4 shrink-0" aria-hidden>
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v6M12 16.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      <span className="min-w-0">{children}</span>
    </div>
  );
}

function Orqaga({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 block w-full text-center text-[12px] text-slate-500 transition hover:text-sky-700"
    >
      ← Boshqa tabel raqami
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  onFocusChange,
  onEnter,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  onFocusChange?: (v: boolean) => void;
  onEnter?: () => void;
  autoFocus?: boolean;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <div
        className={`relative rounded-xl border bg-white transition-all duration-300 ${
          focus ? "border-sky-500 shadow-[0_0_0_4px_rgba(56,189,248,.12)]" : "border-slate-200"
        }`}
      >
        <input
          value={value}
          inputMode={inputMode}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter?.();
            }
          }}
          onFocus={() => {
            setFocus(true);
            onFocusChange?.(true);
          }}
          onBlur={() => {
            setFocus(false);
            onFocusChange?.(false);
          }}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full bg-transparent px-4 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
        />
        <span
          className={`absolute inset-x-3 bottom-0 h-px origin-left bg-gradient-to-r from-sky-400 to-transparent transition-transform duration-500 ${
            focus ? "scale-x-100" : "scale-x-0"
          }`}
        />
      </div>
    </label>
  );
}
