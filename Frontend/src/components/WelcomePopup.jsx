import React, { useState, useEffect } from 'react';

export default function WelcomePopup({ onSignIn, onClose }) {
    // Check localStorage immediately to determine if we should render
    const hasSeenWelcome = localStorage.getItem('velo_welcome_seen');

    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(!hasSeenWelcome);

    useEffect(() => {
        // If user hasn't seen welcome, show the popup with animation
        if (!hasSeenWelcome) {
            // Slight delay for smooth entrance animation
            const timer = setTimeout(() => setIsVisible(true), 150);
            return () => clearTimeout(timer);
        }
    }, [hasSeenWelcome]);

    const handleSignIn = () => {
        setIsVisible(false);
        setTimeout(() => {
            onSignIn();
            setShouldRender(false);
        }, 300);
    };

    const handleContinueAsGuest = () => {
        localStorage.setItem('velo_welcome_seen', 'true');
        setIsVisible(false);
        setTimeout(() => {
            onClose();
            setShouldRender(false);
        }, 300);
    };

    if (!shouldRender) return null;

    return (
        <div
            className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {/* Backdrop with blur - no click to close */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Popup Card */}
            <div className={`relative bg-surface-dark/95 border border-white/10 rounded-2xl w-full max-w-sm p-6 md:p-8 shadow-2xl backdrop-blur-xl transform transition-all duration-300 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
                }`}>

                {/* Icon */}
                <div className="flex justify-center mb-5">
                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                        <span className="material-symbols-outlined text-[40px] text-primary">
                            waving_hand
                        </span>
                    </div>
                </div>

                {/* Welcome Text */}
                <div className="text-center mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                        Welcome to VeloMarketSense
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Sign in to unlock personalized market intelligence and save your chat history.
                    </p>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleSignIn}
                        className="w-full bg-primary hover:brightness-110 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">login</span>
                        Sign In
                    </button>

                    <button
                        onClick={handleContinueAsGuest}
                        className="w-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium py-3 rounded-xl transition-all duration-200 border border-white/10"
                    >
                        Continue as Guest
                    </button>
                </div>

                {/* Subtle hint */}
                <p className="text-center text-slate-500 text-xs mt-4">
                    You can always sign in later from the header
                </p>
            </div>
        </div>
    );
}
