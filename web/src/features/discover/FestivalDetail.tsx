import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, MapPin, Sparkles, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { getFestival, getFestivalEvents } from '@/lib/api/discover';

export function FestivalDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: festival, isLoading, isError } = useQuery({
    queryKey: ['festival', slug],
    queryFn: () => getFestival(slug!),
    enabled: !!slug,
  });
  const { data: events } = useQuery({
    queryKey: ['festival-events', festival?.id],
    queryFn: () => getFestivalEvents(festival!.id),
    enabled: !!festival?.id,
  });

  if (isLoading) {
    return <div className="discover-state">Opening the festival story…</div>;
  }
  if (isError || !festival) {
    return (
      <div className="discover-state discover-error">
        <p>We could not find this festival.</p>
        <Link to="/discover" className="btn-secondary mt-3 inline-flex">Back to Discover</Link>
      </div>
    );
  }

  const bodyParagraphs = (festival.body || '').split(/\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 pb-10">
      <Link to="/discover" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-terracotta transition-colors self-start">
        <ArrowLeft size={16} /> Back to Discover
      </Link>

      <section className="temple-card overflow-hidden">
        {festival.imageUrl && (
          <div className="w-full aspect-[21/9] max-h-80 overflow-hidden bg-surface-subtle">
            <img src={festival.imageUrl} alt={festival.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-5 md:p-7 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-gold">Festival</span>
            {festival.monthHint && <span className="badge-tulsi">{festival.monthHint}</span>}
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-text-primary">{festival.name}</h1>
          {festival.summary && <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-2xl">{festival.summary}</p>}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        <div className="flex flex-col gap-6">
          {bodyParagraphs.length > 0 && (
            <section className="temple-card p-5 md:p-6">
              <h2 className="font-serif text-xl font-semibold text-text-primary flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-terracotta" /> The story
              </h2>
              <div className="flex flex-col gap-3 text-sm md:text-base text-text-secondary leading-relaxed">
                {bodyParagraphs.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          {events && events.length > 0 && (
            <section className="temple-card p-5">
              <h3 className="font-serif text-base font-semibold text-text-primary flex items-center gap-2 mb-3">
                <CalendarDays size={16} className="text-terracotta" /> Related events
              </h3>
              <div className="flex flex-col gap-2.5">
                {events.map((e) => (
                  <Link key={e.id} to={`/events/${e.slug}`} className="p-3 rounded-xl border border-border hover:border-gold transition-colors">
                    <p className="font-semibold text-sm text-text-primary">{e.title}</p>
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                      <MapPin size={11} /> {[e.venueName, e.districtName].filter(Boolean).join(' · ') || 'Kerala'}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {(!events || events.length === 0) && (
            <section className="temple-card p-5">
              <p className="text-sm text-text-secondary">
                Programmes for this festival are announced locally. Check the temple or district listings closer to the season.
              </p>
              <Link to="/discover" className="inline-flex items-center gap-1.5 text-terracotta font-semibold text-sm mt-3">
                Browse all events <ExternalLink size={13} />
              </Link>
            </section>
          )}
        </aside>
      </div>
    </motion.div>
  );
}
