import React from 'react';
import { Database, X } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';



interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: any[];
    historySettings: any;
    handleUpdateHistorySettings: (settings: any) => void;
    handleClearHistory: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
    isOpen,
    onClose,
    history,
    historySettings,
    handleUpdateHistorySettings,
    handleClearHistory
}) => {
    const { playClick } = useAudio();
    if (!isOpen) return null;


    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-j-void/90 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
            <div className="w-full max-w-3xl bg-j-panel border border-j-blue/20 rounded-[3rem] shadow-[0_0_80px_rgba(0,120,215,0.15)] overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
                <div className="flex h-[700px]">
                    {/* Left Sidebar in Modal: Settings */}
                    <div className="w-64 border-r border-white/5 p-8 flex flex-col gap-8 bg-black/20">
                        <div className="flex items-center gap-3 mb-4">
                            <Database size={24} className="text-j-blue" />
                            <h2 className="font-bold text-lg uppercase tracking-wider">Storage</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-mono text-j-text-muted uppercase tracking-widest pl-1">Store History</label>
                                <div
                                    onClick={() => { playClick(); handleUpdateHistorySettings({ ...historySettings, storeHistory: !historySettings.storeHistory }); }}

                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-300 ${historySettings.storeHistory ? 'bg-j-blue' : 'bg-white/10'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${historySettings.storeHistory ? 'translate-x-6' : ''}`}></div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-mono text-j-text-muted uppercase tracking-widest pl-1">Context Limit</label>
                                <input
                                    type="range"
                                    min="5"
                                    max="100"
                                    step="5"
                                    value={historySettings.maxContextMessages}
                                    onChange={(e) => handleUpdateHistorySettings({ ...historySettings, maxContextMessages: parseInt(e.target.value) })}
                                    className="w-full accent-j-blue h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] font-mono text-j-blue p-1">
                                    <span>{historySettings.maxContextMessages} msgs</span>
                                    <span className="opacity-50 tracking-tighter uppercase">AI Memory Depth</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <button
                                onClick={() => { playClick(); handleClearHistory(); }}
                                className="w-full py-3 bg-j-crimson/10 border border-j-crimson/20 text-j-crimson text-[10px] font-mono uppercase tracking-widest rounded-xl hover:bg-j-crimson hover:text-white transition-all shadow-lg active:scale-95"
                            >

                                Purge History
                            </button>
                        </div>
                    </div>

                    {/* Right Area: Content Preview */}
                    <div className="flex-1 flex flex-col p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Conversation Logs</h3>
                                <p className="text-[10px] font-mono text-j-text-muted uppercase tracking-[0.2em] mt-1">Total Records: <span className="text-j-blue font-bold">{history.length}</span></p>
                            </div>
                            <button onClick={() => { playClick(); onClose(); }} className="p-2 hover:bg-white/5 rounded-full text-j-text-muted transition-colors">

                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
                            {history.length > 0 ? (
                                history.slice().reverse().map((msg: any, idx: number) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/[0.03] hover:border-j-blue/30 transition-all flex flex-col gap-2 group relative">
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[8px] font-mono px-2 py-0.5 rounded uppercase tracking-widest ${msg.role === 'user' ? 'bg-j-blue/10 text-j-blue' : 'bg-j-cyan/10 text-j-cyan'}`}>
                                                {msg.role}
                                            </span>
                                            <span className="text-[8px] font-mono text-j-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                                {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-j-text-secondary leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                                            {msg.text}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                                    <Database size={64} className="animate-pulse" />
                                    <span className="text-xs font-mono uppercase tracking-[0.5em]">No Data Cached</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
