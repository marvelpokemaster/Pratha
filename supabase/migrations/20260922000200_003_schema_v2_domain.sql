/*
# Pratha schema v2 — domain (Pooja, Gaushala registry, Seva, payments, notifications, AI, audit)
*/

create type public.offering_kind as enum ('vazhipadu', 'archana', 'abhishekam', 'gau_grasam', 'gau_pooja', 'ghee_offering', 'special');
create type public.booking_status as enum ('pending_payment', 'confirmed', 'performed', 'cancelled', 'refunded', 'failed');
create type public.payment_status as enum ('created', 'paid', 'failed', 'refunded');
create type public.payment_entity as enum ('booking', 'contribution');
create type public.animal_status as enum ('active', 'deceased', 'transferred', 'sold');
create type public.health_status as enum ('healthy', 'under_treatment', 'critical', 'quarantine');
create type public.health_event_kind as enum ('checkup', 'treatment', 'mastitis_check', 'foot_check', 'deworming', 'injury', 'calving', 'other');
create type public.alert_kind as enum ('pre_monsoon', 'vaccine_due', 'flood', 'mastitis_risk', 'low_feed');
create type public.alert_severity as enum ('info', 'warning', 'critical');
create type public.submission_status as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------------
-- Gaushala registry
-- ---------------------------------------------------------------------------
create table public.gaushalas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_i18n jsonb not null,
  name text generated always as (name_i18n ->> 'en') stored,
  description_i18n jsonb,
  district_id uuid references public.districts(id) on delete set null,
  address text,
  lat double precision,
  lng double precision,
  temple_id uuid references public.temples(id) on delete set null,
  devaswom_board_id uuid references public.devaswom_boards(id) on delete set null,
  registration_no text,
  contact jsonb not null default '{}'::jsonb,
  capacity int,
  founded_year int,
  transparency jsonb not null default '{"fund_use": {"fodder": 45, "medical": 25, "shelter": 20, "admin": 10}}'::jsonb,
  trust_score numeric(4,1) not null default 0,
  verified boolean not null default false,
  cover_image_url text,
  featured boolean not null default false,
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gaushalas_status_idx on public.gaushalas(status);
create index gaushalas_district_idx on public.gaushalas(district_id);
create trigger gaushalas_updated before update on public.gaushalas for each row execute function public.set_updated_at();
alter table public.events add constraint events_gaushala_fk foreign key (gaushala_id) references public.gaushalas(id) on delete set null;

create table public.animals (
  id uuid primary key default gen_random_uuid(),
  gaushala_id uuid not null references public.gaushalas(id) on delete cascade,
  tag_id text,
  qr_code uuid not null unique default gen_random_uuid(),
  name text not null,
  breed_id uuid references public.breeds(id) on delete set null,
  sex text not null default 'female' check (sex in ('female', 'male')),
  dob date,
  age_estimate_months int,
  colour text,
  status public.animal_status not null default 'active',
  sire_id uuid references public.animals(id) on delete set null,
  dam_id uuid references public.animals(id) on delete set null,
  acquisition_type text check (acquisition_type in ('born', 'rescued', 'donated', 'purchased')),
  acquired_at date,
  story_i18n jsonb,
  health_status public.health_status not null default 'healthy',
  is_sacred_herd boolean not null default false,
  is_public boolean not null default true,
  image_url text,
  sponsorship_goal bigint not null default 0,
  sponsorship_raised bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gaushala_id, tag_id)
);
create index animals_gaushala_idx on public.animals(gaushala_id);
create trigger animals_updated before update on public.animals for each row execute function public.set_updated_at();

