
import React, { useEffect, useRef, useMemo } from 'react';


interface DotGlobeProps {
    isSpeaking: boolean;
    isConnected: boolean;
    isConnecting: boolean;
    analyser?: AnalyserNode | null;    // AI Output Analyser
    micAnalyser?: AnalyserNode | null; // User Mic Analyser
    size?: number;
}

const DotGlobe: React.FC<DotGlobeProps> = ({
    isSpeaking,
    isConnected,
    isConnecting,
    analyser,
    micAnalyser,
    size = 300
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    const intensityRef = useRef(0); // For smoothing transitions

    // Constants for the globe
    const PARTICLE_COUNT = 1200;
    const GLOBE_RADIUS = size * 0.35;
    const PERSPECTIVE = size * 0.8;

    // Color palette matching the screenshots
    const COLORS = {
        cyan: '#00E5FF',
        amber: '#FFD600',
        white: '#FFFFFF',
        void: '#050D0F'
    };

    // Pre-calculate particle positions and landmass check
    const particles = useMemo(() => {
        const p = [];
        const isLand = (lat: number, lon: number) => {
            if (lon > -100 && lon < -30 && lat > -40 && lat < 50) return true;
            if (lon > -20 && lon < 140 && lat > -35 && lat < 70) {
                if (lon > 40 && lon < 100 && lat < 10) return false;
                return true;
            }
            if (lon > 110 && lon < 155 && lat > -45 && lat < -10) return true;
            return false;
        };

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const z = Math.random() * 2 - 1;
            const phi = Math.random() * 2 * Math.PI;
            const r = Math.sqrt(1 - z * z);
            const lat = Math.asin(z) * (180 / Math.PI);
            const lon = (phi * (180 / Math.PI)) - 180;

            p.push({
                x: r * Math.cos(phi),
                y: r * Math.sin(phi),
                z: z,
                isLand: isLand(lat, lon),
                type: Math.random() > 0.5 ? 1 : 0,
                offset: Math.random() * Math.PI * 2
            });
        }
        return p;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let rotationY = 0;
        let rotationX = 0.3;
        let angle = 0;

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            const centerY = height / 2;

            ctx.clearRect(0, 0, width, height);

            const isActive = isConnected || isConnecting || isSpeaking;

            // --- SMOOTH AUDIO INTENSITY ---
            let targetIntensity = 0;

            // Helper to get average frequency data
            const getIntensity = (an: AnalyserNode) => {
                const dataArray = new Uint8Array(an.frequencyBinCount);
                an.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / an.frequencyBinCount;
                return average / 128.0;
            };

            // Combine both analysers
            if (analyser) targetIntensity += getIntensity(analyser);
            if (micAnalyser) targetIntensity += getIntensity(micAnalyser);

            // Clamp and Interpolate for smoothness
            targetIntensity = Math.min(1.0, targetIntensity);
            // Linear Interpolation: Current + (Target - Current) * EaseFactor
            // Higher factor = faster response, Lower = smoother transition
            intensityRef.current += (targetIntensity - intensityRef.current) * 0.15;

            const baseSpeed = isActive ? 0.008 + intensityRef.current * 0.02 : 0.003;
            rotationY += baseSpeed;
            angle += 0.04;

            // Sorting for depth
            const sortedParticles = [...particles].map(p => {
                let x = p.x * Math.cos(rotationY) - p.z * Math.sin(rotationY);
                let z = p.x * Math.sin(rotationY) + p.z * Math.cos(rotationY);
                let y = p.y * Math.cos(rotationX) - z * Math.sin(rotationX);
                z = p.y * Math.sin(rotationX) + z * Math.cos(rotationX);
                return { ...p, rx: x, ry: y, rz: z };
            }).sort((a, b) => a.rz - b.rz);

            // Back Atmosphere Glow
            const glowAlpha = isActive ? 0.15 + intensityRef.current * 0.1 : 0.05;
            const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, GLOBE_RADIUS * 1.4);
            bgGradient.addColorStop(0, isActive ? `rgba(0, 229, 255, ${glowAlpha})` : `rgba(200, 200, 200, ${glowAlpha})`);
            bgGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            // Render Particles
            sortedParticles.forEach(p => {
                const scale = PERSPECTIVE / (PERSPECTIVE - p.rz * GLOBE_RADIUS);

                // --- PHYSICS Bounciness/Vibration ---
                const idleVib = isActive ? Math.sin(angle * 3 + p.offset) * 1.5 : 0;
                const audioVib = intensityRef.current * 18 * Math.random(); // Smoothed bounce
                const pulseEffect = idleVib + audioVib;

                const x2d = p.rx * (GLOBE_RADIUS + pulseEffect) * scale + centerX;
                const y2d = p.ry * (GLOBE_RADIUS + pulseEffect) * scale + centerY;

                const zAlpha = (p.rz + 1) / 2;
                let alpha = Math.max(0.1, zAlpha);

                if (!isActive) {
                    alpha *= 0.3;
                    ctx.fillStyle = COLORS.white;
                } else {
                    const colorMix = p.x < 0 ? COLORS.cyan : COLORS.amber;
                    if (p.isLand) {
                        ctx.fillStyle = colorMix;
                        alpha = Math.min(1, alpha + 0.4 + intensityRef.current * 0.4);
                        if (intensityRef.current > 0.1) {
                            const flash = (Math.sin(angle * 6 + p.offset) + 1) / 2;
                            alpha *= (0.6 + flash * 0.4);
                        }
                    } else {
                        ctx.fillStyle = COLORS.cyan;
                        alpha *= 0.2;
                    }
                }

                ctx.globalAlpha = Math.min(1, alpha);
                const pSize = (p.isLand ? 1.5 : 0.8) * scale;
                ctx.fillRect(x2d, y2d, pSize, pSize);
            });

            // Floating Rings
            if (isActive) {
                const ringSizeBoost = intensityRef.current * 25;
                ctx.globalAlpha = 0.1 + intensityRef.current * 0.3;

                ctx.strokeStyle = COLORS.amber;
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, (GLOBE_RADIUS * 1.15) + ringSizeBoost, (GLOBE_RADIUS * 0.25) + ringSizeBoost * 0.4, rotationY * 0.3, 0, Math.PI * 2);
                ctx.stroke();

                ctx.strokeStyle = COLORS.cyan;
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, (GLOBE_RADIUS * 1.25) + ringSizeBoost, (GLOBE_RADIUS * 0.35) + ringSizeBoost * 0.4, -rotationY * 0.2, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.globalAlpha = 1.0;
            requestRef.current = requestAnimationFrame(render);
        };

        render();
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [particles, isSpeaking, isConnected, isConnecting, analyser, micAnalyser]);

    return (
        <div className="relative flex items-center justify-center overflow-hidden" style={{ width: size, height: size }}>
            <div className={`absolute inset-0 rounded-full transition-all duration-700 ${isSpeaking ? 'opacity-20 scale-100' : 'opacity-0 scale-90'}`}
                style={{ background: `radial-gradient(circle at center, ${COLORS.cyan} 0%, transparent 70%)` }} />

            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="relative z-10"
            />
        </div>
    );
};

export default DotGlobe;
