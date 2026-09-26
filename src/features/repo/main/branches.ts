import { simpleGit } from 'simple-git';
import { type BranchList } from '../ipc/channels';

/** Lokala brancher och den utcheckade. Tomt för mappar utan git. */
export async function listBranches(path: string): Promise<BranchList> {
  const git = simpleGit(path);
  if (!(await git.checkIsRepo().catch(() => false))) return { current: null, branches: [] };
  const local = await git.branchLocal();
  return {
    current: local.detached ? null : local.current,
    branches: local.all,
  };
}

/** Byter branch. Misslyckas med gits eget meddelande om arbetsträdet är smutsigt. */
export async function checkoutBranch(path: string, branch: string): Promise<void> {
  await simpleGit(path).checkout(branch);
}
