import React from 'react';
import { Activity, RefreshCw, Wrench } from 'lucide-react';

export interface AdvisorRecommendation {
  id: string;
  title: string;
  explanation: string;
  suggestedAction: string;
  command?: string;
  risk: 'green' | 'yellow' | 'red';
}

interface SystemAdvisorPanelProps {
  recommendations: AdvisorRecommendation[];
  isScanning: boolean;
  onScanNow: () => void;
  onRunFix: (recommendation: AdvisorRecommendation) => void;
}

const riskClasses = {
  green: 'border-emerald-500/25 bg-emerald-500/5',
  yellow: 'border-amber-500/25 bg-amber-500/5',
  red: 'border-rose-500/25 bg-rose-500/5',
};

const SystemAdvisorPanel: React.FC<SystemAdvisorPanelProps> = ({
  recommendations,
  isScanning,
  onScanNow,
  onRunFix,
}) => {
  return (
    <div className='rounded-3xl border border-white/[0.06] bg-j-surface/20 backdrop-blur-md p-5 flex flex-col gap-4 shadow-xl'>
      <div className='flex items-center justify-between border-b border-white/5 pb-2'>
        <div className='flex items-center gap-2'>
          <Activity size={16} className='text-j-cyan' />
          <h3 className='text-sm font-semibold text-j-cyan tracking-wide'>System Advisor</h3>
        </div>
        <button
          onClick={onScanNow}
          className='text-j-text-muted hover:text-j-cyan transition-colors'
          title='Run health scan now'
        >
          <RefreshCw size={15} className={isScanning ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className='max-h-72 overflow-y-auto no-scrollbar space-y-3 pr-1'>
        {recommendations.length === 0 ? (
          <div className='text-xs text-j-text-muted bg-white/[0.03] border border-white/5 rounded-2xl p-4'>
            No active anomalies detected. System health looks stable.
          </div>
        ) : (
          recommendations.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-3 ${riskClasses[item.risk] || riskClasses.yellow}`}
            >
              <h4 className='text-sm font-semibold text-white'>{item.title}</h4>
              <p className='text-xs text-j-text-secondary mt-1'>{item.explanation}</p>
              <p className='text-[11px] text-j-text-muted mt-2'>{item.suggestedAction}</p>
              {item.command && (
                <button
                  onClick={() => onRunFix(item)}
                  className='mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-j-cyan/15 border border-j-cyan/30 text-j-cyan hover:bg-j-cyan hover:text-black transition-colors'
                >
                  <Wrench size={13} />
                  Ask Theta to fix this
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SystemAdvisorPanel;
