import { describe, expect, it } from 'vitest';
import { looksLikeGitUrl, repoNameFromUrl } from './clone-url';

describe('repoNameFromUrl', () => {
  it.each([
    ['https://github.com/acme/shop.git', 'shop'],
    ['https://github.com/acme/shop', 'shop'],
    ['https://github.com/acme/shop/', 'shop'],
    ['git@github.com:acme/my-shop.git', 'my-shop'],
    ['ssh://git@host/team/Repo.Name.git', 'Repo.Name'],
  ])('%s -> %s', (url, expected) => {
    expect(repoNameFromUrl(url)).toBe(expected);
  });

  it('returnerar null för tomt', () => {
    expect(repoNameFromUrl('  ')).toBeNull();
  });

  it('sanerar farliga tecken', () => {
    expect(repoNameFromUrl('https://x/a/..')).toBeNull();
    expect(repoNameFromUrl('https://x/a/we ird!')).toBe('we-ird-');
  });
});

describe('looksLikeGitUrl', () => {
  it('accepterar vanliga former', () => {
    expect(looksLikeGitUrl('https://github.com/acme/shop.git')).toBe(true);
    expect(looksLikeGitUrl('git@github.com:acme/shop.git')).toBe(true);
    expect(looksLikeGitUrl('ssh://git@host/x.git')).toBe(true);
  });
  it('avvisar sökvägar och skräp', () => {
    expect(looksLikeGitUrl('/Users/erik/Highai')).toBe(false);
    expect(looksLikeGitUrl('hej')).toBe(false);
  });
});
