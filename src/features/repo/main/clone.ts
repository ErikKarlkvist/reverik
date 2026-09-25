import { mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { app } from 'electron';
import { simpleGit } from 'simple-git';
import { emitEvent } from '@/common/main/ipc';
import { cloneProgressEvent } from '../ipc/channels';
import { looksLikeGitUrl, repoNameFromUrl } from '../model/clone-url';

export function reposDir(): string {
  return join(app.getPath('userData'), 'repos');
}

/** Klonar till userData/repos/<namn>. Finns mappen redan återanvänds den. */
export async function cloneRepo(url: string): Promise<string> {
  const trimmed = url.trim();
  if (!looksLikeGitUrl(trimmed)) throw new Error('Det ser inte ut som en git-URL.');
  const name = repoNameFromUrl(trimmed);
  if (!name) throw new Error('Kunde inte härleda ett mappnamn från URL:en.');

  const dir = reposDir();
  await mkdir(dir, { recursive: true });
  const target = join(dir, name);

  if (await exists(target)) return target;

  const git = simpleGit({
    progress: ({ stage, progress }) => {
      emitEvent(cloneProgressEvent, { url: trimmed, stage, percent: progress });
    },
  });
  await git.clone(trimmed, target, ['--depth', '1', '--single-branch']);
  return target;
}

async function exists(path: string): Promise<boolean> {
  return stat(path)
    .then(() => true)
    .catch(() => false);
}
