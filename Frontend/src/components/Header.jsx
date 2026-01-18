import React, { useState } from 'react';
import AuthModal from './AuthModal';

export default function Header({ title }) {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <>
            <header className="flex items-center justify-between px-4 md:px-8 py-4 sticky top-0 z-10 pl-14 md:pl-8 bg-background-dark/80 backdrop-blur-md">
                <div className="flex-1">
                    {title && (
                        <div className="animate-fade-in-up">
                            <p className="text-xs md:text-sm font-medium text-slate-400">Researching</p>
                            <p className="text-sm md:text-base font-bold text-white truncate max-w-[200px] md:max-w-md">{title}</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    {isLoggedIn ? (
                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="size-9 rounded-full border-2 border-primary/20 p-0.5 group-hover:border-primary transition-all">
                                <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAuthOpen(true)}
                            className="px-4 py-2 bg-primary hover:brightness-110 text-white font-medium text-sm rounded-full transition-all duration-200"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </header>

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
            />
        </>
    );
}
