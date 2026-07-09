import { useState, useEffect } from 'react';

/**
 * Hook para retrasar la actualización de un valor hasta que haya pasado
 * un tiempo determinado (delay).
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Configuramos el temporizador
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpieza del temporizador si el valor cambia antes de que termine el delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};