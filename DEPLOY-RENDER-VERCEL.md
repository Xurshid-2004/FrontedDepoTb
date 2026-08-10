# Deploy: Render (backend) + Vercel (frontend)

Django API va PostgreSQL — **Render**'da. Next.js sahifalari — **Vercel**'da.

> Bu ikki xizmat ikki xil domenda turadi, shuning uchun CORS sozlamasi
> majburiy. Quyidagi tartibni buzmang: avval backend, keyin frontend,
> soʻng ikkalasini bir-biriga bogʻlash.

---

## 0. Oldindan bilib qoʻying

| Masala | Holat |
|---|---|
| **Kamera (Face ID)** | Faqat `https://` da ishlaydi. Render ham, Vercel ham HTTPS beradi — muammo yoʻq |
| **Render `free` reja** | 15 daqiqa jimlikdan keyin uxlaydi. Uygʻonish ~50 soniya, frontend esa 30 soniyada uzadi → birinchi urinish xato beradi. Haqiqiy foydalanuvchilar uchun `starter` oling |
| **Render `free` baza** | 90 kundan keyin oʻchiriladi. Jiddiy ishlatishda `basic-256mb` |
| **Face ID xizmati** | InsightFace ~1.5 GB RAM talab qiladi. `free`/`starter` = 512 MB — **yetmaydi**. Kamida `standard` (2 GB) |

Face ID'siz tizim toʻliq ishlaydi — hamma PIN bilan kiradi. Uni keyinroq
yoqish mumkin, kod tayyor.

---

## 1. Backend — Render

### 1.1 Blueprint orqali yaratish

1. Kodni GitHub'ga yuklang
2. Render → **New** → **Blueprint** → repo'ni tanlang
3. Render `render.yaml` ni oʻqib ikkita narsani yaratadi:
   - `tb-db` — PostgreSQL 16
   - `tb-api` — Django (Frankfurt mintaqasi)
4. **Apply** bosing va build tugashini kuting (~5 daqiqa)

`DJANGO_SECRET_KEY` va `JWT_SECRET` avtomatik yaratiladi — siz koʻrmaysiz
ham, kiritishingiz ham shart emas.

### 1.2 Tekshirish

```
https://tb-api-xxxx.onrender.com/health
```

Kutilgan javob:
```json
{"ok": true, "servis": "tb-django", "baza": true}
```

`"baza": false` boʻlsa — baza ulanmagan, Render loglarini oching.

### 1.3 Administrator yaratish

Render → `tb-api` → **Shell**:

```bash
python manage.py createsuperuser
```

Bu Django admin paneli (`/admin/`) uchun. Ilovaning oʻz admini esa
tabel raqami bilan ishlaydi — uni shu yerdan yarating:

```bash
python manage.py shell -c "
from core.models import Depo, Worker
w = Worker.objects.create(depo=Depo.joriy(), tabel='0212',
    familiya='Familiya', ism='Ism', roles=['admin'], faol=True, is_staff=True)
w.set_pin('1234'); w.set_unusable_password(); w.save()
print('Tayyor:', w.tabel)
"
```

> PIN'ni birinchi kirishdan keyin «Parollar» boʻlimidan almashtiring.

---

## 2. Frontend — Vercel

### 2.1 Loyihani ulash

1. Vercel → **Add New** → **Project** → oʻsha repo
2. **Root Directory**: `./` (oʻzgartirmang — Next.js ildizda)
3. Framework: **Next.js** (oʻzi aniqlaydi)

### 2.2 Muhit oʻzgaruvchilari

Vercel → Settings → **Environment Variables**:

| Nomi | Qiymat | Izoh |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | `https://tb-api-xxxx.onrender.com` | Render manzili, oxirida `/` YOʻQ |
| `DJANGO_URL` | `https://tb-api-xxxx.onrender.com` | PDF generatori server tomonidan ishlatadi |
| `NEXT_PUBLIC_DEPO_KOD` | `TCH-6` | |
| `NEXT_PUBLIC_BASE_URL` | `https://sizning-domen.vercel.app` | QR kodlar uchun |
| `SIGN_PRIVATE_KEY` | `.env.local` dagi qiymat | QR imzo — **maxfiy** |
| `SIGN_PUBLIC_KEY` | `.env.local` dagi qiymat | |

