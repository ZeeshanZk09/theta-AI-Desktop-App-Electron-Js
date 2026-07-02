import { Brain, X, Plus, Trash2 } from "lucide-react";

import { useAudio } from "../../hooks/useAudio";

import type { Memory } from "../../types/index";

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: Memory[];
  newMemoryInput: string;
  setNewMemoryInput: (val: string) => void;
  handleAddMemory: () => void;
  handleDeleteMemory: (id: string) => void;
  memoryInputRef: React.RefObject<HTMLInputElement | null>;
}

const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  newMemoryInput,
  setNewMemoryInput,
  handleAddMemory,
  handleDeleteMemory,
  memoryInputRef,
}) => {
  const { playClick } = useAudio();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-j-void/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      />

      {/* Modal Content - Glassmorphism Sci-Fi Style */}
      <div className="w-full max-w-xl bg-j-panel border border-j-cyan/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,229,255,0.2)] overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
        <div className="p-8 flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-j-cyan/10 rounded-xl">
                <Brain size={24} className="text-j-cyan" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">AI Memory Bank</h2>
                <p className="text-[10px] font-mono text-j-text-muted uppercase tracking-widest">
                  Local Persistent Storage
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-j-text-muted hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Add New Memory Input */}
          <div className="mb-6">
            <div className="relative">
              <input
                ref={memoryInputRef}
                type="text"
                value={newMemoryInput}
                onChange={(e) => setNewMemoryInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMemory()}
                placeholder="Type something for Theta to remember..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-j-text-primary focus:outline-none focus:border-j-cyan/50 transition-all placeholder:text-j-text-muted shadow-inner"
              />
              <button
                onClick={handleAddMemory}
                className="absolute right-3 top-3 p-2 bg-j-cyan/10 text-j-cyan hover:bg-j-cyan hover:text-black rounded-xl transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Memories List */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
            {memories.length > 0 ? (
              memories.map((memo) => (
                <div
                  key={memo.id}
                  className="group relative p-5 rounded-2xl bg-white/5 border border-white/[0.05] hover:border-j-cyan/20 transition-all animate-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-sm text-j-text-secondary leading-relaxed flex-1">
                      {memo.content}
                    </p>
                    <button
                      onClick={() => {
                        playClick();
                        handleDeleteMemory(memo.id);
                      }}
                      className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-j-text-muted hover:text-j-crimson bg-white/5 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-[9px] font-mono uppercase tracking-tighter">
                    <span className="text-j-text-muted bg-white/5 px-2 py-0.5 rounded">
                      {new Date(memo.timestamp).toLocaleString()}
                    </span>
                    <span className="text-j-cyan/60">#{memo.category}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                <Brain size={48} className="mb-4" />
                <p className="text-sm font-mono uppercase tracking-[0.2em]">Vault is Empty</p>
              </div>
            )}
          </div>

          {/* Footer Status */}
          <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
            <div className="text-[10px] font-mono text-j-text-muted uppercase">
              Total Memories: <span className="text-j-cyan font-bold">{memories.length}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-j-cyan uppercase animate-pulse">
              <div className="w-1.5 h-1.5 bg-j-cyan rounded-full shadow-[0_0_5px_#00E5FF]" />
              Sync Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryModal;
