# MASTER PROMPT — TB Main loyihasi

> Har qanday yangi AI suhbatining eng boshiga (yoki `CLAUDE.md` / `AGENTS.md` faylining ichiga) shu matnni to'liq joylang. Bu AI'ga loyihani, uslubimni va qat'iy qoidalarni bir zumda tushuntiradi.

---

## 0. TIL VA MULOQOT

- Men bilan **faqat o'zbek tilida, lotin yozuvida** muloqot qil.
- **Kirill harflari** (а, е, о, р, с...) hech qachon matnga aralashmasin. Faqat kod, terminal buyruqlari, texnik nomlar, npm/pip paket nomlari ingliz tilida bo'lishi mumkin.
- Apostrof — **to'g'ri belgi** (`o'`, `g'`), ASCII `'` emas.
- Javoblar aniq, bosqichma-bosqich, ortiqcha izohsiz. "Assalomu alaykum" degan kirish jumlasi shart emas.

---

## 1. LOYIHA HAQIDA — TB MAIN

**Nomi:** TB Main (Temiryo'l Bo'limi ichki tizimi)
**Papka:** `C:\Users\ANUBIS PC\Desktop\tb mains\tb mains\Tb Main`
**Git:** loyiha ichida `.git` bor — har o'zgartirishdan keyin commit qilinadi.
**Holati:** Ishlab turgan web sayt (production'da). Endi qo'shimchalar, o'zgartirishlar va olib tashlashlar qilinadi.

### Tech stack

| Qatlam | Texnologiya |
|---|---|
| Frontend | **Next.js 16** (App Router, `app/` katalog) + **React 19** + **TypeScript 5.7** |
| Styling | **Tailwind CSS v4** (`@tailwindcss/postcss`) |
| Frontend qo'shimcha | `framer-motion`, `three.js`, `@supabase/supabase-js`, `pdf-lib`, `@pdf-lib/fontkit`, `docx`, `qrcode`, `pg` |
| Backend | **Django 6.0** + **DRF 3.16** + **django-cors-headers** |
| DB | **PostgreSQL** (prod, `psycopg[binary]`), **SQLite** (dev — `Bacend/dev.sqlite3`) |
| Auth | **JWT (HS256)** — `PyJWT`, access/refresh tokenlar, `core/tokens.py`, `core/authentication.py` |
| Image | Pillow — `import_xodimlar` buyrug'i xodim rasmlarini kichraytiradi |
| Prod server | **gunicorn 23** + **whitenoise 6.11** (statik fayllar uchun) |
| Face servisi | Alohida Python microservice — `face-service/` (Flask/FastAPI + Dockerfile) |
| Reverse proxy | **Caddy** (`Caddyfile` — root va `Bacend/Caddyfile`) |
| Konteyner | **Docker + docker-compose** (`docker-compose.yml`) |
| Deploy — backend | **Render** (`render.yaml`, `DEPLOY-RENDER-VERCEL.md`) yoki **DigitalOcean** (`Bacend/DEPLOY-DIGITALOCEAN.md`) |
| Deploy — frontend | **Vercel** (`.vercelignore`, `next.config.mjs`) |
| Runtime muhiti | **Windows + PowerShell**. `ishga-tushirish.ps1`, `toxtatish.ps1`, `face-ishga-tushirish.ps1` |

### Loyiha tuzilmasi (yuqori daraja)

```
Tb Main/
├─ app/                    # Next.js App Router (page.tsx, layout.tsx, api/, verify/, lab/, (sys)/)
├─ components/             # React komponentlar
├─ lib/                    # Frontend yordamchi kutubxonalar (Supabase client, fetchers, utils)
├─ public/                 # Statik fayllar
├─ assets/                 # Grafik, font, media
├─ Bacend/                 # Django backend
│  ├─ api/                 # DRF: urls.py, serializers.py, views_auth.py, views_ops.py,
│  │                       #      views_state.py, views_yoriqnoma.py, errors.py, tests.py,
│  │                       #      test_journal.py, test_xodimlar.py, test_admin_yarat.py
│  ├─ core/                # Domain: models.py, admin.py, authentication.py, tokens.py,
│  │                       #        permissions.py, logic.py, face.py, imzo.py, pin.py,
│  │                       #        qurilma.py, migrations/, management/, data/
│  ├─ config/              # Django settings, urls
│  ├─ face-service/        # (backend ichidagi nusxa)
│  ├─ dev.sqlite3          # Dev DB
│  ├─ requirements.txt     # Django==6.0.6, DRF, psycopg[binary], PyJWT, Pillow, gunicorn, whitenoise
│  ├─ manage.py
│  ├─ gunicorn.conf.py
│  ├─ docker-compose.yml
│  ├─ Dockerfile
│  ├─ Caddyfile
│  ├─ railway.json
│  └─ *.sh (build, backup, deploy, avto-yangila)
├─ face-service/           # Face recognition microservice (Python, Docker)
├─ arxiv/                  # Arxivlangan hujjatlar/versiyalar
├─ docker-compose.yml      # Root Compose (frontend + backend + face + caddy)
├─ Dockerfile              # Frontend uchun
├─ Caddyfile               # Root reverse proxy
├─ render.yaml             # Render deploy
├─ next.config.mjs
├─ tsconfig.json
├─ package.json            # tb-web
├─ .env.example / .env.local
├─ ishga-tushirish.ps1     # Hammasini lokalda ishga tushiradi
├─ toxtatish.ps1
├─ face-ishga-tushirish.ps1
└─ DEPLOY.md, DEPLOY-RENDER-VERCEL.md, SETUP.md, README.md
```

---

## 2. QAT'IY ISH USLUBI

1. **Reja avval, kod keyin.** Har qanday o'zgartirishdan oldin:
   - Qaysi fayl(lar)ga tegasan → ro'yxatla.
   - Frontend ↔ Backend kontrakt qanday o'zgaradi → ayt.
   - Qanday testlar buziladi/qo'shiladi → ayt.
   - Menga **tasdiqlash so'ra**, keyin kod yoz.
2. **Bir qadamda bitta o'zgartirish.** Ko'p faylni bir turtki bilan sindirma. Har qadamdan keyin **AI o'zi tekshiradi** (grep, test, build) va faqat toza natijani menga beradi.
3. **To'liq fayl ber.** Diff/parcha yo'q — copy-paste uchun butun fayl mazmuni.
4. **PowerShell muhiti:** `&&` bilan buyruqlarni zanjirlama. Har buyruqni alohida yoz yoki `;` ishlat.
5. **Windows path'lar:** `C:\Users\ANUBIS PC\Desktop\tb mains\tb mains\Tb Main`. Bo'sh joyli papka — qo'shtirnoq ichida yoz.
6. **Yumshoq o'chirish (soft-delete):** DB yozuvlarni fizik `DELETE` qilma — `is_active=False` yoki `deleted_at` bilan yashir. Tarixiy butunlik muhim.
7. **Chiqindi/qo'shma yo'q:** faqat so'ralgan narsani, manba hujjatga/screenshot'ga aniq mos qilib ber. O'ylab topilgan "yaxshilash" — YO'Q.
8. **Faraz qilma — so'ra.** Noaniq joy bo'lsa, kodga o'tishdan avval savol ber.

---

## 3. FRONTEND ↔ BACKEND MOSLIGI (100%)

Bu loyihaning **eng muhim invariant'i**. Har o'zgartirish shu qoidalarga bo'ysunadi.

> **DIQQAT — TEKSHIRUV MAS'ULIYATI ENTITETI:** Frontend ↔ backend mosligini **AI o'zi to'liq tekshiradi**. Foydalanuvchi (men) hech qachon qo'lda `grep` qilish, endpoint solishtirish, TS tipi va serializer maydonlarini bittalab tekshirish, testlarni ishga tushirish yoki deploy oldi audit qilish bilan shug'ullanmaydi. AI har o'zgartirishdan keyin §3.2 va §4 (Test) bo'yicha to'liq audit o'tkazadi, natijani jadval ko'rinishida ko'rsatadi, kamchilik topilsa **o'zi tuzatadi** va yana tekshiradi — **to'liq yashil ("hammasi mos") holatga kelmaguncha to'xtamaydi**. Menga faqat yakuniy tayyor natija va tasdiq beriladi. "Bu joyni siz tekshirib ko'ring", "manuel tekshiring", "diqqat qiling" — bunday jumlalar AI javobida BO'LMAYDI.

### 3.1 Yagona haqiqat manbai (Single Source of Truth)

- **Backend API kontrakti** — `Bacend/api/urls.py` + `Bacend/api/serializers.py` + `views_*.py` yagona haqiqat.
- Frontend uni faqat `lib/api/` (yoki `lib/`) ichidagi **type-safe fetcher**'lar orqali chaqiradi. Har `fetch('/api/...')` chaqirig'i emas.
- Har yangi endpoint uchun frontendda mos **TypeScript tipi** va **wrapper funksiya** yaratiladi. Ikkalasi bir commit'da.

### 3.2 Kontraktni har o'zgartirishda tekshirish

Har o'zgartirishdan keyin (backend YOKI frontend), AI quyidagini ta'minlaydi:

- Backend endpoint qo'shildi/o'zgardi → mos frontend fetcher va TS tipi yangilandi.
- Frontend yangi maydonni ishlatadi → backend serializer'da o'sha maydon bor.
- URL, method (GET/POST/PATCH/DELETE), status kod, request/response shakli — hammasi mos.
- CORS: `django-cors-headers` sozlamalari frontend origin'ini qamrab oladi (dev: `http://localhost:3000`; prod: Vercel domen).
- JWT: frontend `Authorization: Bearer <access>` yuboradi; 401 bo'lsa refresh oqimi ishlaydi.

### 3.3 Nomlash konvensiyasi

- Backend URL'lari: **kebab-case**, `/api/...` prefiksi bilan (masalan `/api/xodimlar/`, `/api/yoriqnoma/`).
- JSON kalitlari: **snake_case** (Django default). Frontendda TS interfeys shu holda.
- O'zbekcha domen atamalar (xodim, yoriqnoma, imzo, qurilma, jurnal, pin) **o'zgartirilmaydi** — kod ham, DB ham shu atamalarda.

---

## 4. TEST QOIDALARI

- Backend testlar: `Bacend/api/tests.py`, `test_journal.py`, `test_xodimlar.py`, `test_admin_yarat.py`. Ular **doim yashil** qolishi kerak.
- Har yangi endpoint yoki logika o'zgarishi → mos DRF test (`APITestCase`) yozildi.
- Har o'chirilgan endpoint → mos testlar ham olib tashlandi, mavjudlar sinamaydigan yo'l ochilmadi.
- Frontendda hech bo'lmasa **build test**: `npm run build` xatolarsiz o'tadi. TypeScript qat'iy — `any` ishlatma.
- Deploy'gacha AI albatta quyidagini **o'zi ishga tushiradi** (menga faqat yakuniy natija — pass/fail — beriladi):
  1. `cd Bacend; python manage.py migrate --check` — migratsiyalar sync
  2. `cd Bacend; python manage.py test` — backend testlar
  3. `npm run lint` va `npm run build` — frontend
  4. `docker compose -f docker-compose.yml config` — kompoz fayl to'g'ri
- Deploy vaqtida yagona buyruq bilan chiqishi kerak (masalan `./deploy.sh` yoki `ishga-tushirish.ps1`). Uni sindirma.

---

## 5. XAVFSIZLIK VA MA'LUMOTLAR

- `.env.local`, `.env.example` — **hech qachon** ichiga real secret yozib commit qilma. `.env.example` faqat kalit nomlari va bo'sh qiymat.
- `.gitignore` va `.dockerignore` allaqachon bor — ular buzilmasin.
- JWT `SECRET_KEY` va `JWT_SECRET` faqat env orqali.
- Face-service uchun rasm/embedding'lar — hech qachon frontendga xom chiqmasin.
- DB `dev.sqlite3` faqat lokal, prod'da PostgreSQL.

---

## 6. SCREENSHOT ORQALI ISH JARAYONI

Men AI'ga:
1. **Screenshot** yuboraman (sahifa yoki modal).
2. Ustiga strelka/matn bilan **aynan qayer o'zgarishi/o'chirilishi** kerakligini ko'rsataman.
3. Yoki matnda "Bu tugmani olib tashla", "Bu formaga X maydon qo'sh" deb yozaman.

AI **majburiy** bajaradi:
1. Screenshot'dagi element qaysi fayl (`app/**/*.tsx` yoki `components/**/*.tsx`) ekanini aniqlaydi. Kerak bo'lsa `grep` qiladi.
2. Backend'ga ta'sirini baholaydi (yangi endpoint kerakmi? mavjud serializer o'zgaradimi?).
3. **Reja beradi** (§2.1 bo'yicha), tasdiqlashimni kutadi.
4. Faqat tasdiqdan keyin — to'liq fayl(lar)ni beradi + testlarni yangilaydi.
5. Ishga tushirish/tekshirish buyruqlarini **PowerShell** ko'rinishida beradi.

---

## 7. AI'DAN KUTAMAN

- O'zbek (lotin) tilida javob.
- Kod — ingliz nomlarda, lekin o'zbekcha domen atamalar saqlanadi (`xodim`, `yoriqnoma`, `imzo`, `qurilma`, `jurnal`, `pin`, `smena`).
- To'liq fayl, PowerShell'ga mos buyruqlar (`&&` yo'q).
- Reja → tasdiq → kod → test → deploy tekshiruvi.
- Har o'zgartirishda frontend/backend mosligini, testlarni va deploy tayyorligini **AI o'zi to'liq tekshiradi**. Foydalanuvchi jalb qilinmaydi.
- Noaniq bo'lsa, so'raydi. Farazsiz.
