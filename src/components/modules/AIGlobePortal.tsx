import React from 'react';

import { ConnectionStatus } from '../../types';
import DotGlobe from '../DotGlobe';

interface AIGlobePortalProps {
    status: ConnectionStatus;
    isAISpeaking: boolean;
    analyser: AnalyserNode | null;
    micAnalyser: AnalyserNode | null;
    handleStartStop: () => void;
    portalRef: React.RefObject<HTMLDivElement | null>;
    windowWidth: number;
}

const AIGlobePortal: React.FC<AIGlobePortalProps> = ({
    status,
    isAISpeaking,
    analyser,
    micAnalyser,
    handleStartStop,
    portalRef,
    windowWidth
}) => {
    return (
        <div className={`flex items-center justify-center z-10 ${windowWidth < 800 ? 'w-full' : 'flex-1 lg:flex-none'}`} ref={portalRef}>
            <div className="w-[280px] sm:w-[320px] lg:w-[360px] xl:w-[420px] aspect-square rounded-[3rem] border border-white/[0.08] bg-j-panel/90 backdrop-blur-2xl relative flex flex-col items-center justify-center p-6 lg:p-8 shadow-2xl">

                {/* Glowing Background for the Globe */}
                <div className={`absolute inset-0 rounded-[3rem] transition-all duration-1000 ${status === ConnectionStatus.CONNECTED ? 'opacity-20 shadow-[inset_0_0_100px_rgba(0,229,255,0.2)]' : 'opacity-0'}`} />

                <div className="relative flex items-center justify-center mb-6">
                    <DotGlobe
                        isSpeaking={isAISpeaking}
                        isConnected={status === ConnectionStatus.CONNECTED}
                        isConnecting={status === ConnectionStatus.CONNECTING}
                        analyser={analyser}
                        micAnalyser={micAnalyser}
                        size={280}
                    />

                    {/* Outer Sci-Fi UI Elements */}
                    <div className={`absolute inset-[-20px] border border-j-cyan/10 rounded-full ${status === ConnectionStatus.CONNECTED ? 'animate-spin-slow' : 'opacity-20'}`} />
                    <div className={`absolute inset-[-40px] border border-dashed border-j-steel/20 rounded-full ${status === ConnectionStatus.CONNECTED ? 'animate-spin-slow duration-[30s]' : 'opacity-10'}`} />
                </div>

                <div className="flex flex-col items-center gap-4 z-10">
                    <span className={`text-[10px] font-mono tracking-[0.3em] uppercase transition-colors duration-500
            ${status === ConnectionStatus.CONNECTED ? 'text-j-cyan' : status === ConnectionStatus.CONNECTING ? 'text-j-amber' : 'text-j-text-muted'}
          `}>
                        {status === ConnectionStatus.CONNECTED ? 'System Active' : status === ConnectionStatus.CONNECTING ? 'Initializing' : 'Standby Mode'}
                    </span>

                    <button
                        onClick={handleStartStop}
                        className={`px-8 py-2 rounded-full border text-[10px] font-mono transition-all uppercase tracking-[0.2em] font-bold shadow-lg
              ${status === ConnectionStatus.CONNECTED
                                ? 'border-j-crimson/50 text-j-crimson hover:bg-j-crimson hover:text-white shadow-j-crimson/20'
                                : 'border-j-cyan/30 text-j-cyan hover:bg-j-cyan hover:text-j-void shadow-j-cyan/20'
                            }
            `}
                    >
                        {status === ConnectionStatus.CONNECTED ? 'Terminate' : 'Initialize AI'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIGlobePortal;
