import React from 'react';

export default function Sidebar({ isOpen, onClose }) {
    return (
        <aside className={`
      w-[260px] bg-surface-dark border-r border-border-dark flex flex-col h-screen shrink-0 z-30
      fixed md:relative transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
            <div className="p-6 flex flex-col h-full">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-background-dark font-bold">bolt</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-white text-base font-bold tracking-tight">VeloMarketSense</h1>
                        <p className="text-primary/70 text-[10px] uppercase tracking-widest font-bold">Ocean Data AI</p>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={onClose} className="md:hidden ml-auto text-slate-400">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* New Research Button */}
                <button className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-background-dark rounded-lg font-bold text-sm mb-8 hover:brightness-110 transition-all duration-200 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    New Research
                </button>

                {/* Navigation */}
                <div className="space-y-1 mb-8">
                    <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-primary transition-colors cursor-pointer group">
                        <span className="material-symbols-outlined text-[20px]">dashboard</span>
                        <p className="text-sm font-medium">Terminal Overview</p>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-[20px]">monitoring</span>
                        <p className="text-sm font-medium">Market Pulse</p>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <p className="px-3 mb-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Recent Activity</p>
                    <div className="space-y-0.5">
                        {[
                            { icon: 'description', text: 'HDFC Bank Q3 Analysis', active: true },
                            { icon: 'water_drop', text: 'Crude Oil Forecast' },
                            { icon: 'query_stats', text: 'Tata Motors Trends' },
                            { icon: 'analytics', text: 'EV Sector Benchmark' }
                        ].map((item, idx) => (
                            <div key={idx} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${item.active ? 'bg-white/5 border border-primary/30 text-slate-200' : 'hover:bg-white/5 text-slate-400'}`}>
                                <span className={`material-symbols-outlined text-[18px] ${item.active ? 'text-primary' : 'group-hover:text-primary'}`}>{item.icon}</span>
                                <p className="text-xs font-medium truncate">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Settings */}
                <div className="pt-4 mt-4 border-t border-border-dark">
                    <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-primary cursor-pointer transition-colors">
                        <span className="material-symbols-outlined text-[20px]">settings</span>
                        <p className="text-sm font-medium">Settings</p>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-primary cursor-pointer transition-colors">
                        <span className="material-symbols-outlined text-[20px]">help</span>
                        <p className="text-sm font-medium">Support</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
