-- =====================================================================
-- 0002 — Frontend bilan moslashtirish + self-host qoʻshimchalari
--   · Ruxsat/koʻrinish override tizimi (rol + shaxs, perm + feature)
--   · Lavozim arxivi (soft-delete bilan mos)
--   · Yuz surati (prototip FaceID)
--   · JWT login uchun refresh tokenlar
-- Versiya: 0002 · frontend 1–3-bosqich bilan sinxron
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RUXSAT / KOʻRINISH OVERRIDE (frontend AccessState bilan bir xil)
--    scope='role'  → scope_id = rol nomi ('bugalter', ...)
--    scope='user'  → scope_id = users.id (uuid matn koʻrinishida)
--    kalit         → Perm ('journal.read') yoki FeatureKey ('card.kip','nav.tb'...)
--    qiymat        → true = majburan yoq, false = majburan yashir
--    Yoʻqligi      → kod ichidagi standart (ROLE_PERMS / ROLE_FEATURES)
-- ---------------------------------------------------------------------
create table if not exists access_overrides (
  depo_id    uuid not null references depos(id) on delete cascade,
  scope      text not null check (scope in ('role','user')),
  scope_id   text not null,
  kalit      text not null,
  qiymat     boolean not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references users(id),
  primary key (depo_id, scope, scope_id, kalit)
);
create index if not exists idx_access_scope on access_overrides(depo_id, scope, scope_id);

comment on table access_overrides is
  'Rol/shaxs boʻyicha ruxsat va koʻrinish override. Ustuvorlik: user > role > kod standarti.';

-- Eski `permissions` jadvali endi `access_overrides` (scope=role) bilan
-- birlashtiriladi. Uni oʻchirmaymiz (soft), lekin ilova access_overrides'ni ishlatadi.
comment on table permissions is 'DEPRECATED — oʻrniga access_overrides ishlatiladi.';

-- ---------------------------------------------------------------------
-- 2. LAVOZIM ARXIVI
--    Frontend `Position.arxiv` — bu yerda mavjud `deleted` bilan bir xil
--    maʼnoda (soft-delete). Aniqlik uchun alohida `arxiv` ustuni.
-- ---------------------------------------------------------------------
alter table positions add column if not exists arxiv boolean not null default false;
update positions set arxiv = deleted where arxiv is distinct from deleted;

-- ---------------------------------------------------------------------
-- 3. YUZ SURATI (prototip FaceID)
--    face_vector(512) va face_url allaqachon bor. Frontend base64
--    `faceImage` yuboradi — uni face_url (data URL yoki storage havolasi)
--    sifatida saqlaymiz. Qoʻshimcha ustun shart emas; izoh qoʻyamiz.
-- ---------------------------------------------------------------------
comment on column users.face_url is 'Yuz surati: storage havolasi yoki base64 data URL (prototip).';

-- ---------------------------------------------------------------------
-- 3b. PAROL (PIN) — majburiy almashtirish bayrogʻi
--     pin_hash allaqachon bor (0001). pin_reset = true boʻlsa ishchi
--     keyingi kirishda yangi PIN oʻrnatishga majbur.
-- ---------------------------------------------------------------------
alter table users add column if not exists pin_reset boolean not null default false;

-- ---------------------------------------------------------------------
-- 4. JWT REFRESH TOKENLAR (self-host login uchun)
-- ---------------------------------------------------------------------
create table if not exists auth_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  token_hash text not null,                 -- refresh token SHA-256
  qurilma    text,
  ip         inet,
  amal_qiladi timestamptz not null,         -- muddati
  bekor      boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_authtok_user on auth_tokens(user_id) where bekor = false;

-- ---------------------------------------------------------------------
-- 5. YANGI HUJJAT TURLARI (MB-6/kitobcha statik shakllar `documents`da
--    arxivlanadi; qoʻshimcha enum qiymat shart emas — mavjudlari yetarli).
--    Izoh: kitobcha = 'journal' doc_type ostida saqlanishi mumkin.
-- ---------------------------------------------------------------------

-- Migratsiya oxiri.
