import { type JSX } from 'react';
import { parsePreference, THEME_LABELS, type ThemePreference, useTheme } from './theme';

export function ThemeSelect(): JSX.Element {
  const [preference, setPreference] = useTheme();
  return (
    <label className="theme-select">
      Tema
      <select
        value={preference}
        onChange={(e) => {
          setPreference(parsePreference(e.target.value));
        }}
      >
        {(Object.keys(THEME_LABELS) as ThemePreference[]).map((key) => (
          <option key={key} value={key}>
            {THEME_LABELS[key]}
          </option>
        ))}
      </select>
    </label>
  );
}