> `NEXT_PUBLIC_*` oʻzgaruvchilar **build vaqtida** mijoz kodiga
> qotiriladi. Ularni oʻzgartirsangiz **qayta deploy qilish shart** —
> aks holda eski qiymat ishlab turaveradi.

### 2.3 Deploy

**Deploy** bosing. Build ~2 daqiqa.

---

## 3. Ikkalasini bogʻlash (eng muhim qadam)

Vercel domeni tayyor boʻlgach, Render'ga qaytib **ikkita** oʻzgaruvchini
kiriting: `tb-api` → **Environment**:

| Nomi | Qiymat |
|---|---|
| `CORS_ALLOWED_ORIGINS` | `https://sizning-domen.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://sizning-domen.vercel.app` |

Soʻng **Manual Deploy → Deploy latest commit**.

> Bu qadamsiz brauzer barcha soʻrovlarni bloklaydi va sahifa
> «Serverga ulanib boʻlmadi» deb turadi. Konsolda `CORS policy` xatosi
> koʻrinadi.

**Preview deploy'lar** ham kerak boʻlsa, vergul bilan qoʻshing:
```
https://tb.vercel.app,https://tb-git-main-user.vercel.app
```

---

## 4. Tekshirish roʻyxati

- [ ] `https://tb-api-xxx.onrender.com/health` → `{"ok":true,"baza":true}`
- [ ] Vercel sahifasi ochiladi, kirish kartasi koʻrinadi
- [ ] Tabel raqami kiritilganda «topilmadi» emas, PIN soʻraladi
- [ ] Kirish ishlaydi, boshqaruv paneli ochiladi
- [ ] `https://tb-api-xxx.onrender.com/admin/` — Django admin, CSS joyida
      *(CSS boʻlmasa `collectstatic` bajarilmagan — build logini koʻring)*

---

## 5. Face ID'ni yoqish (ixtiyoriy)

1. `render.yaml` dagi `tb-face` blokini izohdan chiqaring
2. `plan: standard` ekanini tekshiring (2 GB RAM — kamida shu)
3. Blueprint'ni qayta qoʻllang
4. `tb-api` ga qoʻying: `FACE_SERVICE_URL = http://tb-face:8000`
5. `tb-api` ni qayta deploy qiling

Birinchi ishga tushishda model (~281 MB) yuklanadi — 2-3 daqiqa.

Tekshirish: kirish oynasida tabel kiritilgach kamera soʻralsa — ishladi.
Soʻralmasa `FACE_SERVICE_URL` boʻsh yoki xizmat koʻtarilmagan.

**FACE_SERVICE_URL boʻsh boʻlsa tizim jimgina PIN rejimida ishlaydi** —
xato bermaydi, foydalanuvchi hech narsani sezmaydi.

---

## 6. Tez-tez uchraydigan muammolar

| Belgi | Sabab | Yechim |
|---|---|---|
| «Serverga ulanib boʻlmadi» | CORS sozlanmagan | 3-boʻlim |
| Birinchi kirish uzoq, keyin normal | `free` reja uxlagan | `starter` rejaga oʻting |
| `DisallowedHost` xatosi | Maxsus domen qoʻshgansiz | `DJANGO_ALLOWED_HOSTS` ga yozing |
| Admin panelda CSS yoʻq | `collectstatic` oʻtmagan | Build logini tekshiring |
| `SSL connection is required` | Tashqi baza URL'i | `DB_SSLMODE=require` qoʻying |
| Kamera ochilmaydi | Sahifa `http://` da | HTTPS majburiy — Vercel domenini ishlating |
| Kamera soʻralmaydi | Face xizmati yoʻq | Normal holat, PIN bilan ishlaydi |

---

## 7. Maxfiylik

Bu fayllar **hech qachon** git'ga tushmasligi kerak (`.gitignore` da bor):
`Bacend/.env`, `.env.local`, `*.pem`

Docker image'ga ham tushmaydi — `.dockerignore` va `.vercelignore`
buni taʼminlaydi. Agar kalitlar bir marta git'ga tushgan boʻlsa,
ularni **almashtiring** — tarixdan oʻchirish yetarli emas.
