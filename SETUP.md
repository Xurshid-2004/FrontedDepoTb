# TB tizimi — lokal ishga tushirish

Ishlab chiqish muhitini noldan tayyorlash. Serverga joylash uchun —
[DEPLOY.md](DEPLOY.md).

---

## Nima kerak

| Dastur | Versiya | Tekshirish |
|---|---|---|
| Node.js | 20+ | `node -v` |
| Python | 3.12+ | `python --version` |
| PostgreSQL | 14+ | `psql --version` |

> PostgreSQL oʻrnatmoqchi boʻlmasangiz, sinov uchun SQLite bilan ham
> ishlaydi — pastda koʻrsatilgan.

---

## Eng tez yoʻl — bitta skript

```powershell
.\ishga-tushirish.ps1
```

Skript hammasini oʻzi qiladi: bogʻliqliklarni oʻrnatadi, bazani
tayyorlaydi, normativ maʼlumotni yozadi va ikkala xizmatni koʻtaradi.

Qoʻlda qilmoqchi boʻlsangiz — quyidagi qadamlar.

---

## 1. Backend (Django)

PowerShell'da har bir buyruq **alohida** yoziladi.

```powershell
cd Bacend
```

```powershell
python -m pip install -r requirements.txt
```

Sozlama faylini yarating:

```powershell
Copy-Item .env.example .env
```

`Bacend\.env` ichida bazani koʻrsating:

```ini
# PostgreSQL bor boʻlsa:
DATABASE_URL=postgres://tb:PAROL@127.0.0.1:5432/tb

# PostgreSQL yoʻq boʻlsa (faqat sinov uchun):
# DATABASE_URL=sqlite://dev.sqlite3
```

Bazani tayyorlang:

```powershell
python manage.py migrate
```

Normativ maʼlumot — 28 lavozim, 19 buyum, 143 norma (31-ilova):

```powershell
python manage.py seed --demo --admin 10001 --pin 1234
```

> `--demo` namunaviy xodimlarni ham qoʻshadi (depo boshligʻi, bugalter,
> TB xodimi va h.k.). Haqiqiy ishlatishda `--demo` siz ishga tushiring.

Backend'ni koʻtaring:

```powershell
python manage.py runserver 127.0.0.1:8000
```

Tekshirish: http://127.0.0.1:8000/api/v1/health

---

## 2. Frontend (Next.js)

**Yangi** PowerShell oynasida:

```powershell
npm install
```

`.env.local` faylida Django manzili koʻrsatilgan boʻlishi kerak:

```ini
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
DJANGO_URL=http://127.0.0.1:8000
NEXT_PUBLIC_DEMO=1
```

```powershell
npm run dev
```

Brauzerda: **http://localhost:3000**

Kirish: tabel `10001`, PIN `1234`.

---

## 3. Django admin paneli

Barcha jadvallar uchun tayyor boshqaruv interfeysi:

```powershell
cd Bacend
python manage.py createsuperuser
```

Soʻng: http://127.0.0.1:8000/admin/

Bu yerdan ishchilar, buyumlar, normalar, arizalar — hammasini
bevosita tahrirlash mumkin.

---

## Loyiha tuzilishi

```
tb_web/
├── Bacend/                 ← Django backend (BARCHA MANTIQ SHU YERDA)
│   ├── config/             sozlamalar, marshrutlar
│   ├── core/               modellar, biznes-mantiq, ruxsatlar, admin
│   │   ├── models.py       24 model
│   │   ├── logic.py        ariza oqimi, normalar, muddatlar
│   │   ├── permissions.py  rol/lavozim/shaxs ruxsatlari
│   │   ├── pin.py          PIN hash (PBKDF2)
│   │   └── tokens.py       JWT access/refresh
│   └── api/                REST endpointlar (30 ta) va testlar
│
├── app/                    Next.js sahifalari
│   └── api/documents/      PDF/DOCX generatori (faqat shu qoldi)
├── components/             UI komponentlari
├── lib/
│   ├── api.ts              Django bilan ishlovchi REST klient
│   ├── store.tsx           ilova holati (localStorage'da maʼlumot YOʻQ)
│   ├── logic.ts            koʻrsatish uchun hisob-kitob
│   └── docs/               blanka chizish (pdf-lib)
│
├── app_flutter/            mobil ilova
└── arxiv/                  eski Supabase sxemasi (ishlatilmaydi)
```

---

## Testlar

```powershell
cd Bacend
python manage.py test api
```

27 ta test: autentifikatsiya, ruxsatlar, ariza oqimi, ombor, holat shakli.

---

## Tez-tez uchraydigan xatolar

| Xato | Sabab | Yechim |
|---|---|---|
| `DJANGO_SECRET_KEY sozlanmagan` | `.env` yoʻq yoki boʻsh | `Copy-Item .env.example .env` |
| `connection refused` (5432) | Postgres ishlamayapti | Xizmatni yoqing yoki SQLite'ga oʻting |
| Saytda «Serverga ulanib boʻlmadi» | Django koʻtarilmagan | 8000-portda runserver ishlayaptimi? |
| `UnicodeEncodeError` konsolda | Windows cp1252 | `$env:PYTHONIOENCODING="utf-8"` |
| Kirishda «tabel topilmadi» | Seed bajarilmagan | `python manage.py seed --demo` |
