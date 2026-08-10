-- =====================================================================
-- TB tizimi — boshlangʻich sxema (Supabase / PostgreSQL 16)
-- «TEMIRYOʻLINFRATUZILMA» AJ, Buxoro lokomotiv deposi (TCH-6)
-- Versiya: 0001 · 06.08.2026
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ---------------------------------------------------------------------
-- ENUM turlari
-- ---------------------------------------------------------------------
create type tb_role as enum (
  'admin','depo_boshligi','bosh_xisobchi','bugalter',
  'tb_xodim','ombor_mudiri','yoriqchi','sex_boshligi','ishchi'
);

create type tb_request_status as enum (
  'DRAFT','SUBMITTED','ACCOUNTANT_APPROVED','CHIEF_APPROVED',
  'HEAD_APPROVED','ISSUED','RECEIVED','COMPLETED','REJECTED'
);

create type tb_request_kind as enum ('oddiy','yangi_ishchi');
create type tb_unit        as enum ('dona','kg','metr','sm','juft');
create type tb_size_kind   as enum ('kiyim','poyabzal','bosh_kiyim','yoq');
create type tb_doc_type    as enum ('journal','requisition','card','kip','talon','stock_in');
create type tb_move_kind   as enum ('kirim','chiqim','qaytarim','hisobdan_chiqarish');
create type tb_exam_result as enum ('otdi','otmadi','kutilmoqda');
create type tb_talon_act   as enum ('olindi','qaytarildi');

-- ---------------------------------------------------------------------
-- 1. DEPOLAR (multi-depo asos)
-- ---------------------------------------------------------------------
create table depos (
  id           uuid primary key default gen_random_uuid(),
  kod          text not null unique,              -- TCH-6
  nomi         text not null,                     -- Buxoro lokomotiv deposi
  tashkilot    text not null default '«TEMIRYOʻLINFRATUZILMA» AJ',
  qish_boshi   text not null default '09-15',     -- MM-DD
  qish_oxiri   text not null default '04-15',     -- MM-DD
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted      boolean not null default false
);

-- ---------------------------------------------------------------------
-- 2. LAVOZIMLAR (31-ilova)
-- ---------------------------------------------------------------------
create table positions (
  id         uuid primary key default gen_random_uuid(),
  depo_id    uuid not null references depos(id) on delete restrict,
  tartib     int  not null,
  nomi       text not null,
  formulyar  boolean not null default false,      -- KIP yuritiladimi (mashinist/yordamchi)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted    boolean not null default false,
  unique (depo_id, tartib)
);
create index idx_positions_depo on positions(depo_id) where deleted = false;

-- ---------------------------------------------------------------------
-- 3. KOLONNALAR (mashinistlar guruhi)
-- ---------------------------------------------------------------------
create table colonnas (
  id         uuid primary key default gen_random_uuid(),
  depo_id    uuid not null references depos(id) on delete restrict,
  nomi       text not null,                        -- El. mashinist / yordamchi
  tavsif     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted    boolean not null default false,
  unique (depo_id, nomi)
);

-- ---------------------------------------------------------------------
-- 4. FOYDALANUVCHILAR / ISHCHILAR
-- ---------------------------------------------------------------------
create table users (
  id             uuid primary key default gen_random_uuid(),
  auth_id        uuid unique,                      -- supabase auth.users.id
  depo_id        uuid not null references depos(id) on delete restrict,
  tabel          text not null,
  familiya       text not null,
  ism            text not null,
  otasi          text,
  position_id    uuid references positions(id),
  colonna_id     uuid references colonnas(id),
  yoriqchi_id    uuid references users(id),        -- ishchining yoʻriqchisi
  sex            text,                             -- sex / boʻlim
  ish_joyi       text,
  kirgan_sana    date,
  telefon        text,
  roles          tb_role[] not null default '{ishchi}',
  pin_hash       text,
  imzo_url       text,                             -- ekranda chizilgan imzo (PNG)
  face_vector    vector(512),                      -- InsightFace embedding
  face_url       text,
  qurilma_id     text,
  faol           boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted        boolean not null default false,
  unique (depo_id, tabel)
);
create index idx_users_depo     on users(depo_id) where deleted = false;
create index idx_users_position on users(depo_id, position_id);
create index idx_users_colonna  on users(depo_id, colonna_id);
create index idx_users_fio      on users using gin (to_tsvector('simple', familiya||' '||ism||' '||coalesce(otasi,'')));

