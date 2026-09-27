import { z } from 'zod';
import { flowSchema } from '@/common/model/flow';
import { reviewSchema } from '@/common/model/review';

export const analysisOriginSchema = z.enum([
  /** Inbyggd grundanalys som följer med appen, går inte att ta bort */
  'builtin',
  /** Producerad av AI-analysen */
  'ai',
]);

/** Var i historiken analysen gäller: branch och commit när den importerades. */
export const analysisRefSchema = z.object({
  branch: z.string().nullable(),
  commit: z.string().min(1),
});

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
  /** Branch och commit flödet beskriver. Saknas för inbyggda och repon utan git. */
  ref: analysisRefSchema.optional(),
});

export type AnalysisOrigin = z.infer<typeof analysisOriginSchema>;
export type SavedAnalysis = z.infer<typeof savedAnalysisSchema>;
export type AnalysisRef = z.infer<typeof analysisRefSchema>;

export const savedAnalysesSchema = z.array(savedAnalysisSchema);

/** Nyast först. */
export function sortAnalyses(list: readonly SavedAnalysis[]): SavedAnalysis[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Rubrik för gruppen en analys hör till i listan: branch och kort commit. */
export function refLabel(ref: AnalysisRef): string {
  return `${ref.branch ?? ref.commit.slice(0, 7)} · ${ref.commit.slice(0, 7)}`;
}
