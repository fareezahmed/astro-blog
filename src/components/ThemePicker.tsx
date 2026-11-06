import { useEffect, useState } from 'react';

// A second island, hydrated with client:idle because nobody needs it in the
// first hundred milliseconds. It swaps the data-theme / data-mode attributes
// on <html> and remembers the choice in localStorage. The inline script in
// Layout.astro re-applies that choice before first paint on the next page.

interface Props {
  themes: { id: string; name: string }[];
  defaultTheme: string;
}

type Mode = 'system' | 'light' | 'dark';
const MODES: Mode[] = ['system', 'light', 'dark'];
const MODE_LABEL: Record<Mode, string> = { system: 'Auto', light: 'Light', dark: 'Dark' };

export default function ThemePicker({ themes, defaultTheme }: Props) {
  const [theme, setTheme] = useState(defaultTheme);
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    // The server-rendered HTML used the build-time default; after hydration,
    // read what the inline script applied so the controls match the page.
    const root = document.documentElement;
    setTheme(root.dataset.theme ?? defaultTheme);
    setMode((root.dataset.mode as Mode) ?? 'system');

    const onThemeChange = (event: Event) => setTheme((event as CustomEvent<string>).detail);
    window.addEventListener('themechange', onThemeChange);
    return () => window.removeEventListener('themechange', onThemeChange);
  }, [defaultTheme]);

  function applyTheme(id: string) {
    document.documentElement.dataset.theme = id;
    try {
      localStorage.setItem('theme', id);
    } catch {}
    setTheme(id);
  }

  function cycleMode() {
    const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    const root = document.documentElement;
    try {
      if (next === 'system') {
        delete root.dataset.mode;
        localStorage.removeItem('mode');
      } else {
        root.dataset.mode = next;
        localStorage.setItem('mode', next);
      }
    } catch {}
    setMode(next);
  }

  return (
    <div className="flex items-center gap-1">
      <label className="sr-only" htmlFor="theme-picker">
        Theme
      </label>
      <select
        id="theme-picker"
        value={theme}
        onChange={(e) => applyTheme(e.target.value)}
        className="rounded-btn border border-line bg-surface px-2 py-1 text-xs text-ink outline-none hover:border-line-strong focus:border-brand"
      >
        {themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={cycleMode}
        title={`Color mode: ${MODE_LABEL[mode]}. Click to change.`}
        className="rounded-btn border border-line px-2 py-1 text-xs text-ink-soft hover:border-line-strong"
      >
        {MODE_LABEL[mode]}
      </button>
    </div>
  );
}
