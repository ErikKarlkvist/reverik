/**
 * Kommandot som körs i terminalen när den öppnas. Claude Code får guiden som
 * tillägg till sin systemprompt, så den vet om filkontraktet utan att
 * användaren behöver be den läsa något.
 */
export function claudeStartCommand(guideFile: string): string {
  return `claude --append-system-prompt-file ${guideFile}`;
}
