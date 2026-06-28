import React from 'react';
import { useAudio } from '../../hooks/useAudio';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    glow?: boolean;
}

const NeonButton: React.FC<NeonButtonProps> = ({
    children,
    variant = 'primary',
    glow = false,
    className = '',
    onClick,
    ...props
}) => {
    const { playClick } = useAudio();

    const handleInternalClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        playClick();
        if (onClick) onClick(e);
    };

    const baseStyles = "relative px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-j-cyan/10 text-j-cyan border border-j-cyan/50 hover:bg-j-cyan/20 hover:border-j-cyan hover:shadow-glow-cyan",
        secondary: "bg-j-steel/30 text-j-text-secondary border border-j-steel hover:text-j-text-primary hover:border-j-text-secondary hover:bg-j-steel/50",
        danger: "bg-j-crimson/10 text-j-crimson border border-j-crimson/50 hover:bg-j-crimson/20 hover:border-j-crimson hover:shadow-[0_0_15px_rgba(192,57,43,0.4)]",
        ghost: "text-j-text-secondary hover:text-j-cyan hover:bg-white/5 border border-transparent"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            onClick={handleInternalClick}
            {...props}
        >
            {/* Scanline Effect on Hover */}
            {variant !== 'ghost' && (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[200%] group-hover:animate-scan opacity-0 group-hover:opacity-100 pointer-events-none"></div>
            )}
            <span className="relative z-10 flex items-center gap-2">{children}</span>
        </button>
    );
};


export default NeonButton;
