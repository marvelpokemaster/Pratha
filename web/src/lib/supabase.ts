import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://yxwwgynxgihrktwndhep.supabase.co';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_d5jPPSIuz8nC-3wwuH1PvQ_3CJYfypR';

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export type I18nValue = Record<string, string> | null;

export function localized(value: I18nValue, language = 'en'): string {
  if (!value) return '';
  return value[language] || value.en || value.ml || value.hi || '';
}
