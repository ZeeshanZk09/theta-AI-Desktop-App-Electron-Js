import React from 'react';
import { Plus, Folder, X, FolderOpen } from 'lucide-react';

interface FolderExplorerProps {
  importedFolders: { name: string; path: string }[];
  handleImportFolder: () => void;
  handleRemoveFolder: (idx: number) => void;
  handleOpenFolder: (path: string) => void;
  handleOpenVaultFolder: (folderName: string) => void;
  editingFolderIdx: number | null;
  tempFolderName: string;
  setTempFolderName: (name: string) => void;
  handleFinishRename: () => void;
  handleStartRename: (idx: number, name: string) => void;
}

const FolderExplorer: React.FC<FolderExplorerProps> = ({
  importedFolders,
  handleImportFolder,
  handleRemoveFolder,
  handleOpenFolder,
  handleOpenVaultFolder,
  editingFolderIdx,
  tempFolderName,
  setTempFolderName,
  handleFinishRename,
  handleStartRename,
}) => {
  return (
    <div className='w-24 lg:w-28 xl:w-32 flex flex-col items-center gap-4 lg:gap-6 py-4 lg:py-8 rounded-[2rem] lg:rounded-[3rem] border border-white/[0.05] bg-j-surface/50 backdrop-blur-xl shadow-2xl h-fit'>
      {/* Import Button */}
      <button
        onClick={handleImportFolder}
        className='flex flex-col items-center gap-1.5 lg:gap-2 group transition-transform hover:scale-110 mb-2'
      >
        <div className='w-12 h-9 lg:w-16 lg:h-12 rounded-lg lg:rounded-xl bg-j-cyan/10 border border-j-cyan/30 flex items-center justify-center text-j-cyan cursor-pointer hover:bg-j-cyan hover:text-black transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)]'>
          <Plus size={24} />
        </div>
        <span className='text-[9px] text-j-cyan font-bold uppercase tracking-tighter'>Import</span>
      </button>

      <div className='w-full px-2 flex flex-col gap-2'>
        {['DOCS', 'BUSINESS', 'EXCEL'].map((vaultFolder) => (
          <button
            key={vaultFolder}
            onClick={() => handleOpenVaultFolder(vaultFolder)}
            className='flex items-center gap-2 text-[9px] text-j-text-secondary hover:text-j-cyan transition-colors border border-white/10 hover:border-j-cyan/30 rounded-lg px-2 py-1'
            title={`Open ${vaultFolder} from Theta Vault`}
          >
            <FolderOpen size={12} />
            {vaultFolder}
          </button>
        ))}
      </div>

      <div className='w-8 h-[1px] bg-white/10 mb-2'></div>

      {importedFolders.map((folder, idx) => (
        <div
          key={idx}
          className='flex flex-col items-center gap-1.5 lg:gap-2 group transition-transform hover:scale-110 relative'
        >
          {/* Close/Remove Button */}
          <button
            onClick={() => handleRemoveFolder(idx)}
            className='absolute -top-1 -right-1 w-4 h-4 bg-j-crimson text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:scale-110'
          >
            <X size={10} />
          </button>

          {/* Icon Container: Opens Folder */}
          <button
            onClick={() => handleOpenFolder(folder.path)}
            className='w-12 h-9 lg:w-16 lg:h-12 rounded-lg lg:rounded-xl bg-black/40 border border-white/[0.1] flex items-center justify-center text-j-text-secondary cursor-pointer group-hover:text-j-cyan group-hover:bg-j-cyan/5 group-hover:border-j-cyan/30 transition-all shadow-inner'
          >
            <Folder size={24} />
          </button>

          {/* Text Container: Renames Folder */}
          {editingFolderIdx === idx ? (
            <input
              autoFocus
              value={tempFolderName}
              onChange={(e) => setTempFolderName(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={(e) => e.key === 'Enter' && handleFinishRename()}
              className='w-16 lg:w-20 bg-black/60 border border-j-cyan/50 text-[10px] lg:text-xs text-white text-center rounded focus:outline-none uppercase'
            />
          ) : (
            <button
              onClick={() => handleStartRename(idx, folder.name)}
              className='text-[10px] lg:text-xs text-j-text-muted group-hover:text-j-text-primary text-center font-bold leading-tight transition-colors uppercase tracking-tighter cursor-pointer px-2 truncate w-full'
              title={folder.name}
            >
              {folder.name}
            </button>
          )}
        </div>
      ))}

      {importedFolders.length === 0 && (
        <div className='flex flex-col items-center opacity-20 py-4'>
          <Folder size={20} className='mb-2' />
          <span className='text-[8px] uppercase tracking-widest'>Empty</span>
        </div>
      )}
    </div>
  );
};

export default FolderExplorer;
