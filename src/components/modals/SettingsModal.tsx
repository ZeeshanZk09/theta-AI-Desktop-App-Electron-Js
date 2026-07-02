/* eslint-disable @typescript-eslint/no-floating-promises */
import { X, Settings, Database, Key, Trash2, Save, CheckCircle2, AlertCircle } from "lucide-react";
import React, { useState, useEffect } from "react";

import { useAudio } from "../../hooks/useAudio";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApprovalAuditEntry {
  requestId?: string;
  action: string;
  risk?: string;
  detail?: string;
  approvedAt?: number;
  requestedAt?: number;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [appVersion, setAppVersion] = useState("");
  const [approvalAudit, setApprovalAudit] = useState<unknown[]>([]);
  const { playClick } = useAudio();

  useEffect(() => {
    if (isOpen) {
      window.electronAPI.getGeminiToken().then((key: string | null) => {
        if (key) setApiKey(key);
      });
      // Fetch version
      window.electronAPI.getAppVersion().then((version: string) => {
        setAppVersion(version);
      });

      if (window.electronAPI.loadApprovalAuditLog) {
        window.electronAPI.loadApprovalAuditLog().then((entries: unknown[]) => {
          setApprovalAudit(Array.isArray(entries) ? entries : []);
        });
      }
    }
  }, [isOpen]);

  const handleSaveKey = async () => {
    playClick();
    setIsSaving(true);
    setMessage(null);
    try {
      const success = await window.electronAPI.saveGeminiToken(apiKey);
      if (success) {
        setMessage({ type: "success", text: "Settings updated successfully!" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: (err as Error).message || "Error saving settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearMemory = async () => {
    playClick();
    if (
      window.confirm(
        "Bhai, kya aap waqai saari memories clear karna chahte hain? Yeh wapas nahi aayengi."
      )
    ) {
      await window.electronAPI.saveMemories([]);
      setMessage({ type: "success", text: "Memories cleared!" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleClearApprovalAudit = async () => {
    playClick();
    await window.electronAPI.clearApprovalAuditLog();
    setApprovalAudit([]);
    setMessage({ type: "success", text: "Approval audit log cleared." });
    setTimeout(() => setMessage(null), 3000);
  };

  if (!isOpen) return null;

  const handleCloseInternal = () => {
    playClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-j-panel border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-j-cyan/10 rounded-lg">
              <Settings size={20} className="text-j-cyan" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">Main Settings</h2>
          </div>
          <button
            onClick={handleCloseInternal}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} className="text-j-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* API Key Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Key size={18} className="text-j-cyan opacity-80" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
                Global Configuration
              </h3>
            </div>
            <div className="bg-j-surface/30 p-6 rounded-2xl border border-white/5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-j-text-secondary ml-1">Secret Access Key</label>
                <div className="flex gap-3">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1 bg-j-void border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-j-cyan/50 transition-all font-mono text-sm"
                    placeholder="Enter Secret Key..."
                  />
                  <button
                    onClick={handleSaveKey}
                    disabled={isSaving}
                    className="bg-j-cyan/80 hover:bg-j-cyan text-j-void px-6 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <Settings size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    <span>Save</span>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-j-text-secondary leading-relaxed">
                Update your secret key here. This key is used for secure system authentication and
                processing.
              </p>
            </div>
          </section>

          {/* Database Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Database size={18} className="text-j-magenta opacity-80" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
                System Memory
              </h3>
            </div>
            <div className="bg-j-surface/30 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-white">Wipe Long-term Memory</h4>
                <p className="text-[10px] text-j-text-secondary">
                  Delete all stored facts and preferences about you.
                </p>
              </div>
              <button
                onClick={handleClearMemory}
                className="group flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95"
              >
                <Trash2 size={14} className="group-hover:shake" />
                <span>Clear All Memory</span>
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Database size={18} className="text-j-cyan opacity-80" />
              <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
                Approval Audit Log
              </h3>
            </div>

            <div className="bg-j-surface/30 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-j-text-secondary">
                  Showing latest approved actions ({approvalAudit.length})
                </p>
                <button
                  onClick={handleClearApprovalAudit}
                  className="text-[11px] px-3 py-1 rounded-lg border border-white/10 text-j-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                >
                  Clear Log
                </button>
              </div>

              <div className="max-h-44 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {approvalAudit.length === 0 ? (
                  <div className="text-[11px] text-j-text-muted border border-white/10 rounded-xl p-3">
                    No approved actions logged yet.
                  </div>
                ) : (
                  approvalAudit.slice(0, 30).map((entry, idx) => (
                    <div
                      key={`${(entry as ApprovalAuditEntry).requestId || idx}-${idx}`}
                      className="text-[11px] border border-white/10 rounded-xl p-3 bg-black/25"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-j-text-primary font-semibold truncate">
                          {(entry as ApprovalAuditEntry).action}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${
                            (entry as ApprovalAuditEntry).risk === "red"
                              ? "bg-rose-500/15 text-rose-300"
                              : (entry as ApprovalAuditEntry).risk === "green"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {(entry as ApprovalAuditEntry).risk || "yellow"}
                        </span>
                      </div>
                      <p className="text-j-text-secondary mt-1 break-words">{(entry as ApprovalAuditEntry).detail}</p>
                      <p className="text-j-text-muted mt-1">
                        {new Date(
                          (entry as ApprovalAuditEntry).approvedAt || (entry as ApprovalAuditEntry).requestedAt || Date.now()
                        ).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Feedback Messages */}
          {message && (
            <div
              className={`flex items-center gap-3 p-4 rounded-xl border animate-in slide-in-from-bottom duration-300 ${
                message.type === "success"
                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/[0.02] border-t border-white/10 text-center">
          <p className="text-[10px] text-j-text-secondary">
            Theta Version {appVersion || "..."} • Developed for Zeeshan
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
