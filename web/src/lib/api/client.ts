// Legacy Cloudflare Worker client. The only consumer is the Rishi AI fallback
// (lib/api/ai.ts); authenticated data paths go through Supabase directly.
const API_BASE_URL = 'https://utsavam-backend.utsavam-api.workers.dev';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // Failed to parse JSON error response, use default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
