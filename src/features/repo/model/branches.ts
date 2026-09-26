/**
 * Föreslår vilken branch man jämför mot: en tidigare vald om den finns kvar,
 * annars main eller master, annars första andra branchen.
 */
export function defaultBaseBranch(
  branches: readonly string[],
  current: string | null,
  stored: string | null,
): string | null {
  const others = branches.filter((b) => b !== current);
  if (stored && others.includes(stored)) return stored;
  return others.find((b) => b === 'main' || b === 'master') ?? others[0] ?? null;
}
