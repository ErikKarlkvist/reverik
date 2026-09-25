import { useCallback, useEffect, useState } from 'react';
import { clampStep } from '../../model/playback';

export interface Playback {
  stepIndex: number;
  playing: boolean;
  atEnd: boolean;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  restart: () => void;
  goTo: (index: number) => void;
}

export function useFlowPlayback(stepCount: number, intervalMs = 1500): Playback {
  const [stepIndex, setStepIndex] = useState(() => clampStep(0, stepCount));
  const [wantsPlay, setWantsPlay] = useState(false);

  const atEnd = stepIndex >= stepCount - 1;
  const playing = wantsPlay && !atEnd;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStepIndex((i) => clampStep(i + 1, stepCount));
    }, intervalMs);
    return () => {
      clearInterval(id);
    };
  }, [playing, stepCount, intervalMs]);

  const goTo = useCallback(
    (index: number) => {
      setStepIndex(clampStep(index, stepCount));
    },
    [stepCount],
  );

  const toggle = useCallback(() => {
    if (atEnd) {
      setStepIndex(clampStep(0, stepCount));
      setWantsPlay(true);
    } else {
      setWantsPlay((p) => !p);
    }
  }, [atEnd, stepCount]);

  const next = useCallback(() => {
    setWantsPlay(false);
    setStepIndex((i) => clampStep(i + 1, stepCount));
  }, [stepCount]);

  const prev = useCallback(() => {
    setWantsPlay(false);
    setStepIndex((i) => clampStep(i - 1, stepCount));
  }, [stepCount]);

  const restart = useCallback(() => {
    setWantsPlay(false);
    setStepIndex(clampStep(0, stepCount));
  }, [stepCount]);

  return { stepIndex, playing, atEnd, toggle, next, prev, restart, goTo };
}
