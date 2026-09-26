import { z } from 'zod';
import { flowSchema } from '@/common/model/flow';
import { reviewSchema } from '@/common/model/review';

export const analysisOriginSchema = z.enum([
  /** Inbyggd grundanalys som följer med appen, går inte att ta bort */
  'builtin',
  /** Producerad av AI-analysen */
  'ai',
]);

export const savedAnalysisSchema = z.object({
  id: z.string().min(1),
  /** Absolut sökväg till repot analysen gäller */
  repoPath: z.string().min(1),
  origin: analysisOriginSchema,
  createdAt: z.string(),
  /** Filen i repot analysen importerades från, relativt roten. Sparas om igen när filen ändras. */
  file: z.string().min(1).optional(),
  flow: flowSchema,
  /** Finns när analysen är en review: `flow` är då flödet efter ändringen */
  review: reviewSchema.optional(),
});

export type AnalysisOrigin = z.infer<typeof analysisOriginSchema>;
export type SavedAnalysis = z.infer<typeof savedAnalysisSchema>;

export const savedAnalysesSchema = z.array(savedAnalysisSchema);

/** Nyast först. */
export function sortAnalyses(list: readonly SavedAnalysis[]): SavedAnalysis[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
