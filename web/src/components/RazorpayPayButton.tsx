import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RAZORPAY_KEY_ID } from '@/lib/razorpay';

interface RazorpayPayButtonProps {
  amount: number; // in paise (e.g., 50000 for ₹500)
  currency?: string;
  receipt?: string;
  label?: string;
  className?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess?: (paymentData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onError?: (error: Error) => void;
}

export function RazorpayPayButton({
  amount,
  currency = 'INR',
  receipt,
  label,
  className = 'btn-primary',
  prefill,
  onSuccess,
  onError,
}: RazorpayPayButtonProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Inject Razorpay script if not already present
    if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePay = async () => {
    if (amount < 100) {
      const err = new Error('Minimum payment amount is 100 paise (₹1.00)');
      onError?.(err);
      alert(err.message);
      return;
    }

    setLoading(true);
    try {
      // Step 1: Call Backend to Create Order
      const { data: order, error: orderErr } = await supabase.functions.invoke('razorpay-order', {
        body: {
          action: 'create',
          amount,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
        },
      });

      if (orderErr || !order?.order_id) {
        throw new Error(orderErr?.message || order?.error || 'Failed to create payment order');
      }

      // Step 2: Open Razorpay Standard Checkout Modal
      const rzp = new (window as any).Razorpay({
        key: order.keyId || RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'Pratha',
        description: 'Standard Sacred Offering',
        prefill: {
          name: prefill?.name || '',
          email: prefill?.email || '',
          contact: prefill?.contact || '',
        },
        theme: {
          color: '#a04b2a',
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // Step 3: Verify Payment Signature via Backend
            const { data: verifyRes, error: verifyErr } = await supabase.functions.invoke('razorpay-order', {
              body: {
                action: 'verify',
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });

            if (verifyErr || !verifyRes?.success) {
              throw new Error(verifyErr?.message || verifyRes?.error || 'Payment signature verification failed');
            }

            onSuccess?.(response);
          } catch (vErr: any) {
            console.error('Signature verification error:', vErr);
            onError?.(vErr);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      rzp.on('payment.failed', (resp: any) => {
        console.error('Payment failed event:', resp.error);
        const failErr = new Error(resp.error?.description || 'Payment was declined');
        onError?.(failErr);
        setLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      onError?.(err);
      alert(err.message || 'Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  const buttonText = label || `Pay ₹${(amount / 100).toLocaleString('en-IN')}`;

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          <span>Opening Checkout...</span>
        </span>
      ) : (
        buttonText
      )}
    </button>
  );
}
