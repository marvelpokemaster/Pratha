import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { askRishi } from '@/lib/api/ai';
import './RishiChatModal.css';

interface RishiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function RishiChatModal({ isOpen, onClose, initialPrompt }: RishiChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hari Om, Devotee. I am Rishi, your Vedic spiritual guide at Pratha. How may I illuminate your journey of devotion, sanctuary seva, or auspicious timing today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Which ritual is recommended for family peace & health?",
    "What is the spiritual significance of Gau Seva in the Vedas?",
    "Explain today's Panchang and auspicious Muhurat.",
    "How does Shri Krishna Gaushala protect indigenous cows?"
  ];

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const text = queryText || input.trim();
    if (!text || loading) return;

    setInput('');
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await askRishi(text);
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer || 'Blessings upon your journey. May peace prevail.' }]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'The sanctuary winds carry peace. An offline contemplation: In the Atharva Veda, serving Gomata and invoking divine fire brings harmony to hearth and soul.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rishi-modal-backdrop" onClick={onClose}>
      <div className="rishi-modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="rishi-header">
          <div className="rishi-title-group">
            <div className="rishi-avatar">ॐ</div>
            <div>
              <h3 className="rishi-title">Rishi Vedic Companion</h3>
              <p className="rishi-subtitle">Active • Ancient Wisdom & Seva</p>
            </div>
          </div>
          <button className="rishi-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="rishi-messages hide-scrollbar">
          {messages.map((m, idx) => (
            <div key={idx} className={`rishi-msg ${m.role}`}>
              <div className="rishi-msg-bubble">
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="rishi-msg assistant">
              <div className="rishi-msg-bubble flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-terracotta" />
                <span>Invoking Vedic contemplation...</span>
              </div>
            </div>
          )}

          {messages.length === 1 && !loading && (
            <div className="rishi-suggestions">
              <p className="text-xs text-muted font-medium uppercase tracking-wider mb-1">
                Suggested Contemplations
              </p>
              {suggestions.map((sug, i) => (
                <button key={i} className="rishi-chip" onClick={() => handleSend(sug)}>
                  <Sparkles size={14} className="inline mr-2 text-gold" />
                  {sug}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="rishi-input-bar" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <input
            type="text"
            className="rishi-input"
            placeholder="Ask of pujas, panchang, or gau seva..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="rishi-send-btn" disabled={!input.trim() || loading}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
