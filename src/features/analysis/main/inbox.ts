import { type FSWatcher, watch } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type FlowValidation, validateFlow } from '@/common/model/flow';
import { t } from '@/common/model/i18n';
import { type InboxEvent } from '../ipc/channels';
import { type SavedAnalysis } from '../model/analysis';
import { buildGuide, errorsFileFor, FLOWS_DIR, GUIDE_FILE, isFlowFile } from '../model/guide';
import { type AnalysisStore } from './store';
import { verifySources } from './verify';

export type ImportResult =
  | { type: 'imported'; analysis: SavedAnalysis }
  | { type: 'rejected'; errors: string[] }
  /** Filen är redan importerad med samma innehåll, eller borttagen */
  | { type: 'unchanged' };

/**
 * Läser en flödesfil, validerar den och sparar den. Fel skrivs bredvid filen
 * som `<namn>.errors.json` så att AI:n kan läsa dem och rätta sig.
 */
export async function importFlowFile(
  store: AnalysisStore,
  repoPath: string,
  name: string,
): Promise<ImportResult> {
  const dir = join(repoPath, FLOWS_DIR);
  const errorsPath = join(dir, errorsFileFor(name));
  const file = `${FLOWS_DIR}/${name}`;

  let raw: string;
  try {
    raw = await readFile(join(dir, name), 'utf8');
  } catch {
    return { type: 'unchanged' };
  }

  const parsed = await parseAndVerify(repoPath, raw);
  if (!parsed.ok) {
    await writeFile(errorsPath, JSON.stringify({ file, errors: parsed.errors }, null, 2), 'utf8');
    return { type: 'rejected', errors: parsed.errors };
  }
  await rm(errorsPath, { force: true });

  const existing = (await store.list(repoPath)).find((a) => a.file === file);
  if (existing && JSON.stringify(existing.flow) === JSON.stringify(parsed.flow))
    return { type: 'unchanged' };
  return { type: 'imported', analysis: await store.upsertFromFile(repoPath, file, parsed.flow) };
}

async function parseAndVerify(repoPath: string, raw: string): Promise<FlowValidation> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return {
      ok: false,
      errors: [t('inbox.invalidJson', { message: e instanceof Error ? e.message : String(e) })],
    };
  }
  const validated = validateFlow(parsed);
  if (!validated.ok) return validated;
  const errors = await verifySources(repoPath, validated.flow);
  return errors.length > 0 ? { ok: false, errors } : validated;
}

/** Skriver guiden om den saknas eller är en äldre version. */
export async function writeGuide(repoPath: string): Promise<void> {
  const path = join(repoPath, GUIDE_FILE);
  const content = buildGuide();
  const current = await readFile(path, 'utf8').catch(() => null);
  if (current !== content) await writeFile(path, content, 'utf8');
}

const DEBOUNCE_MS = 250;

/**
 * Bevakar `.highai/flows/` i det valda repot. Importerar det som redan
 * ligger där vid start och sedan varje fil som sparas.
 */
export class FlowInbox {
  private watcher: FSWatcher | null = null;
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
    const dir = join(repoPath, FLOWS_DIR);
    await mkdir(dir, { recursive: true });
    await writeGuide(repoPath);

    this.watcher = watch(dir, (_event, filename) => {
      if (typeof filename === 'string' && isFlowFile(filename)) this.schedule(repoPath, filename);
    });
    this.watcher.on('error', (error: unknown) => {
      console.error(error);
    });

    for (const name of (await readdir(dir)).filter(isFlowFile).sort()) {
      await this.importAndEmit(repoPath, name);
    }
  }

  stop(): void {
    this.watcher?.close();
    this.watcher = null;
    this.repoPath = null;
    for (const timer of this.pending.values()) clearTimeout(timer);
    this.pending.clear();
  }

  private schedule(repoPath: string, name: string): void {
    const existing = this.pending.get(name);
    if (existing) clearTimeout(existing);
    this.pending.set(
      name,
      setTimeout(() => {
        this.pending.delete(name);
        if (this.repoPath === repoPath) void this.importAndEmit(repoPath, name);
      }, DEBOUNCE_MS),
    );
  }

  private async importAndEmit(repoPath: string, name: string): Promise<void> {
    const file = `${FLOWS_DIR}/${name}`;
    try {
      const result = await importFlowFile(this.store, repoPath, name);
      if (result.type === 'imported') {
        this.emit({
          type: 'imported',
          repoPath,
          file,
          analysis: result.analysis,
          list: await this.listAll(repoPath),
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
