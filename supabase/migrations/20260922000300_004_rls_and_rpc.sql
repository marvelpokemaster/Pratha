/*
# Pratha schema v2 — RLS policies, views and RPCs

Policy model:
- Reference tables: public read; super_admin write.
- Published content: public read; drafts visible to managers; writes by scoped managers.
- Owner tables: owner only; admins may read.
- Transactional tables (bookings, contributions, payments): owner read; writes only via
  SECURITY DEFINER RPCs / service role (client never sets amount or status).
*/

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'states','districts','categories','devaswom_boards','breeds','feed_types','vaccine_types','veterinary_contacts',
    'profiles','user_roles','family_members','push_tokens','saved_items',
    'temples','festivals','events','live_streams','media_assets','editorial_blocks',
    'gaushalas','animals','animal_health_events','vaccinations','lactation_records','feed_inventory','feed_transactions',
    'gaushala_alerts','welfare_updates','evacuation_plans',
    'puja_offerings','puja_bookings','seva_campaigns','seva_contributions','payments',
    'notifications','notification_outbox','ai_conversations','ai_messages','ai_usage','audit_log','event_submissions'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Reference tables: public read, super_admin write
do $$
declare t text;
begin
  foreach t in array array['states','districts','categories','devaswom_boards','breeds','feed_types','vaccine_types','veterinary_contacts'] loop
    execute format('create policy %I on public.%I for select using (true)', t || '_read', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin())', t || '_admin', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create policy profiles_self on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());

create policy user_roles_self on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_super_admin());
create policy user_roles_admin on public.user_roles for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

create policy family_owner on public.family_members for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_tokens_owner on public.push_tokens for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy saved_items_owner on public.saved_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Discovery content
-- ---------------------------------------------------------------------------
create policy temples_read on public.temples for select using (status = 'published' or public.manages_temple(id));
create policy temples_write on public.temples for insert to authenticated with check (public.is_admin());
create policy temples_update on public.temples for update to authenticated using (public.manages_temple(id)) with check (public.manages_temple(id));
create policy temples_delete on public.temples for delete to authenticated using (public.is_admin());

create policy festivals_read on public.festivals for select using (status = 'published' or public.is_admin());
create policy festivals_admin on public.festivals for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy events_read on public.events for select using (
  status = 'published' or public.is_admin() or (temple_id is not null and public.manages_temple(temple_id))
  or (gaushala_id is not null and public.manages_gaushala(gaushala_id))
);
create policy events_write on public.events for insert to authenticated with check (
  public.is_admin() or (temple_id is not null and public.manages_temple(temple_id)) or (gaushala_id is not null and public.manages_gaushala(gaushala_id))
);
create policy events_update on public.events for update to authenticated using (
  public.is_admin() or (temple_id is not null and public.manages_temple(temple_id)) or (gaushala_id is not null and public.manages_gaushala(gaushala_id))
);
create policy events_delete on public.events for delete to authenticated using (public.is_admin());

create policy live_streams_read on public.live_streams for select using (status = 'published' or public.is_admin() or (temple_id is not null and public.manages_temple(temple_id)));
create policy live_streams_write on public.live_streams for all to authenticated
  using (public.is_admin() or (temple_id is not null and public.manages_temple(temple_id)))
  with check (public.is_admin() or (temple_id is not null and public.manages_temple(temple_id)));

create policy media_read on public.media_assets for select using (true);
create policy media_write on public.media_assets for all to authenticated using (public.is_admin() or created_by = auth.uid()) with check (public.is_admin() or created_by = auth.uid());

create policy editorial_read on public.editorial_blocks for select using (status = 'published' or public.is_admin());
create policy editorial_admin on public.editorial_blocks for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Gaushala
-- ---------------------------------------------------------------------------
create policy gaushalas_read on public.gaushalas for select using (status = 'published' or public.manages_gaushala(id));
create policy gaushalas_insert on public.gaushalas for insert to authenticated with check (public.is_admin());
create policy gaushalas_update on public.gaushalas for update to authenticated using (public.is_gaushala_admin(id)) with check (public.is_gaushala_admin(id));
create policy gaushalas_delete on public.gaushalas for delete to authenticated using (public.is_admin());

