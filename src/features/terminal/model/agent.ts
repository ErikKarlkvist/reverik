/**
 * Vilken agent som startas i terminalen. `shell` startar ingenting, då får
 * användaren själv köra sin agent och be den läsa guiden.
 */
export const AGENTS = ['claude', 'codex', 'shell'] as const;
export type Agent = (typeof AGENTS)[number];

/**
 * Kommandot som skrivs in i skalet när terminalen öppnas. Claude Code får
 * guiden som tillägg till systemprompten. Codex saknar den möjligheten, så den
 * får en första prompt som pekar på guiden. null betyder bara ett skal.
 */
export function agentStartCommand(agent: Agent, guideFile: string): string | null {
  switch (agent) {
    case 'claude':
      return `claude --append-system-prompt-file ${guideFile}`;
    case 'codex':
      return `codex "Read ${guideFile} now and follow it for the rest of this session."`;
    case 'shell':
      return null;
  }
}
