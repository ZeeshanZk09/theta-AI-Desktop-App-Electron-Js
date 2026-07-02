import { useCallback } from 'react';

import { logger } from "../lib/logger";

export const useAudio = () => {
  const playSound = useCallback((path: string, volume: number = 0.5) => {
    try {
      const audio = new Audio(path);
      audio.volume = volume;
      audio.play().catch(err => {
        // Silent fail if audio cannot play (e.g. user hasn't interacted yet)
        logger.warn('Audio play failed:', err);
      });
    } catch (err) {
      logger.error('Audio error:', err);
    }
  }, []);

  const playClick = useCallback(() => {
    playSound('audio/button.wav', 0.4);
  }, [playSound]);


  return { playSound, playClick };
};