create table public.animal_health_events (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  kind public.health_event_kind not null,
  occurred_at timestamptz not null default now(),
  notes text,
  vet_name text,
  vet_contact text,
  diagnosis text,
  medication text,
  cost bigint,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index health_events_animal_idx on public.animal_health_events(animal_id, occurred_at desc);

create table public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  vaccine_type_id uuid not null references public.vaccine_types(id),
  administered_at date not null default current_date,
  next_due_at date,
  batch_no text,
  administered_by text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index vaccinations_animal_idx on public.vaccinations(animal_id);
create index vaccinations_due_idx on public.vaccinations(next_due_at);

create or replace function public.set_vaccination_due()
returns trigger language plpgsql as $$
begin
  if new.next_due_at is null then
    select new.administered_at + make_interval(days => vt.interval_days) into new.next_due_at
    from public.vaccine_types vt where vt.id = new.vaccine_type_id;
  end if;
  return new;
end $$;
create trigger vaccinations_due before insert or update on public.vaccinations for each row execute function public.set_vaccination_due();

create table public.lactation_records (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  for_date date not null default current_date,
  morning_l numeric(6,2) not null default 0,
  evening_l numeric(6,2) not null default 0,
  notes text,
  recorded_by uuid references auth.users(id) on delete set null,
  unique (animal_id, for_date)
);

create table public.feed_inventory (
  id uuid primary key default gen_random_uuid(),
  gaushala_id uuid not null references public.gaushalas(id) on delete cascade,
  feed_type_id uuid not null references public.feed_types(id),
  quantity numeric(12,2) not null default 0,
  unit text not null default 'kg',
  reorder_level numeric(12,2) not null default 0,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (gaushala_id, feed_type_id)
);

create table public.feed_transactions (
  id uuid primary key default gen_random_uuid(),
  gaushala_id uuid not null references public.gaushalas(id) on delete cascade,
  feed_type_id uuid not null references public.feed_types(id),
  kind text not null check (kind in ('in', 'out', 'adjust')),
  quantity numeric(12,2) not null,
  unit text not null default 'kg',
  cost bigint,
  source text,
  occurred_at timestamptz not null default now(),
  recorded_by uuid references auth.users(id) on delete set null
);
create index feed_tx_gaushala_idx on public.feed_transactions(gaushala_id, occurred_at desc);

create or replace function public.apply_feed_transaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare delta numeric;
begin
  delta := case new.kind when 'in' then new.quantity when 'out' then -new.quantity else 0 end;
  insert into public.feed_inventory (gaushala_id, feed_type_id, quantity, unit, updated_by, updated_at)
  values (new.gaushala_id, new.feed_type_id, case when new.kind = 'adjust' then new.quantity else greatest(delta, 0) end, new.unit, new.recorded_by, now())
  on conflict (gaushala_id, feed_type_id) do update
    set quantity = case when new.kind = 'adjust' then new.quantity else greatest(feed_inventory.quantity + delta, 0) end,
        updated_by = new.recorded_by, updated_at = now();
  return new;
end $$;
create trigger feed_tx_apply after insert on public.feed_transactions for each row execute function public.apply_feed_transaction();

create table public.gaushala_alerts (
  id uuid primary key default gen_random_uuid(),
  gaushala_id uuid not null references public.gaushalas(id) on delete cascade,
  kind public.alert_kind not null,
  severity public.alert_severity not null default 'warning',
  message_i18n jsonb not null,
  animal_id uuid references public.animals(id) on delete cascade,
  due_at timestamptz,
  acknowledged_by uuid references auth.users(id) on delete set null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);
create index gaushala_alerts_idx on public.gaushala_alerts(gaushala_id, acknowledged_at);

create table public.welfare_updates (
  id uuid primary key default gen_random_uuid(),
  gaushala_id uuid not null references public.gaushalas(id) on delete cascade,
  animal_id uuid references public.animals(id) on delete set null,
  title_i18n jsonb not null,
  title text generated always as (title_i18n ->> 'en') stored,
  body_i18n jsonb,
  image_url text,
  published_at timestamptz not null default now(),
  status public.content_status not null default 'published',
  created_by uuid references auth.users(id) on delete set null
);
create index welfare_updates_gaushala_idx on public.welfare_updates(gaushala_id, published_at desc);

create table public.evacuation_plans (
  id uuid primary key default gen_random_uuid(),
  gaushala_id uuid not null references public.gaushalas(id) on delete cascade,
  shelter_location text not null,
  transport text,
  contacts jsonb not null default '[]'::jsonb,
  animal_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pooja / Vazhipadu
-- ---------------------------------------------------------------------------
create table public.puja_offerings (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  temple_id uuid not null references public.temples(id) on delete cascade,
  name_i18n jsonb not null,
  name text generated always as (name_i18n ->> 'en') stored,
  description_i18n jsonb,
  significance_i18n jsonb,
  category_id uuid references public.categories(id) on delete set null,
  offering_kind public.offering_kind not null default 'vazhipadu',
  price bigint not null check (price >= 0),
  currency char(3) not null default 'INR',
  requires_sankalpa boolean not null default true,
  requires_nakshatra boolean not null default false,
  max_per_day int,
  available_days int[] not null default '{0,1,2,3,4,5,6}',
  lead_time_days int not null default 0,
  priest_name text,
  duration_min int,
  gaushala_id uuid references public.gaushalas(id) on delete set null,
  image_url text,
  popular boolean not null default false,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index puja_offerings_temple_idx on public.puja_offerings(temple_id, status);
create trigger puja_offerings_updated before update on public.puja_offerings for each row execute function public.set_updated_at();

create table public.puja_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  offering_id uuid not null references public.puja_offerings(id),
  temple_id uuid not null references public.temples(id),
  booking_date date not null,
  quantity int not null default 1 check (quantity between 1 and 20),
  amount bigint not null,
  currency char(3) not null default 'INR',
  status public.booking_status not null default 'pending_payment',
  sankalpa jsonb not null default '{}'::jsonb,
  family_member_ids uuid[] not null default '{}',
  notes text,
  prasadam_delivery text not null default 'none' check (prasadam_delivery in ('none', 'collect', 'post')),
  receipt_no text,
  confirmation_ref text unique,
  payment_id uuid,
  paid_at timestamptz,
  performed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index puja_bookings_user_idx on public.puja_bookings(user_id, created_at desc);
create index puja_bookings_temple_date_idx on public.puja_bookings(temple_id, booking_date);
create index puja_bookings_offering_date_idx on public.puja_bookings(offering_id, booking_date) where status in ('pending_payment', 'confirmed', 'performed');
create trigger puja_bookings_updated before update on public.puja_bookings for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seva / payments / receipts
-- ---------------------------------------------------------------------------
create table public.seva_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  gaushala_id uuid references public.gaushalas(id) on delete set null,
  title_i18n jsonb not null,
  title text generated always as (title_i18n ->> 'en') stored,
  description_i18n jsonb,
  category_id uuid references public.categories(id) on delete set null,
  goal_amount bigint not null default 0,
  raised_amount bigint not null default 0,
  suggested_amounts bigint[] not null default '{50100,110000,250100}',
  icon text,
  image_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  featured boolean not null default false,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger seva_campaigns_updated before update on public.seva_campaigns for each row execute function public.set_updated_at();

create table public.seva_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  gaushala_id uuid references public.gaushalas(id) on delete set null,
  animal_id uuid references public.animals(id) on delete set null,
  campaign_id uuid references public.seva_campaigns(id) on delete set null,
  amount bigint not null check (amount > 0),
  currency char(3) not null default 'INR',
  status public.payment_status not null default 'created',
  payment_id uuid,
  receipt_no text,
  message text,
  donor_name text,
  donor_email text,
  is_anonymous boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  check (gaushala_id is not null or animal_id is not null or campaign_id is not null)
);
create index seva_contributions_user_idx on public.seva_contributions(user_id, created_at desc);
create index seva_contributions_campaign_idx on public.seva_contributions(campaign_id) where status = 'paid';
create index seva_contributions_animal_idx on public.seva_contributions(animal_id) where status = 'paid';

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'razorpay',
  provider_order_id text unique,
  provider_payment_id text unique,
  entity_type public.payment_entity not null,
  entity_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  amount bigint not null,
  currency char(3) not null default 'INR',
  status public.payment_status not null default 'created',
  raw_webhook jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_entity_idx on public.payments(entity_type, entity_id);
create trigger payments_updated before update on public.payments for each row execute function public.set_updated_at();

create sequence public.receipt_seq;
create or replace function public.next_receipt_no()
returns text language sql volatile as $$
  select 'PR/' ||
    case when extract(month from now()) >= 4
      then to_char(now(), 'YY') || '-' || to_char(now() + interval '1 year', 'YY')
      else to_char(now() - interval '1 year', 'YY') || '-' || to_char(now(), 'YY') end
    || '/' || lpad(nextval('public.receipt_seq')::text, 6, '0')
$$;

-- Roll-ups: campaign raised_amount and animal sponsorship_raised from paid contributions
create or replace function public.rollup_contribution()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'UPDATE' and old.status <> 'paid' and new.status = 'paid') or (tg_op = 'INSERT' and new.status = 'paid') then
    if new.campaign_id is not null then
      update public.seva_campaigns set raised_amount = raised_amount + new.amount where id = new.campaign_id;
    end if;
    if new.animal_id is not null then
      update public.animals set sponsorship_raised = sponsorship_raised + new.amount where id = new.animal_id;
    end if;
  end if;
  return new;
end $$;
create trigger seva_contributions_rollup after insert or update on public.seva_contributions for each row execute function public.rollup_contribution();

-- ---------------------------------------------------------------------------
-- Notifications, AI, audit, submissions
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title_i18n jsonb not null,
  body_i18n jsonb,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  channel text not null check (channel in ('email', 'push', 'sms')),
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts int not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index notification_outbox_pending_idx on public.notification_outbox(status) where status = 'pending';

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index ai_messages_conv_idx on public.ai_messages(conversation_id, created_at);
create table public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  for_date date not null default current_date,
  requests int not null default 0,
  primary key (user_id, for_date)
);

