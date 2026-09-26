import { Capacitor } from '@capacitor/core';
import { useSyncExternalStore } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'pratha-theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');

const listeners = new Set<() => void>();
media.addEventListener('change', () => {
  applyTheme();
  if (Capacitor.isNativePlatform()) syncStatusBar();
  emit();
});

function emit() {
  listeners.forEach((fn) => fn());
}

export function getThemeMode(): ThemeMode {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' ? v : 'system';
}

export function resolvedTheme(mode: ThemeMode = getThemeMode()): 'light' | 'dark' {
  return mode === 'system' ? (media.matches ? 'dark' : 'light') : mode;
}

export function applyTheme(mode: ThemeMode = getThemeMode()) {
  const resolved = resolvedTheme(mode);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function setThemeMode(mode: ThemeMode) {
  if (mode === 'system') localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, mode);
  applyTheme(mode);
  emit();
}

// Applies the stored/system theme before first paint; call once at app init.
export function initTheme() {
  applyTheme();
  // Android status bar icon contrast follows theme.
  if (Capacitor.isNativePlatform()) syncStatusBar();
}

async function syncStatusBar() {
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: resolvedTheme() === 'dark' ? Style.Dark : Style.Light });
  } catch {
    // Plugin unavailable — cosmetic only.
  }
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getThemeMode,
  );
}
