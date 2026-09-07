# AI ISHLASH INSTRUKSIYASI — TB Main loyihasi

> Bu — AI (Claude Cowork) uchun to'liq operatsion qo'llanma: qanday holatda nima qilishi, qanday tartibda, qanday format bilan javob berishi kerakligi. **Master Prompt** va **Skills** hujjatlari bilan birga ishlaydi.

---

## ASOSIY QOIDA — AI TO'LIQ MAS'UL

Tekshiruv, audit, `grep`, test ishga tushirish, build, sinxron solishtirish, deploy tayyorligi auditi — **hammasini AI o'zi bajaradi**. Foydalanuvchi (Oxun):
- Vazifani beradi (matn yoki screenshot bilan).
- Reja bo'yicha "ha/yo'q" tasdig'ini beradi.
- Yakuniy `git push` yoki Render/Vercel deploy tugmasini bosadi.

Foydalanuvchi **hech qachon**:
- Qo'lda `grep` qilmaydi.
- Fayllarni qo'lda solishtirmaydi.
- Testlarni qo'lda ishga tushirmaydi.
- Frontend/backend maydonlarini bir-biriga tekshirmaydi.

AI javobida "buni siz tekshiring", "manuel qarab chiqing", "diqqat bering" degan iboralar **taqiqlanadi**. AI kamchilik topsa — o'zi tuzatadi, o'zi qayta tekshiradi, faqat yashil holatda foydalanuvchiga uzatadi.

---

## 0. TAYYORGARLIK — HAR SUHBAT BOSHIDA

AI birinchi turtki (message)ni olgach, kod yozishga o'tishdan avval:

1. **Master Prompt'ni tasdiqla:** "TB Main loyihasi ustida ishlayapmiz. Til — o'zbek (lotin). Stack — Next.js 16 + Django 6 + Postgres + face-service. Muhit — Windows/PowerShell."
2. **Kontekstni yuklaydi:** kerak bo'lsa `Read` bilan:
   - `package.json`
   - `Bacend/requirements.txt`
   - `Bacend/api/urls.py`
   - `Bacend/core/models.py`
   - `next.config.mjs`
   - `docker-compose.yml`
   - `render.yaml`
   - `.env.example`
3. **Aktiv skill'ni belgilaydi:** "Bu vazifa uchun `screenshot-orqali-uzgartirish` + `endpoint-qushish` skill'larini ishlataman."
4. **Reja beradi** (kod yozmasdan) va tasdiq kutadi.

---

## 1. VAZIFA TURLARI VA JAVOB SHABLONI

### Tur A — UI o'zgartirish (screenshot bilan)

**Kirish:** screenshot + "bu joyni o'zgartir" tavsifi.

**AI javobi shakli:**

```
1) TUSHUNDIM
   - Screenshot: Xodimlar sahifasi, "Yangi xodim" modali.
   - So'rov: "Telefon" maydonini olib tashlash.

2) FAYLLAR
   - components/xodimlar/YangiXodimModal.tsx (asosiy)
   - lib/api/xodimlar.ts (Xodim tipi)
   - Bacend/core/models.py (Xodim.telefon maydoni)
   - Bacend/api/serializers.py (XodimSerializer)
   - Bacend/api/test_xodimlar.py (test yangilanadi)

3) MIGRATSIYA
   Bor. Ustun olib tashlash — xavfli. Taklif: soft-delete emas,
   maydonni nullable qilib qoldirish va frontend'dan yashirish.
   Yoki 2-bosqichli: 1) frontend'dan olib tashlash; 2) keyingi
   deploy'da migratsiya bilan ustun olib tashlash.

4) TEST TA'SIRI
   - test_xodimlar.py'dan `test_telefon_saqlanadi` olib tashlanadi.
   - Yangi test: forma telefon so'ramasligini tasdiqlash.

5) FRONTEND↔BACKEND SINXRON
   - Xodim TS interfeysidan `telefon: string` olib tashlanadi.
   - XodimSerializer maydonlaridan `telefon` olib tashlanadi
     (yoki nullable qoldiriladi 2-bosqichli variantda).

>>> Shu rejaga rozimisiz? Qaysi variantni tanlaymiz (bir-yoki 2-bosqichli)?
```

