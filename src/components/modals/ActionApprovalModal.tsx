import { AlertTriangle, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import React from 'react';

export interface ActionApprovalRequest {
  requestId: string;
  action: string;
  detail: string;
  payload?: Record<string, unknown>;
  source?: string;
  risk: 'green' | 'yellow' | 'red';
  requestedAt?: number;
}

interface ActionApprovalModalProps {
  request: ActionApprovalRequest | null;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

const riskStyles = {
  green: {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    panel: 'border-emerald-500/30',
    icon: <ShieldCheck size={18} className='text-emerald-300' />,
    label: 'Low Risk',
  },
  yellow: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    panel: 'border-amber-500/35',
    icon: <ShieldAlert size={18} className='text-amber-300' />,
    label: 'Medium Risk',
  },
  red: {
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
    panel: 'border-rose-500/35',
    icon: <ShieldX size={18} className='text-rose-300' />,
    label: 'High Risk',
  },
};

const ActionApprovalModal: React.FC<ActionApprovalModalProps> = ({
  request,
  onApprove,
  onReject,
}) => {
  if (!request) return null;

  const style = riskStyles[request.risk] || riskStyles.yellow;

  return (
    <div className='fixed inset-0 z-[120] flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' />
      <div
        className={`relative z-10 w-full max-w-2xl rounded-3xl border bg-j-panel/95 shadow-2xl ${style.panel}`}
      >
        <div className='p-6 border-b border-white/10 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-xl bg-white/5'>
              <AlertTriangle size={18} className='text-j-cyan' />
            </div>
            <div>
              <h3 className='text-lg font-bold text-white'>Action Approval Required</h3>
              <p className='text-xs text-j-text-muted'>Review this request before execution.</p>
            </div>
          </div>
          <div className={`px-3 py-1 text-[11px] rounded-full border font-semibold ${style.badge}`}>
            {style.label}
          </div>
        </div>

        <div className='p-6 space-y-4'>
          <div className='flex items-center gap-2 text-sm text-white'>
            {style.icon}
            <span className='font-semibold'>{request.action}</span>
          </div>

          <div className='rounded-2xl border border-white/10 bg-black/30 p-4'>
            <p className='text-[11px] text-j-text-muted uppercase tracking-wider mb-1'>Detail</p>
            <p className='text-sm text-j-text-primary break-words'>{request.detail}</p>
          </div>

          <div className='rounded-2xl border border-white/10 bg-black/30 p-4'>
            <p className='text-[11px] text-j-text-muted uppercase tracking-wider mb-2'>
              Exact Payload
            </p>
            <pre className='text-[11px] text-j-text-secondary whitespace-pre-wrap break-all max-h-48 overflow-y-auto custom-scrollbar'>
              {JSON.stringify(request.payload ?? {}, null, 2)}
            </pre>
          </div>

          <div className='flex items-center justify-between text-[11px] text-j-text-muted'>
            <span>Source: {request.source || 'Unknown'}</span>
            <span>Requested: {new Date(request.requestedAt || Date.now()).toLocaleString()}</span>
          </div>
        </div>

        <div className='p-6 border-t border-white/10 flex items-center justify-end gap-3'>
          <button
            onClick={() => onReject(request.requestId)}
            className='px-4 py-2 rounded-xl border border-white/15 text-j-text-secondary hover:text-white hover:bg-white/5 transition-colors'
          >
            Reject
          </button>
          <button
            onClick={() => onApprove(request.requestId)}
            className='px-5 py-2 rounded-xl bg-j-cyan text-black font-semibold hover:brightness-110 transition-colors'
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionApprovalModal;
