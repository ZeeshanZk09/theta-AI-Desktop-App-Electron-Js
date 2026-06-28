import React, { useState } from 'react';
import { Users, X, Plus, Trash2, Phone, Search } from 'lucide-react';
import { useAudio } from '../../hooks/useAudio';

interface Contact {
  id: string;
  name: string;
  phone: string;
  timestamp: number;
}

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  handleAddContact: (name: string, phone: string) => void;
  handleDeleteContact: (id: string) => void;
}

const ContactsModal: React.FC<ContactsModalProps> = ({
  isOpen,
  onClose,
  contacts,
  handleAddContact,
  handleDeleteContact,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { playClick } = useAudio();

  if (!isOpen) return null;

  const filteredContacts = contacts.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
  );

  const onAdd = () => {
    playClick();
    if (name.trim() && phone.trim()) {
      handleAddContact(name, phone);
      setName('');
      setPhone('');
    }
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
      {/* Backdrop */}
      <button
        className='absolute inset-0 bg-j-void/80 backdrop-blur-md animate-in fade-in duration-300'
        onClick={onClose}
      />

      {/* Modal Content - Glassmorphism Sci-Fi Style */}
      <div className='w-full max-w-xl bg-j-panel border border-j-cyan/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,229,255,0.2)] overflow-hidden relative z-10 animate-in zoom-in-95 duration-300'>
        <div className='p-8 flex flex-col h-[650px]'>
          {/* Header */}
          <div className='flex justify-between items-center mb-6'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-j-cyan/10 rounded-xl'>
                <Users size={24} className='text-j-cyan' />
              </div>
              <div>
                <h2 className='text-xl font-bold text-white tracking-tight'>Theta Contacts</h2>
                <p className='text-[10px] font-mono text-j-text-muted uppercase tracking-widest'>
                  WhatsApp Directory
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='p-2 hover:bg-white/5 rounded-full text-j-text-muted hover:text-white transition-colors'
            >
              <X size={24} />
            </button>
          </div>

          {/* Quick Add Form */}
          <div className='mb-6 grid grid-cols-1 md:grid-cols-2 gap-3'>
            <div className='relative'>
              <input
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Contact Name'
                className='w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-j-text-primary focus:outline-none focus:border-j-cyan/50 transition-all placeholder:text-j-text-muted'
              />
            </div>
            <div className='relative flex gap-2'>
              <input
                type='text'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                placeholder='+923001234567'
                className='w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-j-text-primary focus:outline-none focus:border-j-cyan/50 transition-all placeholder:text-j-text-muted'
              />
              <button
                onClick={onAdd}
                className='p-3 bg-j-cyan/10 text-j-cyan hover:bg-j-cyan hover:text-black rounded-xl transition-all'
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className='mb-4 relative'>
            <Search size={16} className='absolute left-4 top-3.5 text-j-text-muted' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search contacts...'
              className='w-full bg-white/5 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-xs text-j-text-secondary focus:outline-none focus:border-white/10 transition-all'
            />
          </div>

          {/* Contacts List */}
          <div className='flex-1 overflow-y-auto no-scrollbar space-y-2'>
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className='group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/[0.05] hover:border-j-cyan/20 transition-all'
                >
                  <div className='flex items-center gap-4'>
                    <div className='w-10 h-10 rounded-full bg-gradient-to-br from-j-cyan/20 to-transparent flex items-center justify-center border border-j-cyan/10'>
                      <span className='text-j-cyan font-bold text-sm uppercase'>
                        {contact.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-white'>{contact.name}</h4>
                      <div className='flex items-center gap-1.5 mt-0.5'>
                        <Phone size={10} className='text-j-cyan/60' />
                        <span className='text-[11px] font-mono text-j-text-muted'>
                          {contact.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      playClick();
                      handleDeleteContact(contact.id);
                    }}
                    className='p-2 opacity-0 group-hover:opacity-100 transition-opacity text-j-text-muted hover:text-j-crimson bg-white/5 rounded-lg'
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className='h-full flex flex-col items-center justify-center opacity-20 text-center'>
                <Users size={48} className='mb-4 text-j-cyan' />
                <p className='text-sm font-mono uppercase tracking-[0.2em]'>
                  {searchQuery ? 'No Matches Found' : 'No Contacts Saved'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='mt-6 pt-6 border-t border-white/5 flex items-center justify-between'>
            <div className='text-[10px] font-mono text-j-text-muted uppercase'>
              Total Records: <span className='text-j-cyan font-bold'>{contacts.length}</span>
            </div>
            <div className='text-[9px] font-mono text-j-text-muted italic'>
              Stored locally on your device
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactsModal;
