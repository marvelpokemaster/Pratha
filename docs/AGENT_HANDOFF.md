> **AI AGENT INSTRUCTION:** Read this document before exploring the repository. Treat it as the canonical engineering state snapshot. Inspect only files relevant to the current task and update this document whenever implementation state changes.

# Agent Handoff — Pratha

| Field | Value |
|---|---|
| Last updated | 2026-09-25 |
| Branch | `devin/1790111517-pratha-supabase-platform` |
| Current phase | Hosted Supabase integration, public discovery, and end-to-end hardening |
| Overall status | Web discovery flows are connected to hosted Supabase; payments, Edge Functions, and production Auth configuration remain incomplete |

## Product and architecture

Pratha (formerly Sattva) is a cultural, temple, Pooja, Gaushala, Seva, and spiritual-assistance platform. The web app is React 19 + Vite + React Router + TanStack Query + Lucide. Android wraps `web/dist` with Capacitor. iOS uses the existing Expo SDK 57 DOM bridge in `expo/src/PrathaDomBridge.tsx`; do not rewrite the web UI into React Native primitives.

The target backend is hosted Supabase:

```text
React DOM web / Capacitor Android / Expo DOM iOS
                         ↓
Supabase Auth + PostgreSQL/RLS + Storage + RPCs/Edge Functions
                         ↓
Razorpay, Gemini, notifications (not configured yet)
```

The Cloudflare Worker and Firebase client remain in the repository only as migration/fallback paths. Migrated catalog, profile, family, Auth, booking, and contribution code uses `web/src/lib/supabase.ts` and `web/src/lib/api/*.ts`.

## Hosted Supabase state

- Project: `Pratha`
- Ref: `yxwwgynxgihrktwndhep`
- Region: `ap-south-1`
- URL: `https://yxwwgynxgihrktwndhep.supabase.co`
- Dashboard: `https://supabase.com/dashboard/project/yxwwgynxgihrktwndhep`
- MCP: `supabase-remote-bbca`, read-only HTTP MCP, OAuth authorized
- Browser key: publishable key is wired as a fallback in `web/src/lib/supabase.ts`; deployments should use `VITE_SUPABASE_PUBLISHABLE_KEY`

Applied migrations:

1. `20260827105146_001_sattva_schema.sql`
2. `20260922000100_002_schema_v2_core.sql`
3. `20260922000200_003_schema_v2_domain.sql`
4. `20260922000300_004_rls_and_rpc.sql`
5. `20260922000400_005_integrity.sql`
6. `20260922000500_006_demonstration_catalog.sql`
7. `20260925000100_007_security_hardening.sql` (local follow-up; hosted application requires a valid CLI PAT to apply)

Hosted MCP verification on 2026-09-25:

- All six migrations listed remotely.
- All public application tables reported `rls_enabled: true`.
- Demo counts: 3 temples, 1 festival, 3 events, 1 published Gaushala, 2 public animals, 2 published Pooja offerings, 2 published Seva campaigns.
- Direct REST query returned the two published Pooja offerings.
- Security advisors warned about executable security-definer helpers; follow-up migration `007` narrows browser execute grants and still needs to be pushed. Performance advisors report many unindexed foreign keys; review these before production imports.

## Current implementation status

| Area | Status | Notes |
|---|---|---|
| Public Home | Working | Existing polished shell reads hosted Pooja and welfare data |
| Pooja discovery | Working | Reads `puja_offerings` and temple relation from hosted Supabase |
| Signed-out booking UX | Working | Modal opens; submit redirects signed-out users to `/login` |
| Gaushala directory/passports | Working | Reads hosted Gaushala and animal rows; sample disclaimers render |
| Seva UI | Working | Existing initiative UX; contribution RPC path requires Auth and a published campaign |
| Profile/family/history APIs | Supabase-connected | Authenticated RLS behavior still needs a signed-in test |
| Supabase Auth | Cut over | `AuthContext` and email/password screen use Supabase; email-confirmation/redirect settings need dashboard verification |
| Temples/events/festivals/Live Darshan | Partial | `/discover` now reads hosted temples, events, and festivals; dedicated detail/live-stream pages remain pending |
| Firebase/Worker retirement | Partial | `firebase.ts`, `api/client.ts`, and Rishi Worker path remain as fallback |
| Payments | Not production-ready | Razorpay keys, webhook function, and sandbox test are not configured |
| Notifications/AI Edge Functions | Not complete | Must be implemented and deployed before production claim |
| Expo typecheck | Known failures | StatusBar prop typing and duplicate TanStack Query core type mismatch remain |

