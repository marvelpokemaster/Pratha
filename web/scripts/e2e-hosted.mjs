// Hosted E2E: exercises Supabase Auth + RLS + transactional RPCs against the
// live project. Run from web/: `node scripts/e2e-hosted.mjs`
// The test account and its rows stay on hosted; bookings are cancelled at the end.
import { createClient } from '@supabase/supabase-js';

const URL = process.env.VITE_SUPABASE_URL || 'https://yxwwgynxgihrktwndhep.supabase.co';
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_d5jPPSIuz8nC-3wwuH1PvQ_3CJYfypR';
// example.com is on Supabase's blocked-domain list; use a realistic domain.
const EMAIL = process.env.E2E_EMAIL || `devin.pratha.e2e.${Date.now()}@gmail.com`;
const REUSE = !!process.env.E2E_EMAIL; // skip signUp when reusing a confirmed account
if (REUSE && !process.env.E2E_PASSWORD) throw new Error('E2E_PASSWORD is required with E2E_EMAIL');
const PASSWORD = process.env.E2E_PASSWORD || `E2e!${crypto.randomUUID()}`;

const anon = createClient(URL, KEY, { auth: { persistSession: false } });
const user = createClient(URL, KEY, { auth: { persistSession: false } });

let passed = 0, failed = 0;
const check = (name, ok, detail = '') => {
  if (ok) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name} ${detail}`); }
};

const offeringId = '40000000-0000-4000-8000-000000000001'; // Pushpanjali Archana, free, lead 1d
const paidOfferingId = '40000000-0000-4000-8000-000000000002'; // Rudra Abhishekam, lead 2d

const dayAfter = (d) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

console.log(`E2E against ${URL}\n`);

// --- Auth: sign up ----------------------------------------------------------
console.log('== Auth ==');
let needsConfirm = false;
if (REUSE) {
  console.log('  info: reusing pre-confirmed account');
} else {
  const { data: su, error: suErr } = await anon.auth.signUp({ email: EMAIL, password: PASSWORD });
  check('signUp succeeds', !suErr, suErr?.message);
  needsConfirm = !!su?.user && !su.session;
  console.log(`  info: email confirmation ${needsConfirm ? 'ENABLED (no session returned)' : 'disabled (session returned)'}`);
}

if (needsConfirm) {
  // Confirm via admin path is NOT possible from the client; rely on MCP-side
  // confirmation done externally, or sign in and observe the error.
  const { data: si, error: siErr } = await user.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  check('signIn blocked until email confirmed', !si || !!siErr, siErr ? `(got: ${siErr.message})` : '');
}

if (process.env.E2E_CONFIRMED === '1') {
  const { data: si, error: siErr } = await user.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  check('signInWithPassword succeeds after confirmation', !!si?.session && !siErr, siErr?.message);
}

// --- Public reads (anon + RLS) ----------------------------------------------
console.log('== Public reads ==');
const { data: offerings, error: offErr } = await anon.from('puja_offerings').select('id,name,lead_time_days,available_days').eq('status', 'published');
check('anon can read published offerings', !offErr && offerings.length >= 2, offErr?.message);
const { data: streams, error: stErr } = await anon.from('live_streams').select('id,title,provider').eq('status', 'published');
check('anon can read live_streams', !stErr && streams.length >= 2, stErr?.message);

// --- Signed-out transactional redirects (RPC rejects) ------------------------
console.log('== Signed-out RPC guards ==');
const { error: anonBookErr } = await anon.rpc('create_puja_booking', {
  p_offering_id: offeringId, p_booking_date: dayAfter(3), p_quantity: 1,
  p_sankalpa: { devotee_name: 'Anon' }, p_notes: null, p_prasadam: 'none',
});
// Grant is authenticated-only: anon is blocked at role level (permission
// denied) or by the RPC's own not_authenticated guard — either is a pass.
check('anon create_puja_booking rejected', !!anonBookErr && /not_authenticated|permission denied/i.test(anonBookErr.message), anonBookErr?.message);
const { error: anonContribErr } = await anon.rpc('create_contribution', { p_amount: 50000, p_message: 'anon' });
check('anon create_contribution rejected', !!anonContribErr && /not_authenticated|permission denied/i.test(anonContribErr.message), anonContribErr?.message);

const authed = !!process.env.E2E_CONFIRMED;
if (authed) {
  // --- Profile RLS -----------------------------------------------------------
  console.log('== Profile RLS ==');
  const { data: me } = await user.auth.getUser();
  const uid = me.user.id;
  const { error: profErr } = await user.from('profiles').update({ display_name: 'E2E Devotee', city: 'Thrissur', gotra: 'Kashyapa' }).eq('id', uid);
  check('profile update own row', !profErr, profErr?.message);
  const { data: prof, error: profSelErr } = await user.from('profiles').select('id,display_name,city').maybeSingle();
  check('profile select own row', !profSelErr && prof?.display_name === 'E2E Devotee', profSelErr?.message);
  const { error: profOtherErr } = await user.from('profiles').insert({ id: '00000000-0000-4000-8000-00000000dead', display_name: 'intruder' });
  check('profile insert as another user rejected', !!profOtherErr, profOtherErr?.message);

  // --- Family member ---------------------------------------------------------
  const { data: fam, error: famErr } = await user.from('family_members').insert({ user_id: uid, name: 'E2E Parent', relation: 'Parent' }).select('id').single();
  check('family member insert own', !famErr && fam?.id, famErr?.message);

  // --- Booking RPC: negative then positive ----------------------------------
  console.log('== Booking RPC ==');
  const { error: soonErr } = await user.rpc('create_puja_booking', {
    p_offering_id: offeringId, p_booking_date: dayAfter(0), p_quantity: 1,
    p_sankalpa: { devotee_name: 'E2E Devotee', nakshatra: 'Rohini' },
  });
  check('booking today rejected (date_too_soon)', !!soonErr && /date_too_soon/.test(soonErr.message), soonErr?.message);

  const { error: noNakErr } = await user.rpc('create_puja_booking', {
    p_offering_id: offeringId, p_booking_date: dayAfter(3), p_quantity: 1,
    p_sankalpa: { devotee_name: 'E2E Devotee' },
  });
  check('missing nakshatra rejected', !!noNakErr && /nakshatra_required/.test(noNakErr.message), noNakErr?.message);

  const { data: booking, error: bookErr } = await user.rpc('create_puja_booking', {
    p_offering_id: offeringId, p_booking_date: dayAfter(3), p_quantity: 1,
    p_sankalpa: { devotee_name: 'E2E Devotee', gotra: 'Kashyapa', nakshatra: 'Rohini' },
    p_notes: 'hosted e2e', p_prasadam: 'none',
  });
  check('valid free booking created + confirmed', !bookErr && booking?.status === 'confirmed' && !!booking?.confirmation_ref, bookErr?.message || JSON.stringify(booking));

  const { data: paidBooking, error: paidErr } = await user.rpc('create_puja_booking', {
    p_offering_id: paidOfferingId, p_booking_date: dayAfter(4), p_quantity: 1,
    p_sankalpa: { devotee_name: 'E2E Devotee' },
  });
  check('paid booking created as pending_payment', !paidErr && paidBooking?.status === 'pending_payment', paidErr?.message || JSON.stringify(paidBooking));

  // --- RLS on bookings -------------------------------------------------------
  const { data: myBookings, error: myBookErr } = await user.from('puja_bookings').select('id,status,confirmation_ref,offering_id');
  check('owner reads own bookings via RLS', !myBookErr && (myBookings?.length ?? 0) >= 2, myBookErr?.message);
  const { error: directInsert } = await user.from('puja_bookings').insert({ user_id: uid, offering_id: offeringId, temple_id: '20000000-0000-4000-8000-000000000002', booking_date: dayAfter(5), amount: 0 });
  check('direct booking insert rejected (RPC-only writes)', !!directInsert, directInsert?.message);

  // --- Contribution RPC ------------------------------------------------------
  const { data: contrib, error: contribErr } = await user.rpc('create_contribution', {
    p_amount: 50100, p_campaign_id: '50000000-0000-4000-8000-000000000001', p_message: 'e2e contribution',
  });
  check('create_contribution creates created-status row', !contribErr && contrib?.status === 'created', contribErr?.message || JSON.stringify(contrib));
  const { data: myContribs } = await user.from('seva_contributions').select('id,amount,status').eq('id', contrib?.id);
  check('owner reads own contribution via RLS', (myContribs?.length ?? 0) === 1, JSON.stringify(myContribs));

  // --- Cleanup: cancel the bookings -----------------------------------------
  console.log('== Cleanup ==');
  for (const b of [booking, paidBooking]) {
    if (b?.id) {
      const { error: cancelErr } = await user.rpc('cancel_puja_booking', { p_booking_id: b.id });
      check(`cancel booking ${b.confirmation_ref || b.id.slice(0, 8)}`, !cancelErr, cancelErr?.message);
    }
  }
}

// --- Password reset request (config surface check) --------------------------
// The default Supabase SMTP sender is rate-limited to a few emails per hour;
// hitting the cap is a hosted-mailer limitation, not an app failure.
const { error: resetErr } = await anon.auth.resetPasswordForEmail(EMAIL, { redirectTo: 'http://localhost:5173' });
if (!resetErr) check('resetPasswordForEmail accepted', true);
else if (/rate limit/i.test(resetErr.message)) console.log('  info: reset email rate-limited (default Supabase SMTP cap — needs custom SMTP for production)');
else check('resetPasswordForEmail accepted', false, resetErr?.message);

console.log(`\n${passed} passed, ${failed} failed${needsConfirm && !authed ? ' — account awaits email confirmation; confirm via admin then rerun with E2E_CONFIRMED=1' : ''}`);
process.exit(failed ? 1 : 0);
