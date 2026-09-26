import { fetchApi } from './client';

// Rishi is served by the Cloudflare Worker's /api/v1/ai/ask, which is the
// documented fallback until a Supabase Edge Function exists for AI. The worker
// endpoint is intentionally unauthenticated and expects `{ query }`.
export async function askRishi(prompt: string): Promise<{ answer: string }> {
  const res = await fetchApi<{ response: string }>('/api/v1/ai/ask', {
    method: 'POST',
    body: JSON.stringify({ query: prompt }),
  });
  return { answer: res.response };
}
