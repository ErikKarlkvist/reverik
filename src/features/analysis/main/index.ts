import { join } from 'node:path';
import { app } from 'electron';
import { emitEvent, handleChannel } from '@/common/main/ipc';
import {
  deleteAnalysisChannel,
  inboxEvent,
  listAnalysesChannel,
  saveAnalysisChannel,
  watchInboxChannel,
} from '../ipc/channels';
import { type SavedAnalysis } from '../model/analysis';
import { builtinAnalyses } from './builtin';
import { FlowInbox } from './inbox';
import { AnalysisStore } from './store';

export function registerAnalysisHandlers(): void {
  const store = new AnalysisStore(join(app.getPath('userData'), 'analyses'));
  const listAll = async (repoPath: string): Promise<SavedAnalysis[]> => [
    ...builtinAnalyses(repoPath),
    ...(await store.list(repoPath)),
  ];
  const inbox = new FlowInbox(store, listAll, (event) => {
    emitEvent(inboxEvent, event);
  });

  handleChannel(listAnalysesChannel, ({ repoPath }) => listAll(repoPath));
  handleChannel(saveAnalysisChannel, ({ repoPath, flow }) => store.save(repoPath, flow));
  handleChannel(deleteAnalysisChannel, async ({ repoPath, id }) => {
    await store.delete(repoPath, id);
    return listAll(repoPath);
  });
  handleChannel(watchInboxChannel, ({ repoPath }) => inbox.watch(repoPath));

  app.on('before-quit', () => {
    inbox.stop();
  });
}
