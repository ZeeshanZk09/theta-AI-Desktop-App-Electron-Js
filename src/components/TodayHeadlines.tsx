import React, { useState, useEffect } from 'react';
import { Map, Sliders, RefreshCw } from 'lucide-react';
import type { DashboardData } from '../lib/dashboard';

interface TodayHeadlinesProps {
    data: {
        headlines: string[];
        weather: {
            today: string;
            tomorrow: string;
            dayAfter: string;
        };
    } | null;
    loading?: boolean;
    onMapClick?: () => void;
    onSettingsClick?: () => void;
    onRefresh?: () => void;
}

const TodayHeadlines: React.FC<TodayHeadlinesProps> = ({
    data,
    loading,
    onMapClick,
    onSettingsClick,
    onRefresh
}) => {

    // Logic removed. AI now handles news fetching and calls a tool to update this component.


    return (
        <div className="flex-1 rounded-3xl border border-white/[0.05] bg-j-surface/20 backdrop-blur-md p-5 flex flex-col relative overflow-hidden shadow-xl group">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-medium text-j-cyan tracking-tight">Today Headlines</span>
                    {loading && <RefreshCw size={14} className="text-j-cyan animate-spin" />}
                </div>
                <div className="flex gap-3 text-j-text-muted">
                    <button onClick={onRefresh} className="hover:text-j-cyan transition-colors" title="AI Refresh">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>

                    <button onClick={onMapClick} className="hover:text-j-cyan transition-colors" title="Set Location">
                        <Map size={18} />
                    </button>
                    <button onClick={onSettingsClick} className="hover:text-j-cyan transition-colors" title="Dashboard Interests">
                        <Sliders size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-2">
                {data ? (
                    <ul className="text-xs text-j-text-secondary list-disc pl-4 space-y-2 font-mono leading-relaxed opacity-100">
                        {data.headlines.map((headline, idx) => (
                            <li key={idx} className={idx === data.headlines.length - 1 ? 'opacity-70' : ''}>
                                {headline}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col gap-2 opacity-20">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-3 bg-white/20 rounded-full w-full animate-pulse"></div>
                        ))}
                    </div>
                )}
            </div>

            {/* Weather Footer */}
            <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1.5">
                {data ? (
                    <>
                        <div className="flex items-center gap-2 text-xs text-j-text-primary font-medium">
                            <span>{data.weather.today}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-j-text-secondary">
                            <span>{data.weather.tomorrow}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-j-text-secondary">
                            <span>{data.weather.dayAfter}</span>
                        </div>
                    </>
                ) : (
                    <div className="space-y-2 opacity-20">
                        <div className="h-4 bg-white/20 rounded w-1/2 animate-pulse"></div>
                        <div className="h-4 bg-white/20 rounded w-1/3 animate-pulse"></div>
                    </div>
                )}
            </div>

            <div className="absolute bottom-3 right-3">
                <div className="w-5 h-5 border border-white/10 rounded-sm"></div>
            </div>
        </div>
    );
};

export default TodayHeadlines;
