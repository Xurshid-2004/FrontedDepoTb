# SKILLS — TB Main uchun maxsus AI ko'nikmalari

> Har bir skill — AI aynan qanday holatlarda uni ishga solishini va **qanday qadamlar bilan** bajarishini yozib qo'yilgan qisqa yo'riqnoma. AI har suhbatda kerakli skill'ni tanlab, uning bo'limlariga qat'iy amal qiladi.
>
> Fayllar joyi (agar `.claude/skills/` ishlatilsa): loyiha ildizida `.claude/skills/<skill-nomi>/SKILL.md`. Aks holda — shu hujjatning o'zi AI'ga to'liq beriladi.

---

## GLOBAL QOIDA — TEKSHIRUV MAS'ULIYATI

**Barcha skill'larga taalluqli:** har qanday tekshiruv, audit, `grep`, test ishga tushirish, build, sinxron solishtirish — **AI o'zi to'liq bajaradi**. Foydalanuvchidan hech qachon "bu buyruqni ishga tushiring", "manuel tekshiring", "diqqat bilan qarab chiqing" deb so'ralmaydi. AI o'z terminal va fayl tizimi tools'lari orqali barcha tekshiruvlarni o'zi o'tkazadi, natijani o'zi o'qiydi, kamchilik topsa o'zi tuzatadi va **yashil holatga kelmaguncha to'xtamaydi**. Foydalanuvchiga faqat yakuniy tayyor natija va qisqa audit jadvali beriladi.

---

## SKILL 1 — `screenshot-orqali-uzgartirish`

**Qachon ishlatiladi:** Foydalanuvchi UI screenshot yuboradi va "bu joyni o'zgartir / bu tugmani olib tashla / bu forma qo'sh" deydi.

**Qadamlar (qat'iy tartib):**

1. **Element identifikatsiyasi**
   - Screenshot'ni diqqat bilan tahlil qil: matn, rang, joylashuv, atrofidagi kontekst.
   - `grep -rn "<screenshot matni>" app/ components/` bilan mos faylni topish.
   - Sahifa route'ini `app/**/page.tsx` orqali aniqlash.
2. **Ta'sir doirasini yozib berish** (kod yozmasdan):
   - **Fayl(lar):** `components/X.tsx`, `app/verify/page.tsx`, ...
   - **Backend'ga ta'siri:** yo'q / bor (qaysi endpoint, qanday o'zgarish).
   - **DB migratsiya:** yo'q / bor.
   - **Test:** qaysilari yangilanadi.
3. **Tasdiqlash so'rash:** "Shu rejaga rozimisiz? Davom etamanmi?"
4. Faqat "ha"dan keyin:
   - Butun fayl(lar)ni yoz.
   - Kerak bo'lsa serializer/view/urls.py'ni yangila.
   - Frontend fetcher va TS tipini sinxronlash.
   - Test qo'sh yoki yangila.
5. **Yakunda beriladi:**
   - Barcha o'zgargan fayllar ro'yxati.
   - Ishga tushirish buyruqlari (PowerShell, `&&` siz).
   - Git commit xabari (o'zbekcha, imperativ: "Xodim formasidan telefon maydonini olib tashla").

---

## SKILL 2 — `olib-tashlash-xavfsiz`

**Qachon ishlatiladi:** Foydalanuvchi "bu joyni o'chir" yoki "bu funksiyani olib tashla" deydi.

**Qat'iy qoidalar:**

- **DB yozuvlar** — hech qachon fizik `DELETE` qilinmaydi. `is_active=False` yoki `deleted_at=timezone.now()` bilan yumshoq o'chirish.
- **Endpoint olib tashlansa:**
  - `Bacend/api/urls.py`'dan olib tashla.
  - Mos `views_*.py` funksiyasi/klassi olib tashlanadi.
  - Mos DRF test'lar (`test_*.py`) olib tashlanadi (yolg'iz turmasin).
  - Frontendda uni chaqiruvchi barcha joylar (`grep -rn "endpoint-nomi" app/ components/ lib/`) tozalanadi.
  - Yetim TS tip va fetcher'lar olib tashlanadi.
- **UI element olib tashlansa:**
  - Fayldan tozalanadi.
  - Ishlatilmay qolgan import'lar (`unused imports`) olib tashlanadi.
  - Ishlatilmay qolgan CSS class'lar (Tailwind bo'lgani uchun ko'p hollarda avtomatik) tekshiriladi.
  - i18n/matn fayllari bo'lsa — yetim kalitlar olib tashlanadi.
