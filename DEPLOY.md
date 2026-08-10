# TB tizimi — serverga joylash

Bu hujjat tizimni noldan ishga tushirishni bosqichma-bosqich tushuntiradi.

---

## Arxitektura

```
                      ┌──────────────────────────────┐
   Brauzer / Flutter  │           Caddy              │  HTTPS (Let's Encrypt)
   ──────────────────▶│      80 / 443 portlar        │
                      └──────────────┬───────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
     /api/documents/*           /api/*  /admin/*        qolgani
              │                      │                      │
              ▼                      ▼                      ▼
      ┌──────────────┐      ┌────────────────┐     ┌──────────────┐
      │   Next.js    │      │     Django     │     │   Next.js    │
      │ PDF / DOCX   │─────▶│  BARCHA MANTIQ │     │   sahifalar  │
      │  generatori  │      │   va maʼlumot  │     └──────────────┘
      └──────────────┘      └────────┬───────┘
                                     │
                            ┌────────▼────────┐
                            │   PostgreSQL    │
                            └─────────────────┘
```

**Muhim:** barcha biznes-mantiq va ruxsat tekshiruvi **Django'da**. Brauzer
hech qanday qaror qabul qilmaydi va hech qanday maʼlumotni diskda saqlamaydi
(localStorage'da faqat kirish tokeni turadi).

---

## 1. Server talablari

| Narsa | Eng kami | Tavsiya (800 foydalanuvchi) |
|---|---|---|
| RAM | 2 GB | 4 GB |
| Disk | 20 GB | 40 GB |
| OS | Ubuntu 22.04+ | Ubuntu 24.04 |
| Dastur | Docker + Docker Compose | — |

FaceID xizmati yoqilsa qoʻshimcha **4 GB RAM** kerak.

Docker oʻrnatish:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # keyin qayta kiring
```

---

## 2. Loyihani koʻchirish

```bash
git clone <repo> /opt/tb
cd /opt/tb
```

---

## 3. Sozlamalar

```bash
cp .env.example .env.production
nano .env.production
```

**Majburiy toʻldiriladigan qatorlar:**

```bash
# Maxfiy kalitlar — ikkitasini alohida yarating
python3 -c "import secrets; print(secrets.token_urlsafe(64))"   # DJANGO_SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(64))"   # JWT_SECRET

# Baza paroli
openssl rand -base64 32                                         # POSTGRES_PASSWORD
```

Va domeningizni yozing:

```ini
TB_DOMAIN=tb.example.uz
NEXT_PUBLIC_BASE_URL=https://tb.example.uz
DJANGO_ALLOWED_HOSTS=tb.example.uz
CSRF_TRUSTED_ORIGINS=https://tb.example.uz
NEXT_PUBLIC_DEMO=0
```

> **Domen hali yoʻqmi?** `TB_DOMAIN=:80` qoldiring va serverning IP manzili
> orqali kiring. HTTPS keyinroq, domen ulanganda avtomatik olinadi.

QR imzo kalitlari:

```bash
openssl ecparam -genkey -name prime256v1 -noout -out ec-priv.pem
openssl ec -in ec-priv.pem -pubout -out ec-pub.pem
base64 -w0 ec-priv.pem   # → SIGN_PRIVATE_KEY
base64 -w0 ec-pub.pem    # → SIGN_PUBLIC_KEY
rm ec-priv.pem ec-pub.pem
```

---

## 4. Ishga tushirish

```bash
docker compose --env-file .env.production up -d --build
```

Birinchi koʻtarilishda avtomatik bajariladi:

1. PostgreSQL koʻtariladi va tayyor boʻlishi kutiladi
2. Django migratsiyalari oʻtkaziladi
3. Statik fayllar yigʻiladi
4. **Normativ maʼlumot yoziladi** — 28 lavozim, 19 buyum, 143 norma (31-ilova)
5. gunicorn ishga tushadi

Holatni koʻrish:

```bash
docker compose ps
docker compose logs -f api      # Django loglari
docker compose logs -f web      # Next.js loglari
```

Sogʻliq tekshiruvi:

```bash
curl -s https://tb.example.uz/api/v1/health
# {"ok":true,"servis":"tb-django","baza":true}
```

---

## 5. Administrator yaratish

```bash
docker compose exec api python manage.py seed --admin 10001 --pin 1234
```

Bu buyruq:
- `10001` tabel raqamli administratorni yaratadi
- boshlangʻich PIN oʻrnatadi

> **Birinchi kirishdan keyin PIN'ni almashtiring.** Admin panelidan
> (`/admin/`) yoki ilovaning «Parollar» boʻlimidan qilish mumkin.

Django admin paneliga kirish uchun alohida parolli hisob:

```bash
docker compose exec api python manage.py createsuperuser
```

---

## 6. Ishchilarni kiritish

Uch yoʻl bor:

**a) Ilova orqali** — Administrator paneli → Ishchilar → «Ommaviy import».
CSV formatida: `tabel,familiya,ism,otasi`

**b) Django admin panelidan** — `https://tb.example.uz/admin/core/worker/`

**c) Bittalab** — Administrator paneli → «+ Yangi ishchi»