create table public.audit_log (
  id bigserial primary key,
  actor_id uuid,
  table_name text not null,
  row_id uuid,
  action text not null,
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);

create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (actor_id, table_name, row_id, action, before, after)
  values (auth.uid(), tg_table_name, coalesce((to_jsonb(new) ->> 'id')::uuid, (to_jsonb(old) ->> 'id')::uuid), tg_op,
          case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

create trigger audit_temples after insert or update or delete on public.temples for each row execute function public.audit_row();
create trigger audit_events after insert or update or delete on public.events for each row execute function public.audit_row();
create trigger audit_gaushalas after insert or update or delete on public.gaushalas for each row execute function public.audit_row();
create trigger audit_offerings after insert or update or delete on public.puja_offerings for each row execute function public.audit_row();
create trigger audit_bookings after update on public.puja_bookings for each row execute function public.audit_row();
create trigger audit_payments after insert or update on public.payments for each row execute function public.audit_row();
create trigger audit_roles after insert or update or delete on public.user_roles for each row execute function public.audit_row();

create table public.event_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  status public.submission_status not null default 'pending',
  reviewer_id uuid references auth.users(id) on delete set null,
  review_note text,
  event_id uuid references public.events(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index event_submissions_status_idx on public.event_submissions(status, created_at);