create policy animals_read on public.animals for select using (
  (is_public and status = 'active' and exists (select 1 from public.gaushalas g where g.id = gaushala_id and g.status = 'published'))
  or public.manages_gaushala(gaushala_id)
);
create policy animals_write on public.animals for all to authenticated using (public.manages_gaushala(gaushala_id)) with check (public.manages_gaushala(gaushala_id));

create policy health_events_rw on public.animal_health_events for all to authenticated
  using (exists (select 1 from public.animals a where a.id = animal_id and public.manages_gaushala(a.gaushala_id)))
  with check (exists (select 1 from public.animals a where a.id = animal_id and public.manages_gaushala(a.gaushala_id)));
create policy vaccinations_rw on public.vaccinations for all to authenticated
  using (exists (select 1 from public.animals a where a.id = animal_id and public.manages_gaushala(a.gaushala_id)))
  with check (exists (select 1 from public.animals a where a.id = animal_id and public.manages_gaushala(a.gaushala_id)));
create policy lactation_rw on public.lactation_records for all to authenticated
  using (exists (select 1 from public.animals a where a.id = animal_id and public.manages_gaushala(a.gaushala_id)))
  with check (exists (select 1 from public.animals a where a.id = animal_id and public.manages_gaushala(a.gaushala_id)));
create policy feed_inventory_rw on public.feed_inventory for all to authenticated using (public.manages_gaushala(gaushala_id)) with check (public.manages_gaushala(gaushala_id));
create policy feed_tx_rw on public.feed_transactions for all to authenticated using (public.manages_gaushala(gaushala_id)) with check (public.manages_gaushala(gaushala_id));
create policy alerts_rw on public.gaushala_alerts for all to authenticated using (public.manages_gaushala(gaushala_id)) with check (public.manages_gaushala(gaushala_id));
create policy evacuation_rw on public.evacuation_plans for all to authenticated using (public.manages_gaushala(gaushala_id)) with check (public.manages_gaushala(gaushala_id));

create policy welfare_read on public.welfare_updates for select using (status = 'published' or public.manages_gaushala(gaushala_id));
create policy welfare_write on public.welfare_updates for all to authenticated using (public.manages_gaushala(gaushala_id)) with check (public.manages_gaushala(gaushala_id));

-- ---------------------------------------------------------------------------
-- Pooja
-- ---------------------------------------------------------------------------
create policy offerings_read on public.puja_offerings for select using (status = 'published' or public.manages_temple(temple_id));
create policy offerings_write on public.puja_offerings for all to authenticated using (public.manages_temple(temple_id)) with check (public.manages_temple(temple_id));

create policy bookings_owner_read on public.puja_bookings for select to authenticated using (user_id = auth.uid() or public.manages_temple(temple_id));
create policy bookings_temple_update on public.puja_bookings for update to authenticated using (public.manages_temple(temple_id)) with check (public.manages_temple(temple_id));

-- ---------------------------------------------------------------------------
-- Seva / payments
-- ---------------------------------------------------------------------------
create policy campaigns_read on public.seva_campaigns for select using (status = 'published' or public.is_admin() or (gaushala_id is not null and public.manages_gaushala(gaushala_id)));
create policy campaigns_write on public.seva_campaigns for all to authenticated
  using (public.is_admin() or (gaushala_id is not null and public.is_gaushala_admin(gaushala_id)))
  with check (public.is_admin() or (gaushala_id is not null and public.is_gaushala_admin(gaushala_id)));

create policy contributions_owner_read on public.seva_contributions for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or (gaushala_id is not null and public.manages_gaushala(gaushala_id)));
create policy payments_owner_read on public.payments for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Notifications / AI / audit / submissions
-- ---------------------------------------------------------------------------
create policy notifications_owner on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_mark on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy outbox_admin on public.notification_outbox for select to authenticated using (public.is_admin());