Har bir ishchi birinchi kirishda **oʻzi 4 xonali PIN oʻrnatadi**. PIN faqat
serverda, PBKDF2-SHA256 bilan hash qilib saqlanadi — hech kim, hatto
administrator ham, uni koʻra olmaydi (faqat tiklashi mumkin).

---

## 7. Yangilash

```bash
cd /opt/tb
git pull
docker compose --env-file .env.production up -d --build
```

Migratsiyalar avtomatik oʻtadi. Maʼlumot yoʻqolmaydi.

---

## 8. Zaxira nusxa (backup)

**Kunlik zaxira** — cron'ga qoʻying:

```bash
# /etc/cron.d/tb-backup
0 2 * * * root docker exec tb-db pg_dump -U tb tb | gzip > /var/backups/tb-$(date +\%F).sql.gz
```

Eski nusxalarni tozalash (30 kundan oshganini):

```bash
find /var/backups -name 'tb-*.sql.gz' -mtime +30 -delete
```

**Tiklash:**

```bash
gunzip -c /var/backups/tb-2026-08-09.sql.gz | docker exec -i tb-db psql -U tb tb
```

---

## 9. FaceID xizmatini yoqish

RAM 8 GB boʻlganda:

```bash
# .env.production ga token qoʻshing
FACE_SERVICE_TOKEN=$(openssl rand -hex 32)

docker compose --env-file .env.production --profile face up -d --build
```

---

## 10. Foydali buyruqlar

```bash
# Barcha xizmatlarni toʻxtatish
docker compose down

# Loglar (oxirgi 100 qator)
docker compose logs --tail=100 api

# Django buyruq qatori
docker compose exec api python manage.py shell

# Muddati oʻtgan tokenlarni tozalash
docker compose exec api python manage.py shell -c "from core.tokens import tozalash; print(tozalash())"

# Bazaga bevosita ulanish
docker compose exec db psql -U tb tb

# Testlarni ishga tushirish
docker compose exec api python manage.py test api
```

---

## 11. Nosozliklarni bartaraf etish

| Belgi | Sabab | Yechim |
|---|---|---|
| `api` konteyner qayta-qayta oʻchadi | `DJANGO_SECRET_KEY` boʻsh | `.env.production` ga kalit yozing |
| `502 Bad Gateway` | Django hali koʻtarilmagan | `docker compose logs api` ni koʻring |
| Kirishda «Serverga ulanib boʻlmadi» | `NEXT_PUBLIC_API_BASE` notoʻgʻri | Boʻsh boʻlishi kerak (Caddy proxy qiladi) |
| `DisallowedHost` xatosi | Domen roʻyxatda yoʻq | `DJANGO_ALLOWED_HOSTS` ga qoʻshing |
| HTTPS olinmayapti | DNS hali yoʻnaltirilmagan | A-yozuv server IP siga qaratilganini tekshiring |
| Migratsiya xatosi | Baza koʻtarilmagan | `docker compose logs db` |

---

## 12. Xavfsizlik eslatmalari

- `.env.production` faylini **git'ga qoʻshmang** va hech kimga yubormang
- `NEXT_PUBLIC_DEMO=0` boʻlishini tekshiring — aks holda login sahifasida
  demo tabel raqamlari koʻrinadi
- Django admin paneli (`/admin/`) faqat `is_staff` belgisi bor hisoblarga
  ochiq — ishchilarga bermang
- PIN hash'lari hech qachon API javobiga qoʻshilmaydi; buni test tasdiqlaydi
  (`api/tests.py::test_pin_hash_hech_qachon_chiqmaydi`)
- Kirish urinishlari daqiqasiga 20 tagacha cheklangan (`THROTTLE_LOGIN`)
