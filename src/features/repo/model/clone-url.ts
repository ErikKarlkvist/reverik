/**
 * Härleder ett mappnamn från en git-URL, t.ex.
 * `git@github.com:acme/shop.git` och `https://github.com/acme/shop` ger båda `shop`.
 * Returnerar null om URL:en inte ser ut som något som går att klona.
 */
export function repoNameFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const withoutTrailing = trimmed.replace(/[/\\]+$/, '').replace(/\.git$/i, '');
  const last = withoutTrailing.split(/[/:\\]/).pop();
  if (!last) return null;
  const safe = last.replace(/[^\w.-]/g, '-').replace(/^[.-]+/, '');
  return safe || null;
}

export function looksLikeGitUrl(url: string): boolean {
  const trimmed = url.trim();
  return (
    /^(https?:\/\/|git@|ssh:\/\/|git:\/\/)\S+$/.test(trimmed) || /^[\w.-]+@[\w.-]+:/.test(trimmed)
  );
}
