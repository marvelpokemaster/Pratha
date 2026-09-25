alter table public.animals add constraint animal_age_valid check (age_estimate_months >= 0);
alter table public.feed_transactions add constraint feed_quantity_valid check (quantity >= 0);
alter table public.feed_inventory add constraint inventory_quantity_valid check (quantity >= 0 and reorder_level >= 0);
alter table public.lactation_records add constraint milk_quantity_valid check (morning_l >= 0 and evening_l >= 0);
alter table public.puja_offerings add constraint offering_capacity_valid check (max_per_day > 0 and lead_time_days >= 0);
alter table public.user_roles add constraint role_scope_valid check (
  (scope_type = 'global' and scope_id is null) or (scope_type <> 'global' and scope_id is not null)
);

revoke update on public.puja_bookings from authenticated;
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name, phone, gotra, nakshatra, city, district_id, preferred_language, avatar_path, marketing_opt_in) on public.profiles to authenticated;
drop policy profiles_insert on public.profiles;

create or replace function public.complete_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.puja_bookings set status = 'performed', performed_at = now()
  where id = p_booking_id and public.manages_temple(temple_id) and status = 'confirmed' and booking_date <= current_date;
  if not found then raise exception 'booking_not_ready'; end if;
end $$;

create or replace function public.apply_feed_transaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare stock numeric; delta numeric;
begin
  insert into public.feed_inventory (gaushala_id, feed_type_id, quantity, unit)
    values (new.gaushala_id, new.feed_type_id, 0, new.unit) on conflict (gaushala_id, feed_type_id) do nothing;
  select quantity into stock from public.feed_inventory
    where gaushala_id = new.gaushala_id and feed_type_id = new.feed_type_id for update;
  delta := case new.kind when 'in' then new.quantity when 'out' then -new.quantity else new.quantity - stock end;
  if stock + delta < 0 then raise exception 'insufficient_feed'; end if;
  update public.feed_inventory set quantity = stock + delta, updated_by = auth.uid(), updated_at = now()
    where gaushala_id = new.gaushala_id and feed_type_id = new.feed_type_id;
  return new;
end $$;

revoke update, delete on public.feed_transactions from authenticated;
revoke insert, update, delete on public.feed_inventory from authenticated;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and not exists (
      select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e'
    )
  loop
    execute format('alter function %s set search_path = public, extensions', f.signature);
    execute format('revoke execute on function %s from public, anon, authenticated', f.signature);
    execute format('grant execute on function %s to service_role', f.signature);
  end loop;
end $$;

grant execute on function public.has_role(public.app_role, public.role_scope, uuid),
  public.is_admin(), public.is_super_admin(), public.manages_temple(uuid),
  public.manages_gaushala(uuid), public.is_gaushala_admin(uuid),
  public.search_all(text, int), public.i18n_text(jsonb, text) to anon, authenticated;
grant execute on function public.create_puja_booking(uuid, date, int, jsonb, uuid[], text, text),
  public.create_contribution(bigint, uuid, uuid, uuid, text, boolean, text, text),
  public.cancel_puja_booking(uuid), public.complete_booking(uuid),
  public.generate_vaccine_alerts(uuid), public.recompute_trust_score(uuid) to authenticated;

update storage.buckets set file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp']
  where id in ('public-media', 'avatars');
update storage.buckets set file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf','image/jpeg','image/png']
  where id in ('animal-documents', 'receipts');
