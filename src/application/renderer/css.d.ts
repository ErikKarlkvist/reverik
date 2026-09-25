import 'react';

declare module 'react' {
  interface CSSProperties {
    '--sidebar-width'?: string;
    '--bottom-height'?: string;
    '--terminal-width'?: string;
  }
}
