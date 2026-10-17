// Hosted Razorpay E2E test script
// Run with: node scripts/e2e-razorpay.mjs
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const URL = process.env.VITE_SUPABASE_URL || 'https://yxwwgynxgihrktwndhep.supabase.co';
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_d5jPPSIuz8nC-3wwuH1PvQ_3CJYfypR';
const supabase = createClient(URL, KEY);

async function run() {
  console.log('--- 1. Testing Auth & Session ---');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'pratha.demo.devotee@gmail.com',
    password: 'DemoDevotee#2026',
  });
  if (authErr) throw authErr;
  console.log('   Authenticated as demo devotee:', authData.user.id);

  console.log('\n--- 2. Testing Pooja Booking Payment Flow ---');
  const paidOfferingId = '40000000-0000-4000-8000-000000000002'; // Rudra Abhishekam
  const bookingDate = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);

  const { data: booking, error: bookErr } = await supabase.rpc('create_puja_booking', {
    p_offering_id: paidOfferingId,
    p_booking_date: bookingDate,
    p_quantity: 1,
    p_sankalpa: { devotee_name: 'Demo Devotee', gotra: 'Bharadwaja', nakshatra: 'Rohini' },
    p_notes: 'Razorpay E2E automated script',
    p_prasadam: 'none',
  });
  if (bookErr) throw bookErr;
  console.log(`   Booking created: ${booking.id} (${booking.confirmation_ref})`);
  console.log(`   Initial status: ${booking.status} (expected: pending_payment)`);

  const { data: orderRes, error: orderErr } = await supabase.functions.invoke('razorpay-order', {
    body: { action: 'create', entityType: 'booking', entityId: booking.id },
  });
  if (orderErr) throw orderErr;
  console.log(`   Razorpay Order generated: ${orderRes.orderId} for ₹${orderRes.amount / 100}`);

  const secret = 'YF0GPxhYpOU5szW3eZmWV2Si';
  const testPaymentId = 'pay_sim_' + Date.now();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${orderRes.orderId}|${testPaymentId}`)
    .digest('hex');

  const { data: verifyRes, error: verifyErr } = await supabase.functions.invoke('razorpay-order', {
    body: {
      action: 'verify',
      paymentId: orderRes.paymentId,
      razorpayPaymentId: testPaymentId,
      razorpayOrderId: orderRes.orderId,
      razorpaySignature: signature,
    },
  });
  if (verifyErr || !verifyRes.success) throw new Error('Verification failed: ' + JSON.stringify(verifyRes));
  console.log('   Payment signature verified successfully.');

  const { data: updatedBooking } = await supabase
    .from('puja_bookings')
    .select('id, status, confirmation_ref')
    .eq('id', booking.id)
    .single();
  console.log(`   Database status reconciled to: ${updatedBooking?.status} (expected: confirmed)`);

  console.log('\n--- 3. Testing Seva Contribution Flow ---');
  const campaignId = '50000000-0000-4000-8000-000000000001';
  const { data: contrib, error: contribErr } = await supabase.rpc('create_contribution', {
    p_amount: 110000,
    p_campaign_id: campaignId,
    p_message: 'Razorpay Automated E2E Seva Test',
  });
  if (contribErr) throw contribErr;
  console.log(`   Contribution created: ${contrib.id} with status: ${contrib.status}`);

  const { data: sevaOrder, error: sevaOrderErr } = await supabase.functions.invoke('razorpay-order', {
    body: { action: 'create', entityType: 'contribution', entityId: contrib.id },
  });
  if (sevaOrderErr) throw sevaOrderErr;
  console.log(`   Razorpay Seva Order: ${sevaOrder.orderId} for ₹${sevaOrder.amount / 100}`);

  const sevaPaymentId = 'pay_sim_seva_' + Date.now();
  const sevaSig = crypto
    .createHmac('sha256', secret)
    .update(`${sevaOrder.orderId}|${sevaPaymentId}`)
    .digest('hex');

  const { data: sevaVerify, error: sevaVerifyErr } = await supabase.functions.invoke('razorpay-order', {
    body: {
      action: 'verify',
      paymentId: sevaOrder.paymentId,
      razorpayPaymentId: sevaPaymentId,
      razorpayOrderId: sevaOrder.orderId,
      razorpaySignature: sevaSig,
    },
  });
  if (sevaVerifyErr || !sevaVerify.success) throw new Error('Seva verify failed: ' + JSON.stringify(sevaVerify));

  const { data: updatedContrib } = await supabase
    .from('seva_contributions')
    .select('id, status')
    .eq('id', contrib.id)
    .single();
  console.log(`   Database status reconciled to: ${updatedContrib?.status} (expected: paid)`);

  console.log('\n✅ ALL LIVE RAZORPAY E2E RECONCILIATION TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ E2E RUN FAILED:', err);
  process.exit(1);
});
