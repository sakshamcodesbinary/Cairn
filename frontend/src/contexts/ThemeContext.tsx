import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'day' | 'night';
type ThemeContextValue = { theme: Theme; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('cairn:theme:v1');
    if (saved === 'day' || saved === 'night') return saved;
  } catch { /* Storage may be disabled; theme still works in memory. */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'night' ? '#101d27' : '#f1f4f5');
    try { localStorage.setItem('cairn:theme:v1', theme); } catch { /* Optional persistence. */ }
  }, [theme]);
  const value = useMemo(() => ({ theme, toggleTheme: () => setTheme(value => value === 'day' ? 'night' : 'day') }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be inside ThemeProvider');
  return value;
}
