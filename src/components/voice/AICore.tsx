import React from 'react';
import DotGlobe from '../DotGlobe';

import { ConnectionStatus } from '../../types';

interface AICoreProps {
    status: ConnectionStatus;
    isSpeaking: boolean;
    analyser?: AnalyserNode | null;
    micAnalyser?: AnalyserNode | null;
}

const AICore: React.FC<AICoreProps> = ({ status, isSpeaking, analyser, micAnalyser }) => {
    const isConnected = status === ConnectionStatus.CONNECTED;
    const isConnecting = status === ConnectionStatus.CONNECTING;

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Outer Rotating Rings (status indicators) */}
            <div className={`absolute w-[300px] h-[300px] rounded-full border border-j-steel/30 transition-all duration-1000 ${isSpeaking ? 'scale-110 border-j-cyan/30' : 'scale-100'}`}></div>
            <div className={`absolute w-[280px] h-[280px] rounded-full border border-dashed border-j-steel/20 animate-spin-slow duration-[20s]`}></div>

            {/* Dynamic Status Glow */}
            <div className={`absolute w-[150px] h-[150px] rounded-full blur-[50px] transition-colors duration-500 opacity-20
        ${isConnected ? 'bg-j-cyan' : isConnecting ? 'bg-j-amber' : 'bg-red-500'}
      `}></div>

            {/* Main Core Visualizer */}
            <div className="relative z-10 w-[240px] h-[240px] flex items-center justify-center">
                <DotGlobe
                    isSpeaking={isSpeaking}
                    isConnected={isConnected}
                    isConnecting={isConnecting}
                    analyser={analyser}
                    micAnalyser={micAnalyser}
                    size={240}
                />
            </div>

            {/* Status Label */}
            <div className="absolute top-[80%] mt-8 flex flex-col items-center gap-1">
                <span className={`text-[10px] font-mono tracking-[0.2em] uppercase 
          ${isConnected ? 'text-j-cyan' : isConnecting ? 'text-j-amber' : 'text-j-text-muted'}
        `}>
                    {isConnected ? 'System Online' : isConnecting ? 'Initializing...' : 'Offline'}
                </span>
                {isConnected && (
                    <div className="flex gap-1">
                        <div className="w-1 h-1 bg-j-cyan rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-j-cyan rounded-full animate-pulse delay-75"></div>
                        <div className="w-1 h-1 bg-j-cyan rounded-full animate-pulse delay-150"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AICore;
