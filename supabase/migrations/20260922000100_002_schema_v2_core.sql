/*
# Pratha schema v2 — core (reference data, identity, discovery content)

Replaces the unused Firebase-keyed prototype schema (001). Ownership is now
`user_id uuid references auth.users`. Translatable text is jsonb {en, ml, hi}.
Money is integer paise. Publishable content uses content_status.
*/

-- ---------------------------------------------------------------------------
-- Preserve the Firebase-keyed prototype for an explicit, audited import.
-- ---------------------------------------------------------------------------
create schema if not exists legacy;
revoke all on schema legacy from public, anon, authenticated;
alter table public.family_members set schema legacy;
alter table public.puja_bookings set schema legacy;
alter table public.seva_contributions set schema legacy;
alter table public.pujas set schema legacy;
alter table public.welfare_updates set schema legacy;
alter table public.animals set schema legacy;
alter table public.gaushalas set schema legacy;
alter table public.profiles set schema legacy;

create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.app_language as enum ('en', 'ml', 'hi');
create type public.app_role as enum ('super_admin', 'editor', 'temple_admin', 'gaushala_admin', 'gaushala_staff', 'vet');
create type public.role_scope as enum ('global', 'temple', 'gaushala');
create type public.category_kind as enum ('event', 'puja', 'seva');
create type public.stream_provider as enum ('youtube', 'website', 'other');
create type public.media_entity as enum ('temple', 'event', 'festival', 'gaushala', 'animal', 'campaign', 'welfare_update');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.i18n_text(v jsonb, lang text default 'en')
returns text language sql immutable as $$
  select coalesce(v ->> lang, v ->> 'en', v ->> 'ml', v ->> 'hi')
$$;

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------
create table public.states (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_i18n jsonb not null,
  name text generated always as (name_i18n ->> 'en') stored
);

create table public.districts (
  id uuid primary key default gen_random_uuid(),
  state_id uuid not null references public.states(id) on delete cascade,
  slug text unique not null,
  name_i18n jsonb not null,
  name text generated always as (name_i18n ->> 'en') stored,
  sort int not null default 0
);
create index districts_state_idx on public.districts(state_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  kind public.category_kind not null,
  slug text not null,
  name_i18n jsonb not null,
  name text generated always as (name_i18n ->> 'en') stored,
  icon text,
  sort int not null default 0,
  unique (kind, slug)
);

create table public.devaswom_boards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_i18n jsonb not null,
  name text generated always as (name_i18n ->> 'en') stored,
  website text
);

create table public.breeds (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_i18n jsonb not null,
  name text generated always as (name_i18n ->> 'en') stored,
  description_i18n jsonb,
  traits jsonb not null default '{}'::jsonb,
  is_indigenous boolean not null default true
);

create table public.feed_types (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_i18n jsonb not null,
  name text generated always as (name_i18n ->> 'en') stored,
  category text not null check (category in ('green', 'dry', 'concentrate', 'byproduct')),
  unit text not null default 'kg'
);

create table public.vaccine_types (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_i18n jsonb not null,
  name text generated always as (name_i18n ->> 'en') stored,
  interval_days int not null default 365,
  season_hint text
);

create table public.veterinary_contacts (
  id uuid primary key default gen_random_uuid(),
  district_id uuid references public.districts(id) on delete set null,
  kind text not null check (kind in ('govt_hospital', 'private', 'helpline', 'kvasu', 'ahd_office')),
  name text not null,
  phone text,
  address text,
  hours text,
  sort int not null default 0
);

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  phone text,
  gotra text,
  nakshatra text,
  city text,
  district_id uuid references public.districts(id) on delete set null,
  preferred_language public.app_language not null default 'en',
  avatar_path text,
  legacy_firebase_uid text unique,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  scope_type public.role_scope not null default 'global',
  scope_id uuid,
  created_at timestamptz not null default now(),
  unique (user_id, role, scope_type, scope_id)
);
create index user_roles_user_idx on public.user_roles(user_id);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relation text,
  gotra text,
  nakshatra text,
  dob date,
  created_at timestamptz not null default now()
);
create index family_members_user_idx on public.family_members(user_id);

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('web', 'android', 'ios')),
  token text not null,
  last_seen timestamptz not null default now(),
  unique (user_id, token)
);

create table public.saved_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, entity_type, entity_id)
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, phone, legacy_firebase_uid)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.phone,
    new.raw_user_meta_data ->> 'legacy_firebase_uid'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helpers used by RLS
create or replace function public.has_role(r public.app_role, s_type public.role_scope default null, s_id uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = r
      and (
        ur.scope_type = 'global'
        or (s_id is not null and ur.scope_type = s_type and ur.scope_id = s_id)
      )
  )
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role in ('super_admin', 'editor') and ur.scope_type = 'global'
  )
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'super_admin')
$$;

create or replace function public.manages_temple(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'temple_admin' and ur.scope_type = 'temple' and ur.scope_id = t
  )
