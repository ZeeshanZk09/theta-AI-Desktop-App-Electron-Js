import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    footer?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, header, footer }) => {
    return (
        <div className="h-screen w-screen bg-j-void text-j-text-primary overflow-hidden relative selection:bg-j-cyan/20">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Subtle Hex Grid */}
                <div className="absolute inset-0 opacity-[0.03] bg-hex-grid bg-[size:30px_30px]"></div>

                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0B0F14_120%)]"></div>

                {/* Top Glow Line */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-j-cyan/20 to-transparent"></div>
            </div>

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Header Area */}
                {header && (
                    <header className="flex-none p-4 md:p-6 border-b border-j-steel/30 bg-j-void/80 backdrop-blur-sm z-50">
                        {header}
                    </header>
                )}

                {/* Dynamic Workspace */}
                <main className="flex-1 min-h-0 relative p-4 md:p-6 overflow-hidden">
                    {children}
                </main>

                {/* Footer / Control Dock */}
                {footer && (
                    <footer className="flex-none p-4 md:p-6 pt-2 z-50">
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
};

export default MainLayout;
