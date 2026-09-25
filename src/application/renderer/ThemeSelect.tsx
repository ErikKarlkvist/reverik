import { type JSX } from 'react';
import { t } from '@/common/model/i18n';
import { parsePreference, THEME_LABELS, type ThemePreference, useTheme } from './theme';

export function ThemeSelect(): JSX.Element {
  const [preference, setPreference] = useTheme();
  return (
    <label className="theme-select">
      {t('theme.label')}
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