Foydalanuvchi tasdig'idan keyin — to'liq fayllar, PowerShell buyruqlar, git commit xabari.

---

### Tur B — Backend endpoint qo'shish

**Kirish:** "Xodimga PIN qayta tiklash tugmasi kerak."

**AI javobi shakli (avval kontrakt):**

```
1) KONTRAKT
   URL:     POST /api/xodimlar/<id>/pin-qayta-tikla/
   Auth:    JWT (permission: IsAdminOrKadr)
   Request: {} (bo'sh)
   Response 200: {"pin": "1234", "yaratilgan_vaqti": "2026-09-05T12:34:56Z"}
   Response 403: {"detail": "ruxsat yo'q"}
   Response 404: {"detail": "xodim topilmadi"}

2) FAYLLAR
   Backend: api/urls.py, api/views_ops.py, api/serializers.py,
            core/pin.py (logika bor), api/test_xodimlar.py
   Frontend: lib/api/xodimlar.ts (fetcher), components/XodimKarta.tsx (tugma)

3) MIGRATSIYA: yo'q

4) TESTLAR
   - test_pin_qayta_tiklash_happy
   - test_pin_qayta_tiklash_auth_yoq
   - test_pin_qayta_tiklash_boshqa_xodim_ruxsatsiz

>>> Rozimisiz?
```

Keyin — kod.

---

### Tur C — Olib tashlash

Master promt §6 va Skill 2 bo'yicha. Har olib tashlashda **yetim tekshiruvi** majburiy:

```powershell
grep -rn "PinQaytaTikla" .
grep -rn "pin-qayta-tikla" .
grep -rn "pinQaytaTikla" .
```

Natija bo'sh bo'lishi kerak.

---

### Tur D — Bag tuzatish

**Kirish:** "Xodim ro'yxati 500 xato qaytaryapti."

**Qadamlar:**
1. `grep -rn` bilan mos view'ni top.
2. Log qayerda? — foydalanuvchidan Render log yoki lokal `runserver` chiqishini so'ra.
3. Reproduction test yoz (avval qizil).
4. Tuzat.
5. Test yashil.
6. Regressiya testi qoladi.

---

### Tur E — Deploy

Skill 5 ishga tushadi. AI hech qachon o'z-o'zidan `git push` yoki deploy komandasi bermaydi — faqat menga tayyor buyruqlarni beradi.

---

## 2. FAYL YOZISH QOIDALARI

- **To'liq fayl** ber. Diff, "..." bilan qisqartirish, "shu joyni almashtir" — YO'Q.
- Fayl boshida yo'l izohi:
  ```typescript
  // app/verify/page.tsx
  ```
  yoki
  ```python
  # Bacend/api/views_ops.py
  ```
- TS uchun `any` ishlatma — aniq tip.
- Django view'larda `try/except` bilan aniq xato javoblari (`Response({"detail": "..."}, status=400)`).
- Serializer'da `read_only_fields`, `write_only_fields` aniq belgilangan.
- URL'larda trailing slash `/` — Django default.
- Frontend'da fetcher shabloni:
  ```typescript
  // lib/api/xodimlar.ts
  export type Xodim = { id: number; ism: string; familiya: string; is_active: boolean };
  export type XodimYaratRequest = { ism: string; familiya: string };

  export async function xodimlarniOl(): Promise<Xodim[]> {
    const r = await fetch(`${API_BASE}/api/xodimlar/`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
      cache: "no-store",
    });
    if (!r.ok) throw new ApiError(r.status, await r.text());
    return r.json();
  }
  ```

---

## 3. XATO IShLOV VA UZOQ CHIDAMLILIK

AI kod yozganda quyidagi holatlarni **avvaldan** hisobga oladi:

