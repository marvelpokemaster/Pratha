import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, CalendarDays, Clock, Ticket, ExternalLink, Radio, Landmark, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { getEvent } from '@/lib/api/discover';

function formatDateRange(startsAt?: string, endsAt?: string): string {
  if (!startsAt) return 'Dates to be announced';
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;
  const sameDay = end && start.toDateString() === end.toDateString();
  const dateFmt = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' } as const;
  const timeFmt = { hour: 'numeric', minute: '2-digit' } as const;
  if (sameDay) {
    return `${start.toLocaleDateString('en-IN', dateFmt)} · ${start.toLocaleTimeString('en-IN', timeFmt)} – ${end!.toLocaleTimeString('en-IN', timeFmt)}`;
  }
  return end
    ? `${start.toLocaleDateString('en-IN', dateFmt)} → ${end.toLocaleDateString('en-IN', dateFmt)}`
    : start.toLocaleDateString('en-IN', dateFmt);
}

export function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['event', slug],
    queryFn: () => getEvent(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return <div className="discover-state">Opening the event…</div>;
  }
  if (isError || !event) {
    return (
      <div className="discover-state discover-error">
        <p>We could not find this event.</p>
        <Link to="/discover" className="btn-secondary mt-3 inline-flex">Back to Discover</Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 pb-10">
      <Link to="/discover" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-terracotta transition-colors self-start">
        <ArrowLeft size={16} /> Back to Discover
      </Link>

      <section className="temple-card overflow-hidden">
        {event.imageUrl && (
          <div className="w-full aspect-[21/9] max-h-80 overflow-hidden bg-surface-subtle">
            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-5 md:p-7 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {event.categoryName && <span className="badge-gold">{event.categoryName}</span>}
            {event.isFree ? <span className="badge-tulsi">Free entry</span> : <span className="badge-tulsi">Ticketed</span>}
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-text-primary">{event.title}</h1>
          <div className="flex flex-col gap-2 text-sm text-text-secondary">
            <p className="flex items-center gap-2"><CalendarDays size={15} className="text-terracotta shrink-0" />{formatDateRange(event.startsAt, event.endsAt)}</p>
            {(event.dailyStartTime || event.dailyEndTime) && (
              <p className="flex items-center gap-2"><Clock size={15} className="text-terracotta shrink-0" />Daily {event.dailyStartTime?.slice(0, 5)} – {event.dailyEndTime?.slice(0, 5)}</p>
            )}
            {(event.venueName || event.venueAddress || event.districtName) && (
              <p className="flex items-center gap-2"><MapPin size={15} className="text-terracotta shrink-0" />{[event.venueName, event.venueAddress, event.districtName].filter(Boolean).join(' · ')}</p>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        <div className="flex flex-col gap-6">
          {event.description && (
            <section className="temple-card p-5 md:p-6">
              <h2 className="font-serif text-xl font-semibold text-text-primary mb-3">About this event</h2>
              <p className="text-sm md:text-base text-text-secondary leading-relaxed">{event.description}</p>
            </section>
          )}

          {event.activities.length > 0 && (
            <section className="temple-card p-5 md:p-6">
              <h2 className="font-serif text-xl font-semibold text-text-primary flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-terracotta" /> Programme
              </h2>
              <ul className="flex flex-col gap-2 text-sm text-text-secondary list-disc list-inside">
                {event.activities.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </section>
          )}

          {event.howToReach && (
            <section className="temple-card p-5 md:p-6">
              <h2 className="font-serif text-xl font-semibold text-text-primary mb-3">How to reach</h2>
              <p className="text-sm text-text-secondary leading-relaxed">{event.howToReach}</p>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          {event.ticketInfo && (
            <section className="temple-card p-5">
              <h3 className="font-serif text-base font-semibold text-text-primary flex items-center gap-2 mb-2">
                <Ticket size={16} className="text-terracotta" /> Tickets
              </h3>
              <p className="text-sm text-text-secondary">{event.ticketInfo}</p>
            </section>
          )}

          {event.liveStreamUrl && (
            <section className="temple-card p-5">
              <h3 className="font-serif text-base font-semibold text-text-primary flex items-center gap-2 mb-2">
                <Radio size={16} className="text-terracotta" /> Watch online
              </h3>
              <a href={event.liveStreamUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-terracotta font-semibold text-sm">
                Open live stream <ExternalLink size={13} />
              </a>
            </section>
          )}

          {(event.templeSlug || event.festivalSlug) && (
            <section className="temple-card p-5">
              <h3 className="font-serif text-base font-semibold text-text-primary flex items-center gap-2 mb-3">
                <Landmark size={16} className="text-terracotta" /> Related
              </h3>
              <div className="flex flex-col gap-2.5">
                {event.templeSlug && (
                  <Link to={`/temples/${event.templeSlug}`} className="p-3 rounded-xl bg-surface-subtle text-sm font-semibold text-text-primary hover:border-gold border border-transparent transition-colors">
                    {event.templeName}
                  </Link>
                )}
                {event.festivalSlug && (
                  <Link to={`/festivals/${event.festivalSlug}`} className="p-3 rounded-xl bg-surface-subtle text-sm font-semibold text-text-primary hover:border-gold border border-transparent transition-colors">
                    {event.festivalName}
                  </Link>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </motion.div>
  );
}
