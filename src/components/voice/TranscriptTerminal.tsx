import React, { useEffect, useRef } from 'react';
import { Terminal, Cpu } from 'lucide-react';
import { Message } from '../../types';

interface TranscriptTerminalProps {
    messages: Message[];
    className?: string;
}

const TranscriptTerminal: React.FC<TranscriptTerminalProps> = ({ messages, className = '' }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className={`flex flex-col h-full bg-black/40 border border-j-steel/30 rounded-lg overflow-hidden backdrop-blur-sm ${className}`}>
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-j-steel/10 border-b border-j-steel/20">
                <div className="flex items-center gap-2 text-j-text-muted">
                    <Terminal size={12} />
                    <span className="text-[10px] font-mono tracking-wider uppercase">Live Transcript</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-j-steel/50"></div>
                    <div className="w-2 h-2 rounded-full bg-j-steel/50"></div>
                </div>
            </div>

            {/* Terminal Body */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm scroll-smooth custom-scrollbar"
            >
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-j-steel opacity-50 gap-2">
                        <Cpu size={24} />
                        <span className="text-xs uppercase tracking-widest">Awaiting Input...</span>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={msg.id || i}
                        className={`flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'items-end' : 'items-start'
                            }`}
                    >
                        <div className={`max-w-[85%] rounded-md p-3 border ${msg.role === 'user'
                            ? 'bg-j-steel/20 border-j-steel/40 text-j-text-primary'
                            : 'bg-j-cyan/5 border-j-cyan/20 text-j-cyan'
                            }`}>
                            <div className="flex items-center gap-2 mb-1 opacity-50">
                                <span className="text-[10px] uppercase font-bold tracking-wider">
                                    {msg.role === 'user' ? 'CMD: USER' : 'SYS: CORE'}
                                </span>
                                <span className="text-[8px]">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TranscriptTerminal;
