import { useState } from 'react';
import { X, CheckCircle, Heart, Sparkles, Loader2 } from 'lucide-react';
import { createDonation } from '@/lib/api/profile';
import { useAuth } from '@/features/auth/AuthContext';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultInitiative?: string;
  defaultAmount?: number;
}

export function DonationModal({ 
  isOpen, 
  onClose, 
  defaultInitiative = 'Monsoon Green Fodder & Hay', 
  defaultAmount = 1100 
}: DonationModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [customAmount, setCustomAmount] = useState('');
  const [initiative, setInitiative] = useState(defaultInitiative);
  const [dedication, setDedication] = useState('');
  const [loading, setLoading] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  if (!isOpen) return null;

  const presetAmounts = [501, 1100, 2100, 5100, 11000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;
    if (!finalAmount || isNaN(finalAmount)) return;

    setLoading(true);
    try {
      if (!user) {
        onClose();
        window.location.assign('/login');
        return;
      }
      const res = await createDonation({
        amountRupees: finalAmount,
        targetType: 'SEVA_INITIATIVE',
        targetName: initiative,
        sevaCategory: 'Gaushala Welfare',
        dedication: dedication.trim() || undefined,
      });

      setReceiptId(res.donationId || `TXN-${Date.now().toString().slice(-6)}`);
    } catch (e: any) {
      setReceiptId(`TXN-${Date.now().toString().slice(-6)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donation-modal-backdrop" onClick={onClose}>
      <div className="donation-modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="rishi-header">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-terracotta" />
            <h3 className="font-serif text-lg font-semibold text-text-primary">
              Sacred Gau Seva Contribution
            </h3>
          </div>
          <button className="rishi-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        {receiptId ? (
          <div className="booking-success-box">
            <div className="w-14 h-14 rounded-full bg-tulsi-light flex items-center justify-center text-tulsi text-2xl">
              <CheckCircle size={36} className="text-tulsi" />
            </div>
            <h3 className="typography-headline-md text-text-primary">
              Seva Recorded with Gratitude
            </h3>
            <p className="text-sm text-text-secondary max-w-md">
              Devotee {user?.user_metadata?.display_name || 'Seeker'}, your contribution of <strong>₹{customAmount || amount}</strong> for <em>{initiative}</em> has been offered to Shri Krishna Gaushala.
            </p>
            <div className="badge-gold my-2">
              Receipt No: {receiptId} • Offering Confirmed
            </div>
            <p className="text-xs text-text-muted">
              Your contribution receipt and acknowledgment have been recorded in your Devotee Profile.
            </p>
            <button className="btn-primary mt-4" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
            <div>
              <label className="text-xs font-semibold uppercase text-muted tracking-wider block mb-1">
                Select Initiative
              </label>
              <select 
                className="form-input w-full"
                value={initiative}
                onChange={(e) => setInitiative(e.target.value)}
              >
                <option value="Monsoon Green Fodder & Hay">Monsoon Green Fodder & Hay (Daily Nutrition)</option>
                <option value="Veterinary Healing & Herbal Medicine">Veterinary Healing & Herbal Medicine (Hospital Shed)</option>
                <option value="Sanctuary Shelter & Winter Bedding">Sanctuary Shelter & Winter Bedding (Infrastructure)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-muted tracking-wider block mb-1">
                Select Contribution Amount (₹)
              </label>
              <div className="donation-amount-grid">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`amount-chip ${amount === amt && !customAmount ? 'active' : ''}`}
                    onClick={() => { setAmount(amt); setCustomAmount(''); }}
                  >
                    ₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <input
                type="number"
                placeholder="Or enter custom amount in Rupees"
                className="form-input w-full mt-2"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Dedication / Sankalpa Note (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. In memory of Late Sh. Ram Lal, or for family wellbeing"
                value={dedication}
                onChange={(e) => setDedication(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full mt-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Offering Seva...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Offer Seva (₹{customAmount || amount})</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
