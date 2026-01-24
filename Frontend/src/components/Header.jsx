import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSelector, useDispatch } from 'react-redux';
import { setIsAuthenticated, setUser } from '../Features/authSlice';
import axios from 'axios';
import AuthModal from './AuthModal';

export default function Header({ title }) {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const navigate = useNavigate();

    const dispatch = useDispatch();
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const user = useSelector((state) => state.auth.user);

    // Check auth status on component mount (first visit or reload)
    useEffect(() => {
        const checkAuthStatus = async () => {
            // Skip if already authenticated (e.g., just signed in)
            if (isAuthenticated) {
                setIsCheckingAuth(false);
                return;
            }

            try {
                const response = await axios.get('/api/user/user-details', {
                    withCredentials: true
                });

                if (response.data.user) {
                    dispatch(setUser(response.data.user));
                    dispatch(setIsAuthenticated(true));
                }
            } catch (error) {
                // User not authenticated - that's fine, stay as guest
                console.log('User not authenticated');
                dispatch(setIsAuthenticated(false));
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAuthStatus();
    }, []); // Only run on mount

    // Handler for successful sign in
    const handleAuthSuccess = (userData) => {
        dispatch(setUser(userData));
        dispatch(setIsAuthenticated(true));
        setIsAuthOpen(false);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'QueryNexus',
                    text: 'Check out QueryNexus - Real-Time Market Intelligence.',
                    url: window.location.href,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard");
        }
    };

    return (
        <>
            <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 bg-background-dark min-h-[56px]">
                {/* Left side - Chat Title */}
                <div className="flex-1 min-w-0">
                    {title && (
                        <h1 className="text-sm md:text-base font-medium text-white truncate max-w-[200px] md:max-w-[400px]">
                            {title}
                        </h1>
                    )}
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center gap-2 h-9">
                    <button
                        onClick={() => navigate('/about')}
                        title="About QueryNexus"
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">info</span>
                    </button>
                    <button
                        onClick={handleShare}
                        title="Share"
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">share</span>
                    </button>
                    {isCheckingAuth ? (
                        <div className="size-9 rounded bg-white/10 animate-pulse"></div>
                    ) : !isAuthenticated ? (
                        <button
                            onClick={() => setIsAuthOpen(true)}
                            className="px-4 py-2 bg-primary hover:brightness-110 text-white font-medium text-sm rounded transition-all duration-200"
                        >
                            Sign In
                        </button>
                    ) : null}
                </div>
            </header>

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                onAuthSuccess={handleAuthSuccess}
            />
        </>
    );
}