create policy ai_conv_owner on public.ai_conversations for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ai_msg_owner on public.ai_messages for select to authenticated using (exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy ai_usage_owner on public.ai_usage for select to authenticated using (user_id = auth.uid());
create policy audit_admin on public.audit_log for select to authenticated using (public.is_super_admin());

create policy submissions_owner on public.event_submissions for select to authenticated using (submitted_by = auth.uid() or public.is_admin());
create policy submissions_insert on public.event_submissions for insert to authenticated with check (submitted_by = auth.uid());
create policy submissions_review on public.event_submissions for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------
create or replace view public.welfare_stats with (security_invoker = true) as
select
  (select count(*) from public.animals a join public.gaushalas g on g.id = a.gaushala_id where a.status = 'active' and g.status = 'published') as animals_cared,
  (select count(*) from public.gaushalas where status = 'published') as gaushalas,
  (select coalesce(sum(amount), 0) from public.seva_contributions where status = 'paid') as total_raised,
  (select count(*) from public.seva_contributions where status = 'paid') as contributions,
  (select count(*) from public.temples where status = 'published') as temples,
  (select count(*) from public.events where status = 'published' and ends_at >= now()) as upcoming_events;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Full-text + trigram search across events, temples, gaushalas, offerings
create or replace function public.search_all(q text, lim int default 20)
returns table (entity_type text, id uuid, slug text, title text, subtitle text, image_url text, rank real)
language sql stable security invoker as $$
  with query as (select websearch_to_tsquery('simple', q) as tsq, q as raw)
  select * from (
    select 'event'::text, e.id, e.slug, e.title, coalesce(d.name, ''), e.cover_image_url,
           greatest(ts_rank(e.search_tsv, query.tsq), similarity(e.title, query.raw))::real as rank
    from public.events e left join public.districts d on d.id = e.district_id, query
    where e.status = 'published' and (e.search_tsv @@ query.tsq or e.title % query.raw)
    union all
    select 'temple', t.id, t.slug, t.name, coalesce(t.deity_i18n ->> 'en', ''), t.cover_image_url,
           greatest(ts_rank(t.search_tsv, query.tsq), similarity(t.name, query.raw))::real
    from public.temples t, query
    where t.status = 'published' and (t.search_tsv @@ query.tsq or t.name % query.raw)
    union all
    select 'gaushala', g.id, g.slug, g.name, coalesce(d.name, ''), g.cover_image_url, similarity(g.name, query.raw)::real
    from public.gaushalas g left join public.districts d on d.id = g.district_id, query
    where g.status = 'published' and (g.name % query.raw or g.name ilike '%' || query.raw || '%')
    union all
    select 'puja', p.id, p.slug, p.name, t.name, p.image_url, similarity(p.name, query.raw)::real
    from public.puja_offerings p join public.temples t on t.id = p.temple_id, query
    where p.status = 'published' and t.status = 'published' and (p.name % query.raw or p.name ilike '%' || query.raw || '%')
  ) r
  order by rank desc
  limit lim
$$;

-- Create a booking: price computed server-side; returns booking id + amount.
create or replace function public.create_puja_booking(
  p_offering_id uuid,
  p_booking_date date,
  p_quantity int,
  p_sankalpa jsonb,
  p_family_member_ids uuid[] default '{}',
  p_notes text default null,
  p_prasadam text default 'none'
)
returns public.puja_bookings
language plpgsql security definer set search_path = public as $$
declare
  o public.puja_offerings;
  booked int;
  b public.puja_bookings;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select * into o from public.puja_offerings where id = p_offering_id and status = 'published' for update;
  if not found then raise exception 'offering_not_found'; end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 20 then raise exception 'invalid_quantity'; end if;
  if p_booking_date is null then raise exception 'date_required'; end if;
  if not exists (select 1 from public.temples where id = o.temple_id and status = 'published') then raise exception 'temple_unavailable'; end if;
  if exists (select 1 from unnest(p_family_member_ids) member_id where not exists (
    select 1 from public.family_members f where f.id = member_id and f.user_id = auth.uid()
  )) then raise exception 'invalid_family_member'; end if;
  if p_booking_date < current_date + o.lead_time_days then raise exception 'date_too_soon'; end if;
  if not (extract(dow from p_booking_date)::int = any (o.available_days)) then raise exception 'date_unavailable'; end if;
  if o.requires_sankalpa and coalesce(p_sankalpa ->> 'devotee_name', '') = '' then raise exception 'sankalpa_required'; end if;
  if o.requires_nakshatra and coalesce(p_sankalpa ->> 'nakshatra', '') = '' then raise exception 'nakshatra_required'; end if;
  if o.max_per_day is not null then
    select coalesce(sum(quantity), 0) into booked from public.puja_bookings
    where offering_id = o.id and booking_date = p_booking_date and status in ('pending_payment', 'confirmed', 'performed');
    if booked + p_quantity > o.max_per_day then raise exception 'slot_full'; end if;
  end if;

  insert into public.puja_bookings (user_id, offering_id, temple_id, booking_date, quantity, amount, currency, sankalpa, family_member_ids, notes, prasadam_delivery, status, confirmation_ref)
  values (auth.uid(), o.id, o.temple_id, p_booking_date, p_quantity, o.price * p_quantity, o.currency, coalesce(p_sankalpa, '{}'::jsonb), coalesce(p_family_member_ids, '{}'), p_notes, coalesce(p_prasadam, 'none'),
          case when o.price = 0 then 'confirmed' else 'pending_payment' end,
          'PRT-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8)))
  returning * into b;

  if b.status = 'confirmed' then
    update public.puja_bookings set receipt_no = public.next_receipt_no(), paid_at = now() where id = b.id returning * into b;
    perform public.notify_user(b.user_id, 'booking_confirmed',
      jsonb_build_object('en', 'Vazhipadu booked', 'ml', 'വഴിപാട് ബുക്ക് ചെയ്തു', 'hi', 'पूजा बुक हो गई'),
      jsonb_build_object('en', o.name || ' on ' || to_char(b.booking_date, 'DD Mon YYYY') || ' · Ref ' || b.confirmation_ref),
      jsonb_build_object('booking_id', b.id));
  end if;
  return b;
end $$;

-- Create a contribution (donation) intent; status becomes paid via payments webhook / confirm RPC.
create or replace function public.create_contribution(
  p_amount bigint,
  p_gaushala_id uuid default null,
  p_animal_id uuid default null,
  p_campaign_id uuid default null,
  p_message text default null,
  p_is_anonymous boolean default false,
  p_donor_name text default null,
  p_donor_email text default null
)
returns public.seva_contributions
language plpgsql security definer set search_path = public as $$
declare c public.seva_contributions; g uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_amount < 1000 then raise exception 'amount_too_small'; end if; -- min ₹10
  if p_amount > 50000000 then raise exception 'amount_too_large'; end if;
  g := p_gaushala_id;
  if g is null and p_animal_id is not null then select gaushala_id into g from public.animals where id = p_animal_id; end if;
  if g is null and p_campaign_id is not null then select gaushala_id into g from public.seva_campaigns where id = p_campaign_id; end if;
  if g is null or not exists (select 1 from public.gaushalas where id = g and status = 'published') then raise exception 'gaushala_not_found'; end if;
  if p_animal_id is not null and not exists (select 1 from public.animals where id = p_animal_id and gaushala_id = g and is_public and status = 'active') then raise exception 'animal_not_found'; end if;
  if p_campaign_id is not null and not exists (select 1 from public.seva_campaigns where id = p_campaign_id and gaushala_id = g) then raise exception 'campaign_mismatch'; end if;
  if p_campaign_id is not null and not exists (select 1 from public.seva_campaigns where id = p_campaign_id and status = 'published') then
    raise exception 'campaign_not_found';
  end if;
  insert into public.seva_contributions (user_id, gaushala_id, animal_id, campaign_id, amount, message, is_anonymous, donor_name, donor_email)
  values (auth.uid(), g, p_animal_id, p_campaign_id, p_amount, p_message, p_is_anonymous, p_donor_name, p_donor_email)
  returning * into c;
  return c;
end $$;

-- In-app notification + outbox helper (used by RPCs and edge functions)
create or replace function public.notify_user(p_user uuid, p_kind text, p_title jsonb, p_body jsonb, p_data jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null then return; end if;
  insert into public.notifications (user_id, kind, title_i18n, body_i18n, data) values (p_user, p_kind, p_title, p_body, p_data);
  insert into public.notification_outbox (user_id, channel, template, payload)
  values (p_user, 'email', p_kind, jsonb_build_object('title', p_title, 'body', p_body) || p_data);
end $$;

-- Mark payment paid (called by payments webhook edge function with service role, or by
-- the confirm step in test mode). Idempotent on provider_payment_id.
create or replace function public.mark_payment_paid(p_payment_id uuid, p_provider_payment_id text, p_raw jsonb default null)
returns public.payments language plpgsql security definer set search_path = public as $$
declare p public.payments; b public.puja_bookings; c public.seva_contributions; o public.puja_offerings;
begin
  select * into p from public.payments where id = p_payment_id for update;
  if not found then raise exception 'payment_not_found'; end if;
  if p.status = 'paid' then return p; end if;
  update public.payments set status = 'paid', provider_payment_id = p_provider_payment_id, raw_webhook = coalesce(p_raw, raw_webhook)
  where id = p.id returning * into p;

  if p.entity_type = 'booking' then
    update public.puja_bookings set status = 'confirmed', payment_id = p.id, paid_at = now(), receipt_no = public.next_receipt_no()
    where id = p.entity_id returning * into b;
    select * into o from public.puja_offerings where id = b.offering_id;
    perform public.notify_user(b.user_id, 'booking_confirmed',
      jsonb_build_object('en', 'Vazhipadu booked', 'ml', 'വഴിപാട് ബുക്ക് ചെയ്തു', 'hi', 'पूजा बुक हो गई'),
      jsonb_build_object('en', o.name || ' on ' || to_char(b.booking_date, 'DD Mon YYYY') || ' · Ref ' || b.confirmation_ref),
      jsonb_build_object('booking_id', b.id));
  else
    update public.seva_contributions set status = 'paid', payment_id = p.id, paid_at = now(), receipt_no = public.next_receipt_no()
    where id = p.entity_id returning * into c;
    perform public.notify_user(c.user_id, 'contribution_received',
      jsonb_build_object('en', 'Seva received', 'ml', 'സേവ സ്വീകരിച്ചു', 'hi', 'सेवा प्राप्त हुई'),
      jsonb_build_object('en', 'Thank you for your contribution of ₹' || (c.amount / 100)::text || ' · Receipt ' || c.receipt_no),
      jsonb_build_object('contribution_id', c.id));
  end if;
  return p;
end $$;

create or replace function public.mark_payment_failed(p_payment_id uuid, p_raw jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
declare p public.payments;
begin
  select * into p from public.payments where id = p_payment_id for update;
  if not found or p.status = 'paid' then return; end if;
  update public.payments set status = 'failed', raw_webhook = coalesce(p_raw, raw_webhook) where id = p.id;
  if p.entity_type = 'booking' then update public.puja_bookings set status = 'failed' where id = p.entity_id and status = 'pending_payment';
  else update public.seva_contributions set status = 'failed' where id = p.entity_id and status = 'created'; end if;
end $$;

-- Cancel own pending booking
create or replace function public.cancel_puja_booking(p_booking_id uuid)
returns public.puja_bookings language plpgsql security definer set search_path = public as $$
declare b public.puja_bookings;
begin
  update public.puja_bookings set status = 'cancelled'
  where id = p_booking_id and user_id = auth.uid() and (status = 'pending_payment' or (status = 'confirmed' and amount = 0)) and booking_date > current_date
  returning * into b;
  if not found then raise exception 'cannot_cancel'; end if;
  return b;
end $$;

-- Gaushala staff: generate due-vaccine alerts (called by cron edge function or manually)
create or replace function public.generate_vaccine_alerts(p_gaushala_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare n int := 0;
begin
  if not public.manages_gaushala(p_gaushala_id) then raise exception 'forbidden'; end if;
  insert into public.gaushala_alerts (gaushala_id, kind, severity, message_i18n, animal_id, due_at)
  select a.gaushala_id, 'vaccine_due', case when v.next_due_at < current_date then 'critical' else 'warning' end,
         jsonb_build_object('en', a.name || ': ' || vt.name || ' due ' || to_char(v.next_due_at, 'DD Mon'),
                            'ml', a.name || ': ' || coalesce(vt.name_i18n ->> 'ml', vt.name) || ' ' || to_char(v.next_due_at, 'DD Mon')),
         a.id, v.next_due_at
  from public.vaccinations v
  join public.animals a on a.id = v.animal_id and a.status = 'active'
  join public.vaccine_types vt on vt.id = v.vaccine_type_id
  where a.gaushala_id = p_gaushala_id
    and v.next_due_at <= current_date + 30
    and v.next_due_at = (select max(v2.next_due_at) from public.vaccinations v2 where v2.animal_id = a.id and v2.vaccine_type_id = v.vaccine_type_id)
    and not exists (select 1 from public.gaushala_alerts al where al.animal_id = a.id and al.kind = 'vaccine_due' and al.due_at = v.next_due_at);
  get diagnostics n = row_count;
  return n;
end $$;

-- Trust score: data completeness heuristic (0-10)
create or replace function public.recompute_trust_score(p_gaushala_id uuid)
returns numeric language plpgsql security definer set search_path = public as $$
declare s numeric := 0; g public.gaushalas;
begin
  if not public.is_gaushala_admin(p_gaushala_id) then raise exception 'forbidden'; end if;
  select * into g from public.gaushalas where id = p_gaushala_id;
  if g.verified then s := s + 3; end if;
  if g.registration_no is not null then s := s + 1; end if;
  if exists (select 1 from public.welfare_updates where gaushala_id = g.id and published_at > now() - interval '90 days') then s := s + 2; end if;
  if exists (select 1 from public.vaccinations v join public.animals a on a.id = v.animal_id where a.gaushala_id = g.id and v.administered_at > current_date - 365) then s := s + 2; end if;
  if exists (select 1 from public.animal_health_events h join public.animals a on a.id = h.animal_id where a.gaushala_id = g.id and h.occurred_at > now() - interval '180 days') then s := s + 1; end if;
  if (g.transparency -> 'fund_use') is not null then s := s + 1; end if;
  update public.gaushalas set trust_score = least(s, 10) where id = g.id;
  return least(s, 10);
end $$;

grant execute on function public.search_all(text, int) to anon, authenticated;
grant execute on function public.create_puja_booking(uuid, date, int, jsonb, uuid[], text, text) to authenticated;
grant execute on function public.create_contribution(bigint, uuid, uuid, uuid, text, boolean, text, text) to anon, authenticated;
grant execute on function public.cancel_puja_booking(uuid) to authenticated;
grant execute on function public.generate_vaccine_alerts(uuid) to authenticated;
grant execute on function public.recompute_trust_score(uuid) to authenticated;
revoke execute on function public.mark_payment_paid(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.mark_payment_failed(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.notify_user(uuid, text, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.mark_payment_paid(uuid, text, jsonb), public.mark_payment_failed(uuid, jsonb), public.notify_user(uuid, text, jsonb, jsonb, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('public-media', 'public-media', true),
  ('avatars', 'avatars', true),
  ('animal-documents', 'animal-documents', false),
  ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "public media read" on storage.objects for select using (bucket_id in ('public-media', 'avatars'));
create policy "admins write public media" on storage.objects for insert to authenticated with check (bucket_id = 'public-media' and (public.is_admin() or exists (select 1 from public.user_roles where user_id = auth.uid())));
create policy "admins update public media" on storage.objects for update to authenticated using (bucket_id = 'public-media' and public.is_admin());
create policy "admins delete public media" on storage.objects for delete to authenticated using (bucket_id = 'public-media' and public.is_admin());
create policy "own avatar write" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own avatar update" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "animal docs staff" on storage.objects for all to authenticated
  using (bucket_id = 'animal-documents' and public.manages_gaushala(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'animal-documents' and public.manages_gaushala(((storage.foldername(name))[1])::uuid));
create policy "own receipts read" on storage.objects for select to authenticated using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
