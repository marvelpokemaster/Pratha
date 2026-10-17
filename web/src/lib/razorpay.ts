import { supabase } from './supabase';

export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

let scriptLoadedPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);
  if (scriptLoadedPromise) return scriptLoadedPromise;

  scriptLoadedPromise = new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptLoadedPromise;
}

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentId: string;
  description?: string;
}

export async function createPaymentOrder(entityType: 'booking' | 'contribution', entityId: string): Promise<CreateOrderResult> {
  const { data, error } = await supabase.functions.invoke('razorpay-order', {
    body: { action: 'create', entityType, entityId },
  });

  if (error) {
    throw new Error(error.message || 'Failed to initialize payment order');
  }
  if (!data?.orderId) {
    throw new Error(data?.error || 'Failed to create payment order with provider');
  }

  return data as CreateOrderResult;
}

export async function verifyPayment(params: {
  paymentId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}): Promise<{ success: boolean; status: string }> {
  const { data, error } = await supabase.functions.invoke('razorpay-order', {
    body: {
      action: 'verify',
      paymentId: params.paymentId,
      razorpayPaymentId: params.razorpayPaymentId,
      razorpayOrderId: params.razorpayOrderId,
      razorpaySignature: params.razorpaySignature,
    },
  });

  if (error) {
    throw new Error(error.message || 'Payment signature verification failed');
  }
  if (!data?.success) {
    throw new Error(data?.error || 'Verification rejected');
  }

  return data;
}

export interface CheckoutOptions {
  order: CreateOrderResult;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (paymentResult: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => Promise<void> | void;
  onDismiss?: () => void;
  onError?: (err: any) => void;
}

export async function startRazorpayCheckout(opts: CheckoutOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !(window as any).Razorpay) {
    throw new Error('Razorpay Checkout SDK is not available. Please check your internet connection.');
  }

  const razorpayOptions = {
    key: opts.order.keyId || RAZORPAY_KEY_ID,
    amount: opts.order.amount,
    currency: opts.order.currency || 'INR',
    name: 'Pratha',
    description: opts.order.description || 'Sacred Offering / Seva',
    order_id: opts.order.orderId,
    prefill: {
      name: opts.prefill?.name || '',
      email: opts.prefill?.email || '',
      contact: opts.prefill?.contact || '',
    },
    theme: {
      color: '#a04b2a', // Pratha terracotta
    },
    modal: {
      ondismiss: () => {
        opts.onDismiss?.();
      },
    },
    handler: async (response: any) => {
      try {
        await opts.onSuccess({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
      } catch (err) {
        opts.onError?.(err);
      }
    },
  };

  const rzp = new (window as any).Razorpay(razorpayOptions);
  rzp.on('payment.failed', (resp: any) => {
    console.error('Razorpay payment failed:', resp.error);
    opts.onError?.(new Error(resp.error?.description || 'Payment failed'));
  });
  rzp.open();
}
