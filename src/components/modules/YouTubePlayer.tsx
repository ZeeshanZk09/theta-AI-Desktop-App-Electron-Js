import { X, Minus, Maximize2, Music } from 'lucide-react';
import React, { useState } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  onClose: () => void;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <div className='fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-500'>
        <div className='bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex items-center gap-4 shadow-2xl group hover:bg-white/15 transition-all'>
          <div className='w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform'>
            <Music className='text-white w-6 h-6 animate-pulse' />
          </div>
          <div className='flex flex-col'>
            <span className='text-white font-medium text-sm'>Now Playing...</span>
            <span className='text-white/60 text-xs'>YouTube Video Active</span>
          </div>
          <div className='flex items-center gap-2 ml-4'>
            <button
              onClick={() => setIsMinimized(false)}
              className='p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white'
            >
              <Maximize2 size={16} />
            </button>
            <button
              onClick={onClose}
              className='p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-500'
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 z-[9998] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300'>
      <div className='relative w-full max-w-4xl aspect-video bg-[#0A0A0A] rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-500'>
        {/* Header/Title Bar */}
        <div className='absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between px-6'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20'>
              <Music className='text-white w-4 h-4' />
            </div>
            <span className='text-white font-semibold tracking-wide'>Theta Media Player</span>
          </div>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => setIsMinimized(true)}
              className='p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white'
              title='Minimize'
            >
              <Minus size={20} />
            </button>
            <button
              onClick={onClose}
              className='p-2 hover:bg-red-500 rounded-full transition-colors text-white/50 hover:text-white'
              title='Close'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* YouTube Embed */}
        <iframe
          width='100%'
          height='100%'
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
          title='YouTube video player'
          frameBorder='0'
          sandbox='allow-same-origin allow-scripts allow-presentation allow-forms'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
          allowFullScreen
          className='w-full h-full'
         />

        {/* Ambient Glow */}
        <div className='absolute -bottom-20 -left-20 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full pointer-events-none' />
        <div className='absolute -top-20 -right-20 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none' />
      </div>
    </div>
  );
};

export default YouTubePlayer;
