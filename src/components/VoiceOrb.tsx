
import React, { useEffect, useRef, useState } from 'react';

interface VoiceOrbProps {
  isActive: boolean;
  analyser: AnalyserNode | null;
}

const VoiceOrb: React.FC<VoiceOrbProps> = ({ isActive, analyser }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });

  // Handle Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Use the state dimensions to keep canvas sharp
      const { width, height } = dimensions;
      
      // Ensure internal resolution matches display size
      canvas.width = width;
      canvas.height = height;
      
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      
      // Responsive radius based on smallest dimension
      const minDim = Math.min(width, height);
      const baseRadius = minDim * 0.15; // 15% of container size

      if (isActive && analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        
        // Dynamic Glow
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / bufferLength;
        const glowRadius = baseRadius + (average * 0.5);

        const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, glowRadius);
        gradient.addColorStop(0, 'rgba(147, 197, 253, 0.8)'); // blue-300
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.4)'); // blue-500
        gradient.addColorStop(1, 'rgba(30, 64, 175, 0)'); // blue-800

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Waveform Orbs
        ctx.beginPath();
        ctx.strokeStyle = '#60a5fa'; // blue-400
        ctx.lineWidth = 2;
        for (let i = 0; i < bufferLength; i += 4) {
          const angle = (i / bufferLength) * Math.PI * 2;
          const v = dataArray[i] / 128.0;
          const r = baseRadius + (v * (minDim * 0.1)); // Dynamic wave height
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      } else {
        // Idle state
        ctx.beginPath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      requestRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, analyser, dimensions]);

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-full h-full min-h-[200px] overflow-hidden">
      {isActive && (
        <>
          <div className="pulse-ring absolute border-blue-400 bg-blue-400 opacity-20 inset-0 m-auto" style={{ width: '20%', height: '20%', animationDelay: '0s' }}></div>
          <div className="pulse-ring absolute border-blue-500 bg-blue-500 opacity-15 inset-0 m-auto" style={{ width: '30%', height: '30%', animationDelay: '-0.4s' }}></div>
          <div className="pulse-ring absolute border-blue-600 bg-blue-600 opacity-10 inset-0 m-auto" style={{ width: '40%', height: '40%', animationDelay: '-0.8s' }}></div>
        </>
      )}
      <canvas
        ref={canvasRef}
        className="z-10 block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default VoiceOrb;
