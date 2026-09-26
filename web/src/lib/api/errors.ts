// Maps hosted-RPC raise-exception codes (e.g. create_puja_booking,
// create_contribution) to user-facing copy.
export function friendlyRpcError(error: unknown, messages: Record<string, string>, fallback: string): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  for (const key of Object.keys(messages)) {
    if (raw.includes(key)) return messages[key];
  }
  return raw || fallback;
}