- **Migratsiya:** ustun/jadval olib tashlansa, avval `makemigrations` — reja beriladi, tasdiq — keyin `migrate`. Prod DB'da hech qachon `--fake` yoki qo'lda tuzatma taklif qilma menga aytmasdan.

**Yakunida:**
- O'chirilgan barcha narsalar ro'yxati (frontend + backend + test + migratsiya).
- "Yetim qolgan hech narsa yo'q" — grep natijalarini ko'rsat.

---

## SKILL 3 — `endpoint-qushish`

**Qachon ishlatiladi:** Yangi API endpoint kerak (yangi maydon, yangi ro'yxat, yangi amal).

**Qadamlar:**

1. **Kontrakt yozib berish** (kod yozmasdan):
   - URL: `/api/xodimlar/<id>/qayta-tikla/` (kebab-case).
   - Method: `POST`.
   - Request body (JSON schema).
   - Response body (JSON schema, xato holatlari bilan).
   - Auth: JWT talab qilinadimi, qaysi permission.
   - Migratsiya kerakmi.
2. Menga tasdiqlashga bering.
3. **Backend:**
   - `core/models.py` — kerak bo'lsa maydon qo'sh.
   - `python manage.py makemigrations` — nomlangan migratsiya.
   - `api/serializers.py` — mos serializer.
   - `api/views_ops.py` (yoki mos view fayl) — logika.
   - `api/urls.py` — route qo'sh.
   - `api/test_*.py` — kamida 3 test: happy path, auth yo'q, invalid input.
4. **Frontend:**
   - `lib/api/<domen>.ts` — TS tipi (Request, Response) va fetcher funksiya.
   - Ishlatuvchi komponent yangilanadi.
   - Loading, error, success holatlari bor.
5. **Sinov:**
   - `cd Bacend; python manage.py test api`
   - `npm run build`
6. **Commit xabari:** "Xodimni qayta tiklash endpoint'i qo'shildi".

---

## SKILL 4 — `frontend-backend-sinxron-tekshiruv`

**Qachon ishlatiladi:** Har o'zgartirishdan **keyin**, avtomatik. Foydalanuvchi so'rasin yoki so'ramasin.

**Kim bajaradi:** **AI o'zi to'liq**. Grep buyruqlarini AI o'z bash/terminal tools'ida ishga tushiradi, natijani o'zi tahlil qiladi, kamchilik topsa o'zi tuzatadi va yana tekshiradi. Foydalanuvchi jalb qilinmaydi.

**Tekshiruv ro'yxati:**

1. `grep -rn "fetch(" app/ components/ lib/` — hamma chaqiriqlar `lib/api/`'ga o'ralganmi?
2. Har `lib/api/*.ts` fayli — mos backend endpoint borligini `grep -rn "path" Bacend/api/urls.py`'dan tasdiqla.
3. TS interfeys maydonlari ↔ DRF serializer maydonlari — bittalab solishtir. Yetishmayotgan yoki ortiqcha maydon bo'lsa — xato deb belgila.
4. HTTP method'lar mosmi (frontend `POST` — backend `POST`).
5. Status kod ishlov: frontend 401/403/404/500 uchun mos xato holati chizadimi.
6. CORS: yangi frontend origin bo'lsa, `settings.py`'da `CORS_ALLOWED_ORIGINS` yangilanganmi.
7. JWT: yangi endpoint auth talab qilsa, permission class biriktirilganmi.

**Chiqarish shakli:**
```
Sinxron tekshiruv:
  [OK] /api/xodimlar/ — GET/POST, tipi mos
  [OK] /api/yoriqnoma/<id>/ — GET/PATCH, tipi mos
  [XATO] /api/imzo/tekshir/ — frontend 'signature' maydonini so'raydi, serializer'da yo'q
Qilinadigan tuzatishlar: ...
```

---

## SKILL 5 — `deploy-tayyor-tekshiruv`

**Qachon ishlatiladi:** Foydalanuvchi "deploy qilaman" desa yoki katta o'zgartirish tugagach.

**Kim bajaradi:** **AI o'zi** barcha tekshiruvlarni ishga tushiradi (o'z terminal tools'i orqali), natijalarni o'zi o'qiydi. Foydalanuvchiga faqat yakuniy report beriladi. Agar biror bosqich qizil bo'lsa — AI o'zi tuzatadi va qaytadan ishga tushiradi. Deploy'ning o'zini (`git push`, Render dashboard) AI qilmaydi — foydalanuvchiga tayyor "yashil" holatda uzatadi.

**Qadamlar (PowerShell, `&&` siz — AI o'z terminalida ishga tushiradi):**

```powershell
# 1. Backend
cd "C:\Users\ANUBIS PC\Desktop\tb mains\tb mains\Tb Main\Bacend"
python manage.py migrate --check
python manage.py test
python manage.py collectstatic --noinput --dry-run

# 2. Frontend
cd "C:\Users\ANUBIS PC\Desktop\tb mains\tb mains\Tb Main"
npm run lint
npm run build

# 3. Docker konfig
docker compose -f docker-compose.yml config

# 4. Env tekshiruvi
# .env.example va .env.local kalitlari mos ekanini ayt
# Har yangi env kaliti .env.example'ga ham qo'shilganmi

# 5. Render/Vercel
# render.yaml o'zgargan bo'lsa, u yerdagi build/start command'lar package.json va gunicorn.conf.py bilan mos
# .vercelignore va next.config.mjs'da rewrite/redirect kerakmi tekshir
```

**Ripo`rt shakli:**
```
Deploy tayyorlik:
  [OK] Migratsiyalar sync
  [OK] 42/42 backend test yashil
  [OK] npm run build 0 xato
  [OGOHLANTIRISH] .env.example'ga FACE_SERVICE_URL qo'shish kerak
  [OK] docker compose config valid
Deploy qilsa bo'ladi? HA (bir ogohlantirish bilan)
```

---

## SKILL 6 — `powershell-buyruq-yaratish`

**Qachon:** AI har qanday terminal buyrug'i beradi.

**Qoidalar:**
- `&&` va `||` **ishlatilmaydi** — PowerShell qo'llab-quvvatlamaydi.
- Zanjir kerak bo'lsa: har bir buyruqni alohida qatorga yoki `;` bilan.
- Windows path — qo'shtirnoq ichida: `cd "C:\Users\ANUBIS PC\Desktop\tb mains\tb mains\Tb Main"`.
- `sudo` yo'q — Windows'da `Start-Process -Verb RunAs` yoki qo'l bilan ishga tushirish uchun izoh.
- Python: `python` (Windows), `pip install` uchun virtualenv bo'lsa avval `.\venv\Scripts\Activate.ps1`.
- Node: `npm` yoki `pnpm` (loyihada `package-lock.json` bor — **`npm` ishlat**).
- Fayl yaratish: `New-Item`, `Set-Content`. `echo > file` — kodlash muammosi bo'ladi, ehtiyot bo'l.

**Namuna shablon:**
```powershell
cd "C:\Users\ANUBIS PC\Desktop\tb mains\tb mains\Tb Main"
npm install
cd Bacend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

## SKILL 7 — `django-migratsiya-xavfsiz`

**Qachon:** `core/models.py` o'zgaradi.

**Qadamlar:**
1. O'zgarish turini aniqla:
   - Yangi maydon (nullable/default bilan → xavfsiz).
   - Yangi maydon (NOT NULL default siz → xatarli, data migration kerak).
   - Ustun tipi o'zgardi → xatarli.
   - Ustun/jadval o'chirildi → juda xatarli (soft-delete afzal).
2. Xavfli bo'lsa — menga aytish va **ikki bosqichli migratsiya** taklif qilish:
   - 1-migratsiya: nullable qo'shish.
   - Data migration: mavjud yozuvlarni to'ldirish.
   - 2-migratsiya: NOT NULL qilish (keyingi deploy).
3. Migratsiya nomi ma'noli: `0012_xodim_smena_qoshildi.py` (nom snake_case, o'zbekcha domen).
4. `python manage.py makemigrations --name xodim_smena_qoshildi core`
5. Migratsiya faylini menga ko'rsat, keyin `migrate`.
6. Rollback rejasi: qanday qilib orqaga qaytariladi (`migrate core 0011`).

---

## SKILL 8 — `test-yozish`

**Qachon:** yangi/o'zgargan har logika.

**Backend (DRF, `APITestCase`):**
- Har endpoint uchun kamida 3 test:
  1. **Happy path** — to'g'ri kirish, kutilgan javob va status.
  2. **Auth yo'q / permission yo'q** — 401/403.
  3. **Invalid input** — 400 va tegishli xato xabari.
- Fayl nomi: `Bacend/api/test_<domen>.py`.
- Fixture'lar: `setUp`'da minimal foydalanuvchi + JWT token.

**Frontend:**
- Hech bo'lmasa `npm run build` va `npm run lint` xatosiz.
- Katta komponent bo'lsa — Vitest/RTL taklif qil (hozircha loyihada yo'q; taklif qilib, tasdiq so'ra).

**Yakunda:**
```
Yangi/yangilangan testlar: 4
Barchasi yashil: HA
Coverage o'zgarishi: +2.3% (agar coverage yig'ilsa)
```

---

## SKILL 9 — `env-va-secret-boshqaruv`

**Qachon:** yangi tashqi servis, kalit yoki sozlama qo'shiladi.

**Qoidalar:**
- Yangi env kaliti → **`.env.example`'ga bo'sh qiymat bilan qo'shiladi** (masalan `FACE_SERVICE_URL=`).
- `.env.local`'ga real qiymat qo'yiladi (foydalanuvchi qo'lda).
- `render.yaml` va Vercel Environment Variables ro'yxatiga qo'shish kerakligini eslatib qo'yish.
- Frontend'da `NEXT_PUBLIC_` prefiksi **faqat** browser'da ochilishi mumkin bo'lgan qiymatlar uchun. Secret'lar uchun hech qachon `NEXT_PUBLIC_` ishlatma.
- Backend Django `settings.py`'da `os.environ.get("KEY", default)` bilan olish. Default productionga ta'sir qilmasin.

**Yakunida:**
```
Yangi env kalitlari: FACE_SERVICE_URL, JWT_ACCESS_TTL
Qo'shildi: .env.example, .env.local (namuna qiymat), render.yaml
Vercel'da qo'lda qo'shish kerak: FACE_SERVICE_URL, NEXT_PUBLIC_API_BASE
```

---

## SKILL 10 — `git-commit-uslub`

**Qachon:** har bir tugallangan o'zgartirishdan keyin.

**Qoidalar:**
- Bir commit — bir mantiqiy o'zgartirish (frontend + mos backend + test).
- Xabar imperativ, o'zbekcha, birinchi harf kichik (yoki katta — bir standart).
- Namunalar:
  - `xodim: telefon maydoni olib tashlandi`
  - `yoriqnoma: PDF eksport qo'shildi`
  - `auth: JWT refresh oqimi tuzatildi`
  - `deploy: render.yaml env kalitlari yangilandi`
- Body kerak bo'lsa: nima o'zgargani va nima uchun (BREAKING bo'lsa katta harflarda ogohlantirish).
- **Attribution** (agar Claude Code ishlatilsa, oxiriga):
  ```
  Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
  ```

---

## SKILL 11 — `face-service-integratsiya`

**Qachon:** face recognition oqimiga tegiladi.

**E'tibor beriladigan joylar:**
- `face-service/app.py` — servis endpoint'lari (embedding, verify).
- `Bacend/core/face.py` — Django tomondagi mijoz.
- Face-service alohida Docker konteynerda — URL `FACE_SERVICE_URL` env orqali.
- Xatosiz down bo'lish (fallback): agar face-service javob bermasa, tegishli oqim aniq xato beradi, tizim qulamaydi.
- Rasm/embedding'lar frontendga xom chiqmasin — faqat `verified: true/false` va `score`.

---

## SKILL 12 — `oldingi-holatga-qaytish`

**Qachon:** biror o'zgartirish noto'g'ri chiqsa.

**Qadamlar:**
1. `git status` va `git log --oneline -10` bilan holatni ko'rsat.
2. Ikki variantni taklif qil:
   - Yumshoq: `git restore <fayl>` yoki `git revert <sha>`.
   - Qattiq: `git reset --hard <sha>` — **faqat foydalanuvchi tasdig'i bilan**.
3. Migratsiya rollback kerak bo'lsa: `python manage.py migrate <app> <oldingi_migratsiya>`.
4. Deploy allaqachon bo'lgan bo'lsa: Render/Vercel dashboard'dan **rollback** tugmasi ishlatilsin — buyruq bermay, menga aytib qo'y.
