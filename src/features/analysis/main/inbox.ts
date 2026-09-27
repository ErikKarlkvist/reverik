import { type FSWatcher, watch } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { headRef, resolveCommit } from '@/common/main/git';
import { type Flow, validateFlow } from '@/common/model/flow';
import { type Review, validateReviewDocument } from '@/common/model/review';
import { t } from '@/common/model/i18n';
import { type InboxEvent } from '../ipc/channels';
import { type AnalysisRef, type SavedAnalysis } from '../model/analysis';
import {
  buildGuide,
  errorsFileFor,
  FLOWS_DIR,
  GUIDE_FILE,
  isFlowFile,
  REVIEWS_DIR,
} from '../model/guide';
import { type AnalysisStore } from './store';
import { verifySources } from './verify';

export type ImportResult =
  | { type: 'imported'; analysis: SavedAnalysis }
  | { type: 'rejected'; errors: string[] }
  /** Filen är redan importerad med samma innehåll, eller borttagen */
  | { type: 'unchanged' };

export type InboxKind = 'flow' | 'review';

const INBOX_DIRS: Readonly<Record<InboxKind, string>> = {
  flow: FLOWS_DIR,
  review: REVIEWS_DIR,
};

type Parsed =
  | { ok: true; flow: Flow; review?: Review; ref: AnalysisRef | null }
  | { ok: false; errors: string[] };

/**
 * Läser en flödes- eller reviewfil, validerar den och sparar den. Fel skrivs
 * bredvid filen som `<namn>.errors.json` så att AI:n kan läsa dem och rätta sig.
 */
export async function importFlowFile(
  store: AnalysisStore,
  repoPath: string,
  name: string,
  kind: InboxKind = 'flow',
): Promise<ImportResult> {
  const dir = join(repoPath, INBOX_DIRS[kind]);
  const errorsPath = join(dir, errorsFileFor(name));
  const file = `${INBOX_DIRS[kind]}/${name}`;

  let raw: string;
  try {
    raw = await readFile(join(dir, name), 'utf8');
  } catch {
    return { type: 'unchanged' };
  }

  const parsed = await parseAndVerify(repoPath, raw, kind);
  if (!parsed.ok) {
    await writeFile(errorsPath, JSON.stringify({ file, errors: parsed.errors }, null, 2), 'utf8');
    return { type: 'rejected', errors: parsed.errors };
  }
  await rm(errorsPath, { force: true });

  const existing = (await store.list(repoPath)).find((a) => a.file === file);
  if (
    existing &&
    JSON.stringify(existing.flow) === JSON.stringify(parsed.flow) &&
    JSON.stringify(existing.review) === JSON.stringify(parsed.review) &&
    existing.ref?.commit === parsed.ref?.commit
  )
    return { type: 'unchanged' };
  return {
    type: 'imported',
    analysis: await store.upsertFromFile(repoPath, file, parsed.flow, parsed.review, parsed.ref),
  };
}

/**
 * Ett flöde beskriver arbetsträdet och kontrolleras mot det. En reviews head
 * kontrolleras mot branchen den säger sig beskriva om den finns i repot och
 * inte är utcheckad, annars mot arbetsträdet. Base beskriver en annan branch
 * och kontrolleras inte.
 */
async function parseAndVerify(repoPath: string, raw: string, kind: InboxKind): Promise<Parsed> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    return {
      ok: false,
      errors: [t('inbox.invalidJson', { message: e instanceof Error ? e.message : String(e) })],
    };
  }
  if (kind === 'review') {
    const validated = validateReviewDocument(json);
    if (!validated.ok) return validated;
    return checkSources(repoPath, validated.flow, validated.review);
  }
  const validated = validateFlow(json);
  if (!validated.ok) return validated;
  return checkSources(repoPath, validated.flow);
}

