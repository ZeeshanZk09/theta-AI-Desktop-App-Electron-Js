import { useEffect, useState, useRef } from 'react';

const electronAPI = (window as any).electronAPI;

export const useZoom = () => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const isInitialApplied = useRef(false);

  const calculateOptimalZoom = () => {
    // 2000px target width (Safe for all sidebars + hub)
    const targetWidth = 2000;
    
    // Asli Hardware Width use karenge (ye kabhi nahi badalti, isliye stability 100% hogi)
    const hardwareWidth = window.screen.width;
    
    const ratio = hardwareWidth / targetWidth;
    
    // Limits: Laptop screens ke liye ~0.65-0.75, Desktop ke liye 1.0
    return Math.min(Math.max(ratio, 0.6), 1.2);
  };

  useEffect(() => {
    if (!electronAPI) return;

    const applyScaling = () => {
      const optimal = calculateOptimalZoom();
      electronAPI.setZoomFactor(optimal);
      setZoomLevel(optimal);
      isInitialApplied.current = true;
      console.log(`Final Auto-Scale Applied: ${Math.round(optimal * 100)}% based on screen width ${window.screen.width}px`);
    };

    // Immediately apply scaling to avoid visual jumps
    applyScaling();

    // Listen for resize events to re-apply if needed (optional, mostly for dev)
    /* window.addEventListener('resize', applyScaling); */

    // Manual Shortcuts remains stable
    const handleKeyDown = (e: KeyboardEvent) => {
      const isControl = e.ctrlKey || e.metaKey;
      if (isControl) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          const current = (window as any).electronAPI.getZoomFactor();
          (window as any).electronAPI.setZoomFactor(Math.min(current + 0.1, 2.5));
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          const current = (window as any).electronAPI.getZoomFactor();
          (window as any).electronAPI.setZoomFactor(Math.max(current - 0.1, 0.4));
        } else if (e.key === '0') {
          e.preventDefault();
          applyScaling();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      // clearTimeout(timer); // Timer removed
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return { zoomLevel };
};
