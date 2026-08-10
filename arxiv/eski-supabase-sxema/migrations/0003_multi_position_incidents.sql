-- =====================================================================
-- 0003 — Koʻp lavozim, lavozim darajasidagi ruxsat va TB/avariya xabarlari
--   · Ishchi bir nechta lavozimga ega boʻlishi mumkin (user_positions)
--   · access_overrides.scope ga 'position' qoʻshildi (rol < lavozim < shaxs)
--   · incidents — TB baxtsiz xodisalari / mashinist yoʻriqchisi avariyalari
-- Versiya: 0003 · frontend (Worker.positionIds, AccessState.positionOverrides,
--   IncidentEntry) bilan sinxron
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ISHCHI ↔ LAVOZIM (koʻp-koʻpga)
--    users.position_id — asosiy (birinchi) lavozim boʻlib qoladi (moslik uchun).
--    Barcha lavozimlar shu jadvalda; tartib = koʻrsatish tartibi (0 = asosiy).
-- ---------------------------------------------------------------------
create table if not exists user_positions (
  user_id     uuid not null references users(id) on delete cascade,
  position_id uuid not null references positions(id) on delete restrict,
  tartib      int not null default 0,
  created_at  timestamptz not null default now(),
  primary key (user_id, position_id)
);
create index if not exists idx_user_positions_user on user_positions(user_id);
create index if not exists idx_user_positions_pos  on user_positions(position_id);

-- Mavjud users.position_id qatorlarini backfill qilish (bitta lavozim, tartib=0)
insert into user_positions (user_id, position_id, tartib)
select id, position_id, 0 from users
where position_id is not null and deleted = false
on conflict (user_id, position_id) do nothing;

comment on table user_positions is
  'Ishchining barcha lavozimlari (bitta yoki bir nechta). users.position_id — asosiysi, moslik uchun saqlanadi.';

-- ---------------------------------------------------------------------
-- 2. ACCESS_OVERRIDES: lavozim darajasi qoʻshildi
--    Ustuvorlik (ilova kodida hisoblanadi): scope='user' > scope='position' > scope='role' > standart.
-- ---------------------------------------------------------------------
alter table access_overrides drop constraint if exists access_overrides_scope_check;
alter table access_overrides add constraint access_overrides_scope_check
  check (scope in ('role','position','user'));

comment on table access_overrides is
  'Rol/lavozim/shaxs boʻyicha ruxsat va koʻrinish override. Ustuvorlik: user > position > role > kod standarti.';

-- ---------------------------------------------------------------------
-- 3. INCIDENTS — TB baxtsiz xodisalari / mashinist yoʻriqchisi avariyalari
--    turi='tb'      → TB xodimi kiritadi (incident.tb.write ruxsati bilan)
--    turi='avariya' → mashinist yoʻriqchisi kiritadi (incident.avariya.write)
--    Yozuvlar eskisidan yangisiga qarab (created_at asc) koʻrsatiladi.
-- ---------------------------------------------------------------------
create table if not exists incidents (
  id         uuid primary key default gen_random_uuid(),
  depo_id    uuid not null references depos(id) on delete cascade,
  turi       text not null check (turi in ('tb','avariya')),
  matn       text not null,
  author_id  uuid not null references users(id),
  created_at timestamptz not null default now(),
  deleted    boolean not null default false
);
create index if not exists idx_incidents_depo on incidents(depo_id, turi, created_at) where deleted = false;

comment on table incidents is
  'TB xodimi kiritgan baxtsiz xodisalar (turi=tb) va mashinist yoʻriqchisi kiritgan avariyalar (turi=avariya) — matnli xabarlar, ruxsati borlarga koʻrinadi.';

-- RLS — boshqa depo_id ustunli jadvallar bilan bir xil qoida
alter table user_positions enable row level security;
alter table incidents enable row level security;

create policy user_positions_depo_read on user_positions for select
  using (
    exists (
      select 1 from users u
      where u.id = user_positions.user_id
        and (u.depo_id = tb_my_depo() or tb_has_role('admin'))
    )
  );

create policy incidents_depo_read on incidents for select
  using (depo_id = tb_my_depo() or tb_has_role('admin'));

-- Migratsiya oxiri.
