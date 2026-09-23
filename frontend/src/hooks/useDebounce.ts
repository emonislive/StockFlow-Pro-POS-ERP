import { useState, useEffect } from 'react';

/**
 * useDebounce hook to delay state updates (e.g. for search inputs).
 * Prevents redundant re-renders and network request hammering.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
