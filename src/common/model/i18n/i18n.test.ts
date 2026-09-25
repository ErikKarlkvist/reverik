import { describe, expect, it } from 'vitest';
import en from './en-gb.json';
import { t } from './index';

describe('t', () => {
  it('interpolerar parametrar', () => {
    expect(t('repo.files', { count: 3 })).toBe('3 files');
  });

  it('lämnar okända platshållare orörda', () => {
    expect(t('error.demoMissing', {})).toBe('The demo app was not found at {path}');
  });

  it('alla texter är ifyllda', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim(), key).not.toBe('');
    }
  });
});