async function checkSources(repoPath: string, flow: Flow, review?: Review): Promise<Parsed> {
  const head = await headRef(repoPath);
  let ref: AnalysisRef | null = head;
  let resolvedReview = review;
  if (review) {
    const headCommit = await resolveCommit(repoPath, review.headLabel);
    if (headCommit) ref = { branch: review.headLabel, commit: headCommit };
    const baseCommit = await resolveCommit(repoPath, review.baseLabel);
    if (baseCommit) resolvedReview = { ...review, baseCommit };
  }
  // Är commiten utcheckad räcker arbetsträdet, som även har ocommittade ändringar.
  const verifyAt = ref && ref.commit !== head?.commit ? ref.commit : null;
  const errors = await verifySources(repoPath, flow, verifyAt);
  if (errors.length > 0) return { ok: false, errors };
  return resolvedReview ? { ok: true, flow, review: resolvedReview, ref } : { ok: true, flow, ref };
}

/** Skriver guiden om den saknas eller är en äldre version. Skapar mappen vid behov. */
export async function writeGuide(repoPath: string): Promise<void> {
  const path = join(repoPath, GUIDE_FILE);
  await mkdir(dirname(path), { recursive: true });
  const content = buildGuide();
  const current = await readFile(path, 'utf8').catch(() => null);
  if (current !== content) await writeFile(path, content, 'utf8');
}

const DEBOUNCE_MS = 250;

/**
 * Bevakar `.reverik/flows/` i det valda repot. Importerar det som redan
 * ligger där vid start och sedan varje fil som sparas.
 */
export class FlowInbox {
  private watchers: FSWatcher[] = [];
  private repoPath: string | null = null;
  private readonly pending = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly store: AnalysisStore,
    private readonly listAll: (repoPath: string) => Promise<SavedAnalysis[]>,
    private readonly emit: (event: InboxEvent) => void,
  ) {}

  async watch(repoPath: string): Promise<void> {
    this.stop();
    this.repoPath = repoPath;
    await writeGuide(repoPath);

    for (const kind of Object.keys(INBOX_DIRS) as InboxKind[]) {
      const dir = join(repoPath, INBOX_DIRS[kind]);
      await mkdir(dir, { recursive: true });
      const watcher = watch(dir, (_event, filename) => {
        if (typeof filename === 'string' && isFlowFile(filename))
          this.schedule(repoPath, kind, filename);
      });
      watcher.on('error', (error: unknown) => {
        console.error(error);
      });
      this.watchers.push(watcher);

      for (const name of (await readdir(dir)).filter(isFlowFile).sort()) {
        await this.importAndEmit(repoPath, kind, name, true);
      }
    }
  }

  stop(): void {
    for (const watcher of this.watchers) watcher.close();
    this.watchers = [];
    this.repoPath = null;
    for (const timer of this.pending.values()) clearTimeout(timer);
    this.pending.clear();
  }

  private schedule(repoPath: string, kind: InboxKind, name: string): void {
    const key = `${kind}/${name}`;
    const existing = this.pending.get(key);
    if (existing) clearTimeout(existing);
    this.pending.set(
      key,
      setTimeout(() => {
        this.pending.delete(key);
        if (this.repoPath === repoPath) void this.importAndEmit(repoPath, kind, name);
      }, DEBOUNCE_MS),
    );
  }

  private async importAndEmit(
    repoPath: string,
    kind: InboxKind,
    name: string,
    initial = false,
  ): Promise<void> {
    const file = `${INBOX_DIRS[kind]}/${name}`;
    try {
      const result = await importFlowFile(this.store, repoPath, name, kind);
      if (result.type === 'imported') {
        this.emit({
          type: 'imported',
          repoPath,
          file,
          analysis: result.analysis,
          list: await this.listAll(repoPath),
          initial,
        });
      } else if (result.type === 'rejected') {
        this.emit({ type: 'rejected', repoPath, file, errors: result.errors });
      }
    } catch (error) {
      console.error(error);
      this.emit({
        type: 'rejected',
        repoPath,
        file,
        errors: [error instanceof Error ? error.message : String(error)],
      });
    }
  }
}
