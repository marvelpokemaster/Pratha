import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { X, HeartHandshake, Loader2, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';

const submitGaushalaDonation = async (uid: string, data: any) => {
  return new Promise(resolve => setTimeout(resolve, 800));
};

export function DonationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('1100');
  const [dedication, setDedication] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { alert('Please sign in to donate'); return; }
    
    setLoading(true);
    try {
      await submitGaushalaDonation(user.uid, {
        amountRupees: parseInt(amount),
        dedication,
        targetId: 'general_fund',
        targetName: 'General Gaushala Fund'
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to process donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeAndReset = () => {
    onClose();
    setTimeout(() => setSuccess(false), 300);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeAndReset()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed z-50 left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%] w-full max-w-md bg-surface md:rounded-3xl rounded-t-3xl rounded-b-none shadow-2xl p-6 md:p-8"
              >
                {!success ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-tulsi-light text-tulsi flex items-center justify-center">
                          <HeartHandshake size={20} />
                        </div>
                        <Dialog.Title className="font-serif text-xl font-semibold text-text-primary m-0">Sponsor Gau Seva</Dialog.Title>
                      </div>
                      <Dialog.Close asChild>
                        <button className="p-2 rounded-full hover:bg-surface-subtle text-text-muted transition-colors"><X size={20} /></button>
                      </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider pl-1">Donation Amount (₹)</label>
                        <select className="w-full bg-surface-subtle border border-border rounded-xl px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-tulsi/50 focus:border-tulsi" value={amount} onChange={(e) => setAmount(e.target.value)}>
                          <option value="1100">₹1,100 - 1 Day Fodder Seva</option>
                          <option value="2100">₹2,100 - Medical Seva</option>
                          <option value="5100">₹5,100 - 1 Month Adoption</option>
                          <option value="11000">₹11,000 - Maha Seva</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-text-muted uppercase tracking-wider pl-1">Dedication / Message (Optional)</label>
                        <textarea className="w-full bg-surface-subtle border border-border rounded-xl px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-tulsi/50 focus:border-tulsi min-h-[100px]" placeholder="e.g., In loving memory of..." value={dedication} onChange={(e) => setDedication(e.target.value)} />
                      </div>

                      <Button type="submit" disabled={loading} className="w-full py-6 rounded-xl font-semibold bg-tulsi hover:bg-tulsi text-white shadow-lg shadow-tulsi/20 mt-2">
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : `Proceed to Pay ₹${amount}`}
                      </Button>
                    </form>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-8">
                    <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
                      <FileCheck size={40} />
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-text-primary mb-2">Seva Accepted</h3>
                    <p className="text-text-secondary mb-8 leading-relaxed">Your sacred offering has been received. The Gaushala caretakers express their deep gratitude.</p>
                    <Button onClick={closeAndReset} className="w-full rounded-full">Return to Sanctuary</Button>
                  </motion.div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
