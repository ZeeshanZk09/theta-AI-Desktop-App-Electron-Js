import React, { useEffect, useRef } from 'react';
import { Terminal, Info, CheckCircle, AlertTriangle, XCircle, Code } from 'lucide-react';
import { SystemLog } from '../types/gemini-live';

interface LogTerminalProps {
  logs: SystemLog[];
  className?: string;
}

const LogTerminal: React.FC<LogTerminalProps> = ({ logs, className = '' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const terminalSessionIdRef = useRef(Math.random().toString(36).substring(2, 8).toUpperCase());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = (type: SystemLog['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={12} className='text-j-hologram' />;
      case 'error':
        return <XCircle size={12} className='text-j-crimson' />;
      case 'warning':
        return <AlertTriangle size={12} className='text-j-amber' />;
      case 'tool':
        return <Code size={12} className='text-j-cyan' />;
      default:
        return <Info size={12} className='text-j-blue' />;
    }
  };

  const getLogColor = (type: SystemLog['type']) => {
    switch (type) {
      case 'success':
        return 'text-j-hologram/90';
      case 'error':
        return 'text-j-crimson/90';
      case 'warning':
        return 'text-j-amber/90';
      case 'tool':
        return 'text-j-cyan/90';
      default:
        return 'text-j-text-secondary';
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-black/70 rounded-2xl overflow-hidden font-mono text-[10px] border border-white/20 relative group ${className}`}
    >
      <div className='absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]'></div>

      <div
        className='flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar scroll-smooth relative z-10'
        ref={scrollRef}
      >
        {logs.length === 0 ? (
          <div className='h-full flex flex-col items-center justify-center opacity-70 gap-4'>
            <div className='w-10 h-10 border border-j-cyan/20 rounded-lg flex items-center justify-center animate-pulse'>
              <Terminal size={18} className='text-j-cyan' />
            </div>
            <span className='uppercase tracking-[0.3em] text-[9px] font-bold text-j-text-secondary'>
              Awaiting_Kernel_Signals...
            </span>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className='group/log animate-in fade-in slide-in-from-left-2 duration-300'
            >
              <div className='flex items-start gap-4'>
                <span className='text-j-text-secondary/80 shrink-0 font-mono text-[9px] font-bold'>
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <div className='flex items-center gap-2 shrink-0 min-w-[60px]'>
                  {getLogIcon(log.type)}
                  <span
                    className={`uppercase font-black text-[9px] tracking-widest ${getLogColor(log.type)}`}
                  >
                    {log.type}
                  </span>
                </div>
                <div className='flex-1'>
                  <div
                    className={`leading-relaxed break-words px-2 py-0.5 rounded transition-colors group-hover/log:bg-white/5 border-l-2 border-transparent group-hover/log:border-current ${getLogColor(log.type)}`}
                  >
                    {log.message}
                  </div>
                  {log.details && (
                    <div className='mt-2 ml-2 p-3 bg-black/90 rounded-xl border border-white/10 text-[9px] opacity-100 overflow-hidden shadow-inner font-mono'>
                      <pre className='whitespace-pre-wrap text-j-text-primary'>
                        {typeof log.details === 'string'
                          ? log.details
                          : JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Terminal Footer */}
      <div className='px-5 py-3 bg-j-surface/80 backdrop-blur-md border-t border-white/10 flex items-center justify-between relative z-10'>
        <div className='flex items-center gap-3'>
          <div className='flex gap-1'>
            <div className='w-1 h-3 bg-j-cyan rounded-full animate-pulse'></div>
            <div className='w-1 h-3 bg-j-cyan/50 rounded-full animate-pulse delay-75'></div>
          </div>
          <span className='text-[9px] font-bold uppercase tracking-[0.2em] text-j-text-secondary'>
            System_Operational
          </span>
        </div>
        <div className='flex items-center gap-4'>
          <span className='text-[8px] text-white/20 font-mono'>
            ID: {terminalSessionIdRef.current}
          </span>
          <span className='text-[9px] font-bold text-j-cyan bg-j-cyan/10 px-2 py-0.5 rounded border border-j-cyan/20'>
            {logs.length} ENTRIES
          </span>
        </div>
      </div>
    </div>
  );
};

export default LogTerminal;
