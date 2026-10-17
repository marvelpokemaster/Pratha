import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

async function secret(name: string): Promise<string | null> {
  const { data, error } = await admin.rpc('get_edge_secret', { p_name: name });
  if (error) {
    console.error('get_edge_secret error for', name, error.message);
    return null;
  }
  return data as string | null;
}

async function verifyWebhookSignature(rawBody: string, signature: string, secretStr: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretStr),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return expectedSignature === signature;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    const webhookSecret = (await secret('razorpay_webhook_secret')) || (await secret('razorpay_key_secret')) || Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

    if (!webhookSecret) {
      console.error('No webhook secret configured');
      return new Response('Server configuration error', { status: 500 });
    }

    if (signature) {
      const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.warn('Invalid webhook signature rejected');
        return new Response('Invalid signature', { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    console.log('Received Razorpay Webhook event:', eventType);

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const { data: paymentRow, error: pErr } = await admin
          .from('payments')
          .select('id, status')
          .eq('provider_order_id', orderId)
          .maybeSingle();

        if (paymentRow && paymentRow.status !== 'paid') {
          console.log(`Marking payment ${paymentRow.id} paid via webhook for order ${orderId}`);
          await admin.rpc('mark_payment_paid', {
            p_payment_id: paymentRow.id,
            p_provider_payment_id: paymentId || 'webhook_captured',
            p_raw: event,
          });
        }
      }
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
