import React from 'react';

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'scanner' | 'alert';
}

const HolographicCard: React.FC<HolographicCardProps> = ({
  children,
  className = '',
  title,
  icon,
  variant = 'default',
}) => {
  const borders = {
    default: 'border-j-steel/40 hover:border-j-cyan/30',
    scanner: 'border-j-hologram/30 hover:border-j-hologram/50',
    alert: 'border-j-amber/40 hover:border-j-amber/60',
  };

  const glows = {
    default: 'hover:shadow-glow-cyan/10',
    scanner: 'shadow-glow-teal/10',
    alert: 'shadow-[0_0_15px_rgba(255,159,28,0.15)]',
  };

  return (
    <div
      className={`
      relative glass-card rounded-2xl border transition-all duration-300 group
      ${borders[variant]} 
      ${glows[variant]}
      ${className}
    `}
    >
      {/* Corner Accents (Tech Feel) */}
      <div
        className={`absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l rounded-tl-2xl transition-colors ${variant === 'alert' ? 'border-j-amber' : 'border-j-cyan/50'}`}
      ></div>
      <div
        className={`absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r rounded-br-2xl transition-colors ${variant === 'alert' ? 'border-j-amber' : 'border-j-cyan/50'}`}
      ></div>

      {title && (
        <div className='flex items-center gap-2 p-4 border-b border-white/5 bg-white/[0.02]'>
          {icon && (
            <span className={`${variant === 'alert' ? 'text-j-amber' : 'text-j-cyan'}`}>
              {icon}
            </span>
          )}
          <h3 className='text-sm font-medium tracking-wide uppercase text-j-text-secondary group-hover:text-j-text-primary transition-colors'>
            {title}
          </h3>
        </div>
      )}

      <div className='p-4'>{children}</div>
    </div>
  );
};

export default HolographicCard;
