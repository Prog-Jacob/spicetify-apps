import { useState, useEffect } from 'react';

export const useSpicetifyReady = (): boolean => {
  const [ready, setReady] = useState(() => !!Spicetify?.React && !!Spicetify?.Platform);

  useEffect(() => {
    if (ready) return;

    const interval = setInterval(() => {
      if (Spicetify?.React && Spicetify?.Platform) {
        setReady(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [ready]);

  return ready;
};
