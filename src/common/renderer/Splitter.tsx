import { type JSX, type PointerEvent as ReactPointerEvent, useCallback, useRef } from 'react';

interface Props {
  /** vertical: ett lodrätt handtag som ändrar bredd. horizontal: vågrätt, ändrar höjd. */
  orientation: 'vertical' | 'horizontal';
  /** Aktuell storlek i pixlar på det som ändras */
  size: number;
  min: number;
  max: number;
  /** Om det som ändras ligger efter handtaget (t.ex. nedre panel som växer när man drar uppåt) */
  inverted?: boolean;
  onResize: (size: number) => void;
  label: string;
}

/** Dragbart handtag mellan två paneler. Storleken ägs av föräldern. */
export function Splitter({
  orientation,
  size,
  min,
  max,
  inverted = false,
  onResize,
  label,
}: Props): JSX.Element {
  const start = useRef<{ pointer: number; size: number } | null>(null);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      start.current = {
        pointer: orientation === 'vertical' ? event.clientX : event.clientY,
        size,
      };
    },
    [orientation, size],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!start.current) return;
      const pointer = orientation === 'vertical' ? event.clientX : event.clientY;
      const delta = (pointer - start.current.pointer) * (inverted ? -1 : 1);
      onResize(Math.max(min, Math.min(max, start.current.size + delta)));
    },
    [orientation, inverted, min, max, onResize],
  );

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
    start.current = null;
  }, []);

  return (
    <div
      role="separator"
      aria-label={label}
      aria-orientation={orientation}
      aria-valuenow={Math.round(size)}
      aria-valuemin={min}
      aria-valuemax={max}
      className={`splitter splitter--${orientation}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  );
}
