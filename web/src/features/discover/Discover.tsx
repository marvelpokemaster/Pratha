import { useQuery } from '@tanstack/react-query';
import { ExternalLink, MapPin, CalendarDays, Landmark, Radio } from 'lucide-react';
import { supabase, localized } from '@/lib/supabase';
import './Discover.css';

type DiscoverItem = {
  id: string;
  title: string;
  summary: string;
  meta: string;
  href?: string;
  image?: string;
};

async function loadDiscovery(): Promise<{ temples: DiscoverItem[]; events: DiscoverItem[]; festivals: DiscoverItem[] }> {
  const [temples, events, festivals] = await Promise.all([
    supabase.from('temples').select('id,name,name_i18n,description_i18n,address,cover_image_url,live_stream_url').eq('status', 'published').order('featured', { ascending: false }),
    supabase.from('events').select('id,title,title_i18n,description_i18n,venue_name,starts_at,cover_image_url').eq('status', 'published').order('starts_at').limit(8),
    supabase.from('festivals').select('id,name,name_i18n,summary_i18n,month_hint,cover_image_url').eq('status', 'published').order('featured', { ascending: false }),
  ]);
  if (temples.error) throw temples.error;
  if (events.error) throw events.error;
  if (festivals.error) throw festivals.error;
  return {
    temples: (temples.data ?? []).map((item) => ({
      id: item.id,
      title: item.name || localized(item.name_i18n),
      summary: localized(item.description_i18n) || 'A living place of worship and cultural heritage.',
      meta: item.address || 'Kerala',
      href: item.live_stream_url || undefined,
      image: item.cover_image_url || undefined,
    })),
    events: (events.data ?? []).map((item) => ({
      id: item.id,
      title: item.title || localized(item.title_i18n),
      summary: localized(item.description_i18n) || 'Discover a cultural experience in the Pratha calendar.',
      meta: [item.venue_name, item.starts_at ? new Date(item.starts_at).toLocaleDateString() : 'Date to be announced'].filter(Boolean).join(' · '),
      image: item.cover_image_url || undefined,
    })),
    festivals: (festivals.data ?? []).map((item) => ({
      id: item.id,
      title: item.name || localized(item.name_i18n),
      summary: localized(item.summary_i18n) || 'Explore the stories, rituals, and traditions behind this festival.',
      meta: item.month_hint || 'Annual celebration',
      image: item.cover_image_url || undefined,
    })),
  };
}

export function Discover() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['discovery'], queryFn: loadDiscovery });
  const groups = [
    { title: 'Temples & Live Darshan', icon: Landmark, items: data?.temples ?? [], action: 'Open stream' },
    { title: 'Upcoming cultural events', icon: CalendarDays, items: data?.events ?? [], action: 'Explore event' },
    { title: 'Festival calendar', icon: Radio, items: data?.festivals ?? [], action: 'Read story' },
  ];

  return (
    <div className="discover-page">
      <section className="discover-hero">
        <span className="badge-gold">Utsav-inspired discovery</span>
        <h1 className="typography-headline-lg">Find what is sacred, local, and alive.</h1>
        <p>Explore temples, festivals, and cultural moments across Kerala through one calm, editorial calendar.</p>
      </section>
      {isLoading && <div className="discover-state">Loading the cultural calendar…</div>}
      {isError && <div className="discover-state discover-error">We could not load the calendar. Please try again.</div>}
      {!isLoading && !isError && groups.map((group) => (
        <section className="discover-group" key={group.title}>
          <div className="discover-group-heading">
            <div><group.icon size={18} /><h2>{group.title}</h2></div>
            <span>{group.items.length} listings</span>
          </div>
          <div className="discover-grid">
            {group.items.map((item) => (
              <article className="discover-card" key={item.id}>
                {item.image ? <img src={item.image} alt="" /> : <div className="discover-card-placeholder"><group.icon size={26} /></div>}
                <div className="discover-card-body">
                  <span className="discover-meta"><MapPin size={13} />{item.meta}</span>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  {item.href ? <a href={item.href} target="_blank" rel="noreferrer">Open live stream <ExternalLink size={13} /></a> : <span className="discover-muted">Curated on Pratha</span>}
                </div>
              </article>
            ))}
            {!group.items.length && <div className="discover-empty">More listings are being curated.</div>}
          </div>
        </section>
      ))}
    </div>
  );
}
