-- Role helpers are invoked by policies and server-side functions; they are
-- not part of the browser-facing RPC surface.
revoke execute on function public.has_role(public.app_role, public.role_scope, uuid) from anon, authenticated;
revoke execute on function public.is_admin() from anon, authenticated;
revoke execute on function public.is_super_admin() from anon, authenticated;
revoke execute on function public.manages_temple(uuid) from anon, authenticated;
revoke execute on function public.manages_gaushala(uuid) from anon, authenticated;
revoke execute on function public.is_gaushala_admin(uuid) from anon, authenticated;

grant execute on function public.search_all(text, int), public.i18n_text(jsonb, text) to anon, authenticated;
