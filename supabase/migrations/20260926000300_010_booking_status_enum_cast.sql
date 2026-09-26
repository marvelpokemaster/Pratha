-- Fix create_puja_booking: the CASE expression produces text, which does not
-- implicitly cast to the booking_status enum on INSERT ("column status is of
-- type booking_status but expression is of type text").
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
          (case when o.price = 0 then 'confirmed' else 'pending_payment' end)::public.booking_status,
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
