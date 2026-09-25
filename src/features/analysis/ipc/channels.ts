import { defineChannel } from '@/common/ipc/channel';
import { type Flow } from '@/common/model/flow';
import { type SavedAnalysis } from '../model/analysis';

/** Alla analyser för ett repo, inbyggda först och sedan sparade, nyast först. */
export const listAnalysesChannel = defineChannel<{ repoPath: string }, SavedAnalysis[]>(
  'analysis:list',
);

export const saveAnalysisChannel = defineChannel<{ repoPath: string; flow: Flow }, SavedAnalysis>(
  'analysis:save',
);

export const deleteAnalysisChannel = defineChannel<
  { repoPath: string; id: string },
  SavedAnalysis[]
>('analysis:delete');
