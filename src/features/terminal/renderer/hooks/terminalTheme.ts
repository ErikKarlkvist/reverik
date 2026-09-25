import { type ITheme } from '@xterm/xterm';

const DARK_ANSI = {
  black: '#1c2230',
  red: '#ff7b72',
  green: '#7ee787',
  yellow: '#e3b341',
  blue: '#79c0ff',
  magenta: '#d2a8ff',
  cyan: '#56d4dd',
  white: '#c9d1d9',
  brightBlack: '#6e7681',
  brightRed: '#ffa198',
  brightGreen: '#a5e8b0',
  brightYellow: '#f2cc60',
  brightBlue: '#a5d6ff',
  brightMagenta: '#e2c5ff',
  brightCyan: '#8ee5ec',
  brightWhite: '#f0f6fc',
};

const LIGHT_ANSI = {
  black: '#1c2230',
  red: '#b42318',
  green: '#1a7f37',
  yellow: '#9a6700',
  blue: '#0969da',
  magenta: '#8250df',
  cyan: '#1b7c83',
  white: '#6e7781',
  brightBlack: '#57606a',
  brightRed: '#cf222e',
  brightGreen: '#2da44e',
  brightYellow: '#bf8700',
  brightBlue: '#218bff',
  brightMagenta: '#a475f9',
  brightCyan: '#3192aa',
  brightWhite: '#8c959f',
};

/** Läser appens tema ur CSS-variablerna så terminalen följer ljust och mörkt läge. */
export function readTerminalTheme(): ITheme {
  const style = getComputedStyle(document.documentElement);
  const v = (name: string): string => style.getPropertyValue(name).trim();
  const dark = v('color-scheme') === 'dark';
  return {
    background: v('--bg-panel'),
    foreground: v('--fg'),
    cursor: v('--accent'),
    cursorAccent: v('--bg-panel'),
    selectionBackground: v('--selection'),
    ...(dark ? DARK_ANSI : LIGHT_ANSI),
  };
}

/** Anropar `onChange` när temat byts, via data-theme på <html> eller systemet. */
export function watchTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const media = matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener('change', onChange);
  };
}