-- Antropometriya (MB-6 №10)
create table user_sizes (
  user_id            uuid primary key references users(id) on delete cascade,
  jinsi              text check (jinsi in ('erkak','ayol')),
  boyi               int,
  kiyim_olchami      text,
  poyabzal_olchami   text,
  bosh_kiyim_olchami text,
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. NOMENKLATURA VA OMBOR
-- ---------------------------------------------------------------------
create table items (
  id         uuid primary key default gen_random_uuid(),
  depo_id    uuid not null references depos(id) on delete restrict,
  kod        text not null,                        -- nomenklatura kodi
  nomi       text not null,
  unit       tb_unit not null default 'dona',
  size_kind  tb_size_kind not null default 'yoq',
  qishki     boolean not null default false,
  narx       numeric(14,2) not null default 0,
  arxiv      boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted    boolean not null default false,
  unique (depo_id, kod)
);
create index idx_items_depo on items(depo_id) where deleted = false;

-- Oʻlcham boʻyicha haqiqiy qoldiq
create table item_variants (
  id          uuid primary key default gen_random_uuid(),
  depo_id     uuid not null references depos(id) on delete restrict,
  item_id     uuid not null references items(id) on delete cascade,
  olcham      text not null default '-',           -- 48, 52, 42, '-' (oʻlchamsiz)
  qoldiq      numeric(14,3) not null default 0,
  min_qoldiq  numeric(14,3) not null default 0,
  foydalanilgan boolean not null default false,    -- qaytarilgan, yaroqli buyum
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted     boolean not null default false,
  unique (item_id, olcham, foydalanilgan)
);
create index idx_variants_depo on item_variants(depo_id, item_id);

-- ---------------------------------------------------------------------
-- 6. NORMALAR (lavozim → buyum → muddat)
-- «Навбатчи» turi tizimga kiritilmaydi (kelishuv, 06.08.2026)
-- ---------------------------------------------------------------------
create table norms (
  id          uuid primary key default gen_random_uuid(),
  depo_id     uuid not null references depos(id) on delete restrict,
  position_id uuid not null references positions(id) on delete cascade,
  item_id     uuid not null references items(id)     on delete cascade,
  muddat_oy   int,                                  -- null = «Иш. Чиққун»
  qishki      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted     boolean not null default false,
  unique (position_id, item_id, qishki)
);
create index idx_norms_position on norms(depo_id, position_id) where deleted = false;

-- ---------------------------------------------------------------------
-- 7. QR IMZOLAR
-- ---------------------------------------------------------------------
create table signatures (
  id         uuid primary key default gen_random_uuid(),
  depo_id    uuid not null references depos(id) on delete restrict,
  user_id    uuid not null references users(id),
  doc_type   tb_doc_type not null,
  doc_id     uuid not null,
  field      text,                                  -- maydon raqami (masalan '05')
  sana       timestamptz not null default now(),
  payload    jsonb not null,                        -- imzolangan maʼlumot
  imzo       text not null,                         -- ECDSA base64
  bekor      boolean not null default false,
  bekor_sabab text
);
create index idx_sign_doc on signatures(doc_type, doc_id);

-- ---------------------------------------------------------------------
-- 8. MB-6 KARTOCHKA
-- ---------------------------------------------------------------------
create table cards (
  id            uuid primary key default gen_random_uuid(),
  depo_id       uuid not null references depos(id) on delete restrict,
  user_id       uuid not null references users(id) on delete cascade,
  ochilgan_sana date not null default current_date,
  ochgan_id     uuid references users(id),          -- TB xodimi
  imzo_tb       uuid references signatures(id),     -- 16
  imzo_sex      uuid references signatures(id),     -- 17
  imzo_xisobchi uuid references signatures(id),     -- 18
  holat         text not null default 'faol',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted       boolean not null default false,
  unique (user_id)
);

-- «Berilgan» boʻlimi (21–25)
create table card_issues (
  id              uuid primary key default gen_random_uuid(),
  depo_id         uuid not null references depos(id),
  card_id         uuid not null references cards(id) on delete cascade,
  item_variant_id uuid not null references item_variants(id),
  request_id      uuid,
  sana            date not null default current_date,
  soni            numeric(14,3) not null,
  yaroqlilik      int not null default 100,
  imzo_ishchi     uuid references signatures(id),
  migratsiya      boolean not null default false,   -- qogʻozdan koʻchirilgan
  created_at      timestamptz not null default now(),
  deleted         boolean not null default false
);
create index idx_issues_card on card_issues(card_id);

-- «Qaytarilgan» boʻlimi (26–30)
create table card_returns (
  id              uuid primary key default gen_random_uuid(),
  depo_id         uuid not null references depos(id),
  card_id         uuid not null references cards(id) on delete cascade,
  item_variant_id uuid not null references item_variants(id),
  sabab           text not null,                    -- ishdan boʻshash / lavozim / yaroqsiz
  sana            date not null default current_date,
  soni            numeric(14,3) not null,
  yaroqlilik      int not null default 0,
  imzo_ishchi     uuid references signatures(id),
  imzo_ombor      uuid references signatures(id),
  created_at      timestamptz not null default now(),
  deleted         boolean not null default false
);

-- ---------------------------------------------------------------------
-- 9. ARIZALAR
-- ---------------------------------------------------------------------
create table requests (
  id           uuid primary key default gen_random_uuid(),
  depo_id      uuid not null references depos(id) on delete restrict,
  raqam        text not null,                       -- TCH6-2026-00001
  user_id      uuid not null references users(id),  -- kimga
  yaratgan_id  uuid not null references users(id),  -- kim yubordi
  turi         tb_request_kind not null default 'oddiy',
  status       tb_request_status not null default 'SUBMITTED',
  royxat_raqam text,                                -- Требование №13
  yaratilgan   timestamptz not null default now(),
  yakunlangan  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted      boolean not null default false,
  unique (depo_id, raqam)
);
create index idx_req_status on requests(depo_id, status) where deleted = false;
create index idx_req_user   on requests(depo_id, user_id);

create table request_items (
  id              uuid primary key default gen_random_uuid(),
  request_id      uuid not null references requests(id) on delete cascade,
  item_id         uuid not null references items(id),
  olcham          text not null default '-',
  item_variant_id uuid references item_variants(id),
  soralgan        numeric(14,3) not null,
  berilgan        numeric(14,3),
  unit            tb_unit not null default 'dona',
  narx            numeric(14,2) not null default 0
);
create index idx_reqitems_req on request_items(request_id);

-- Tasdiqlash zanjiri va rad sabablari
create table request_steps (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  from_status tb_request_status,
  to_status   tb_request_status not null,
  user_id    uuid not null references users(id),
  qaror      text not null,                         -- tasdiq | rad | berdi | oldi
  izoh       text,                                  -- rad sababi (majburiy, depo boshligʻidan tashqari)
  imzo_id    uuid references signatures(id),
  sana       timestamptz not null default now()
);
create index idx_steps_req on request_steps(request_id);

-- ---------------------------------------------------------------------
-- 10. OMBOR HARAKATI
-- ---------------------------------------------------------------------
create table stock_in (
  id              uuid primary key default gen_random_uuid(),
  depo_id         uuid not null references depos(id),
  nakladnaya      text not null,
  sana            date not null default current_date,
  yetkazib_beruvchi text,
  imzo_id         uuid references signatures(id),
  created_by      uuid references users(id),
  created_at      timestamptz not null default now(),
  deleted         boolean not null default false
);

create table stock_in_items (
  id              uuid primary key default gen_random_uuid(),
  stock_in_id     uuid not null references stock_in(id) on delete cascade,
  item_variant_id uuid not null references item_variants(id),
  soni            numeric(14,3) not null,
  narx            numeric(14,2) not null default 0
);

create table stock_moves (
  id              uuid primary key default gen_random_uuid(),
  depo_id         uuid not null references depos(id),
  item_variant_id uuid not null references item_variants(id),
  turi            tb_move_kind not null,
  soni            numeric(14,3) not null,
  hujjat_id       uuid,
  izoh            text,
  user_id         uuid references users(id),
  sana            timestamptz not null default now()
);
create index idx_moves_variant on stock_moves(depo_id, item_variant_id, sana desc);

-- ---------------------------------------------------------------------
-- 11. TB JURNALLARI (Yo D-26)
-- ---------------------------------------------------------------------
create table journal_entries (
  id             uuid primary key default gen_random_uuid(),
  depo_id        uuid not null references depos(id),
  bosqich        smallint not null check (bosqich in (1,2)),   -- 1-kitob / 2-kitob
  sana           date not null default current_date,           -- 1
  komissiya      jsonb not null default '[]',                  -- 2 [{fio,lavozim,user_id}]
  nomuvofiqlik   text not null,                                -- 3
  chora          text not null,                                -- 4
  masul_id       uuid references users(id),                    -- 5
  masul_fio      text,
  masul_lavozim  text,
  muddat         date,                                         -- 6
  bajarildi      boolean not null default false,               -- 7
  bajarilgan_izoh text,
  imzo_id        uuid references signatures(id),
  created_by     uuid references users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted        boolean not null default false
);
create index idx_journal on journal_entries(depo_id, bosqich, sana desc) where deleted = false;

-- ---------------------------------------------------------------------
-- 12. TALONLAR
-- ---------------------------------------------------------------------
create table talons (
  id         uuid primary key default gen_random_uuid(),
  depo_id    uuid not null references depos(id),
  user_id    uuid not null references users(id) on delete cascade,
  raqam      smallint not null check (raqam in (1,2,3)),
  olingan    boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, raqam)
);