$$;

create or replace function public.manages_gaushala(g uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role in ('gaushala_admin', 'gaushala_staff', 'vet')
      and ur.scope_type = 'gaushala' and ur.scope_id = g
  )
$$;

create or replace function public.is_gaushala_admin(g uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'gaushala_admin' and ur.scope_type = 'gaushala' and ur.scope_id = g
  )
$$;

-- ---------------------------------------------------------------------------
-- Discovery content: temples, festivals, events, live streams, media, editorial
-- ---------------------------------------------------------------------------
create table public.temples (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_i18n jsonb not null,
  name text generated always as (name_i18n ->> 'en') stored,
  deity_i18n jsonb,
  description_i18n jsonb,
  district_id uuid references public.districts(id) on delete set null,
  address text,
  lat double precision,
  lng double precision,
  devaswom_board_id uuid references public.devaswom_boards(id) on delete set null,
  timings jsonb not null default '[]'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  website text,
  live_stream_url text,
  live_stream_provider public.stream_provider,
  cover_image_url text,
  has_gaushala boolean not null default false,
  featured boolean not null default false,
  status public.content_status not null default 'draft',
  search_tsv tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name_i18n ->> 'en', '') || ' ' || coalesce(name_i18n ->> 'ml', '') || ' ' || coalesce(name_i18n ->> 'hi', '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(deity_i18n ->> 'en', '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description_i18n ->> 'en', '') || ' ' || coalesce(address, '')), 'C')
  ) stored,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index temples_status_idx on public.temples(status);
create index temples_district_idx on public.temples(district_id);
create index temples_tsv_idx on public.temples using gin(search_tsv);
create index temples_name_trgm_idx on public.temples using gin (name gin_trgm_ops);
create trigger temples_updated before update on public.temples for each row execute function public.set_updated_at();

create table public.festivals (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_i18n jsonb not null,
  name text generated always as (name_i18n ->> 'en') stored,
  summary_i18n jsonb,
  body_i18n jsonb,
  month_hint text,
  cover_image_url text,
  featured boolean not null default false,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger festivals_updated before update on public.festivals for each row execute function public.set_updated_at();

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_i18n jsonb not null,
  title text generated always as (title_i18n ->> 'en') stored,
  description_i18n jsonb,
  activities_i18n jsonb not null default '[]'::jsonb,
  category_id uuid references public.categories(id) on delete set null,
  secondary_category_id uuid references public.categories(id) on delete set null,
  temple_id uuid references public.temples(id) on delete set null,
  gaushala_id uuid,
  festival_id uuid references public.festivals(id) on delete set null,
  district_id uuid references public.districts(id) on delete set null,
  venue_name text,
  venue_address text,
  lat double precision,
  lng double precision,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  daily_start_time time,
  daily_end_time time,
  is_free boolean not null default true,
  ticket_info_i18n jsonb,
  organiser jsonb not null default '{}'::jsonb,
  how_to_reach_i18n jsonb,
  live_stream_url text,
  cover_image_url text,
  featured boolean not null default false,
  status public.content_status not null default 'draft',
  search_tsv tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title_i18n ->> 'en', '') || ' ' || coalesce(title_i18n ->> 'ml', '') || ' ' || coalesce(title_i18n ->> 'hi', '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description_i18n ->> 'en', '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(venue_name, '') || ' ' || coalesce(venue_address, '')), 'C')
  ) stored,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);
create index events_status_start_idx on public.events(status, starts_at);
create index events_district_idx on public.events(district_id);
create index events_category_idx on public.events(category_id);
create index events_temple_idx on public.events(temple_id);
create index events_tsv_idx on public.events using gin(search_tsv);
create index events_title_trgm_idx on public.events using gin (title gin_trgm_ops);
create trigger events_updated before update on public.events for each row execute function public.set_updated_at();

create table public.live_streams (
  id uuid primary key default gen_random_uuid(),
  temple_id uuid references public.temples(id) on delete cascade,
  title_i18n jsonb not null,
  title text generated always as (title_i18n ->> 'en') stored,
  url text not null,
  provider public.stream_provider not null default 'youtube',
  schedule jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index live_streams_temple_idx on public.live_streams(temple_id);
create trigger live_streams_updated before update on public.live_streams for each row execute function public.set_updated_at();

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'public-media',
  path text not null,
  entity_type public.media_entity not null,
  entity_id uuid not null,
  alt_i18n jsonb,
  width int,
  height int,
  sort int not null default 0,
  is_cover boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index media_assets_entity_idx on public.media_assets(entity_type, entity_id);

create table public.editorial_blocks (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('panchang_daily', 'wisdom', 'announcement', 'home_hero')),
  for_date date,
  payload_i18n jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index editorial_blocks_kind_date_idx on public.editorial_blocks(kind, for_date);
create trigger editorial_updated before update on public.editorial_blocks for each row execute function public.set_updated_at();
