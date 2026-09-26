-- Repair for 20260925000100_007_security_hardening: RLS policy expressions are
-- evaluated as the querying role, so the helper functions they call must remain
-- executable by anon/authenticated (migration 005's grant). These helpers only
-- inspect auth.uid(), so re-granting exposes nothing the caller can't already see.
grant execute on function public.has_role(public.app_role, public.role_scope, uuid),
  public.is_admin(), public.is_super_admin(), public.manages_temple(uuid),
  public.manages_gaushala(uuid), public.is_gaushala_admin(uuid) to anon, authenticated;
