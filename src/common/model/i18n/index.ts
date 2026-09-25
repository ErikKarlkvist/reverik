import en from './en-gb.json';

/**
 * Alla texter som visas för användaren, och felmeddelanden som når UI:t eller
 * modellen, hämtas härifrån. Lägg till nya nycklar i en-gb.json. Fler språk
 * blir en fil till med samma nycklar.
 */
export type MessageKey = keyof typeof en;

export const LOCALE = 'en-GB';

type Params = Record<string, string | number>;

export function t(key: MessageKey, params?: Params): string {
  const template = en[key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
