import { useState, useEffect } from 'react';
import { User, HeartHandshake, Flame, Settings, Users, LogOut, ArrowRight, ShieldCheck, MapPin, FileCheck, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { Link } from 'react-router-dom';
import { getProfile, addFamilyMember } from '@/lib/api/profile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const getGaushalaDonationsForUser = async (uid: string) => { return []; };
const getPujaBookingsForUser = async (uid: string) => { return []; };

type ProfileTab = 'seva' | 'pujas' | 'family' | 'settings';

export function Profile() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('seva');
  const queryClient = useQueryClient();

  const [showAddFamily, setShowAddFamily] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState('Spouse');
  const [memberNakshatra, setMemberNakshatra] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: () => getProfile(),
    enabled: !!user,
  });

  const { data: rawDonations = [] } = useQuery({
    queryKey: ['donations', user?.uid],
    queryFn: () => getGaushalaDonationsForUser(user?.uid as string),
    enabled: !!user,
  });

  const { data: pujasData = [] } = useQuery({
    queryKey: ['pujaBookings', user?.uid],
    queryFn: () => getPujaBookingsForUser(user?.uid as string),
    enabled: !!user,
  });

  const donations = (rawDonations as any[]).sort((a, b) => b.createdAt - a.createdAt);
  const bookings = (pujasData as any[]).sort((a, b) => b.createdAt - a.createdAt);
  const family = profile?.profile?.familyMembers || [];

  const addFamilyMutation = useMutation({
    mutationFn: () => addFamilyMember({
      name: memberName, relationship: memberRelation, nakshatra: memberNakshatra
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.uid] });
      setShowAddFamily(false);
      setMemberName('');
      setMemberNakshatra('');
    }
  });

  const handleAddFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;
    addFamilyMutation.mutate();
  };

  const tabs = [
    { id: 'seva', label: 'Offerings', icon: HeartHandshake },
    { id: 'pujas', label: 'Pujas', icon: Flame },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : 'ॐ';

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-10">
      
      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-5 pt-4"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-terracotta to-gold text-white flex items-center justify-center font-serif text-3xl font-bold shadow-lg shadow-terracotta/20 shrink-0">
          {getInitials(profile?.profile?.displayName || user?.email)}
        </div>
        
        <div className="flex flex-col gap-1.5 md:pt-2">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-text-primary">
              {profile?.profile?.displayName || user?.email?.split('@')[0] || 'Devotee'}
            </h1>
            <ShieldCheck size={20} className="text-gold" />
          </div>
          <p className="text-text-secondary text-[15px]">{user?.email}</p>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
            <span className="px-3 py-1 bg-tulsi-light text-tulsi rounded-full text-xs font-bold tracking-widest uppercase border border-tulsi/20">
              Verified Devotee
            </span>
          </div>
        </div>
      </motion.div>

      {/* Profile Navigation */}
      <div className="sticky top-[72px] md:top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border -mx-4 px-4 md:mx-0 md:px-0 py-2">
        <div className="flex overflow-x-auto hide-scrollbar gap-2 md:gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-terracotta",
                activeTab === tab.id 
                  ? "bg-surface border border-border shadow-sm text-terracotta" 
                  : "text-text-muted hover:text-text-primary hover:bg-surface-subtle"
              )}
            >
              <tab.icon size={16} className={activeTab === tab.id ? "text-terracotta" : ""} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {activeTab === 'seva' && (
          <div className="flex flex-col gap-4">
            {donations.length === 0 ? (
              <EmptyState 
                icon={HeartHandshake}
                title="No Offerings Yet"
                desc="Begin your journey of compassion by offering sacred food to the indigenous cows of Vrindavan."
                actionLink="/seva"
                actionLabel="Sponsor Green Fodder"
              />
            ) : (
              donations.map((d) => (
                <Card key={d.id} className="p-5 flex justify-between items-center group hover:shadow-md transition-shadow">
                  <div>
                    <h4 className="font-semibold text-text-primary text-[15px]">{d.targetName || 'Gau Seva Offering'}</h4>
                    <p className="text-xs text-text-muted mt-1">Ref: {d.id} • {d.dateStr || 'Recorded'}</p>
                    {d.dedication && (
                      <p className="text-sm text-text-secondary italic mt-2 border-l-2 border-gold/30 pl-3 py-0.5">
                        "{d.dedication}"
                      </p>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="font-serif font-bold text-lg text-terracotta">₹{d.amountRupees}</span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-tulsi bg-tulsi-light px-2 py-0.5 rounded-full">
                      {d.paymentStatus}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'pujas' && (
          <div className="flex flex-col gap-4">
            {bookings.length === 0 ? (
              <EmptyState 
                icon={Flame}
                title="No Puja Bookings Found"
                desc="Book an authentic temple ceremony across sacred sanctums to view your confirmed bookings and live darshan links here."
                actionLink="/pujas"
                actionLabel="Explore Sacred Pujas"
              />
            ) : (
              bookings.map((b) => (
                <Card key={b.id} className="p-5 flex justify-between items-center group hover:shadow-md transition-shadow">
                  <div>
                    <div className="inline-block px-2 py-0.5 bg-gold-light text-gold text-[10px] font-bold uppercase tracking-widest rounded-full mb-2">
                      {b.status || 'CONFIRMED'}
                    </div>
                    <h4 className="font-semibold text-text-primary text-[15px]">{b.pujaTitle}</h4>
                    <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                      <MapPin size={12} className="text-terracotta" /> {b.templeName} • {b.bookingDate || 'Scheduled Daily'}
                    </p>
                    <p className="text-sm text-text-muted mt-2 border-l-2 border-border pl-3">
                      Chanted for: <strong className="text-text-primary font-semibold">{b.sankalpaName}</strong> (Gotra: {b.gotra || 'Self'})
                    </p>
                  </div>
                  <div className="text-right flex flex-col justify-center">
                    <span className="font-serif font-bold text-lg text-terracotta">₹{b.amountRupees}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'family' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                Chanted in Sankalpas
              </span>
              <Button variant="outline" size="sm" className="h-8 rounded-full" onClick={() => setShowAddFamily(!showAddFamily)}>
                <Plus size={14} className="mr-1.5" />
                Add Member
              </Button>
            </div>

            <AnimatePresence>
              {showAddFamily && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <Card className="p-5 border-gold/30 bg-gold-light/10">
                    <form onSubmit={handleAddFamily} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider pl-1">Full Name</label>
                        <input type="text" required placeholder="e.g. Family member name" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50" value={memberName} onChange={(e) => setMemberName(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider pl-1">Relationship</label>
                          <select className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50" value={memberRelation} onChange={(e) => setMemberRelation(e.target.value)}>
                            <option>Spouse</option><option>Child</option><option>Parent</option><option>Sibling</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider pl-1">Nakshatra</label>
                          <input type="text" placeholder="e.g. Ashwini" className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/50" value={memberNakshatra} onChange={(e) => setMemberNakshatra(e.target.value)} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <Button type="button" variant="ghost" onClick={() => setShowAddFamily(false)}>Cancel</Button>
                        <Button type="submit" disabled={addFamilyMutation.isPending}>{addFamilyMutation.isPending ? 'Saving...' : 'Save Member'}</Button>
                      </div>
                    </form>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {family.length === 0 ? (
              <EmptyState 
                icon={Users}
                title="No Family Registered"
                desc="Add your family members to automatically include them during sacred Sankalpa chants."
                actionOnClick={() => setShowAddFamily(true)}
                actionLabel="Add Family Member"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {family.map((f) => (
                  <Card key={f.id} className="p-4 flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold text-[15px] text-text-primary">{f.name}</h5>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {f.relationship} {f.nakshatra ? `• Nakshatra: ${f.nakshatra}` : ''}
                      </p>
                    </div>
                    <div className="bg-tulsi-light text-tulsi px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                      <Sparkles size={10} /> Included
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col gap-4">
            <Card className="p-5 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-[15px] text-text-primary">Sacred Notifications</h4>
                <p className="text-xs text-text-secondary mt-0.5">Daily Panchang & Aarti updates</p>
              </div>
              <div className="bg-tulsi-light text-tulsi px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Active</div>
            </Card>

            <Button variant="destructive" onClick={signOut} className="w-full justify-center gap-2 mt-4 py-6 rounded-xl font-semibold">
              <LogOut size={16} /> Sign Out of Sanctuary
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, actionLink, actionLabel, actionOnClick }: any) {
  return (
    <Card className="p-8 text-center flex flex-col items-center justify-center border-dashed border-2 bg-surface-subtle/30">
      <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center text-terracotta mb-4 shadow-sm">
        <Icon size={28} />
      </div>
      <h4 className="font-serif text-xl font-semibold text-text-primary mb-2">{title}</h4>
      <p className="text-sm text-text-secondary max-w-md mx-auto mb-6 leading-relaxed">{desc}</p>
      {actionLink ? (
        <Link to={actionLink}>
          <Button variant="outline" className="rounded-full gap-2 font-semibold">
            {actionLabel} <ArrowRight size={16} />
          </Button>
        </Link>
      ) : (
        <Button variant="outline" onClick={actionOnClick} className="rounded-full gap-2 font-semibold">
          <Plus size={16} /> {actionLabel}
        </Button>
      )}
    </Card>
  );
}
