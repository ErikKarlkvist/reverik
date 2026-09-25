import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { type Flow, type SourceRef } from '@/common/model/flow';
import { t } from '@/common/model/i18n';

interface Ref {
  where: string;
  source: SourceRef;
}

function collectRefs(flow: Flow): Ref[] {
  const refs: Ref[] = [];
  flow.nodes.forEach((node, i) => {
    if (node.source) refs.push({ where: `nodes.${i}.source`, source: node.source });
    node.tables?.forEach((table, ti) => {
      if (table.source)
        refs.push({ where: `nodes.${i}.tables.${ti}.source`, source: table.source });
    });
  });
  flow.edges.forEach((edge, i) => {
    refs.push({ where: `edges.${i}.source`, source: edge.source });
  });
  return refs;
}

/**
 * Kontrollerar att varje källhänvisning pekar på en fil i repot och en rad
 * som finns. Felen är skrivna för att skickas tillbaka till AI:n.
 */
export async function verifySources(repoPath: string, flow: Flow): Promise<string[]> {
  const root = resolve(repoPath);
  const lineCounts = new Map<string, number | null>();

  async function countLines(file: string): Promise<number | null> {
    const cached = lineCounts.get(file);
    if (cached !== undefined) return cached;
    const absolute = resolve(root, file);
    let count: number | null = null;
    if (absolute.startsWith(root + sep)) {
      try {
        count = (await readFile(absolute, 'utf8')).split('\n').length;
      } catch {
        count = null;
      }
    }
    lineCounts.set(file, count);
    return count;
  }

  const errors: string[] = [];
  for (const { where, source } of collectRefs(flow)) {
    const count = await countLines(source.file);
    if (count === null) {
      errors.push(t('verify.missingFile', { where, file: source.file }));
      continue;
    }
    for (const line of [source.line, source.endLine ?? source.line]) {
      if (line > count) {
        errors.push(t('verify.lineOutOfRange', { where, file: source.file, count, line }));
        break;
      }
    }
  }
  return errors;
}
