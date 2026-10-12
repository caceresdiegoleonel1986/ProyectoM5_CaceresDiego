import { useState, useEffect } from "react";

/**
 * Hook para debouncing de valores controlados.
 * 
 * @param value Valor que se quiere debounced
 * @param delayMs Tiempo de espera en milisegundos
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}