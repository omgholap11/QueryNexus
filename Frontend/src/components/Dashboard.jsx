import React from 'react';
import Header from './Header';

export default function Dashboard() {
    return (
        <>
            <Header />
            <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto w-full pb-32 animate-fade-in-up">
                <div className="text-center mb-16">
                    <div className="flex justify-center mb-8">
                        <span className="material-symbols-outlined text-[72px] text-primary/20 animate-pulse-slow">tsunami</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-500 tracking-tight mb-4">
                        What are we researching?
                    </h2>
                    <p className="text-slate-400 text-lg font-light max-w-lg mx-auto leading-relaxed">
                        Access deep market liquidity pools and sentiment analysis via <span className="text-primary font-medium border-b border-primary/20 pb-0.5">RAG</span>.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="w-full max-w-2xl group relative z-10">
                    <div className="relative flex items-center bg-surface-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden px-4 h-[52px] ring-1 ring-white/5 focus-within:border-primary/50 transition-all">
                        <div className="flex items-center justify-center pr-4 border-r border-white/10 mr-4 h-6 text-slate-500 group-focus-within:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">search_insights</span>
                        </div>
                        <input
                            autoFocus
                            className="w-full bg-transparent border-none focus:ring-0 text-base text-white placeholder:text-slate-600 font-normal outline-none"
                            placeholder="Ask VeloMarketSense..."
                            type="text"
                        />
                        <div className="flex items-center gap-3 pl-2">
                            <button className="bg-primary/90 hover:bg-primary text-background-dark p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-[0_0_10px_rgba(0,229,255,0.4)] active:scale-95">
                                <span className="material-symbols-outlined font-bold text-[18px]">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                    <p className="mt-4 text-center text-xs text-slate-500 font-medium tracking-wide">
                        Press <kbd className="font-sans px-1.5 py-0.5 bg-white/10 rounded text-slate-300 mx-1">/</kbd> to search
                    </p>
                </div>
            </div>

            {/* Background Glows */}
            <div className="absolute -bottom-24 -right-24 size-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute -top-24 -left-24 size-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        </>
    );
}
