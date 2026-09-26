insert into public.states (id, code, name_i18n) values
('10000000-0000-4000-8000-000000000001','KL','{"en":"Kerala","ml":"കേരളം","hi":"केरल"}');

insert into public.districts (id, state_id, slug, name_i18n, sort)
select ('11000000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid, '10000000-0000-4000-8000-000000000001', slug,
jsonb_build_object('en', en, 'ml', ml, 'hi', hi), n
from (values
(1,'thiruvananthapuram','Thiruvananthapuram','തിരുവനന്തപുരം','तिरुवनंतपुरम'),
(2,'kollam','Kollam','കൊല്ലം','कोल्लम'),(3,'pathanamthitta','Pathanamthitta','പത്തനംതിട്ട','पथनमथिट्टा'),
(4,'alappuzha','Alappuzha','ആലപ്പുഴ','अलप्पुझा'),(5,'kottayam','Kottayam','കോട്ടയം','कोट्टायम'),
(6,'idukki','Idukki','ഇടുക്കി','इडुक्की'),(7,'ernakulam','Ernakulam','എറണാകുളം','एर्नाकुलम'),
(8,'thrissur','Thrissur','തൃശ്ശൂർ','तृश्शूर'),(9,'palakkad','Palakkad','പാലക്കാട്','पालक्काड'),
(10,'malappuram','Malappuram','മലപ്പുറം','मलप्पुरम'),(11,'kozhikode','Kozhikode','കോഴിക്കോട്','कोझिकोड'),
(12,'wayanad','Wayanad','വയനാട്','वायनाड'),(13,'kannur','Kannur','കണ്ണൂർ','कन्नूर'),
(14,'kasaragod','Kasaragod','കാസർഗോഡ്','कासरगोड')
) as d(n,slug,en,ml,hi);

insert into public.categories (kind,slug,name_i18n,sort) values
('event','festivals','{"en":"Festivals","ml":"ഉത്സവങ്ങൾ","hi":"त्योहार"}',1),
('event','performing-arts','{"en":"Performing arts","ml":"കലകൾ","hi":"प्रदर्शन कलाएँ"}',2),
('event','heritage','{"en":"Heritage","ml":"പൈതൃകം","hi":"विरासत"}',3),
('event','community','{"en":"Community","ml":"സമൂഹം","hi":"समुदाय"}',4),
('puja','daily','{"en":"Daily offerings","ml":"ദൈനംദിന വഴിപാടുകൾ","hi":"दैनिक पूजा"}',1),
('puja','special','{"en":"Special poojas","ml":"വിശേഷ പൂജകൾ","hi":"विशेष पूजा"}',2),
('seva','fodder','{"en":"Nourishment","ml":"ആഹാരം","hi":"पोषण"}',1),
('seva','medical','{"en":"Veterinary care","ml":"ചികിത്സ","hi":"पशु चिकित्सा"}',2);

insert into public.breeds (id,code,name_i18n,description_i18n) values
('12000000-0000-4000-8000-000000000001','VECHUR','{"en":"Vechur","ml":"വെച്ചൂർ","hi":"वेचुर"}','{"en":"A small indigenous cattle breed from Kerala."}'),
('12000000-0000-4000-8000-000000000002','KASARAGOD','{"en":"Kasaragod Dwarf","ml":"കാസർഗോഡ് കുള്ളൻ","hi":"कासरगोड बौना"}','{"en":"An indigenous cattle population associated with northern Kerala."}');
insert into public.feed_types (code,name_i18n,category) values
('GRASS','{"en":"Green fodder","ml":"പച്ചപ്പുല്ല്","hi":"हरा चारा"}','green'),
('HAY','{"en":"Dry hay","ml":"ഉണക്കപ്പുല്ല്","hi":"सूखी घास"}','dry'),
('FEED','{"en":"Compound feed","ml":"കാലിത്തീറ്റ","hi":"पशु आहार"}','concentrate');
insert into public.vaccine_types (code,name_i18n,interval_days) values
('FMD','{"en":"Foot and mouth disease","ml":"കുളമ്പുരോഗം","hi":"खुरपका-मुंहपका"}',180),
('HS','{"en":"Haemorrhagic septicaemia","ml":"ഹെമറാജിക് സെപ്റ്റിസീമിയ","hi":"गलघोंटू"}',365);

insert into public.temples (id,slug,name_i18n,deity_i18n,description_i18n,district_id,address,cover_image_url,featured,status,website) values
('20000000-0000-4000-8000-000000000001','guruvayur','{"en":"Guruvayur Temple","ml":"ഗുരുവായൂർ ക്ഷേത്രം","hi":"गुरुवायूर मंदिर"}',
'{"en":"Sri Krishna","ml":"ശ്രീകൃഷ്ണൻ","hi":"श्री कृष्ण"}',
'{"en":"Discover the devotional heritage of Guruvayur in Thrissur. Visit the official Devaswom website for current darshan hours, access rules and official bookings. Pratha is not affiliated with this temple.","ml":"ഗുരുവായൂരിന്റെ ഭക്തിപാരമ്പര്യം അറിയുക. സമയം, പ്രവേശനനിയമങ്ങൾ, ബുക്കിംഗ് എന്നിവയ്ക്ക് ഔദ്യോഗിക വെബ്സൈറ്റ് സന്ദർശിക്കുക.","hi":"गुरुवायूर की भक्ति परंपरा जानें। समय और आधिकारिक बुकिंग के लिए देवस्वम वेबसाइट देखें।"}',
'11000000-0000-4000-8000-000000000008','Guruvayur, Thrissur, Kerala','/images/pujas/temple-hero.jpg',true,'published','https://guruvayurdevaswom.in/'),
('20000000-0000-4000-8000-000000000002','heritage-temple-demo','{"en":"Heritage Temple · Demo","ml":"പൈതൃക ക്ഷേത്രം · ഡെമോ","hi":"विरासत मंदिर · डेमो"}',
'{"en":"Cultural demonstration"}','{"en":"A demonstration temple for exploring the complete Pratha booking journey. No real ritual is performed and no temple affiliation is implied."}',
'11000000-0000-4000-8000-000000000008','Thrissur, Kerala · Demonstration listing','/images/rituals/kashi-vishwanath-aarti.jpg',true,'published',null),
('20000000-0000-4000-8000-000000000003','padmanabhaswamy','{"en":"Sree Padmanabhaswamy Temple","ml":"ശ്രീ പത്മനാഭസ്വാമി ക്ഷേത്രം","hi":"श्री पद्मनाभस्वामी मंदिर"}',
'{"en":"Lord Vishnu","ml":"മഹാവിഷ്ണു","hi":"भगवान विष्णु"}',
'{"en":"Explore the architectural and devotional traditions of Thiruvananthapuram. Confirm visitor guidance with the temple before planning your visit. The image is illustrative."}',
'11000000-0000-4000-8000-000000000001','East Fort, Thiruvananthapuram','/images/pujas/rudra-abhishekam.jpg',true,'published','https://spst.in/');

insert into public.festivals (id,slug,name_i18n,summary_i18n,body_i18n,month_hint,cover_image_url,featured,status) values
('21000000-0000-4000-8000-000000000001','onam','{"en":"Onam","ml":"ഓണം","hi":"ओणम"}',
'{"en":"A season of homecoming, floral carpets and shared meals.","ml":"പൂക്കളവും സദ്യയും ഒത്തുചേരലും.","hi":"फूलों, भोजन और मिलन का उत्सव।"}',
'{"en":"Onam brings communities together through pookalam floral designs, the Onasadya feast and regional arts. Dates follow the Malayalam calendar; check locally announced programmes before travel."}','Chingam · August–September','/images/backgrounds/auth-bg.jpg',true,'published');

insert into public.events (slug,title_i18n,description_i18n,category_id,district_id,venue_name,starts_at,ends_at,cover_image_url,featured,status) values
('kathakali-evening-demo','{"en":"An evening of Kathakali","ml":"ഒരു കഥകളി സായാഹ്നം","hi":"कथकली की एक शाम"}',
'{"en":"Sample programme: discover expressive movement, elaborate costume and the storytelling traditions of Kerala. This is demonstration content, not an announced event. Dates and venue are illustrative."}',
(select id from public.categories where slug='performing-arts'),'11000000-0000-4000-8000-000000000008','Heritage courtyard · Demo','2026-10-24 18:00:00+05:30','2026-10-24 21:00:00+05:30','/images/rituals/kashi-vishwanath-aarti.jpg',true,'published'),
('kerala-heritage-walk-demo','{"en":"Stories of the old streets","ml":"പഴയ തെരുവുകളുടെ കഥകൾ","hi":"पुरानी गलियों की कहानियाँ"}',
'{"en":"Sample heritage walk exploring architecture and cultural memory. Demonstration listing only; no registration or travel arrangement is offered."}',
(select id from public.categories where slug='heritage'),'11000000-0000-4000-8000-000000000007','Fort Kochi · Demo','2026-11-01 08:00:00+05:30','2026-11-01 10:00:00+05:30','/images/pujas/temple-hero.jpg',true,'published'),
('gaushala-open-day-demo','{"en":"A morning at the Gaushala","ml":"ഗോശാലയിലെ ഒരു പ്രഭാതം","hi":"गोशाला में एक सुबह"}',
'{"en":"A sample community day introducing indigenous cattle, everyday care and responsible volunteering. Demonstration listing; contact a real sanctuary before arranging a visit."}',
(select id from public.categories where slug='community'),'11000000-0000-4000-8000-000000000005','Pratha demonstration sanctuary','2026-11-08 09:00:00+05:30','2026-11-08 12:00:00+05:30','/images/seva/sanctuary.jpg',true,'published');

insert into public.gaushalas (id,slug,name_i18n,description_i18n,district_id,address,capacity,cover_image_url,featured,status,transparency) values
('30000000-0000-4000-8000-000000000001','pratha-sanctuary-demo','{"en":"Pratha Sanctuary · Demo","ml":"പ്രഥ ഗോശാല · ഡെമോ","hi":"प्रथा गोशाला · डेमो"}',
'{"en":"Explore a working demonstration of transparent cattle care: animal passports, care updates, fodder records and welfare campaigns. These are sample records, not a verified operating charity."}',
'11000000-0000-4000-8000-000000000005','Kottayam, Kerala · Demonstration listing',30,'/images/seva/sanctuary.jpg',true,'published','{}');
insert into public.animals (id,gaushala_id,name,tag_id,breed_id,dob,story_i18n,image_url,sponsorship_goal) values
('31000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','Nandini','DEMO-001','12000000-0000-4000-8000-000000000001','2021-03-15','{"en":"Meet Nandini, a sample Vechur animal passport used to demonstrate lifelong care records."}','/images/animals/nandini.jpg',500000),
('31000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','Gauri','DEMO-002','12000000-0000-4000-8000-000000000002','2023-07-12','{"en":"Gauri’s demonstration passport shows how a sanctuary can share responsible care updates."}','/images/animals/gauri.jpg',500000);
insert into public.welfare_updates (gaushala_id,title_i18n,body_i18n,status) values
('30000000-0000-4000-8000-000000000001','{"en":"Preparing for the monsoon","ml":"മഴക്കാലത്തിനുള്ള ഒരുക്കം","hi":"मानसून की तैयारी"}','{"en":"Sample care update: staff review dry bedding, drainage, fodder storage and evacuation contacts before heavy rain."}','published');
insert into public.puja_offerings (id,slug,temple_id,name_i18n,description_i18n,significance_i18n,price,offering_kind,requires_nakshatra,max_per_day,lead_time_days,image_url,popular,status) values
('40000000-0000-4000-8000-000000000001','archana-demo','20000000-0000-4000-8000-000000000002','{"en":"Pushpanjali Archana","ml":"പുഷ്പാഞ്ജലി അർച്ചന","hi":"पुष्पांजलि अर्चना"}','{"en":"Experience the booking journey with a free demonstration offering. No real ritual is performed."}','{"en":"A traditional offering of flowers accompanied by prayer."}',0,'archana',true,30,1,'/images/pujas/maha-sudarshana.jpg',true,'published'),
('40000000-0000-4000-8000-000000000002','abhishekam-demo','20000000-0000-4000-8000-000000000002','{"en":"Rudra Abhishekam","ml":"രുദ്രാഭിഷേകം","hi":"रुद्र अभिषेक"}','{"en":"Demonstration offering. Payment remains unavailable until the payment gateway and temple operator are configured."}','{"en":"A ritual bathing associated with devotion to Lord Shiva."}',50100,'abhishekam',false,10,2,'/images/pujas/rudra-abhishekam.jpg',true,'published');
insert into public.seva_campaigns (id,slug,gaushala_id,title_i18n,description_i18n,goal_amount,image_url,featured,status) values
('50000000-0000-4000-8000-000000000001','daily-nourishment-demo','30000000-0000-4000-8000-000000000001','{"en":"A little care. Every day.","ml":"എല്ലാ ദിവസവും കരുതൽ","hi":"हर दिन थोड़ी देखभाल"}','{"en":"Sample fodder campaign showing how contributions can support daily nourishment. This demonstration does not collect money."}',2500000,'/images/seva/nourishment.jpg',true,'published'),
('50000000-0000-4000-8000-000000000002','veterinary-care-demo','30000000-0000-4000-8000-000000000001','{"en":"Healthy lives, gentle care","ml":"ആരോഗ്യവും കരുതലും","hi":"स्वस्थ जीवन, स्नेह भरी देखभाल"}','{"en":"Sample veterinary care campaign. No funds are collected until an authorised organisation and payment gateway are connected."}',5000000,'/images/seva/healing.jpg',true,'published');
