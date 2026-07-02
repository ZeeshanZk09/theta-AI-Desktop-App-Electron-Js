import { User, X } from 'lucide-react';

import { useAudio } from '../../hooks/useAudio';

import type { UserProfile } from '../../types/index';


interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  handleUpdateProfile: (field: string, value: string) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  handleUpdateProfile,
}) => {
  const { playClick } = useAudio();
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
      <div
        className='absolute inset-0 bg-j-void/80 backdrop-blur-md animate-in fade-in duration-300'
        onClick={onClose}
      />
      <div className='w-full max-w-lg bg-j-panel border border-j-blue/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,123,255,0.2)] overflow-hidden relative z-10 animate-in zoom-in-95 duration-300'>
        <div className='p-8 flex flex-col'>
          <div className='flex justify-between items-center mb-8'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-j-blue/10 rounded-xl'>
                <User size={24} className='text-j-blue' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-white tracking-tight'>User Identity</h2>
                <p className='text-[10px] font-mono text-j-text-muted uppercase tracking-widest'>
                  Personal Identification File
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                playClick();
                onClose();
              }}
              className='p-2 hover:bg-white/5 rounded-full text-j-text-muted hover:text-white transition-colors'
            >
              <X size={24} />
            </button>
          </div>

          <div className='space-y-6'>
            {[
              { label: 'Full Name', field: 'name', placeholder: 'e.g. Zeeshan Khan' },
              {
                label: 'Primary Location',
                field: 'location',
                placeholder: 'e.g. Islamabad, Pakistan',
              },
              {
                label: 'Profession',
                field: 'profession',
                placeholder: 'e.g. Senior Software Engineer',
              },
            ].map((item: { label: string; field: keyof typeof userProfile; placeholder: string }) => (
              <div key={item.field} className='space-y-2'>
                <label className='text-[10px] font-mono text-j-text-muted uppercase tracking-widest pl-1'>
                  {item.label}
                </label>
                <input
                  type='text'
                  value={(userProfile[item.field] as string) || ''}
                  onChange={(e) => handleUpdateProfile(item.field as string, e.target.value)}
                  placeholder={item.placeholder}
                  className='w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-j-text-primary focus:outline-none focus:border-j-blue/50 transition-all shadow-inner'
                />
              </div>
            ))}

            <div className='space-y-2'>
              <label className='text-[10px] font-mono text-j-text-muted uppercase tracking-widest pl-1'>
                Bio / Personal Context
              </label>
              <textarea
                value={userProfile.bio}
                onChange={(e) => handleUpdateProfile('bio', e.target.value)}
                placeholder='Tell Theta more about yourself...'
                rows={4}
                className='w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-j-text-primary focus:outline-none focus:border-j-blue/50 transition-all shadow-inner resize-none no-scrollbar'
              />
            </div>
          </div>

          <div className='mt-8 pt-6 border-t border-white/5 flex items-center justify-between'>
            <div className='text-[10px] font-mono text-j-text-muted uppercase'>
              Profile Status: <span className='text-j-blue font-bold'>Encrypted</span>
            </div>
            <div className='flex items-center gap-2 text-[10px] font-mono text-j-blue uppercase'>
              <div className='w-1.5 h-1.5 bg-j-blue rounded-full animate-pulse shadow-[0_0_5px_#0085FF]' />
              Identity Verified
            </div>
          </div>

          {/* Save Button */}
          <div className='mt-6 flex justify-end'>
            <button
              onClick={() => {
                playClick();
                onClose();
              }}
              className='px-10 py-3 bg-j-blue text-white font-bold rounded-2xl hover:bg-j-blue/80 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(0,133,255,0.3)] flex items-center gap-2'
            >
              Save Identity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
