-- =====================================================================
-- 0004 — DEPO_STATE: butun ilova holatini (frontend `DB` obyekti) saqlash
--
-- Nega bunday: frontend (`lib/store.tsx`) butun ilova davomida bitta
-- `DB` obyektini localStorage'da saqlab kelgan (barcha amallar — ariza,
-- jurnal, ombor, KIP va h.k. — shu obyektni bevosita oʻzgartiradi).
-- Bu jadval xuddi shu mexanizmni serverga koʻchiradi: har bir oʻzgarishdan
-- keyin butun `DB` JSON sifatida shu yerga yoziladi, kirishda esa shu
-- yerdan oʻqiladi. Loyihaning ariza/jurnal/ruxsat va hokazo BIZNES
-- MANTIG'I lib/logic.ts va lib/store.tsx'da — oʻzgarmagan, faqat qayerda
-- saqlanishi (brauzer → server/Postgres) oʻzgardi.
--
-- Kelajakda koʻp foydalanuvchi bir vaqtda yozganda "oxirgi yozuv gʻolib"
-- boʻladi (optimistic concurrency yoʻq) — kichik jamoa (bitta depo) uchun
-- yetarli. Kengroq foydalanish uchun keyingi bosqichda jadval-jadval
-- (granular) API'ga oʻtish tavsiya etiladi.
-- =====================================================================

create table if not exists depo_state (
  depo_id    uuid primary key references depos(id) on delete cascade,
  data       jsonb not null,
  updated_by uuid references users(id),
  updated_at timestamptz not null default now()
);

comment on table depo_state is
  'Butun ilova holati (frontend DB obyekti) — depo boʻyicha bitta JSON qator. Har bir mutatsiyadan keyin toʻliq qayta yoziladi.';

-- Migratsiya oxiri.
