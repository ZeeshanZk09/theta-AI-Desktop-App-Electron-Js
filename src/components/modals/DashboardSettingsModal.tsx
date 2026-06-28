import { Sliders, X } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';


interface DashboardSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    dashboardSettings: any;
    handleUpdateDashboardSettings: (settings: any) => void;
}

const DashboardSettingsModal: React.FC<DashboardSettingsModalProps> = ({
    isOpen,
    onClose,
    dashboardSettings,
    handleUpdateDashboardSettings
}) => {
    const { playClick } = useAudio();
    if (!isOpen) return null;


    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-j-void/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
            <div className="w-full max-w-lg bg-j-panel border border-j-hologram/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,255,163,0.2)] overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
                <div className="p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-j-hologram/10 rounded-xl">
                                <Sliders size={24} className="text-j-hologram" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Dashboard Settings</h2>
                                <p className="text-[10px] font-mono text-j-text-muted uppercase tracking-widest">Customize Your Feed</p>
                            </div>
                        </div>
                        <button onClick={() => { playClick(); onClose(); }} className="p-2 hover:bg-white/5 rounded-full text-j-text-muted hover:text-white transition-colors">

                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-j-text-muted uppercase tracking-widest pl-1">Interests (comma-separated)</label>
                            <input
                                type="text"
                                value={dashboardSettings.interests.join(', ')}
                                onChange={(e) => handleUpdateDashboardSettings({ ...dashboardSettings, interests: e.target.value.split(',').map(s => s.trim()) })}
                                placeholder="e.g. Tech, AI, Global Economy"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-j-text-primary focus:outline-none focus:border-j-hologram/50 transition-all shadow-inner"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-j-text-muted uppercase tracking-widest pl-1">Refresh Interval (seconds)</label>
                            <input
                                type="number"
                                value={dashboardSettings.refreshInterval}
                                onChange={(e) => handleUpdateDashboardSettings({ ...dashboardSettings, refreshInterval: parseInt(e.target.value) || 3600 })}
                                placeholder="e.g. 3600"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-j-text-primary focus:outline-none focus:border-j-hologram/50 transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                        <p className="text-[10px] text-j-text-muted italic">Changes will reflect after next refresh.</p>
                        <button
                            onClick={() => { playClick(); onClose(); }}

                            className="px-6 py-2 bg-j-cyan text-black font-bold rounded-xl hover:scale-105 transition-transform"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSettingsModal;
