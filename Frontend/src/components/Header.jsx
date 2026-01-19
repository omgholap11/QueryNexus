import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setIsAuthenticated, setUser } from '../Fetatures/authSlice';
import AuthModal from './AuthModal';
import axios from 'axios';

export default function Header({ title }) {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
                    {isCheckingAuth ? (
                        // Loading state
                        <div className="size-9 rounded-full bg-white/10 animate-pulse"></div>
                    ) : isAuthenticated ? (
                        // Authenticated - show profile icon
                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="size-9 rounded-full border-2 border-primary/20 p-0.5 group-hover:border-primary transition-all">
                                <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Not authenticated - show Sign In button
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
                onAuthSuccess={handleAuthSuccess}
            />
        </>
    );
}

