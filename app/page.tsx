"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginCard from "@/components/LoginCard";

export default function Home() {
  const router = useRouter();

  /* Ishchi paneli oldindan yuklab qoʻyiladi: xodim tabel raqamini terib
     turganda brauzer `/dash` fayllarini fonda olib boʻladi va kirish
     tugagach oʻtish bir zumda kechadi. */
  useEffect(() => {
    router.prefetch("/dash");
    router.prefetch("/ishchi");   // oddiy ishchi `/dash` dan shu yerga oʻtkaziladi
  }, [router]);

  // Kirish sahifasi bir ekranga sigʻadi — sahifa scroll'i butunlay yopiladi.
  // Boshqa sahifalarga oʻtganda avvalgi holat qaytariladi.
  useEffect(() => {
    const html = document.documentElement;
    const oldingiHtml = html.style.overflow;
    const oldingiBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = oldingiHtml;
      document.body.style.overflow = oldingiBody;
    };
  }, []);

  /* Telefonda ekran klaviaturasi ochilganda kirish kartasi uning ostida
     qolib ketardi: PIN kataklari ham, «Kodni tozalash» ham koʻrinmasdi va
     sahifa scroll'i yopiq boʻlgani uchun ularga yetib ham boʻlmasdi.

     Sabab — `100dvh` klaviaturani hisobga olmaydi: u brauzer paneliga qarab
     oʻlchanadi, klaviatura ochilganda esa oʻzgarmaydi. Haqiqiy koʻrinadigan
     balandlikni faqat `visualViewport` biladi. Uni CSS oʻzgaruvchisiga
     yozamiz va karta shunga qarab kichrayadi — natijada hamma narsa
     klaviatura ustida qoladi.

     Qoʻllab-quvvatlamaydigan brauzerda oʻzgaruvchi qoʻyilmaydi va CSS
     avvalgidek `100dvh` zaxira qiymatidan foydalanadi. */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const html = document.documentElement;
    const olcha = () => html.style.setProperty("--kirish-h", `${Math.round(vv.height)}px`);

    olcha();
    vv.addEventListener("resize", olcha);
    vv.addEventListener("scroll", olcha);
    return () => {
      vv.removeEventListener("resize", olcha);
      vv.removeEventListener("scroll", olcha);
      html.style.removeProperty("--kirish-h");
    };
  }, []);

  return (
    <main className="relative h-[var(--kirish-h,100dvh)] overflow-hidden">
      {/* Kirish fon videosi */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <video
          src="/kirish.mp4"
          poster="/hero.jpg"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full scale-105 object-cover"
          style={{ filter: "saturate(1.1) brightness(1.04)" }}
        />
        {/* Yengil parda — video koʻrinib tursin, matn ham oʻqilsin */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,26,45,.32)_0%,rgba(16,32,54,.28)_45%,rgba(28,40,58,.38)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_520px_at_50%_18%,rgba(255,255,255,.14),transparent_70%)]" />
        <div
          className="grid-floor absolute inset-x-[-40%] bottom-[-25%] h-[55%] origin-bottom opacity-[0.3]"
          style={{ transform: "rotateX(74deg)" }}
        />
      </div>

      {/* Kirish kartasi holat yuklanishini KUTMAYDI. Ilgari u `ready`
          bayrogʻiga bogʻlangan edi — server sekin javob bersa yoki qayta
          ishga tushayotgan boʻlsa, bayroq koʻtarilmay ekranda faqat fon
          videosi qolardi. Kartaga db kerak emas: login() serverga
          toʻgʻridan-toʻgʻri murojaat qiladi va holatni oʻzi yuklaydi. */}
      {/* Chetlardagi boʻshliq telefonda kichraytirildi va qurilma «xavfsiz
          zonasi» hisobga olindi — karta vırez yoki pastki chiziq ostida
          qolmaydi. */}
      <section className="relative grid h-[var(--kirish-h,100dvh)] place-items-center overflow-hidden px-3 py-[max(0.75rem,var(--safe-t))] pb-[max(0.75rem,var(--safe-b))] sm:px-4 sm:py-4">
        <div className="flex max-h-full w-full max-w-[1000px] flex-col justify-center">
              {/* Kirish tugashi bilan darrov ishchi paneliga oʻtiladi.

                  Ilgari orada 11 soniyalik kinematik video oʻynardi. U
                  chiroyli edi, lekin har kirishda 3 MB'lik fayl yuklanardi
                  va xodim ishini boshlashdan oldin kutib turardi. Bundan
                  tashqari video sahnasi (Three.js, ~560 KB) kirish
                  sahifasining oʻz toʻplamiga ham qoʻshilib, birinchi
                  yuklanishni sekinlashtirardi. */}
          <LoginCard onAuthed={() => router.replace("/dash")} />

          <p className="mt-3 shrink-0 text-center text-[10px] leading-snug text-white/70 drop-shadow sm:mt-4 sm:text-[11.5px]">
                © {new Date().getFullYear()} Oʻzbekiston temir yoʻllari AJ · Buxoro
                lokomotiv deposi (TCH-6) · Texnika xavfsizligi tizimi
              </p>
        </div>
      </section>
    </main>
  );
}
