import { useState } from 'react';
import { Sparkles, Calendar, MapPin, Clock, Compass } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export function KundliPujaFinder() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<null | any>(null);

  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('');
  const [pob, setPob] = useState('');

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob || !tob || !pob) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI Astrological Analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setResult({
        dosha: "Manglik Dosha & Weak Surya",
        recommendation: "Navgrah Shanti Mahayajna",
        reason: "Based on your birth charts, strengthening your Sun (Surya) and pacifying Mars (Mangal) will remove career obstacles and bring harmony.",
        pujaId: "navgrah_shanti_mahayajna"
      });
    }, 2500);
  };

  const resetForm = () => {
    setResult(null);
    setDob('');
    setTob('');
    setPob('');
    setIsOpen(false);
  }

  if (!isOpen && !result) {
    return (
      <Card className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-border-subtle bg-surface-subtle overflow-hidden relative group cursor-pointer hover:border-gold/50 transition-colors" onClick={() => setIsOpen(true)}>
        <div className="absolute -right-10 -top-10 opacity-5 rotate-12 pointer-events-none">
          <Compass size={200} />
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-gold" />
            <h3 className="font-serif text-xl font-semibold text-text-primary">Personalized Pooja Guidance</h3>
          </div>
          <p className="text-sm text-text-secondary max-w-lg leading-relaxed">
            Discover the exact Vedic rituals and pujas aligned with your birth chart (Kundli). Enter your Date, Time, and Place of Birth for precise astrological recommendations.
          </p>
        </div>

        <Button variant="outline" className="shrink-0 rounded-md border-gold/40 text-text-primary hover:bg-gold-light/20 bg-surface z-10 w-full md:w-auto">
          Find My Puja
        </Button>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border bg-surface shadow-sm">
      <div className="p-5 md:p-6 border-b border-border bg-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Compass size={20} className="text-gold" />
          <h3 className="font-serif text-lg font-semibold text-text-primary">Vedic Astrological Analysis</h3>
        </div>
        <button onClick={resetForm} className="text-xs text-text-muted hover:text-text-primary uppercase tracking-widest font-semibold transition-colors">
          Reset
        </button>
      </div>

      <div className="p-5 md:p-6 bg-surface">
        <AnimatePresence mode="wait">
          {!isAnalyzing && !result && (
            <motion.form 
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleAnalyze} 
              className="flex flex-col gap-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14}/> Date of Birth
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-surface-subtle border border-border rounded-md px-4 py-2.5 text-[15px] focus:outline-none focus:border-terracotta transition-colors text-text-primary"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={14}/> Time of Birth
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full bg-surface-subtle border border-border rounded-md px-4 py-2.5 text-[15px] focus:outline-none focus:border-terracotta transition-colors text-text-primary"
                    value={tob}
                    onChange={(e) => setTob(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={14}/> Place of Birth
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="City, State"
                    className="w-full bg-surface-subtle border border-border rounded-md px-4 py-2.5 text-[15px] focus:outline-none focus:border-terracotta transition-colors text-text-primary"
                    value={pob}
                    onChange={(e) => setPob(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" className="rounded-md font-medium px-8 w-full md:w-auto text-white bg-terracotta hover:bg-terracotta-hover">
                  Analyze Birth Chart
                </Button>
              </div>
            </motion.form>
          )}

          {isAnalyzing && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center text-center gap-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-surface-subtle"></div>
                <div className="w-16 h-16 rounded-full border-4 border-gold border-t-transparent animate-spin absolute top-0 left-0"></div>
                <Compass className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold opacity-50" size={24} />
              </div>
              <div>
                <h4 className="font-serif text-lg font-semibold text-text-primary mb-1">Consulting the Stars...</h4>
                <p className="text-sm text-text-secondary">Aligning planetary positions for {pob}</p>
              </div>
            </motion.div>
          )}

          {result && !isAnalyzing && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="p-5 bg-gold-light/20 border border-gold/20 rounded-md">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-gold mb-1">Detected Afflictions</div>
                    <div className="font-medium text-text-primary mb-4">{result.dosha}</div>
                    
                    <div className="text-[10px] uppercase font-bold tracking-widest text-terracotta mb-1">Recommended Puja</div>
                    <div className="font-serif text-xl font-semibold text-text-primary mb-2">{result.recommendation}</div>
                    <p className="text-sm text-text-secondary leading-relaxed">{result.reason}</p>
                  </div>
                  
                  <div className="flex flex-col justify-end shrink-0 md:border-l md:border-border/50 md:pl-6 pt-4 md:pt-0">
                    <Button 
                      className="rounded-md w-full bg-terracotta text-white hover:bg-terracotta-hover"
                      onClick={() => navigate('/pujas')}
                    >
                      Book This Puja
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
