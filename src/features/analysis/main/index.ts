import { join } from 'node:path';
import { app } from 'electron';
import { handleChannel } from '@/common/main/ipc';
import { deleteAnalysisChannel, listAnalysesChannel, saveAnalysisChannel } from '../ipc/channels';
import { builtinAnalyses } from './builtin';
import { AnalysisStore } from './store';

export function registerAnalysisHandlers(): void {
  const store = new AnalysisStore(join(app.getPath('userData'), 'analyses'));

  handleChannel(listAnalysesChannel, async ({ repoPath }) => [
    ...builtinAnalyses(repoPath),
    ...(await store.list(repoPath)),
  ]);

  handleChannel(saveAnalysisChannel, ({ repoPath, flow }) => store.save(repoPath, flow));

  handleChannel(deleteAnalysisChannel, async ({ repoPath, id }) => [
    ...builtinAnalyses(repoPath),
    ...(await store.delete(repoPath, id)),
  ]);
}
