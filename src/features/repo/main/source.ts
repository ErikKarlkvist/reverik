import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { type SourceExcerpt } from '../ipc/channels';

const DEFAULT_CONTEXT = 8;

export async function readSource(
  repoPath: string,
  file: string,
  line: number,
  context = DEFAULT_CONTEXT,
): Promise<SourceExcerpt> {
  const root = resolve(repoPath);
  const absolute = resolve(root, file);
  if (!absolute.startsWith(root + sep)) {
    throw new Error(`Filen ${file} ligger utanför repot`);
  }
  const all = (await readFile(absolute, 'utf8')).split('\n');
  const startLine = Math.max(1, line - context);
  const endLine = Math.min(all.length, line + context);
  return { file, line, startLine, lines: all.slice(startLine - 1, endLine) };
}
