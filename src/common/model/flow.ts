import { z } from 'zod';

/**
 * Kontraktet mellan analysen (AI:n) och visualiseringen. AI:n producerar ett
 * Flow, UI:t ritar och spelar upp det. Allt som ritas ska gå att spåra
 * tillbaka till en fil och rad i repot.
 */

export const nodeKindSchema = z.enum([
  /** Något användaren interagerar med: knapp, formulär, sida */
  'ui',
  /** Kod som reagerar på en händelse i klienten: handler, hook, action */
  'handler',
  /** HTTP-endpoint eller route i backend */
  'http',
  /** Intern tjänst, modul eller klass i backend */
  'service',
  /** Databas eller annan lagring */
  'db',
  /** Externt system utanför repot: betaltjänst, tredjeparts-API */
  'external',
  /** Kö, topic eller eventbuss */
  'queue',
]);

export const sourceRefSchema = z.object({
  /** Sökväg relativt repots rot */
  file: z.string().min(1),
  line: z.number().int().positive(),
  endLine: z.number().int().positive().optional(),
});

export const flowNodeSchema = z.object({
  id: z.string().min(1),
  kind: nodeKindSchema,
  label: z.string().min(1),
  description: z.string().optional(),
  /** Krävs för allt som finns i repot. Valfritt för db, external och queue. */
  source: sourceRefSchema.optional(),
});

export const flowEdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  /** Kort, t.ex. "POST /api/cart/items" eller "INSERT cart_items" */
  label: z.string().min(1),
  /** Vad som skickas. Fritext eller exempel-JSON. */
  payload: z.string().optional(),
  /** Vad som kommer tillbaka, om något. */
  response: z.string().optional(),
  /** Raden där anropet görs. */
  source: sourceRefSchema,
});

export const flowStepSchema = z.object({
  edgeId: z.string().min(1),
  /** En mening om vad som händer i det här steget. */
  description: z.string().min(1),
});

const NODE_KINDS_WITHOUT_SOURCE: ReadonlySet<z.infer<typeof nodeKindSchema>> = new Set([
  'db',
  'external',
  'queue',
]);

export const flowSchema = z
  .object({
    /** Frågan som ställdes */
    question: z.string().min(1),
    title: z.string().min(1),
    /** En mening om vad flödet gör */
    summary: z.string().min(1),
    nodes: z.array(flowNodeSchema).min(1),
    edges: z.array(flowEdgeSchema).min(1),
    /** Ordningen flödet spelas upp i */
    steps: z.array(flowStepSchema).min(1),
  })
  .superRefine((flow, ctx) => {
    const nodeIds = new Set<string>();
    flow.nodes.forEach((node, i) => {
      if (nodeIds.has(node.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['nodes', i, 'id'],
          message: `Nod-id "${node.id}" förekommer mer än en gång`,
        });
      }
      nodeIds.add(node.id);
      if (!node.source && !NODE_KINDS_WITHOUT_SOURCE.has(node.kind)) {
        ctx.addIssue({
          code: 'custom',
          path: ['nodes', i, 'source'],
          message: `Noden "${node.id}" av typen ${node.kind} måste ha en källhänvisning`,
        });
      }
    });

    const edgeIds = new Set<string>();
    flow.edges.forEach((edge, i) => {
      if (edgeIds.has(edge.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['edges', i, 'id'],
          message: `Kant-id "${edge.id}" förekommer mer än en gång`,
        });
      }
      edgeIds.add(edge.id);
      for (const end of ['from', 'to'] as const) {
        if (!nodeIds.has(edge[end])) {
          ctx.addIssue({
            code: 'custom',
            path: ['edges', i, end],
            message: `Kanten "${edge.id}" pekar på okänd nod "${edge[end]}"`,
          });
        }
      }
    });

    flow.steps.forEach((step, i) => {
      if (!edgeIds.has(step.edgeId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['steps', i, 'edgeId'],
          message: `Steg ${i + 1} pekar på okänd kant "${step.edgeId}"`,
        });
      }
    });
  });

export type NodeKind = z.infer<typeof nodeKindSchema>;
export type SourceRef = z.infer<typeof sourceRefSchema>;
export type FlowNode = z.infer<typeof flowNodeSchema>;
export type FlowEdge = z.infer<typeof flowEdgeSchema>;
export type FlowStep = z.infer<typeof flowStepSchema>;
export type Flow = z.infer<typeof flowSchema>;

export type FlowValidation = { ok: true; flow: Flow } | { ok: false; errors: string[] };

/**
 * Validerar okänd data mot schemat och ger läsbara fel, tänkta att skickas
 * tillbaka till modellen så den kan rätta sig.
 */
export function validateFlow(input: unknown): FlowValidation {
  const result = flowSchema.safeParse(input);
  if (result.success) return { ok: true, flow: result.data };
  return {
    ok: false,
    errors: result.error.issues.map((issue) => {
      const path = issue.path.map(String).join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    }),
  };
}

export const NODE_KIND_LABELS: Readonly<Record<NodeKind, string>> = {
  ui: 'UI',
  handler: 'Handler',
  http: 'HTTP',
  service: 'Tjänst',
  db: 'Databas',
  external: 'Externt',
  queue: 'Kö',
};
