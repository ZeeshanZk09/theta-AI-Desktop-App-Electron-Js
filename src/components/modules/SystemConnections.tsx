import React from 'react';

interface SystemConnectionsProps {
    paths: {
        addFiles: string;
        memory: string;
        history: string;
        user: string;
        centerToCircle: string;
        centerNode: { cx: number; cy: number };
    };
    windowWidth: number;
}

const SystemConnections: React.FC<SystemConnectionsProps> = ({ paths, windowWidth }) => {
    if (windowWidth < 800) return null;

    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id="grad-addFiles" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00C2FF" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#00C2FF" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#00C2FF" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="grad-memory" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FF4444" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#FF4444" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#FF4444" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="grad-history" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0078D7" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#0078D7" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#0078D7" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="grad-user" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#E6EDF3" stopOpacity="0.05" />
                    <stop offset="50%" stopColor="#E6EDF3" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#E6EDF3" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="grad-center" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00C2FF" stopOpacity="1" />
                    <stop offset="100%" stopColor="#00C2FF" stopOpacity="0" />
                </linearGradient>

                <filter id="glow-line-heavy" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Main Paths */}
            <g strokeWidth="2" fill="none" filter="url(#glow-line-heavy)">
                <path d={paths.addFiles} stroke="url(#grad-addFiles)" className="opacity-20" />
                <path d={paths.memory} stroke="url(#grad-memory)" className="opacity-20" />
                <path d={paths.history} stroke="url(#grad-history)" className="opacity-20" />
                <path d={paths.user} stroke="url(#grad-user)" className="opacity-20" />

                <path d={paths.addFiles} stroke="#00C2FF" strokeWidth="1" strokeDasharray="6 20" className="opacity-80 animate-data-flow" />
                <path d={paths.memory} stroke="#FF4444" strokeWidth="1" strokeDasharray="6 20" className="opacity-80 animate-data-flow-reverse" />
                <path d={paths.history} stroke="#0078D7" strokeWidth="1" strokeDasharray="6 20" className="opacity-80 animate-data-flow" />
                <path d={paths.user} stroke="#E6EDF3" strokeWidth="1" strokeDasharray="6 20" className="opacity-80 animate-data-flow" />

                <path d={paths.centerToCircle} stroke="url(#grad-center)" strokeWidth="4" strokeLinecap="round" className="opacity-40" />
                <path d={paths.centerToCircle} stroke="#00C2FF" strokeWidth="1" className="animate-pulse opacity-70" />
            </g>

        </svg>
    );
};

export default SystemConnections;
