
import React, { useEffect, useRef } from 'react';
import { Message } from '../types';

interface TranscriptProps {
  messages: Message[];
  currentInput: string;
  currentOutput: string;
}

const Transcript: React.FC<TranscriptProps> = ({ messages, currentInput, currentOutput }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentInput, currentOutput]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 w-full overflow-y-auto px-1 py-4 space-y-6 custom-scrollbar"
      style={{ scrollBehavior: 'smooth' }}
    >
      {messages.map((msg) => (
        <div 
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm backdrop-blur-md ${
              msg.role === 'user' 
                ? 'bg-arc-blue/20 text-off-white rounded-br-sm border border-arc-blue/30' 
                : 'bg-glass-surface/40 text-off-white/90 rounded-bl-sm border border-system-grey/50'
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}
      
      {(currentInput || currentOutput) && (
        <div className="space-y-4">
          {currentInput && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed bg-arc-blue/10 text-off-white/80 rounded-br-sm border border-arc-blue/20 animate-pulse">
                {currentInput}
              </div>
            </div>
          )}
          {currentOutput && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed bg-glass-surface/30 text-off-white/80 rounded-bl-sm border border-system-grey/30 animate-pulse">
                {currentOutput}
              </div>
            </div>
          )}
        </div>
      )}
      
      {messages.length === 0 && !currentInput && !currentOutput && (
        <div className="h-full flex flex-col items-center justify-center text-muted-steel space-y-3 opacity-60 min-h-[200px]">
          <div className="w-12 h-12 rounded-full bg-glass-surface/30 flex items-center justify-center mb-2">
            <span className="w-2 h-2 rounded-full bg-arc-blue animate-pulse"></span>
          </div>
          <p className="text-sm font-medium">System Ready</p>
          <p className="text-xs">Awaiting voice input...</p>
        </div>
      )}
    </div>
  );
};

export default Transcript;
