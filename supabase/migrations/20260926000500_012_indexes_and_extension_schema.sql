-- Covers the unindexed foreign keys reported by the database linter and moves
-- pg_trgm out of the exposed public schema.
begin;

alter extension pg_trgm set schema extensions;

create index if not exists idx_ai_conversations_user_id on public.ai_conversations (user_id);
create index if not exists idx_animal_health_events_recorded_by on public.animal_health_events (recorded_by);
create index if not exists idx_animals_breed_id on public.animals (breed_id);
create index if not exists idx_animals_dam_id on public.animals (dam_id);
create index if not exists idx_animals_sire_id on public.animals (sire_id);
create index if not exists idx_evacuation_plans_gaushala_id on public.evacuation_plans (gaushala_id);
create index if not exists idx_event_submissions_event_id on public.event_submissions (event_id);
create index if not exists idx_event_submissions_reviewer_id on public.event_submissions (reviewer_id);
create index if not exists idx_event_submissions_submitted_by on public.event_submissions (submitted_by);
create index if not exists idx_events_created_by on public.events (created_by);
create index if not exists idx_events_festival_id on public.events (festival_id);
create index if not exists idx_events_gaushala_id on public.events (gaushala_id);
create index if not exists idx_events_secondary_category_id on public.events (secondary_category_id);
create index if not exists idx_feed_inventory_feed_type_id on public.feed_inventory (feed_type_id);
create index if not exists idx_feed_inventory_updated_by on public.feed_inventory (updated_by);
create index if not exists idx_feed_transactions_feed_type_id on public.feed_transactions (feed_type_id);
create index if not exists idx_feed_transactions_recorded_by on public.feed_transactions (recorded_by);
create index if not exists idx_gaushala_alerts_acknowledged_by on public.gaushala_alerts (acknowledged_by);
create index if not exists idx_gaushala_alerts_animal_id on public.gaushala_alerts (animal_id);
create index if not exists idx_gaushalas_created_by on public.gaushalas (created_by);
create index if not exists idx_gaushalas_devaswom_board_id on public.gaushalas (devaswom_board_id);
create index if not exists idx_gaushalas_temple_id on public.gaushalas (temple_id);
create index if not exists idx_lactation_records_recorded_by on public.lactation_records (recorded_by);
create index if not exists idx_media_assets_created_by on public.media_assets (created_by);
create index if not exists idx_notification_outbox_user_id on public.notification_outbox (user_id);
create index if not exists idx_payments_user_id on public.payments (user_id);
create index if not exists idx_profiles_district_id on public.profiles (district_id);
create index if not exists idx_puja_offerings_category_id on public.puja_offerings (category_id);
create index if not exists idx_puja_offerings_gaushala_id on public.puja_offerings (gaushala_id);
create index if not exists idx_seva_campaigns_category_id on public.seva_campaigns (category_id);
create index if not exists idx_seva_campaigns_gaushala_id on public.seva_campaigns (gaushala_id);
create index if not exists idx_seva_contributions_gaushala_id on public.seva_contributions (gaushala_id);
create index if not exists idx_temples_created_by on public.temples (created_by);
create index if not exists idx_temples_devaswom_board_id on public.temples (devaswom_board_id);
create index if not exists idx_vaccinations_recorded_by on public.vaccinations (recorded_by);
create index if not exists idx_vaccinations_vaccine_type_id on public.vaccinations (vaccine_type_id);
create index if not exists idx_veterinary_contacts_district_id on public.veterinary_contacts (district_id);
create index if not exists idx_welfare_updates_animal_id on public.welfare_updates (animal_id);
create index if not exists idx_welfare_updates_created_by on public.welfare_updates (created_by);

commit;
