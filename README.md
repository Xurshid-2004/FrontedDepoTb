# TB tizimi — frontend prototipi

Buxoro lokomotiv deposi (TCH-6) uchun **Texnika xavfsizligi** va **Omborxona** tizimining
dizayn/effektlar prototipi.

Bu **prototip** — backend, baza va haqiqiy autentifikatsiya hali ulanmagan.
Maqsad: effektlarni jonli koʻrib, tasdiqlab, keyin Flutter va Supabase'ga koʻchirish.

---

## Ishga tushirish

PowerShell'da (har bir buyruq alohida):

```powershell
cd "C:\Users\ANUBIS PC\Desktop\tb_web"
npm install
npm run dev
```

Brauzerda: http://localhost:3000

---

## Sahifalar

| Sahifa | Nima bor |
|---|---|
| `/` | Haqiqiy oqim: login → PIN → Afrosiyob oʻtishi → dashboard → jurnallar |
| `/lab` | Effektlar galereyasi — har bir effekt alohida sinaladi |

---

## Effektlar

| № | Effekt | Fayl | Qayerda ishlatiladi |
|---|---|---|---|
| 01 | Tubes Cursor — neon lentalar | `components/CursorTubes.tsx` | Butun web (desktop) |
| 02 | Afrosiyob kirish oʻtishi — **haqiqiy 3D (Three.js)** | `components/TrainScene.tsx` | Login tasdiqlangandan keyin |
| 03 | PIN / OTP animatsiyasi | `components/PinPad.tsx` | Kirish, muhim amallarni tasdiqlash |
| 04 | Lokomotiv mascot | `components/Locomotive.tsx` | Login va PIN ekrani |
| 05 | Kitob ochilishi (parchalanish + 3D) | `components/BookCard.tsx` | Yo D-26 jurnal kartalari |
| 06 | Morflanuvchi yuklab olish tugmasi | `components/DownloadButton.tsx` | Hisobotlar |
| 07 | 3D coverflow qidiruv | `components/WorkerCoverflow.tsx` | Mashinist yoʻriqchisi kabineti |
| 08 | Tilt + Touch Ripple | `components/Fx.tsx` | Barcha kartalar |
| 09 | Tezlik chiziqlari — 3D perspektiva (canvas) | `components/Fx.tsx` | Faol kartalar, oʻtishlar |

---

## Texnologiyalar

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **Tailwind CSS 4**
- **Framer Motion 13**
- **Three.js 0.185** — faqat Afrosiyob kirish sahnasi uchun (WebGL)
- Canvas 2D (kursor lentalari, tezlik chiziqlari), CSS 3D transformlar (kitob, coverflow)

WebGL faqat bitta joyda — kirish oʻtishida. Qolgan hamma effekt Canvas 2D va CSS 3D.
WebGL mavjud boʻlmasa sahna oʻzini oʻzi oʻchiradi va toʻgʻridan-toʻgʻri dashboard ochiladi.

### Foydali sozlama

Kirish oʻtishini sekinlashtirib koʻrish uchun URL'ga `?slow=3` qoʻshing:
`http://localhost:3000/lab?slow=3` — oʻtish 3 barobar sekin ishlaydi.

---

## Ranglar

| Nom | Qiymat | Ishlatilishi |
|---|---|---|
| ink | `#05090f` | Asosiy fon |
| panel | `#0c1524` | Kartalar foni |
| rail | `#38bdf8` | Asosiy urgʻu (TB moduli) |
| rail2 | `#1b6fe0` | Gradient juftligi |
| gold | `#f2b544` | Omborxona moduli |
| ok / warn / danger | `#22c55e` / `#f59e0b` / `#ef4444` | Holat ranglari |

KIP va muddat ranglari (TZ boʻyicha): 3 kun — yashil, 2 kun — sariq,
bugun — apelsin `#f97316`, oʻtib ketgan — toʻq qizil `#b91c1c`.

---

## Keyingi qadamlar

1. Effektlarni koʻrib chiqish va tasdiqlash
2. Tasdiqlangan effektlar asosida dizayn-tizimni yakunlash
3. TZ hujjatining 18-boʻlimini toʻldirish (v1.1)
4. Flutter va Supabase bilan haqiqiy tizimni qurish
