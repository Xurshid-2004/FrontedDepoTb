-- =====================================================================
-- 0000 — SELF-HOST BOOTSTRAP (oʻz serveringizdagi oddiy PostgreSQL uchun)
--
-- 0001_init.sql Supabase'ning `auth.uid()` funksiyasiga tayanadi.
-- Oddiy Postgres'da bunday funksiya yoʻq. Bu fayl migratsiyalardan
-- OLDIN ishga tushib, `auth` sxemasi va stub `auth.uid()` yaratadi.
--
-- Docker'da avtomatik ishga tushadi (fayl nomi 0000_ boʻlgani uchun
-- 0001, 0002 dan oldin bajariladi).
--
-- Eslatma: ilova bazaga egasi (owner) sifatida ulanadi va RLS'ni
-- chetlab oʻtadi. Rol/depo tekshiruvi ilova kodida (API) amalga oshadi.
-- Stub funksiyalar RLS DDL xatosiz yaratilishi uchun kerak.
-- =====================================================================

create schema if not exists auth;

-- Supabase mosligi uchun stub: oddiy Postgres'da har doim NULL qaytaradi.
create or replace function auth.uid() returns uuid
  language sql stable as $$ select null::uuid $$;

-- pgvector kengaytmasi (face_vector(512) uchun).
-- Docker image: pgvector/pgvector:pg16 — kengaytma tayyor keladi.
create extension if not exists vector;
