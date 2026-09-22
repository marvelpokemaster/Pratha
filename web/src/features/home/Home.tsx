import { useState } from 'react';
import { ShieldCheck, HeartHandshake, Flame, MapPin, Sparkles, Sun, Clock, ArrowRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RishiChatModal } from '@/features/ai/RishiChatModal';
import { useAuth } from '@/features/auth/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getPujas } from '@/lib/api/puja';
import { getWelfareStats } from '@/lib/api/gaushala';
import { IMAGES } from '@/lib/images';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/Card';

export function Home() {
  const [rishiOpen, setRishiOpen] = useState(false);
  const { user } = useAuth();
  const devoteeName = user?.email?.split('@')[0] || 'Devotee';

  const { data: pujaData } = useQuery({
    queryKey: ['pujas'],
    queryFn: () => getPujas({ filterBy: 'live' }),
  });

  const { data: welfareData } = useQuery({
    queryKey: ['welfareStats'],
    queryFn: () => getWelfareStats(),
  });

  const featuredPuja = pujaData?.pujas?.[0] || {
    id: 'ganga_aarti_varanasi',
    title: 'Maha Ganga Aarti & Deep Daan',
    templeName: 'Dashashwamedh Ghat, Varanasi',
    dateTimeStr: 'Daily, 6:45 PM IST',
    durationStr: '1.5 Hours',
    devoteesCount: '45.2k Devotees attending',
    priceRupees: 1101,
    description: 'Experience the divine energy of Varanasi\'s most sacred evening ritual of sacred lamps, Vedic mantras, and holy river aradhana.'
  };

  const totalRescued = welfareData?.totalRescued || 450;
  const totalMeals = welfareData?.totalMealsServed || 13500;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as any, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} className="flex flex-col gap-6 md:gap-10 pb-10">
      
      {/* Editorial Dawn Sanctuary Banner */}
      <motion.section  className="flex flex-col gap-5 pt-2">
        <div className="flex items-center gap-3">
          <span className="font-mantra text-xs md:text-sm tracking-widest text-terracotta uppercase font-bold">
            सुप्रभातम् • शुभं भवतु
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-xs font-semibold text-text-secondary shadow-sm">
            <ShieldCheck size={14} className="text-tulsi" />
            Vrindavan Sanctuary
          </div>
        </div>

        <div>
          <h1 className="font-serif text-3xl md:text-5xl font-semibold text-text-primary mb-3">
            Good Morning, <span className="text-terracotta">{devoteeName}</span>.
          </h1>
          <p className="text-text-secondary text-base md:text-lg leading-relaxed max-w-2xl">
            Step into today with peace. Connect with timeless rituals, nourish indigenous cattle, and invoke blessings for your family.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-2">
          <Link to="/seva" className="flex items-center gap-2 bg-terracotta hover:bg-terracotta-hover text-white px-6 py-3 rounded-md font-medium transition-colors">
            <HeartHandshake size={18} />
            <span>Sponsor Daily Fodder</span>
          </Link>
          <Link to="/pujas" className="flex items-center gap-2 bg-surface hover:bg-surface-subtle border border-border text-text-primary px-6 py-3 rounded-md font-medium transition-colors">
            <Flame size={18} className="text-terracotta" />
            <span>Explore Pujas</span>
          </Link>
        </div>
      </motion.section>

      {/* Quick Action Navigation Grid */}
      <motion.section  className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mt-4">
        {[
          { to: '/pujas', icon: Flame, title: 'Book a Puja', sub: 'Varanasi, Ujjain, Tirupati', color: 'text-terracotta', bg: 'bg-terracotta-light' },
          { to: '/seva', icon: HeartHandshake, title: 'Gau Seva', sub: 'Green Fodder & Medicine', color: 'text-tulsi', bg: 'bg-tulsi-light' },
          { to: '/gaushala', icon: MapPin, title: 'Meet the Herd', sub: 'Shri Krishna Gaushala', color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((item, i) => (
          <Link key={i} to={item.to} className="group flex flex-col gap-3 p-4 md:p-5 rounded-lg bg-surface border border-border hover:bg-surface-subtle transition-colors">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.bg} ${item.color}`}>
              <item.icon size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-[15px] text-text-primary">{item.title}</h4>
              <p className="text-xs text-text-muted mt-0.5">{item.sub}</p>
            </div>
          </Link>
        ))}
        
        <button onClick={() => setRishiOpen(true)} className="group flex flex-col gap-3 p-4 md:p-5 rounded-lg bg-surface hover:bg-gold-light/10 border border-border transition-colors text-left">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gold-light text-[#9E6F05]">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-[15px] text-[#9E6F05]">Rishi Vedic AI</h4>
            <p className="text-xs text-[#9E6F05]/70 mt-0.5">Vedic Guidance & Timing</p>
          </div>
        </button>
      </motion.section>

      {/* Rich Panchang Almanac Widget */}
      <motion.section >
        <Card className="overflow-hidden border-border-subtle">
          <div className="p-5 md:p-6 border-b border-border bg-surface flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun size={24} className="text-gold" />
              <h3 className="font-serif text-xl font-semibold text-text-primary">Today's Vedic Panchang</h3>
            </div>
            <div className="hidden md:flex px-3 py-1 bg-tulsi-light text-tulsi rounded-full text-xs font-bold tracking-widest uppercase">
              Margashirsha Maas
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border bg-surface-subtle/50">
            {[
              { label: 'Tithi', val: 'Shukla Ekadashi', sub: 'Auspicious for Vishnu Pooja' },
              { label: 'Nakshatra', val: 'Mrigashirsha', sub: 'Ruled by Soma • Gentle' },
              { label: 'Auspicious Muhurat', val: 'Abhijit Muhurat', sub: '11:48 AM – 12:36 PM' },
              { label: 'Surya Timings', val: 'Sunrise 06:28 AM', sub: 'Sunset 06:42 PM' }
            ].map((p, i) => (
              <div key={i} className="p-5 md:p-6 flex flex-col gap-1">
                <span className="text-[11px] font-bold tracking-widest uppercase text-text-muted">{p.label}</span>
                <span className="font-semibold text-text-primary text-[15px]">{p.val}</span>
                <span className="text-xs text-text-secondary mt-1">{p.sub}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.section>

      {/* Today's Featured Ritual */}
      <motion.section >
        <Card className="flex flex-col md:flex-row overflow-hidden shadow-sm hover:shadow-md transition-shadow group border-border">
          <div className="relative md:w-2/5 aspect-[4/3] md:aspect-auto overflow-hidden bg-surface-subtle">
            <img 
              src={featuredPuja.templeName.includes("Varanasi") ? IMAGES.rituals.kashiVishwanathAarti : IMAGES.pujas.rudraAbhishekam} 
              alt={featuredPuja.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-white tracking-wide">Featured Aarti</span>
            </div>
          </div>

          <div className="p-6 md:p-8 md:w-3/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-terracotta" />
                  {featuredPuja.templeName}
                </span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {featuredPuja.dateTimeStr}
                </span>
              </div>

              <h3 className="font-serif text-2xl md:text-3xl font-semibold text-text-primary mb-3">
                {featuredPuja.title}
              </h3>
              <p className="text-text-secondary leading-relaxed mb-6">
                {featuredPuja.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-border">
              <div>
                <span className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Sankalpa Dakshina</span>
                <span className="text-xl font-bold text-text-primary">₹{featuredPuja.priceRupees}</span>
              </div>

              <Link to="/pujas" className="flex items-center gap-2 bg-surface hover:bg-surface-subtle text-text-primary border border-border px-5 py-2.5 rounded-md font-medium transition-colors">
                <span>Participate</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* Daily Vedic Wisdom Shloka */}
      <motion.section  className="text-center py-10 px-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-gold-light text-[#9E6F05] flex items-center justify-center font-serif text-2xl shadow-inner mb-6">ॐ</div>
        <h4 className="font-mantra text-xl md:text-2xl font-bold text-text-primary tracking-widest mb-4">गावो विश्वस्य मातरः</h4>
        <p className="text-text-secondary max-w-lg mx-auto italic font-serif leading-relaxed">
          "The Cow is the Mother of the cosmic universe — embodying unconditional sustenance, forgiveness, and universal motherly love."
        </p>
      </motion.section>

      <RishiChatModal isOpen={rishiOpen} onClose={() => setRishiOpen(false)} />
    </motion.div>
  );
}
