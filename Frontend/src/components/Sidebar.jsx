import React from 'react';

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
    return (
        <aside className={`
            ${isCollapsed ? 'w-0 md:w-16' : 'w-[280px]'} 
            bg-surface-dark flex flex-col h-screen shrink-0 z-50 
            transition-all duration-300 fixed md:relative
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            <div className="p-4 flex flex-col h-full overflow-hidden">
                {/* Collapsed State - Only hamburger and new chat */}
                {isCollapsed && (
                    <div className="hidden md:flex flex-col items-center gap-4">
                        <button
                            onClick={onToggleCollapse}
                            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                            title="Expand sidebar"
                        >
                            <span className="material-symbols-outlined text-[22px]">menu</span>
                        </button>
                        <button
                            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                            title="New chat"
                        >
                            <span className="material-symbols-outlined text-[22px]">add</span>
                        </button>
                    </div>
                )}

                {/* Expanded State */}
                {!isCollapsed && (
                    <>
                        {/* Top Row - Hamburger & Search */}
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={onToggleCollapse}
                                className="hidden md:flex text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                                title="Collapse sidebar"
                            >
                                <span className="material-symbols-outlined text-[22px]">menu</span>
                            </button>
                            {/* Mobile Close button */}
                            <button onClick={onClose} className="md:hidden text-slate-400 p-2">
                                <span className="material-symbols-outlined">close</span>
                            </button>

                            <button className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                                <span className="material-symbols-outlined text-[22px]">search</span>
                            </button>
                        </div>

                        {/* New Chat Button */}
                        <button className="flex items-center gap-3 w-full px-4 py-3 bg-[#2F3133] hover:bg-[#3C3F41] text-white rounded-full font-medium text-sm mb-6 transition-all duration-200">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            New chat
                        </button>

                        {/* My Stuff Section */}
                        <div className="mb-4">
                            <button className="flex items-center justify-between w-full px-3 py-2 text-slate-300 hover:bg-white/5 rounded-lg transition-colors">
                                <span className="text-sm font-medium">My stuff</span>
                                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        </div>

                        {/* Gems Section */}
                        <div className="mb-4">
                            <button className="flex items-center justify-between w-full px-3 py-2 text-slate-300 hover:bg-white/5 rounded-lg transition-colors">
                                <span className="text-sm font-medium">Gems</span>
                                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        </div>

                        {/* Chats Section */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <p className="px-3 mb-2 text-sm font-medium text-slate-400">Chats</p>
                            <div className="space-y-0.5">
                                {[
                                    { text: 'HDFC Bank Q3 Analysis', active: true },
                                    { text: 'Crude Oil Forecast' },
                                    { text: 'Tata Motors Trends' },
                                    { text: 'EV Sector Benchmark' }
                                ].map((item, idx) => (
                                    <div key={idx} className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${item.active ? 'bg-primary/30 text-white border border-primary/50' : 'hover:bg-white/5 text-slate-400'}`}>
                                        <p className="text-sm truncate">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer - Settings & Help */}
                        <div className="pt-4 mt-auto border-t border-white/5">
                            <button className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                                <span className="material-symbols-outlined text-[20px]">settings</span>
                                <span className="text-sm">Settings and help</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
}
