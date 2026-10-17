import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

async function secret(name: string): Promise<string | null> {
  const { data, error } = await admin.rpc('get_edge_secret', { p_name: name });
  if (error) {
    console.error('get_edge_secret error for', name, error.message);
    return null;
  }
  return data as string | null;
}

async function verifyHmacSignature(orderId: string, paymentId: string, signature: string, secretStr: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretStr),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = encoder.encode(`${orderId}|${paymentId}`);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return expectedSignature === signature;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const keyId = (await secret('razorpay_key_id')) || Deno.env.get('RAZORPAY_KEY_ID') || 'rzp_test_Tp4SdbJcrBUaxf';
    const keySecret = (await secret('razorpay_key_secret')) || Deno.env.get('RAZORPAY_KEY_SECRET') || 'YF0GPxhYpOU5szW3eZmWV2Si';

    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ error: 'Razorpay credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Optional user authentication
    let user: any = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData } = await admin.auth.getUser(token);
      user = userData?.user || null;
    }

    const url = new URL(req.url);
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    
    // Support path-based routing or action parameter
    const isCreate = url.pathname.endsWith('/create-order') || body.action === 'create' || (!body.action && body.amount);
    const isVerify = url.pathname.endsWith('/verify-payment') || body.action === 'verify' || (!body.action && (body.razorpay_signature || body.razorpaySignature));

    if (isCreate) {
      let amountPaise = 0;
      let currency = (body.currency || 'INR').toUpperCase();
      let receiptRef = body.receipt || `rcpt_${Date.now()}`;
      let description = 'Pratha Sacred Offering';
      const entityType = body.entityType || 'booking';
      let entityId = body.entityId;

      if (body.amount != null) {
        amountPaise = Number(body.amount);
        if (isNaN(amountPaise) || amountPaise < 100) {
          return new Response(JSON.stringify({ error: 'Minimum amount is 100 paise (₹1.00)' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else if (body.entityType && body.entityId) {
        if (!user) {
          return new Response(JSON.stringify({ error: 'Unauthorized: Sign in required for entity booking' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (body.entityType === 'booking') {
          const { data: booking, error: bErr } = await admin
            .from('puja_bookings')
            .select('id, user_id, amount, currency, confirmation_ref, status')
            .eq('id', body.entityId)
            .single();

          if (bErr || !booking) {
            return new Response(JSON.stringify({ error: 'Booking not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          if (booking.user_id !== user.id) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          if (booking.status === 'confirmed') {
            return new Response(JSON.stringify({ error: 'Booking already paid' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          amountPaise = Number(booking.amount);
          currency = booking.currency || 'INR';
          receiptRef = booking.confirmation_ref || receiptRef;
          description = 'Pooja Vazhipadu Booking';
        } else if (body.entityType === 'contribution') {
          const { data: contrib, error: cErr } = await admin
            .from('seva_contributions')
            .select('id, user_id, amount, currency, status')
            .eq('id', body.entityId)
            .single();

          if (cErr || !contrib) {
            return new Response(JSON.stringify({ error: 'Contribution not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          if (contrib.user_id && contrib.user_id !== user.id) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          if (contrib.status === 'paid') {
            return new Response(JSON.stringify({ error: 'Contribution already paid' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          amountPaise = Number(contrib.amount);
          currency = contrib.currency || 'INR';
          description = 'Gau Seva Contribution';
        }
      } else {
        return new Response(JSON.stringify({ error: 'Either amount or (entityType and entityId) is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create Razorpay Order via REST API
      const authBasic = btoa(`${keyId}:${keySecret}`);
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authBasic}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: currency.trim(),
          receipt: receiptRef.slice(0, 40),
          notes: {
            entity_type: entityType,
            entity_id: entityId || '',
            user_id: user?.id || '',
          },
        }),
      });

      const orderData = await rzpRes.json();
      if (!rzpRes.ok) {
        console.error('Razorpay order creation failed:', orderData);
        return new Response(JSON.stringify({ error: orderData?.error?.description || 'Failed to create Razorpay order' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Record in public.payments table if entity exists
      let paymentRowId: string | undefined;
      if (entityId) {
        const { data: pRow } = await admin
          .from('payments')
          .insert({
            provider: 'razorpay',
            provider_order_id: orderData.id,
            entity_type: entityType,
            entity_id: entityId,
            user_id: user?.id || null,
            amount: amountPaise,
            currency: currency.trim(),
            status: 'created',
          })
          .select('id')
          .maybeSingle();
        paymentRowId = pRow?.id;
      }

      return new Response(
        JSON.stringify({
          order_id: orderData.id,
          orderId: orderData.id,
          amount: orderData.amount,
          currency: orderData.currency,
          receipt: orderData.receipt,
          keyId: keyId,
          paymentId: paymentRowId,
          description: description,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isVerify) {
      const orderId = body.order_id || body.razorpayOrderId || body.razorpay_order_id;
      const paymentId = body.payment_id || body.razorpayPaymentId || body.razorpay_payment_id;
      const signature = body.razorpay_signature || body.razorpaySignature;
      const dbPaymentId = body.paymentId;

      if (!orderId || !paymentId || !signature) {
        return new Response(JSON.stringify({ error: 'Missing payment verification fields (order_id, payment_id, razorpay_signature)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const isValid = await verifyHmacSignature(orderId, paymentId, signature, keySecret);
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid payment signature', status: 'failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Reconcile in DB if payment row or order exists
      if (dbPaymentId) {
        await admin.rpc('mark_payment_paid', {
          p_payment_id: dbPaymentId,
          p_provider_payment_id: paymentId,
          p_raw: { order_id: orderId, payment_id: paymentId, signature, verified_at: new Date().toISOString() },
        });
      } else {
        const { data: pRow } = await admin
          .from('payments')
          .select('id, status')
          .eq('provider_order_id', orderId)
          .maybeSingle();

        if (pRow && pRow.status !== 'paid') {
          await admin.rpc('mark_payment_paid', {
            p_payment_id: pRow.id,
            p_provider_payment_id: paymentId,
            p_raw: { order_id: orderId, payment_id: paymentId, signature, verified_at: new Date().toISOString() },
          });
        }
      }

      return new Response(
        JSON.stringify({
          status: 'success',
          success: true,
          message: 'Payment verified successfully',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid endpoint or action' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Razorpay edge function error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
