import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setIsAuthenticated, setUser } from '../Features/authSlice';
import { clearChat } from '../Features/chatSlice';
import { toast } from 'sonner';
import axios from 'axios';

export default function UserProfile() {
    const [activeSection, setActiveSection] = useState('account');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);

    const sidebarItems = [
        { id: 'account', label: 'Account Settings', icon: 'manage_accounts' },
        { id: 'security', label: 'Security', icon: 'shield' },
        { id: 'api-keys', label: 'API Keys', icon: 'key' },
        { id: 'terms', label: 'Terms and Conditions', icon: 'description' },
        { id: 'help', label: 'Help', icon: 'help' },
    ];

    const handleLogout = async () => {
        try {
            await axios.post('/api/user/logout',
                {
                    withCredentials: true
                }
            );
            toast.success("User Log out successful!");
        } catch (error) {
            console.error('Logout failed:', error);
            toast.error("Error while logging out user!!");
        } finally {
            dispatch(setIsAuthenticated(false));
            dispatch(setUser({ name: "", email: "", id: "" }));
            dispatch(clearChat());
            navigate('/');
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            toast.error("Please enter your password to confirm deletion.");
            return;
        }

        setIsDeleting(true);
        try {
            // Placeholder API call - replace with actual endpoint
            const response = await axios.post('/api/user/delete-account', { password: deletePassword },
                {
                    withCredentials: true
                }
            );

            if (response.status === 200) {
                toast.success("Account deleted successfully.");
                // Perform logout cleanup
                dispatch(setIsAuthenticated(false));
                dispatch(setUser({ name: "", email: "", id: "" }));
                dispatch(clearChat());
                navigate('/');
            }
        } catch (error) {
            console.error('Delete account failed:', error);
            // toast.error(error.response?.data?.message || "Failed to delete account. Please check your password.");
            // For UI demo purposes if API isn't ready, let's just log and maybe not err hard
            toast.error("Failed to delete account, Please check Password!.");
        } finally {
            setIsDeleting(false);
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'account':
                return (
                    <div className="space-y-6 animate-fade-in-up pb-10">
                        <div>
                            <h2 className="text-2xl font-semibold mb-1">Account Settings</h2>
                            <p className="text-slate-400 text-sm">Manage your personal information and preferences.</p>
                        </div>

                        <div className="bg-surface-dark border border-border-dark rounded-lg p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="size-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-white">
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                    <h3 className="font-medium text-lg">{user?.name || 'User Name'}</h3>
                                    <p className="text-slate-400">{user?.email || 'user@example.com'}</p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 pt-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm text-slate-400">Full Name</label>
                                    <input
                                        type="text"
                                        defaultValue={user?.name}
                                        className="w-full bg-background-dark border border-border-dark rounded px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                                        disabled
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm text-slate-400">Email Address</label>
                                    <input
                                        type="email"
                                        defaultValue={user?.email}
                                        className="w-full bg-background-dark border border-border-dark rounded px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                                        disabled
                                    />
                                </div>
                            </div>


                        </div>

                        {/* Danger Zone */}
                        <div className="mt-8 pt-8 border-t border-border-dark">
                            <h3 className="text-lg font-semibold text-red-500 mb-4">Danger Zone</h3>
                            <div className="bg-surface-dark border border-border-dark rounded-lg p-6 space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-medium text-slate-200">Log Out</h4>
                                        <p className="text-sm text-slate-400">Log out of your account on this device.</p>
                                    </div>
                                    {!showLogoutConfirm ? (
                                        <button
                                            onClick={() => setShowLogoutConfirm(true)}
                                            className="px-4 py-2 border border-red-500/50 text-red-500 rounded hover:bg-red-500/10 transition-colors text-sm font-medium w-full sm:w-auto text-center"
                                        >
                                            Log Out
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <span className="text-sm text-slate-300 hidden sm:inline text-nowrap">Are you sure?</span>
                                            <button
                                                onClick={handleLogout}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium whitespace-nowrap"
                                            >
                                                Yes, Log Out
                                            </button>
                                            <button
                                                onClick={() => setShowLogoutConfirm(false)}
                                                className="flex-1 sm:flex-none px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="h-px bg-white/5"></div>

                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                        <div>
                                            <h4 className="font-medium text-slate-200">Delete Account</h4>
                                            <p className="text-sm text-slate-400">Permanently delete your account and all data.</p>
                                        </div>
                                        {!showDeleteConfirm && (
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium w-full sm:w-auto"
                                            >
                                                Delete Account
                                            </button>
                                        )}
                                    </div>

                                    {showDeleteConfirm && (
                                        <div className="bg-background-dark/50 border border-red-500/30 rounded p-4 animate-fade-in-up">
                                            <p className="text-sm text-red-400 mb-4 font-medium">
                                                <span className="material-symbols-outlined align-bottom text-[18px] mr-1">warning</span>
                                                Warning: All your chats and messages will be permanently deleted.
                                            </p>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-sm text-slate-400 block mb-1">Confirm Password</label>
                                                    <input
                                                        type="password"
                                                        value={deletePassword}
                                                        onChange={(e) => setDeletePassword(e.target.value)}
                                                        placeholder="Enter your password to confirm"
                                                        className="w-full bg-background-dark border border-border-dark rounded px-3 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                                                    />
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                                    <button
                                                        onClick={handleDeleteAccount}
                                                        disabled={isDeleting}
                                                        className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowDeleteConfirm(false);
                                                            setDeletePassword('');
                                                        }}
                                                        className="w-full sm:w-auto px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className="space-y-6 animate-fade-in-up">
                        <div>
                            <h2 className="text-2xl font-semibold mb-1">Security</h2>
                            <p className="text-slate-400 text-sm">Manage your password and security settings.</p>
                        </div>
                        <div className="bg-surface-dark border border-border-dark rounded-lg p-6">
                            <p className="text-slate-400">Security settings placeholder.</p>
                        </div>
                    </div>
                );
            case 'api-keys':
                return (
                    <div className="space-y-6 animate-fade-in-up">
                        <div>
                            <h2 className="text-2xl font-semibold mb-1">API Keys</h2>
                            <p className="text-slate-400 text-sm">Manage your API keys for external access.</p>
                        </div>
                        <div className="bg-surface-dark border border-border-dark rounded-lg p-6">
                            <p className="text-slate-400">API Keys management placeholder.</p>
                        </div>
                    </div>
                );
            case 'terms':
                return (
                    <div className="space-y-6 animate-fade-in-up">
                        <div>
                            <h2 className="text-2xl font-semibold mb-1">Terms and Conditions</h2>
                            <p className="text-slate-400 text-sm">Review our terms of service.</p>
                        </div>
                        <div className="bg-surface-dark border border-border-dark rounded-lg p-6">
                            <p className="text-slate-400">Terms and conditions content placeholder.</p>
                        </div>
                    </div>
                );
            case 'help':
                return (
                    <div className="space-y-6 animate-fade-in-up">
                        <div>
                            <h2 className="text-2xl font-semibold mb-1">Help & Support</h2>
                            <p className="text-slate-400 text-sm">Get help with your account.</p>
                        </div>
                        <div className="bg-surface-dark border border-border-dark rounded-lg p-6">
                            <p className="text-slate-400">Help section placeholder.</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-background-dark text-slate-100 overflow-hidden">
            {/* Settings Sidebar */}
            <aside className="w-64 bg-surface-dark border-r border-border-dark flex-shrink-0 flex flex-col hidden md:flex">
                <div className="p-4 border-b border-border-dark flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="p-1 hover:bg-white/5 rounded transition-colors text-slate-400 hover:text-white"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <span className="font-semibold">Settings</span>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`flex items-center gap-3 w-full px-3 py-2 text-sm rounded transition-colors text-left ${activeSection === item.id
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface-dark border-b border-border-dark z-20 flex items-center px-4 gap-3">
                <button
                    onClick={() => navigate('/')}
                    className="p-1 hover:bg-white/5 rounded transition-colors text-slate-400 hover:text-white"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <span className="font-semibold">Settings</span>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8 w-full">
                <div className="max-w-4xl mx-auto">
                    {/* Mobile Navigation (Tabs) */}
                    <div className="md:hidden mb-6 flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
                        {sidebarItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${activeSection === item.id
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-transparent text-slate-400 border-border-dark'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
