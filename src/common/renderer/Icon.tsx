import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBackwardStep,
  faChevronDown,
  faChevronUp,
  faForwardStep,
  faPause,
  faPlay,
  faRotateLeft,
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