create table talon_history (
  id         uuid primary key default gen_random_uuid(),
  talon_id   uuid not null references talons(id) on delete cascade,
  amal       tb_talon_act not null,
  sabab      text not null,
  tb_xodim_id uuid not null references users(id),
  imzo_id    uuid references signatures(id),
  sana       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 13. IMTIXON
-- ---------------------------------------------------------------------
create table exams (
  id            uuid primary key default gen_random_uuid(),
  depo_id       uuid not null references depos(id),
  user_id       uuid not null references users(id) on delete cascade,
  sana          date,
  natija        tb_exam_result not null default 'kutilmoqda',
  davriylik_oy  int not null default 12,            -- standart 1 yil
  keyingi_sana  date,
  belgilagan_id uuid references users(id),          -- TB xodimi (individual davr)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_exams_next on exams(depo_id, keyingi_sana);

-- ---------------------------------------------------------------------
-- 14. KIP
-- ---------------------------------------------------------------------
create table kips (
  id          uuid primary key default gen_random_uuid(),
  depo_id     uuid not null references depos(id),
  user_id     uuid not null references users(id) on delete cascade,
  yoriqchi_id uuid not null references users(id),
  colonna_id  uuid references colonnas(id),
  liniya      text not null,
  sana        date not null default current_date,
  muddat_oy   int not null check (muddat_oy in (1,3,6)),
  tugash      date not null,
  imzo_id     uuid references signatures(id),
  created_at  timestamptz not null default now(),
  deleted     boolean not null default false
);
create index idx_kips_tugash on kips(depo_id, tugash);

-- ---------------------------------------------------------------------
-- 15. HUJJATLAR (PDF arxiv)
-- ---------------------------------------------------------------------
create table documents (
  id         uuid primary key default gen_random_uuid(),
  depo_id    uuid not null references depos(id),
  doc_type   tb_doc_type not null,
  doc_id     uuid not null,
  raqam      text,
  pdf_url    text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 16. BILDIRISHNOMALAR
-- ---------------------------------------------------------------------
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  depo_id    uuid not null references depos(id),
  user_id    uuid not null references users(id) on delete cascade,
  turi       text not null,
  sarlavha   text not null,
  matn       text,
  oqilgan    boolean not null default false,
  sana       timestamptz not null default now()
);
create index idx_notif_user on notifications(user_id, oqilgan, sana desc);

-- ---------------------------------------------------------------------
-- 17. AUDIT LOG
-- ---------------------------------------------------------------------
create table audit_log (
  id        uuid primary key default gen_random_uuid(),
  depo_id   uuid references depos(id),
  user_id   uuid references users(id),
  amal      text not null,
  jadval    text,
  yozuv_id  uuid,
  eski      jsonb,
  yangi     jsonb,
  ip        inet,
  qurilma   text,
  sana      timestamptz not null default now()
);
create index idx_audit_sana on audit_log(depo_id, sana desc);

-- ---------------------------------------------------------------------
-- 18. SOZLAMALAR VA RUXSATLAR
-- ---------------------------------------------------------------------
create table settings (
  depo_id  uuid not null references depos(id) on delete cascade,
  kalit    text not null,
  qiymat   jsonb not null,
  primary key (depo_id, kalit)
);

create table permissions (
  depo_id  uuid not null references depos(id) on delete cascade,
  role     tb_role not null,
  perm     text not null,
  yoqilgan boolean not null default true,
  primary key (depo_id, role, perm)
);

-- ---------------------------------------------------------------------
-- 19. TRIGGERLAR
-- ---------------------------------------------------------------------
create or replace function tb_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'depos','positions','colonnas','users','items','item_variants','norms',
    'cards','requests','journal_entries','exams'
  ] loop
    execute format('create trigger trg_%1$s_touch before update on %1$s
                    for each row execute function tb_touch()', t);
  end loop;
end $$;

-- Qoldiqni harakat asosida yangilash
create or replace function tb_apply_move() returns trigger language plpgsql as $$
begin
  update item_variants
     set qoldiq = qoldiq + case when new.turi in ('kirim','qaytarim') then new.soni else -new.soni end
   where id = new.item_variant_id;
  return new;
end $$;
create trigger trg_move_apply after insert on stock_moves
for each row execute function tb_apply_move();

-- ---------------------------------------------------------------------
-- 20. YORDAMCHI KOʻRINISHLAR
-- ---------------------------------------------------------------------
-- Ishchining har bir norma boʻyicha holati: yashil / sariq / qizil
create or replace view v_worker_norm_status as
select
  u.id            as user_id,
  u.depo_id,
  n.item_id,
  n.muddat_oy,
  n.qishki,
  max(ci.sana)    as oxirgi_olish,
  case
    when n.muddat_oy is null then null
    else (max(ci.sana) + (n.muddat_oy || ' months')::interval)::date
  end             as keyingi_sana,
  case
    when max(ci.sana) is null then 'qizil'
    when n.muddat_oy is null  then 'yashil'
    when (max(ci.sana) + (n.muddat_oy || ' months')::interval)::date < current_date then 'qizil'
    when (max(ci.sana) + (n.muddat_oy || ' months')::interval)::date <= current_date then 'sariq'
    else 'yashil'
  end             as holat
from users u
join norms n            on n.position_id = u.position_id and n.deleted = false
left join cards c       on c.user_id = u.id
left join card_issues ci on ci.card_id = c.id and ci.deleted = false
     and ci.item_variant_id in (select id from item_variants where item_id = n.item_id)
where u.deleted = false and u.faol = true
group by u.id, u.depo_id, n.item_id, n.muddat_oy, n.qishki;

-- ---------------------------------------------------------------------
-- 21. RLS (Row Level Security)
-- ---------------------------------------------------------------------
create or replace function tb_my_depo() returns uuid language sql stable as $$
  select depo_id from users where auth_id = auth.uid() limit 1;
$$;

create or replace function tb_my_roles() returns tb_role[] language sql stable as $$
  select roles from users where auth_id = auth.uid() limit 1;
$$;

create or replace function tb_has_role(r tb_role) returns boolean language sql stable as $$
  select r = any(coalesce(tb_my_roles(), '{}'));
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'positions','colonnas','users','user_sizes','items','item_variants','norms',
    'signatures','cards','card_issues','card_returns','requests','request_items',
    'request_steps','stock_in','stock_in_items','stock_moves','journal_entries',
    'talons','talon_history','exams','kips','documents','notifications',
    'audit_log','settings','permissions'
  ] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Depo boʻyicha koʻrish (depo_id ustuni bor jadvallar)
do $$
declare t text;
begin
  foreach t in array array[
    'positions','colonnas','users','items','item_variants','norms','signatures',
    'cards','card_issues','card_returns','requests','stock_in','stock_moves',
    'journal_entries','talons','exams','kips','documents','audit_log',
    'settings','permissions'
  ] loop
    execute format($f$
      create policy %1$s_depo_read on %1$s for select
      using (depo_id = tb_my_depo() or tb_has_role('admin'))
    $f$, t);
  end loop;
end $$;

-- Yozish: service_role (API) orqali. Mijoz toʻgʻridan-toʻgʻri yozmaydi.
-- Bildirishnoma — faqat oʻziniki
create policy notif_own on notifications for select
  using (user_id in (select id from users where auth_id = auth.uid()));

-- ---------------------------------------------------------------------
-- 22. BOSHLANGʻICH DEPO
-- ---------------------------------------------------------------------
insert into depos (kod, nomi, tashkilot)
values ('TCH-6', 'Buxoro lokomotiv deposi', '«TEMIRYOʻLINFRATUZILMA» AJ')
on conflict (kod) do nothing;

insert into colonnas (depo_id, nomi)
select d.id, x.nomi from depos d,
  (values ('El. mashinist / yordamchi'),
          ('Teplovoz mashinist / yordamchi'),
          ('Manyovr teplovoz mashinist / yordamchi')) as x(nomi)
where d.kod = 'TCH-6'
on conflict do nothing;

insert into settings (depo_id, kalit, qiymat)
select d.id, k.kalit, k.qiymat::jsonb from depos d,
  (values ('qish_oyna',      '{"boshi":"09-15","oxiri":"04-15"}'),
          ('imtixon_davr',   '{"oy":12,"ogohlantirish_kun":10}'),
          ('kip_ranglar',    '{"3":"#22C55E","2":"#F59E0B","0":"#F97316","-1":"#B91C1C"}'),
          ('face_chegara',   '{"cosine":0.62}'),
          ('rad_izoh',       '{"majburiy_rollar":["bugalter","bosh_xisobchi","ombor_mudiri"],"istisno":["depo_boshligi"]}')
  ) as k(kalit, qiymat)
where d.kod = 'TCH-6'
on conflict do nothing;
