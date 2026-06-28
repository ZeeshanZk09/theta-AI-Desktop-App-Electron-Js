import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, Minimize2, Zap, Layers, ZoomIn, ZoomOut, RotateCcw, Move, X } from 'lucide-react';

interface VisualHubProps {
    isExpanded: boolean;
    onToggleExpand: () => void;
    generatedImage: string | null;
    generatedDiagram: string | null;
    isVisualizing: boolean;
    isDiagramRendering: boolean;
    onReset: () => void;
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    pan: { x: number; y: number };
    setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
    isDragging: boolean;
    setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
    dragStart: { x: number; y: number };
    setDragStart: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

const VisualHub: React.FC<VisualHubProps> = ({
    isExpanded,
    onToggleExpand,
    generatedImage,
    generatedDiagram,
    isVisualizing,
    isDiagramRendering,
    onReset,
    zoom,
    setZoom,
    pan,
    setPan,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart
}) => {
    const diagramRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (generatedDiagram) {
            const renderDiagram = async () => {
                try {
                    if (diagramRef.current) diagramRef.current.innerHTML = '';
                    // @ts-ignore
                    const { svg } = await window.mermaid.render('mermaid-svg-' + Date.now(), generatedDiagram);
                    if (diagramRef.current) {
                        diagramRef.current.innerHTML = svg;
                    }
                } catch (err: any) {
                    console.error("Mermaid rendering failed:", err);
                    if (diagramRef.current) {
                        diagramRef.current.innerHTML = `<div class="p-6 border border-j-crimson/30 bg-j-crimson/5 rounded-xl text-j-crimson text-xs font-mono text-left overflow-auto max-h-full">
              <p class="font-bold mb-2 uppercase tracking-widest opacity-70">Rendering Error</p>
              <pre class="whitespace-pre-wrap">${err.message || 'Syntax Error'}</pre>
              <p class="mt-4 opacity-50 italic">AI will automatically attempt to repair the syntax.</p>
            </div>`;
                    }
                }
            };
            setTimeout(renderDiagram, 500);
        }
    }, [generatedDiagram]);

    const handleWheel = (e: React.WheelEvent) => {
        if (!generatedImage && !generatedDiagram) return;
        e.preventDefault();
        const scaleBy = 1.1;
        const newZoom = e.deltaY < 0 ? zoom * scaleBy : zoom / scaleBy;
        setZoom(Math.min(Math.max(0.1, newZoom), 5));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((generatedImage || generatedDiagram) && !isVisualizing && !isDiagramRendering) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const resetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    return (
        <div className={`
      ${isExpanded
                ? 'fixed inset-4 z-[100] flex items-center justify-center'
                : 'hidden md:flex flex-[0.8] xl:flex-[1.0] items-start justify-center pb-6 lg:pb-12 px-4 lg:px-8'
            }
    `}>
            <div className={`
        ${isExpanded
                    ? 'w-full h-full rounded-[2.5rem] lg:rounded-[3.5rem]'
                    : 'w-full max-w-[650px] xl:max-w-[850px] h-full rounded-[2.5rem] lg:rounded-[3.5rem]'
                }
        border border-white/[0.08] bg-j-panel/95 backdrop-blur-3xl p-6 relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center text-center group transition-all duration-500 hover:border-j-cyan/20
      `}>
                {/* Sci-Fi Decorative Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-j-cyan/30 rounded-tl-3xl pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-j-cyan/30 rounded-tr-3xl pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-j-cyan/30 rounded-bl-3xl pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-j-cyan/30 rounded-br-3xl pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity"></div>

                {/* Background Grid Accent */}
                <div className="absolute inset-0 sci-fi-grid opacity-[0.2] pointer-events-none"></div>

                {/* Hub Status Indicator */}
                <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-j-cyan/5 border border-j-cyan/10 rounded-lg pointer-events-none group-hover:bg-j-cyan/10 transition-all z-20">
                    <div className="w-1.5 h-1.5 bg-j-cyan rounded-full animate-ping"></div>
                    <span className="text-[9px] font-mono text-j-cyan font-bold tracking-[0.2em] uppercase">Visual Hub</span>
                    <div className="w-[1px] h-3 bg-j-cyan/20 mx-1"></div>
                    <span className="text-[8px] font-mono text-j-text-muted uppercase">Ready</span>
                </div>

                <div className="absolute top-6 right-6 flex gap-3 z-30">
                    <button
                        onClick={onToggleExpand}
                        className={`
              p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center
              ${isExpanded
                                ? 'bg-j-cyan/20 border-j-cyan/50 text-j-cyan shadow-[0_0_20px_rgba(0,229,255,0.2)]'
                                : 'bg-white/5 border-white/10 text-j-text-muted hover:text-j-cyan hover:border-j-cyan/30 hover:bg-j-cyan/5'
                            }
            `}
                        title={isExpanded ? "Minimize" : "Expand"}
                    >
                        {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>

                    {(generatedImage || generatedDiagram) && !isVisualizing && (
                        <button
                            onClick={onReset}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-mono text-j-text-muted hover:text-j-crimson hover:border-j-crimson/30 transition-all h-fit self-center font-bold uppercase tracking-widest"
                        >
                            Reset Hub
                        </button>
                    )}
                </div>

                <div
                    className={`
            flex-1 w-full h-full relative overflow-hidden flex items-center justify-center
            ${(generatedImage || generatedDiagram) && !isVisualizing && !isDiagramRendering ? 'cursor-grab active:cursor-grabbing' : ''}
          `}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Active Scanline Effect */}
                    {(generatedImage || generatedDiagram || isVisualizing || isDiagramRendering) && (
                        <div className="scanline"></div>
                    )}

                    {isVisualizing || isDiagramRendering ? (
                        <div className="flex flex-col items-center justify-center gap-6 animate-pulse">
                            <div className="relative">
                                <div className="w-24 h-24 border-b-2 border-j-cyan rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Zap size={32} className="text-j-cyan animate-pulse" />
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <h3 className="text-sm font-mono text-j-cyan tracking-[0.4em] uppercase font-bold text-glow">
                                    {isDiagramRendering ? 'Designing' : 'Materializing'}
                                </h3>
                                <div className="flex gap-2">
                                    {[0, 1, 2].map(i => (
                                        <div key={i} className="w-1 h-3 bg-j-cyan/50 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-[9px] font-mono text-j-text-muted uppercase tracking-[0.2em] max-w-[300px] opacity-60">
                                {isDiagramRendering ? 'Constructing Visual Logic...' : 'Interpreting Neural Synapses into Visual Data...'}
                            </p>
                        </div>
                    ) : generatedImage ? (
                        <div
                            className="transition-transform duration-75 ease-out will-change-transform"
                            style={{
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                transformOrigin: 'center center'
                            }}
                        >
                            <img
                                src={generatedImage}
                                alt="Generated AI"
                                className="max-w-[90vw] max-h-[80vh] object-contain rounded-[2rem] shadow-2xl pointer-events-none"
                            />
                        </div>
                    ) : generatedDiagram ? (
                        <div
                            className="w-full h-full flex items-center justify-center p-8 transition-transform duration-75 ease-out will-change-transform"
                            style={{
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                transformOrigin: 'center center'
                            }}
                        >
                            <div ref={diagramRef} className={`mermaid-viewer w-full pointer-events-none`} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full border border-dashed border-j-text-muted/30 flex items-center justify-center mb-6 group-hover:border-j-cyan/50 group-hover:rotate-45 transition-all duration-700">
                                <Layers className="text-j-text-muted group-hover:text-j-cyan" size={32} />
                            </div>
                            <h3 className="text-xl font-mono text-j-text-primary tracking-wider mb-4 leading-relaxed font-bold uppercase">
                                Visual Intelligence Hub
                            </h3>

                            <div className="space-y-2 text-j-text-secondary font-mono text-xs max-w-sm tracking-wide">
                                <p className="opacity-80">Images, Flowcharts, and Mindmaps will materialize here.</p>
                                <p className="text-j-cyan/60 font-medium">SYSTEM READY - AWAITING DATA INPUT</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Zoom/Pan Controls */}
                {(generatedImage || generatedDiagram) && !isVisualizing && !isDiagramRendering && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl z-30 animate-in slide-in-from-bottom-8 duration-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        <button
                            onClick={() => setZoom(prev => Math.min(prev * 1.2, 5))}
                            className="p-2.5 bg-white/5 hover:bg-j-cyan/10 rounded-xl text-j-text-muted hover:text-j-cyan transition-all border border-transparent hover:border-j-cyan/30"
                            title="Zoom In"
                        >
                            <ZoomIn size={18} />
                        </button>
                        <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-mono text-j-cyan font-bold tracking-tighter">
                                {Math.round(zoom * 100)}%
                            </span>
                            <span className="text-[8px] font-mono text-j-text-muted uppercase tracking-widest opacity-50">Scale</span>
                        </div>
                        <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
                        <button
                            onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.1))}
                            className="p-2.5 bg-white/5 hover:bg-j-cyan/10 rounded-xl text-j-text-muted hover:text-j-cyan transition-all border border-transparent hover:border-j-cyan/30"
                            title="Zoom Out"
                        >
                            <ZoomOut size={18} />
                        </button>
                        <button
                            onClick={resetView}
                            className="p-2.5 bg-white/5 hover:bg-j-amber/10 rounded-xl text-j-text-muted hover:text-j-amber transition-all border border-transparent hover:border-j-amber/30 ml-2"
                            title="Reset View"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <div className="hidden lg:flex items-center gap-2 ml-4 px-3 py-1.5 bg-j-cyan/5 rounded-lg border border-j-cyan/20">
                            <Move size={14} className="text-j-cyan animate-pulse" />
                            <span className="text-[9px] font-mono text-j-cyan/80 uppercase tracking-widest">Hold Left-Click to Pan</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VisualHub;
