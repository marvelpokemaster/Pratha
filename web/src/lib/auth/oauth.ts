import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/lib/supabase';

// Deep-link target for the native app. Must be allow-listed under
// Authentication → URL Configuration → Redirect URLs in the Supabase dashboard.
const NATIVE_REDIRECT = 'pratha://auth/callback';

export function isAuthDeepLink(url: string): boolean {
  return url.startsWith(NATIVE_REDIRECT);
}

// Supabase puts the PKCE `code` in the deep-link query; exchanging it inside the
// WebView works because the code verifier was persisted there by signInWithOAuth.
export async function handleAuthDeepLink(url: string): Promise<void> {
  if (!isAuthDeepLink(url)) return;
  const code = new URL(url).searchParams.get('code');
  if (!code) return;
  await supabase.auth.exchangeCodeForSession(code);
}

export async function signInWithGoogle(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: NATIVE_REDIRECT, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (data?.url) await Browser.open({ url: data.url });
    return;
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}
