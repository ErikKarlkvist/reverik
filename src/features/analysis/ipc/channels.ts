import { defineChannel, defineEvent } from '@/common/ipc/channel';
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

/**
 * Börjar bevaka `.highai/flows/` i repot och skriver guiden AI:n läser.
 * Anropas när ett repo väljs. Resultatet av importer kommer som `inboxEvent`.
 */
export const watchInboxChannel = defineChannel<{ repoPath: string }>('analysis:watch');

export type InboxEvent =
  | {
      type: 'imported';
      repoPath: string;
      file: string;
      analysis: SavedAnalysis;
      /** Hela listan efter importen, så renderern slipper hämta om */
      list: SavedAnalysis[];
    }
  | { type: 'rejected'; repoPath: string; file: string; errors: string[] };

export const inboxEvent = defineEvent<InboxEvent>('analysis:inbox');
