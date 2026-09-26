-- Demonstration Live Darshan listings. Follows migration 006 conventions:
-- deterministic UUIDs, honest labels, official-portal links only. Kerala temple
-- sanctums are not streamed 24x7; official portals announce festival broadcasts.
insert into public.live_streams (id, temple_id, title_i18n, url, provider, schedule, featured, status) values
('22000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',
 '{"en":"Guruvayur Devaswom — official portal","ml":"ഗുരുവായൂർ ദേവസ്വം — ഔദ്യോഗിക പോർട്ടൽ","hi":"गुरुवायुर देवस्वम — आधिकारिक पोर्टल"}',
 'https://guruvayurdevaswom.in/','website',
 '[{"note_en":"Live broadcasts are announced on official channels during Utsavam, Ekadasi and Ashtami Rohini. There is no 24x7 sanctum stream."}]'::jsonb,
 true,'published'),
('22000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003',
 '{"en":"Sree Padmanabhaswamy — official portal","ml":"ശ്രീ പദ്മനാഭസ്വാമി — ഔദ്യോഗിക പോർട്ടൽ","hi":"श्री पद्मनाभस्वामी — आधिकारिक पोर्टल"}',
 'https://spst.in/','website',
 '[{"note_en":"Festival webcasts and darshan information are published on the official portal."}]'::jsonb,
 true,'published');