## Important files

- `web/src/App.tsx` — BrowserRouter, shared route tree, QueryClient, AuthProvider.
- `web/src/features/auth/AuthContext.tsx` — Supabase session listener and sign-out.
- `web/src/features/auth/Auth.tsx` — Supabase email/password sign-in and sign-up.
- `web/src/lib/supabase.ts` — hosted client, env variables, i18n helper.
- `web/src/lib/api/puja.ts` — Pooja queries and `create_puja_booking` RPC.
- `web/src/lib/api/gaushala.ts` — Gaushala, animal, welfare queries.
- `web/src/lib/api/profile.ts` — profiles, family, contributions, contribution RPC.
- `supabase/migrations/` — schema, RLS/RPC, integrity, and deterministic demo catalog.
- `expo/src/PrathaDomBridge.tsx` — sensitive `'use dom'` bridge; preserve.
- `web/android/` — generated Capacitor output; do not edit manually.

## Required next steps

1. Add public Discover, Events, Festivals, Temples, and Live Darshan routes backed by hosted tables.
2. Add an explicit Pooja booking date selector and authenticated end-to-end test against `create_puja_booking`; current UI sends today and needs a better availability UX.
3. Verify Supabase Auth email confirmation, redirect URLs, password reset, and signed-in RLS behavior.
4. Implement/deploy Edge Functions for AI, payment order/webhook handling, notification dispatch, and any legacy import.
5. Replace remaining Worker/Firebase calls or document each as intentional fallback.
6. Add browser E2E tooling; repeat desktop/mobile responsive QA and capture evidence.
7. Fix or document Supabase advisor findings, then run final lint/typecheck/build, Expo checks, migration checks, and regression QA.
8. Update this file again before commit/PR.

## Validation already performed

- `web/npm run build` passes.
- `web/npm run lint` passes with existing warnings and zero errors.
- Real Vite app manually tested in Chrome at Home, Pujas, signed-out Pooja modal, Gaushala, Seva, and Profile.
- Real Vite app manually tested at `/discover`; hosted temple, event, and festival cards rendered after fixing the event description column selection.
- Browser console showed only Vite/React DevTools informational output during those flows.
- Hosted Supabase was validated through MCP `list_migrations`, `list_tables`, `execute_sql`, `get_project_url`, `get_publishable_keys`, `generate_typescript_types`, and security/performance advisors.
- Screenshots captured locally during manual QA under `/home/ubuntu/screenshots/`.

## Known limitations and failed approaches

- The first Supabase token supplied was rejected because it was not an `sbp_...` personal access token. Hosted project creation and migrations were eventually completed with a valid token, but revalidate the stored CLI token before further deployment.
- The installed MCP URL is read-only; use the Supabase CLI with a valid PAT for migration/Edge Function/configuration writes. The local security follow-up is not yet hosted.
- No secret values belong in this file or commits. Required names include `PRATHA_SUPABASE_DB_PASSWORD`, a valid Supabase PAT, Razorpay sandbox credentials, Gemini key, and notification provider credentials.
- Do not claim production-ready status while payment, notification, hosted Auth configuration, and Edge Function dependencies remain unconfigured.

## Commands

```bash
cd web && npm run dev
cd web && npm run build
cd web && npm run lint
export PATH="$HOME/.local/bin:$PATH"
supabase migration list
supabase db push                 # requires a valid SUPABASE_DB_PASSWORD and CLI PAT
```

## Delivery state

- No PR has been created yet.
- Branch changes are intentionally uncommitted until the remaining implementation and final diff review are complete.
- Never push directly to `main`.
