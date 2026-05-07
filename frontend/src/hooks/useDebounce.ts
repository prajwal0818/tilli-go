import { useRef, useCallback } from 'react';

export function useDebounce<T extends (...args: never[]) => void>(fn: T, delay = 400): T {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  return useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  ) as T;
}
