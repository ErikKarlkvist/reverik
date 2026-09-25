import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { app } from 'electron';

/**
 * Läser `.env` i projektroten under utveckling. Nyckeln stannar i main-processen
 * och exponeras aldrig till renderer.
 */
export function loadEnv(): void {
  const candidates = [resolve(process.cwd(), '.env'), resolve(app.getAppPath(), '.env')];
  const file = candidates.find((path) => existsSync(path));
  if (!file) return;

  for (const rawLine of readFileSync(file, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Miljövariabeln ${key} saknas. Se .env.example.`);
  return value;
}
