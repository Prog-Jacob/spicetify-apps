import { useState, useEffect } from 'react';

const loaded = () => !!Spicetify.Platform?.History && !!Spicetify.CosmosAsync;

export const useSpicetifyReady = () => {
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    if (ready) return;
    const id = setInterval(() => {
      if (loaded()) {
        clearInterval(id);
        setReady(true);
      }
    }, 50);
    return () => clearInterval(id);
  }, [ready]);
  return ready;
};
