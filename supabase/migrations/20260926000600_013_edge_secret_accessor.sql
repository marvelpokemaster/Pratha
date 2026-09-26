-- Vault-backed secret accessor for Edge Functions. The vault schema is not
-- exposed to the Data API, so functions read secrets through this SECURITY
-- DEFINER helper, which is executable by service_role only.
-- The gemini_api_key secret itself was created via vault.create_secret through
-- the management MCP; secret values never live in migration files.

create extension if not exists supabase_vault with schema vault;

create or replace function public.get_edge_secret(p_name text) returns text
language plpgsql
security definer
set search_path = vault, public
as $fn$
begin
  return (select decrypted_secret from vault.decrypted_secrets where name = p_name);
end
$fn$;

revoke all on function public.get_edge_secret(text) from public, anon, authenticated;
grant execute on function public.get_edge_secret(text) to service_role;
