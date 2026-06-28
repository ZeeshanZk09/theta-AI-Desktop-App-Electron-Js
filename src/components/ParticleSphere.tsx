import React, { useEffect, useRef } from 'react';

interface ParticleSphereProps {
  count?: number;
  radius?: number;
  color?: string;
  className?: string;
  isSpeaking?: boolean;
}

const ParticleSphere: React.FC<ParticleSphereProps> = ({ 
  count = 800, 
  radius = 100, 
  color = '#38bdf8',
  className = '',
  isSpeaking = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; z: number; theta: number; phi: number }[] = [];

    // Initialize particles on a sphere surface
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      particles.push({
        theta,
        phi,
        x: 0,
        y: 0,
        z: 0
      });
    }

    let angleX = 0;
    let angleY = 0;

    const render = () => {
      // Clear canvas with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Rotate sphere
      angleX += 0.005;
      angleY += 0.005;

      // Update and draw particles
      particles.forEach(p => {
        // Calculate 3D coordinates based on spherical coordinates
        // Apply vibration if speaking (glitch effect)
        let currentRadius = radius;
        if (isSpeaking) {
            // Random vibration strength
            const vibration = (Math.random() - 0.5) * 15;
            currentRadius += vibration;
        }

        const x = currentRadius * Math.sin(p.phi) * Math.cos(p.theta);
        const y = currentRadius * Math.sin(p.phi) * Math.sin(p.theta);
        const z = currentRadius * Math.cos(p.phi);

        // Apply rotation matrix
        // Rotation around X-axis
        const y1 = y * Math.cos(angleX) - z * Math.sin(angleX);
        const z1 = y * Math.sin(angleX) + z * Math.cos(angleX);
        
        // Rotation around Y-axis
        const x2 = x * Math.cos(angleY) + z1 * Math.sin(angleY);
        const z2 = -x * Math.sin(angleY) + z1 * Math.cos(angleY);

        // Perspective projection
        const scale = 300 / (300 + z2); // Simple perspective
        const x2d = x2 * scale + cx;
        const y2d = y1 * scale + cy;

        // Draw particle
        const alpha = (z2 + radius) / (2 * radius); // Fade out particles at the back
        ctx.fillStyle = color;
        ctx.globalAlpha = Math.max(0.1, alpha); // Minimum visibility
        
        ctx.beginPath();
        // Size varies with perspective
        const size = Math.max(0.5, 1.5 * scale);
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [count, radius, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={radius * 3} 
      height={radius * 3} 
      className={className}
    />
  );
};

export default ParticleSphere;
