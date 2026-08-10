/* ------------------------------------------------------------------
   Boʻlim belgilari.

   Nega tashqi rasm emas, aynan inline SVG:
     • tashqi soʻrov yoʻq — sahifa tezroq ochiladi va internetsiz ham
       ishlaydi (depo serverida bu muhim);
     • `currentColor` — belgi matn rangini oladi, faol/nofaol holat
       oʻz-oʻzidan toʻgʻri chiqadi;
     • istalgan oʻlchamda tiniq — rasmda boʻladigan xiralik yoʻq;
     • litsenziya masalasi yoʻq.

   Barchasi 24×24 katakda, bir xil chiziq qalinligi bilan chizilgan —
   shuning uchun yonma-yon turganda bir butun koʻrinadi.
------------------------------------------------------------------ */

type Props = { size?: number; className?: string };

function Svg({ size = 20, className = "", children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Boshqaruv paneli — toʻrtta karta */
export const IconDash = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
  </Svg>
);

/** TB — texnika xavfsizligi: qalqon va belgi */
export const IconTb = (p: Props) => (
  <Svg {...p}>
    <path d="M12 2.5l7.5 3.2v5.6c0 4.7-3.2 8.9-7.5 11.2-4.3-2.3-7.5-6.5-7.5-11.2V5.7L12 2.5z" />
    <path d="M9 12.2l2.1 2.1 4-4.2" />
  </Svg>
);

/** Arizalar — hujjat va yoʻnalish */
export const IconAriza = (p: Props) => (
  <Svg {...p}>
    <path d="M14 2.5H6.5A1.5 1.5 0 005 4v16a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0019 20V7.5L14 2.5z" />
    <path d="M14 2.5V7a.5.5 0 00.5.5H19" />
    <path d="M8.5 14.5h6M12 11.8l2.7 2.7-2.7 2.7" />
  </Svg>
);

/** Omborxona — taxlangan quti */
export const IconOmbor = (p: Props) => (
  <Svg {...p}>
    <path d="M3 7.5l9-4.5 9 4.5-9 4.5-9-4.5z" />
    <path d="M3 12l9 4.5 9-4.5" />
    <path d="M3 16.5L12 21l9-4.5" />
  </Svg>
);

/** KIP — oʻlchov asbobi (spidometr) */
export const IconKip = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 18a9 9 0 1117 0" />
    <path d="M12 18l4-5.2" />
    <circle cx="12" cy="18" r="1.4" />
    <path d="M5.6 12.2l1.3.6M12 6.5v1.4M18.4 12.2l-1.3.6" />
  </Svg>
);

/** Talonlar — chipta */
export const IconTalon = (p: Props) => (
  <Svg {...p}>
    <path d="M3 8.5V6.5A1.5 1.5 0 014.5 5h15A1.5 1.5 0 0121 6.5v2a2.6 2.6 0 000 7v2a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5v-2a2.6 2.6 0 000-7z" />
    <path d="M14 5v3M14 11v2M14 16v3" strokeDasharray="0.1 3.2" />
  </Svg>
);

/** Hisobotlar — ustunli diagramma */
export const IconHisobot = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 20.5h17" />
    <rect x="5.5" y="12" width="3.6" height="6" rx="1" />
    <rect x="10.8" y="8" width="3.6" height="10" rx="1" />
    <rect x="16.1" y="4.5" width="3.6" height="13.5" rx="1" />
  </Svg>
);

/** Hujjatlar — matnli varaq */
export const IconHujjat = (p: Props) => (
  <Svg {...p}>
    <path d="M14 2.5H6.5A1.5 1.5 0 005 4v16a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0019 20V7.5L14 2.5z" />
    <path d="M14 2.5V7a.5.5 0 00.5.5H19" />
    <path d="M8.5 12.5h7M8.5 16.5h7M8.5 8.5h2" />
  </Svg>
);

/** Arxiv — qopqoqli quti */
export const IconArxiv = (p: Props) => (
  <Svg {...p}>
    <rect x="2.8" y="3.5" width="18.4" height="4.5" rx="1.4" />
    <path d="M4.5 8v11a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5V8" />
    <path d="M9.8 12h4.4" />
  </Svg>
);

/** Mening kabinetim — foydalanuvchi */
export const IconIshchi = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.8" />
    <path d="M4.5 20.5a7.5 7.5 0 0115 0" />
  </Svg>
);

/** Administrator — sozlama gʻildiragi */
export const IconAdmin = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 14.5a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5v.2a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1h.2a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" />
  </Svg>
);

/** Manzil boʻyicha belgini tanlaydi */
export function NavIcon({ href, size, className }: { href: string } & Props) {
  const K = MAP[href] ?? IconDash;
  return <K size={size} className={className} />;
}

const MAP: Record<string, (p: Props) => React.JSX.Element> = {
  "/dash": IconDash,
  "/tb": IconTb,
  "/arizalar": IconAriza,
  "/ombor": IconOmbor,
  "/kip": IconKip,
  "/talon": IconTalon,
  "/hisobot": IconHisobot,
  "/hujjatlar": IconHujjat,
  "/arxiv": IconArxiv,
  "/ishchi": IconIshchi,
  "/admin": IconAdmin,
};
