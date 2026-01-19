import React, { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
    const [mode, setMode] = useState('signin');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const validateEmail = (emailValue) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(emailValue);
    };

    const validateForm = () => {
        const newErrors = {};

        if (mode === 'signup') {
            if (!name.trim()) {
                newErrors.name = 'Name is required';
            } else if (name.trim().length < 2) {
                newErrors.name = 'Name must be at least 2 characters';
            }
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return; // Just show inline errors, no toast
        }

        setIsLoading(true);

        try {
            // Use relative URL - Vite proxy forwards to backend
            const baseUrl = '/api/user';

            if (mode === 'signin') {
                // Sign In API call
                const response = await axios.post(`${baseUrl}/signin`, {
                    email: email,
                    password: password
                }, {
                    withCredentials: true  // Required for cookies to be set
                });

                toast.success('Welcome back! Signed in successfully');

                // Fetch user details after successful sign in
                const userResponse = await axios.get(`${baseUrl}/user-details`, {
                    withCredentials: true
                });

                // Call onAuthSuccess with user data to update Redux state
                if (onAuthSuccess && userResponse.data.user) {
                    onAuthSuccess(userResponse.data.user);
                }

            } else {
                // Sign Up API call
                const response = await axios.post(`${baseUrl}/signup`, {
                    name: name,
                    email: email,
                    password: password
                }, {
                    withCredentials: true  // Required for cookies to be set
                });

                toast.success('Account created successfully!');

                // Fetch user details after successful sign up
                const userResponse = await axios.get(`${baseUrl}/user-details`, {
                    withCredentials: true
                });

                // Call onAuthSuccess with user data to update Redux state
                if (onAuthSuccess && userResponse.data.user) {
                    onAuthSuccess(userResponse.data.user);
                }
            }

            resetForm();

        } catch (error) {
            console.error('Auth error:', error);

            // Handle error response from backend
            if (error.response && error.response.data) {
                const errorMessage = error.response.data.detail || error.response.data.message || 'Authentication failed';
                toast.error(errorMessage);
            } else if (error.request) {
                toast.error('Unable to connect to server. Please try again.');
            } else {
                toast.error('An unexpected error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setErrors({});
    };

    const switchMode = () => {
        setMode(mode === 'signin' ? 'signup' : 'signin');
        resetForm();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with blur - no click to close */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

            {/* Modal */}
            <div className="relative bg-surface-dark border border-white/10 rounded-2xl w-full max-w-md p-6 md:p-8 shadow-2xl animate-fade-in-up">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center size-12 bg-primary rounded mb-4">
                        <span className="material-symbols-outlined text-white text-[28px]">bolt</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">
                        {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        {mode === 'signin'
                            ? 'Sign in to continue to VeloMarketSense'
                            : 'Join VeloMarketSense today'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-300">Full Name</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">
                                    person
                                </span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                                    }}
                                    placeholder="Enter your name"
                                    className={`w-full bg-[#1E1F20] border ${errors.name ? 'border-red-500' : 'border-white/10'} rounded pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors text-sm`}
                                />
                            </div>
                            {errors.name && (
                                <p className="text-red-400 text-xs flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">error</span>
                                    {errors.name}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Email Address</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">
                                mail
                            </span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                                }}
                                placeholder="you@example.com"
                                className={`w-full bg-[#1E1F20] border ${errors.email ? 'border-red-500' : 'border-white/10'} rounded pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors text-sm`}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-red-400 text-xs flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">error</span>
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Password</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">
                                lock
                            </span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                                }}
                                placeholder="••••••••"
                                className={`w-full bg-[#1E1F20] border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors text-sm`}
                            />
                        </div>
                        {errors.password && (
                            <p className="text-red-400 text-xs flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">error</span>
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:brightness-110 text-white font-semibold py-3 rounded transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                        {isLoading ? (
                            mode === 'signin' ? 'Signing in...' : 'Creating account...'
                        ) : (
                            mode === 'signin' ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-slate-500 text-xs">or</span>
                    <div className="flex-1 h-px bg-white/10"></div>
                </div>

                {/* Google Sign In (placeholder) */}
                <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded transition-all duration-200 flex items-center justify-center gap-2">
                    <svg className="size-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                {/* Switch mode */}
                <p className="text-center text-slate-400 text-sm mt-6">
                    {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                    <button
                        type="button"
                        onClick={switchMode}
                        className="text-primary hover:underline ml-1 font-medium"
                    >
                        {mode === 'signin' ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
            </div>
        </div>
    );
}
