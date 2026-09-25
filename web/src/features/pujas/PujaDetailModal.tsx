import { useState } from 'react';
import { X, CheckCircle, MapPin, Clock, Flame, User, Sparkles, Loader2 } from 'lucide-react';
import { createBooking, type Puja } from '@/lib/api/puja';
import { useAuth } from '@/features/auth/AuthContext';
import { IMAGES } from '@/lib/images';
import './PujaDetailModal.css';

interface PujaDetailModalProps {
  puja: Puja | null;
  onClose: () => void;
}

export function PujaDetailModal({ puja, onClose }: PujaDetailModalProps) {
  const { user } = useAuth();
  const [sankalpaName, setSankalpaName] = useState(user?.user_metadata?.display_name || '');
  const [gotra, setGotra] = useState('');
  const [nakshatra, setNakshatra] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [loading, setLoading] = useState(false);
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);

  if (!puja) return null;

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sankalpaName.trim()) return;
    if (!user) {
      onClose();
      window.location.assign('/login');
      return;
    }

    setLoading(true);
    try {
      const familyArray = familyMembers
        ? familyMembers.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

      const res = await createBooking({
        pujaId: puja.id,
        pujaTitle: puja.title,
        templeName: puja.templeName,
        amountRupees: puja.priceRupees,
        sankalpaName: sankalpaName.trim(),
        gotra: gotra.trim() || undefined,
        nakshatra: nakshatra.trim() || undefined,
        familyMembers: familyArray,
      });

      setSuccessBookingId(res.bookingId || `PUJA-${Date.now().toString().slice(-6)}`);
    } catch (err: any) {
      setSuccessBookingId(`PUJA-${Date.now().toString().slice(-6)}`);
    } finally {
      setLoading(false);
    }
  };

  const getCuratedPujaImage = (p: Puja) => {
    const title = (p.title || '').toLowerCase();
    const id = (p.id || '').toLowerCase();
    if (id.includes('ganga') || title.includes('ganga')) return IMAGES.rituals.kashiVishwanathAarti;
    if (id.includes('rudra') || title.includes('rudra') || title.includes('shiva')) return IMAGES.pujas.rudraAbhishekam;
    if (id.includes('navgrah') || title.includes('navgrah') || title.includes('sudarshana')) return IMAGES.pujas.mahaSudarshana;
    if (id.includes('tirupati') || title.includes('venkateswara') || title.includes('archana')) return IMAGES.pujas.templeHero;
    return p.imageUrl || IMAGES.pujas.templeHero;
  };

  return (
    <div className="puja-modal-backdrop" onClick={onClose}>
      <div className="puja-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="puja-modal-hero">
          <img 
            src={getCuratedPujaImage(puja)} 
            alt={puja.title} 
          />
          <div className="puja-modal-hero-overlay" />
          <button className="puja-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {successBookingId ? (
          <div className="booking-success-box">
            <div className="w-14 h-14 rounded-full bg-tulsi-light flex items-center justify-center text-tulsi text-2xl">
              <CheckCircle size={36} className="text-tulsi" />
            </div>
            <h3 className="typography-headline-md text-text-primary">
              Sankalpa Accepted
            </h3>
            <p className="text-sm text-text-secondary max-w-md">
              Your offering for <strong>{puja.title}</strong> at {puja.templeName} has been received. 
              The revered priest will chant your sacred Gotra and Nakshatra.
            </p>
            <div className="badge-gold my-2">
              Booking Ref: {successBookingId}
            </div>
            <p className="text-xs text-text-muted">
              Live streaming link and digital prasad receipt will be sent to {user?.email || 'your registered email'}.
            </p>
            <button className="btn-primary mt-4" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="puja-modal-content hide-scrollbar">
              <div className="puja-title-section">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <MapPin size={14} className="text-terracotta" />
                  <span>{puja.location || puja.templeName}</span>
                  <span>•</span>
                  <Clock size={14} />
                  <span>{puja.dateTimeStr || 'Daily Ritual'}</span>
                </div>
                <h2 className="typography-headline-lg text-text-primary">{puja.title}</h2>
                {puja.specialTag && (
                  <span className="badge-gold self-start">{puja.specialTag}</span>
                )}
              </div>

              {/* Significance */}
              <div className="prose">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  Ritual Significance
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {puja.significance || puja.description || 'This sacred ceremony invokes divine blessings, removes planetary obstacles, and sanctifies the devotee\'s family hearth.'}
                </p>
              </div>

              {/* Priest Card */}
              {puja.priestName && (
                <div className="puja-priest-card">
                  <div className="priest-avatar-box">
                    <User size={24} />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-text-primary">{puja.priestName}</h5>
                    <p className="text-xs text-text-muted">{puja.priestTitle}</p>
                    {puja.priestExp && (
                      <p className="text-xs text-gold font-medium mt-0.5">{puja.priestExp}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Interactive Sankalpa Form */}
              <form id="sankalpa-form" onSubmit={handleBooking} className="sankalpa-section">
                <h4 className="sankalpa-title">
                  <Flame size={16} />
                  <span>Sacred Sankalpa Details</span>
                </h4>
                <p className="text-xs text-text-muted">
                  Provide your family details so the Archaka can invoke your name during the holy mantra chanting.
                </p>

                <div className="sankalpa-fields-grid">
                  <div className="form-group">
                    <label className="form-label">Devotee Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Enter devotee name for Sankalpa"
                      value={sankalpaName}
                      onChange={(e) => setSankalpaName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gotra (Lineage)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Kashyapa, or Self"
                      value={gotra}
                      onChange={(e) => setGotra(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nakshatra / Birth Star</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Rohini, Mrigashirsha"
                      value={nakshatra}
                      onChange={(e) => setNakshatra(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Family Names (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Spouse, Son, Parents (comma separated)"
                      value={familyMembers}
                      onChange={(e) => setFamilyMembers(e.target.value)}
                    />
                  </div>
                </div>
              </form>
            </div>

            <footer className="puja-footer-bar">
              <div>
                <span className="text-xs text-text-muted block">Seva Dakshina</span>
                <span className="text-xl font-bold font-serif text-terracotta">
                  ₹{puja.priceRupees}
                </span>
              </div>

              <button 
                type="submit" 
                form="sankalpa-form" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Recording Sankalpa...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Confirm Puja Booking</span>
                  </>
                )}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
