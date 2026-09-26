import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Landmark, Radio, ExternalLink, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { getLiveStreams, getLiveStream, toEmbedUrl } from '@/lib/api/discover';

export function LiveDarshan() {
  const { data: streams, isLoading, isError } = useQuery({
    queryKey: ['live-streams'],
    queryFn: () => getLiveStreams(),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 pb-10">
      <section className="discover-hero">
        <span className="badge-gold">Live Darshan</span>
        <h1 className="typography-headline-lg">Sacred darshan, wherever you are.</h1>
        <p>Temple sanctums broadcast on festival days; official portals publish schedules and links. Follow a temple to its live destination.</p>
      </section>

      {isLoading && <div className="discover-state">Finding live darshan streams…</div>}
      {isError && <div className="discover-state discover-error">We could not load live streams. Please try again.</div>}

      {!isLoading && !isError && (
        <div className="discover-grid">
          {(streams ?? []).map((s) => (
            <Link to={`/darshan/${s.id}`} key={s.id} className="discover-card block hover:border-gold transition-colors">
              {s.templeImage ? (
                <img src={s.templeImage} alt="" />
              ) : (
                <div className="discover-card-placeholder"><Radio size={26} /></div>
              )}
              <div className="discover-card-body">
                <span className="discover-meta"><Landmark size={13} />{s.templeName || 'Temple'} · {s.provider === 'youtube' ? 'YouTube' : 'Official portal'}</span>
                <h3>{s.title}</h3>
                <p>{s.scheduleNote || 'Schedules and broadcasts are announced on the official channel.'}</p>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-terracotta">
                  Open darshan <ExternalLink size={13} />
                </span>
              </div>
            </Link>
          ))}
          {(!streams || streams.length === 0) && (
            <div className="discover-empty col-span-full">Live darshan links are being curated. Festival broadcasts will appear here.</div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function LiveDarshanDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: stream, isLoading, isError } = useQuery({
    queryKey: ['live-stream', id],
    queryFn: () => getLiveStream(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="discover-state">Preparing the darshan…</div>;
  }
  if (isError || !stream) {
    return (
      <div className="discover-state discover-error">
        <p>We could not find this stream.</p>
        <Link to="/darshan" className="btn-secondary mt-3 inline-flex">Back to Live Darshan</Link>
      </div>
    );
  }

  const embedUrl = toEmbedUrl(stream.url, stream.provider);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 pb-10">
      <Link to="/darshan" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-terracotta transition-colors self-start">
        <ArrowLeft size={16} /> All Live Darshan
      </Link>

      <section className="temple-card overflow-hidden">
        <div className="p-5 md:p-7 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-gold">{stream.provider === 'youtube' ? 'Live stream' : 'Official portal'}</span>
            {stream.featured && <span className="badge-tulsi">Featured</span>}
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-text-primary">{stream.title}</h1>
          {stream.templeName && (
            <Link to={`/temples/${stream.templeSlug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta self-start">
              <MapPin size={14} /> {stream.templeName}
            </Link>
          )}
        </div>

        {embedUrl ? (
          <div className="aspect-video w-full bg-black">
            <iframe
              src={embedUrl}
              title={stream.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="p-5 md:p-7 pt-0">
            <div className="rounded-xl bg-surface-subtle border border-border p-6 flex flex-col items-start gap-3">
              <Radio size={22} className="text-terracotta" />
              <p className="text-sm text-text-secondary leading-relaxed">
                {stream.scheduleNote || 'This darshan is hosted on the temple\u2019s official channel.'}
              </p>
              <a href={stream.url} target="_blank" rel="noreferrer" className="btn-primary">
                Open official portal <ExternalLink size={15} />
              </a>
            </div>
          </div>
        )}
      </section>
    </motion.div>
  );
}