| Holat | Yechim |
|---|---|
| Network xato | try/catch + foydalanuvchi ko'radigan xato holati (toast, banner) |
| 401 | Refresh oqimi; ishlamasa — login sahifasiga yo'naltirish |
| 403 | "Ruxsat yo'q" xabari |
| 404 | Bo'sh holat (empty state) |
| 500 | "Server xatosi, keyinroq urinib ko'ring" + Sentry (agar bor bo'lsa) log |
| Face-service down | Fallback: xato bilan aniq xabar, tizim qulamasin |
| DB unique conflict | Serializer'da mos xato + frontend ko'rsatadi |
| Katta fayl yuklash | Client-side va server-side limit; progress |
| Bir vaqtda ikki yozuv | Optimistic lock yoki oxirgi yozuv ustuvor — aniq tanlash |
| Timezone | `USE_TZ = True`, hamma vaqt UTC saqlanadi, frontend Asia/Tashkent'da ko'rsatadi |

---

## 4. FRONTEND ↔ BACKEND SINXRON TEKSHIRUV (avtomatik)

Har o'zgartirishdan keyin AI **o'zi grep va tekshiruvlarni ishga tushirib, quyidagi jadvalni o'zi to'ldiradi** (foydalanuvchidan hech narsa so'ralmaydi):

| Endpoint | Method | Backend fayl | Frontend fetcher | TS tipi | Test | Holat |
|---|---|---|---|---|---|---|
| `/api/xodimlar/` | GET | `views_ops.py:XodimList` | `lib/api/xodimlar.ts:xodimlarniOl` | `Xodim[]` | `test_xodimlar.py:test_ruyxat` | ✅ |
| `/api/xodimlar/<id>/pin-qayta-tikla/` | POST | `views_ops.py:PinQaytaTikla` | `pinQaytaTikla` | `{pin, yaratilgan_vaqti}` | `test_xodimlar.py:test_pin_*` | ✅ |

Jadval to'liq mos bo'lmasa — AI o'zi tuzatadi, tugagach yana ko'rsatadi.

---

## 5. TESTING PIPELINE

**Lokal (PowerShell):**
```powershell
# Backend
cd "C:\Users\ANUBIS PC\Desktop\tb mains\tb mains\Tb Main\Bacend"
.\venv\Scripts\Activate.ps1
python manage.py test -v 2

# Frontend
cd "C:\Users\ANUBIS PC\Desktop\tb mains\tb mains\Tb Main"
npm run lint
npm run build
```

**Docker (integratsiya):**
```powershell
cd "C:\Users\ANUBIS PC\Desktop\tb mains\tb mains\Tb Main"
docker compose up --build -d
# smoke test
curl http://localhost/api/health/
docker compose down
```

**CI (agar keyinroq qo'shilsa):** GitHub Actions yoki Render'ning o'z pipeline'i. AI `render.yaml`'ni yangilaganda buyurtmani ham yangilashi shart.

---

## 6. DEPLOY OQIMI

Loyihada ikki mumkin variant:

### Variant 1 — Render + Vercel (asosiy)
- **Backend:** Render (`render.yaml`) — Django + gunicorn + PostgreSQL managed.
- **Frontend:** Vercel — Next.js 16.
- **Face-service:** Render alohida servis yoki DigitalOcean droplet.
- **Yagona buyruq:** `git push origin main` — ikkalasi ham avto-deploy.

### Variant 2 — DigitalOcean bitta droplet (Docker)
- `docker-compose.yml` + `Caddyfile` — hammasi bir serverda.
- `Bacend/dropletga-qoy.sh` skripti ishlatiladi.

**AI qoidasi:**
- Har o'zgartirishdan keyin — qaysi variant ishlatilsa, o'shanga aloqador fayllar mos ekanini tekshiradi.
- Env kalitlar ikki muhit uchun ham sinxron.
- Migratsiya deploy vaqtida avtomatik ishlashi kerak (Render'da build/post-deploy hook, Docker'da entrypoint).

---

## 7. XAVFSIZLIK QOIDALARI (AI hech qachon buzmaydi)

1. **Real secret'ni faylga yozib commit qilma.** Faqat `.env.local`'ga (u `.gitignore`'da).
2. **JWT secret** — kamida 64 belgi, faqat env.
3. **CORS** — `CORS_ALLOW_ALL_ORIGINS = True` prod'da hech qachon.
4. **DEBUG = False** prod'da; frontend'ga backend xato batafsili chiqmasin.
5. **CSRF** — DRF'da SessionAuthentication ishlatilsa CSRF token. JWT-only bo'lsa ehtiyot.
6. **SQL injection** — ORM ishlat, `raw()` faqat parametrlangan.
7. **XSS** — React allaqachon escape qiladi; `dangerouslySetInnerHTML` ishlatma.
8. **Face embedding** va PIN'lar — hech qachon frontend log yoki javobga xom chiqmasin.
9. **Fayl yuklash** — MIME va o'lcham chek; Django'da `FileField` orqali.
10. **Rate limit** — kritik endpoint'larga (login, pin-tekshir) DRF throttling qo'shish.

---

## 8. FOYDALANUVCHI BILAN MULOQOT USLUBI

- **Har javob boshida** — bir jumla xulosa: "Xodim formasidan telefon maydonini olib tashlash rejasi tayyor, tasdig'ingizni kutaman."
- **Kod bloklari** — til belgisi bilan (```` ```typescript ````, ```` ```python ````, ```` ```powershell ````).
- **Fayl yo'llari** — Windows shakli: `Bacend\api\urls.py` yoki `Bacend/api/urls.py` (Unix ham qabul).
- **O'zbekcha xato xabarlari:** foydalanuvchiga ko'ringan matn o'zbek tilida ("Xodim topilmadi", "Ruxsat yo'q").
- **Ingliz atamalar:** faqat texnik kontekstda (`serializer`, `endpoint`, `migration`).
- **Emoji yo'q.** Kod izohlarida ham.
- **Faraz yo'q, savol bor.** Har noaniq joyda — savol.

---

## 9. AI O'Z-O'ZINI TEKSHIRISH RO'YXATI

Har topshiriqni yakunlashdan avval AI o'ziga savol beradi:

- [ ] Master Prompt qoidalari buzilmadimi? (til, faraz yo'q, to'liq fayl, PowerShell)
- [ ] Frontend ↔ backend sinxron jadvali to'liq mos?
- [ ] Testlar yozildi va yashilmi (yoki menga tekshirish uchun aniq buyruq berildimi)?
- [ ] Migratsiya kerak bo'lsa, xavfsiz bosqichli variantmi?
- [ ] `.env.example` yangilandimi (agar yangi kalit qo'shilgan bo'lsa)?
- [ ] Deploy oqimi (Render/Vercel/Docker) buzilmadimi?
- [ ] Git commit xabari tayyormi?
- [ ] Yetim kod (grep tekshiruv) qolmadi?

Agar biror `[ ]` "yo'q" bo'lsa — AI tuzatadi va yana tekshiradi.

---

## 10. FAYLLARNI JOYLASH BO'YICHA TAVSIYA

Loyiha ildizida quyidagilarni yaratish tavsiya qilinadi:

```
Tb Main/
├─ AGENTS.md              # (bor) — qisqa AI kontrakti, master promt havolasi
├─ CLAUDE.md              # Master Prompt (§1 hujjat) to'liq nusxasi
├─ .claude/
│  └─ skills/             # Ixtiyoriy, Claude Code Skills formati
│     ├─ screenshot-orqali-uzgartirish/SKILL.md
│     ├─ olib-tashlash-xavfsiz/SKILL.md
│     ├─ endpoint-qushish/SKILL.md
│     └─ ... (Skills hujjatidagi 12 ta)
└─ docs/
   ├─ AI_ISHLASH.md       # Shu (§3) hujjat
   └─ SINXRON_JADVAL.md   # Frontend↔backend endpoint jadvali
```

Cowork chat orqali ishlatilsa: uchala hujjatni suhbat boshida joylash yetarli.

---

## 11. YAKUNIY MANTRALAR

1. **Reja → tasdiq → kod → test → sinxron tekshiruv → commit.**
2. **Frontend va backend har doim 100% mos — moslikni AI o'zi tekshiradi.**
3. **Deploy — bitta buyruq bilan, xatosiz. Tayyorlikni AI o'zi tasdiqlaydi.**
4. **Faraz qilma — so'ra.**
5. **To'liq fayl. PowerShell. O'zbek (lotin).**
6. **Tekshiruv foydalanuvchiga tashlanmaydi. AI to'liq mas'ul.**
