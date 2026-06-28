import { Paperclip, X, Brain, Database, User, Users } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';

interface SystemControlsProps {
  handleNativeFileSelect: () => void;
  attachedFiles: any[];
  removeFile: (idx: number) => void;
  setIsMemoryModalOpen: (open: boolean) => void;
  setIsHistoryModalOpen: (open: boolean) => void;
  setIsUserModalOpen: (open: boolean) => void;
  setIsContactsModalOpen: (open: boolean) => void;
  memoryInputRef: React.RefObject<HTMLInputElement | null>;
  addFilesRef: React.RefObject<HTMLDivElement | null>;
  memoryRef: React.RefObject<HTMLDivElement | null>;
  historyRef: React.RefObject<HTMLDivElement | null>;
  userRef: React.RefObject<HTMLDivElement | null>;
}

const SystemControls: React.FC<SystemControlsProps> = ({
  handleNativeFileSelect,
  attachedFiles,
  removeFile,
  setIsMemoryModalOpen,
  setIsHistoryModalOpen,
  setIsUserModalOpen,
  setIsContactsModalOpen,
  memoryInputRef,
  addFilesRef,
  memoryRef,
  historyRef,
  userRef,
}) => {
  const { playClick } = useAudio();
  return (
    <div className='flex flex-col gap-6'>
      {/* Add Files UI */}
      <div
        ref={addFilesRef}
        onClick={() => {
          playClick();
          handleNativeFileSelect();
        }}
        className='group px-4 py-3 rounded-2xl border border-j-cyan/20 bg-j-panel/40 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer relative overflow-hidden'
      >
        <div className='p-2 rounded-xl bg-j-cyan/10 text-j-cyan group-hover:scale-110 transition-transform'>
          <Paperclip size={18} className='group-hover:rotate-12 transition-transform' />
        </div>
        <div className='flex flex-col items-start'>
          <span className='text-xs font-bold text-white uppercase tracking-wider'>Add files</span>
          <span className='text-[9px] text-j-text-muted font-mono uppercase'>
            {attachedFiles.length > 0 ? `${attachedFiles.length} Selected` : 'Multimodal Input'}
          </span>
        </div>
        <div className='absolute inset-0 bg-j-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity'></div>
      </div>

      {attachedFiles.length > 0 && (
        <div className='flex flex-wrap gap-2 max-w-[200px] mt-[-10px] ml-2 animate-in slide-in-from-top-2 duration-300'>
          {attachedFiles.map((file, idx) => (
            <div
              key={idx}
              className='flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded-lg group/file'
            >
              <span className='text-[8px] text-j-text-muted truncate max-w-[60px]'>
                {file.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playClick();
                  removeFile(idx);
                }}
                className='text-j-crimson opacity-50 hover:opacity-100'
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className='flex flex-col gap-4'>
        {[
          { label: 'memory', icon: Brain, color: 'j-crimson', ref: memoryRef },
          { label: 'history', icon: Database, color: 'j-blue', ref: historyRef },
          { label: 'contacts', icon: Users, color: 'j-cyan', ref: userRef },
          { label: 'User', icon: User, color: 'j-text-primary', ref: userRef },
        ].map((btn, idx) => (
          <div
            key={btn.label}
            ref={btn.ref}
            onClick={() => {
              playClick();
              if (btn.label === 'memory') {
                setIsMemoryModalOpen(true);
                setTimeout(() => memoryInputRef.current?.focus(), 200);
              } else if (btn.label === 'history') {
                setIsHistoryModalOpen(true);
              } else if (btn.label === 'contacts') {
                setIsContactsModalOpen(true);
              } else if (btn.label.toLowerCase() === 'user') {
                setIsUserModalOpen(true);
              }
            }}
            className={`
              group px-4 py-3 rounded-2xl border bg-j-panel/40 flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer relative overflow-hidden
              ${btn.label === 'memory' ? 'border-j-crimson/20 hover:border-j-crimson/50' : 'border-white/[0.05] hover:border-white/20'}
            `}
          >
            <div
              className={`p-2 rounded-xl bg-${btn.color}/10 text-${btn.color} group-hover:scale-110 transition-transform`}
            >
              <btn.icon size={18} />
            </div>
            <div className='flex flex-col items-start'>
              <span className='text-xs font-bold text-white uppercase tracking-wider'>
                {btn.label}
              </span>
              <span className='text-[9px] text-j-text-muted font-mono uppercase'>
                System Access
              </span>
            </div>
            <div
              className={`absolute inset-0 bg-${btn.color}/5 opacity-0 group-hover:opacity-100 transition-opacity`}
            ></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemControls;
