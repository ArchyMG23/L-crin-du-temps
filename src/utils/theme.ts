/**
 * L'ÉCRIN DU TEMPS — Bascule de thème clair / sombre
 *
 * Spécification Section 41 :
 * - Au premier chargement : respecter la préférence système (prefers-color-scheme)
 * - Mémoriser le choix dans localStorage ('ec-theme') en priorité sur la préférence système
 * - Transition douce 300ms, jamais de flash
 * - Application instantanée sans rechargement
 */

export const STORAGE_KEY = 'ec-theme';
export type Theme = 'dark' | 'light';

/**
 * Récupère le thème initial (localStorage prioritaire, sinon préférence système)
 */
export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    return systemPrefersLight ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/**
 * Applique l'attribut data-theme et synchronise la classe dark ainsi que la meta theme-color
 */
export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-theme', theme);
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }

  // Synchronisation dynamique de la meta theme-color pour Safari iOS / Chrome Android
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#07070a' : '#f6f2e9');
  }
}

/**
 * Initialise le thème dès le chargement
 */
export function initTheme(): Theme {
  const theme = getInitialTheme();
  applyTheme(theme);

  // Si le visiteur n'a jamais choisi manuellement, suivre les changements système en direct
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const media = window.matchMedia('(prefers-color-scheme: light)');
      const listener = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
          const next: Theme = e.matches ? 'light' : 'dark';
          applyTheme(next);
        }
      };
      if (media.addEventListener) {
        media.addEventListener('change', listener);
      } else {
        // Fallback anciens navigateurs
        media.addListener(listener);
      }
    }
  }

  return theme;
}

/**
 * Bascule entre clair et sombre
 */
export function toggleTheme(): Theme {
  const current = (document.documentElement.getAttribute('data-theme') as Theme) || 'dark';
  const next: Theme = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {}
  return next;
}

/**
 * Retourne le thème actuellement actif
 */
export function getTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return (document.documentElement.getAttribute('data-theme') as Theme) || 'dark';
}
