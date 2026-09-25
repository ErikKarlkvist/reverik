import { isDemoRepo } from '@/common/main/demo';
import { demoFlows } from '@/common/model/fixtures';
import { type SavedAnalysis } from '../model/analysis';

/** Inbyggda grundanalyser. Just nu bara för demo-appen. */
export function builtinAnalyses(repoPath: string): SavedAnalysis[] {
  if (!isDemoRepo(repoPath)) return [];
  return demoFlows.map((flow, i) => ({
    id: `builtin:${i}`,
    repoPath,
    origin: 'builtin',
    createdAt: '2026-01-01T00:00:00.000Z',
    flow,
  }));
}
