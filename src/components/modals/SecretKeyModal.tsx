import React, { useState } from 'react';
import { Key, ShieldCheck, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';

interface SecretKeyModalProps {
  isOpen: boolean;
  onClose: (key?: string) => void;
}

const SecretKeyModal: React.FC<SecretKeyModalProps> = ({ isOpen, onClose }) => {
  const [key, setKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { playClick } = useAudio();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    if (!key.trim()) {
      setError('Please enter your Secret Key');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Basic validation
      if (!key.startsWith('AIza')) {
        throw new Error('Invalid Key format. It should start with "AIza"');
      }

      const success = await (window as any).electronAPI.saveGeminiToken(key.trim());
      if (success) {
        onClose(key.trim());
      } else {
        throw new Error('Failed to save Secret Key');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500'>
      <div className='w-full max-w-sm bg-[#05070a]/80 border border-white/5 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500'>
        <div className='p-10 space-y-8'>
          <div className='flex flex-col items-center text-center space-y-4'>
            <div className='p-4 bg-j-cyan/5 rounded-2xl border border-j-cyan/10'>
              <ShieldCheck size={32} className='text-j-cyan' />
            </div>
            <div className='space-y-1'>
              <h2 className='text-2xl font-bold text-white tracking-tight'>Access Control</h2>
              <p className='text-white/40 text-[11px] uppercase tracking-[0.2em]'>
                Authentication Required
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-3'>
              <div className='relative group'>
                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                  <Key
                    size={16}
                    className='text-white/20 group-focus-within:text-j-cyan transition-colors'
                  />
                </div>
                <input
                  type='password'
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder='Enter your Secret Key'
                  className='w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-j-cyan/30 focus:ring-1 focus:ring-j-cyan/20 transition-all font-mono text-sm'
                  disabled={isSubmitting}
                />
              </div>
              <p className='text-[10px] text-white/30 text-center'>
                Use your API Key as the secret identifier.
              </p>
            </div>

            {error && (
              <div className='flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/10 rounded-xl animate-in shake duration-300'>
                <AlertCircle size={14} className='text-red-400 shrink-0' />
                <p className='text-[11px] text-red-300'>{error}</p>
              </div>
            )}

            <button
              type='submit'
              disabled={isSubmitting}
              className='w-full bg-white text-black hover:bg-white/90 active:scale-[0.98] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-white/5'
            >
              {isSubmitting ? (
                <Loader2 size={18} className='animate-spin' />
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className='px-10 py-5 bg-white/[0.01] border-t border-white/5'>
          <p className='text-[9px] text-white/20 text-center leading-relaxed font-medium uppercase tracking-widest'>
            Local Encryption Active • Secure Storage
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecretKeyModal;
