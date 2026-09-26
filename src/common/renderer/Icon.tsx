import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBackwardStep,
  faBolt,
  faChevronDown,
  faChevronRight,
  faChevronUp,
  faCircleExclamation,
  faCircleInfo,
  faCommentDots,
  faCloud,
  faCode,
  faCodeBranch,
  faDatabase,
  faDesktop,
  faFolderOpen,
  faForwardStep,
  faGears,
  faKey,
  faLink,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faLayerGroup,
  faPause,
  faPlay,
  faRotateLeft,
  faRoute,
  faServer,
  faTriangleExclamation,
  faTerminal,
  faWindowMaximize,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type JSX } from 'react';

/** Ikonerna appen använder. Lägg till här i stället för att importera Font Awesome direkt. */
const ICONS = {
  chevronDown: faChevronDown,
  chevronUp: faChevronUp,
  play: faPlay,
  pause: faPause,
  stepBack: faBackwardStep,
  stepForward: faForwardStep,
  restart: faRotateLeft,
  close: faXmark,
  chevronRight: faChevronRight,
  terminal: faTerminal,
  // Nod- och systemtyper i grafen
  app: faDesktop,
  api: faServer,
  ui: faWindowMaximize,
  handler: faCode,
  http: faRoute,
  service: faGears,
  db: faDatabase,
  cache: faBolt,
  external: faCloud,
  queue: faLayerGroup,
  key: faKey,
  branch: faCodeBranch,
  folder: faFolderOpen,
  chat: faCommentDots,
  error: faCircleExclamation,
  warning: faTriangleExclamation,
  info: faCircleInfo,
  link: faLink,
  zoomIn: faMagnifyingGlassPlus,
  zoomOut: faMagnifyingGlassMinus,
} satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof ICONS;

interface Props {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
}

/** Ikoner är dekorativa. Knappen som håller ikonen bär betydelsen via text eller aria-label. */
export function Icon({ name, size = 'md' }: Props): JSX.Element {
  return <FontAwesomeIcon icon={ICONS[name]} className={`icon icon--${size}`} aria-hidden />;
}
