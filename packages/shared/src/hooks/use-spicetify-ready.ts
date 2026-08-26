import { useState, useEffect } from 'react';

export const useSpicetifyReady = () => {
  const [ready, setReady] = useState(() => !!Spicetify.Platform?.History);
  useEffect(() => {
    if (ready) return;
    const id = setInterval(() => {
      if (Spicetify.Platform?.History) {
        clearInterval(id);
        setReady(true);
      }
    }, 50);
    return () => clearInterval(id);
  }, [ready]);
  return ready;
};
