import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type Flow } from '@/common/model/flow';
import { type Review } from '@/common/model/review';
import { type SavedAnalysis, savedAnalysesSchema, sortAnalyses } from '../model/analysis';

/**
 * Sparar analyser som en JSON-fil per repo under en basmapp. Basmappen
 * skickas in så att lagringen går att testa utan Electron.
 */
export class AnalysisStore {
  constructor(private readonly baseDir: string) {}

  async list(repoPath: string): Promise<SavedAnalysis[]> {
    return sortAnalyses(await this.read(repoPath));
  }

  async save(repoPath: string, flow: Flow): Promise<SavedAnalysis> {
    const analysis: SavedAnalysis = {
      id: randomUUID(),
      repoPath,
      origin: 'ai',
      createdAt: new Date().toISOString(),
      flow,
    };
    await this.write(repoPath, [...(await this.read(repoPath)), analysis]);
    return analysis;
  }

  /**
   * Sparar ett flöde som importerats från en fil i repot. Finns redan en
   * analys från samma fil ersätts den, så att en rättad fil inte ger dubbletter.
   */
  async upsertFromFile(
    repoPath: string,
    file: string,
    flow: Flow,
    review?: Review,
  ): Promise<SavedAnalysis> {
    const list = await this.read(repoPath);
    const existing = list.find((a) => a.file === file);
    const analysis: SavedAnalysis = {
      id: existing?.id ?? randomUUID(),
      repoPath,
      origin: 'ai',
      createdAt: new Date().toISOString(),
      file,
      flow,
      ...(review ? { review } : {}),
    };
    await this.write(repoPath, [...list.filter((a) => a.id !== analysis.id), analysis]);
    return analysis;
  }

  async delete(repoPath: string, id: string): Promise<SavedAnalysis[]> {
    const remaining = (await this.read(repoPath)).filter((a) => a.id !== id);
    await this.write(repoPath, remaining);
    return sortAnalyses(remaining);
  }

  private filePath(repoPath: string): string {
    const key = createHash('sha1').update(repoPath).digest('hex').slice(0, 16);
    return join(this.baseDir, `${key}.json`);
  }

  private async read(repoPath: string): Promise<SavedAnalysis[]> {
    try {
      const raw = await readFile(this.filePath(repoPath), 'utf8');
      const parsed = savedAnalysesSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : [];
    } catch {
      return [];
    }
  }

  private async write(repoPath: string, list: SavedAnalysis[]): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
    await writeFile(this.filePath(repoPath), JSON.stringify(list, null, 2), 'utf8');
  }
}
