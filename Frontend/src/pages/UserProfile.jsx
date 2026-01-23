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
                    <div className="space-y-6 animate-fade-in-up pb-10">
                        <div>
                            <h2 className="text-2xl font-semibold mb-1">Security at VeloMarketSense</h2>
                            <p className="text-slate-400 text-sm">Last Updated: {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="bg-surface-dark border border-border-dark rounded-lg p-6 space-y-6 text-slate-300 text-sm leading-relaxed">
                            <p>At VeloMarketSense, protecting your data and privacy is our top priority. We utilize industry-standard security practices and modern architecture to ensure your information remains safe.</p>

                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-white">1. Data Encryption</h3>
                                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                    <li><strong className="text-slate-300">In Transit:</strong> All data transmitted between your browser and our servers is encrypted using TLS 1.2/1.3 (Transport Layer Security). This ensures that no one can intercept your search queries or personal data while it travels over the internet.</li>
                                    <li><strong className="text-slate-300">At Rest:</strong> Sensitive user data stored in our databases is protected using strong encryption standards.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-white">2. Authentication & Access Control</h3>
                                <p>We do not store sensitive authentication credentials in your browser’s LocalStorage, which is vulnerable to XSS attacks.</p>
                                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                    <li><strong className="text-slate-300">Secure Cookies:</strong> We use HttpOnly, Secure, and SameSite cookies for session management. These cookies cannot be accessed by JavaScript, protecting your account from hijacking attempts.</li>
                                    <li><strong className="text-slate-300">Token-Based Auth:</strong> Our backend utilizes robust token-based authentication (JWT/OAuth) to validate requests securely.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-white">3. AI & Data Privacy</h3>
                                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                    <li><strong className="text-slate-300">Query Processing:</strong> Your search queries are processed by our Retrieval-Augmented Generation (RAG) engine solely to fetch and summarize relevant news.</li>
                                    <li><strong className="text-slate-300">No Public Training:</strong> Your personal search history and private data are not used to train public AI models.</li>
                                    <li><strong className="text-slate-300">Context Isolation:</strong> We strictly enforce logic that prevents cross-user data leakage. One user cannot access the chat history or session data of another.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-white">4. Infrastructure Security</h3>
                                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                    <li><strong className="text-slate-300">Cloud Security:</strong> Our services are hosted on secure, compliant cloud infrastructure providers (e.g., AWS, Render) that maintain strict physical and network security controls.</li>
                                    <li><strong className="text-slate-300">Database Security:</strong> We utilize managed database services (PostgreSQL & Redis) with restricted IP access and continuous monitoring.</li>
                                    <li><strong className="text-slate-300">API Security:</strong> Our API endpoints are protected against common attacks, including Rate Limiting to prevent abuse and DDoS attempts.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-white">5. Vulnerability Reporting (Responsible Disclosure)</h3>
                                <p>We welcome reports from security researchers and developers. If you believe you have found a vulnerability in VeloMarketSense, please report it to us responsibly:</p>
                                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                    <li><strong className="text-slate-300">Email:</strong> <a href="mailto:security@velomarketsense.com" className="text-primary hover:text-primary/80 transition-colors">security@velomarketsense.com</a></li>
                                    <li><strong className="text-slate-300">Policy:</strong> We ask that you do not exploit the vulnerability or share it publicly until we have had a reasonable time to address it.</li>
                                </ul>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <h3 className="text-base font-semibold text-white">6. Contact Us</h3>
                                <p>For any specific questions regarding our security practices, please contact our support team at <a href="mailto:support@velomarketsense.com" className="text-primary hover:text-primary/80 transition-colors">support@velomarketsense.com</a>.</p>
                            </div>
                        </div>
                    </div>
                );

            case 'terms':
                return (
                    <div className="space-y-6 animate-fade-in-up pb-10">
                        <div>
                            <h2 className="text-2xl font-semibold mb-1">Terms and Conditions</h2>
                            <p className="text-slate-400 text-sm">Effective Date: {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="bg-surface-dark border border-border-dark rounded-lg p-6 space-y-6 text-slate-300 text-sm leading-relaxed">
                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-white">1. Introduction</h3>
                                <p>Welcome to VeloMarketSense. By accessing or using our website and services, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you must not use our Services.</p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-white">2. Nature of Services</h3>
                                <p>VeloMarketSense is a real-time news aggregation and information retrieval platform.</p>
                                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                    <li><strong className="text-slate-300">News Aggregation:</strong> We fetch publicly available financial and market news from third-party sources (via NewsAPIs).</li>
                                    <li><strong className="text-slate-300">AI-Assisted Retrieval (RAG):</strong> We utilize Artificial Intelligence to summarize and retrieve relevant news articles based on user queries.</li>
                                    <li><strong className="text-slate-300">Scope:</strong> We provide access to news content only. We do not generate independent market analysis, predictive signals, or financial forecasts.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-white">3. No Financial Advice</h3>
                                <p>VeloMarketSense is strictly a news aggregator and does not provide financial advice.</p>
                                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                    <li><strong className="text-slate-300">Information Only:</strong> All content provided is for informational purposes only.</li>
                                    <li><strong className="text-slate-300">No Endorsement:</strong> The display of specific news articles does not constitute an endorsement or recommendation to buy, sell, or hold any security.</li>
                                    <li><strong className="text-slate-300">User Responsibility:</strong> You acknowledge that you are solely responsible for your investment decisions. We are not liable for any financial losses resulting from your use of the news provided on our platform.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-white">4. Artificial Intelligence & Content Accuracy</h3>
                                <p>Our services use Artificial Intelligence (AI) to process and summarize news data. By using VeloMarketSense, you acknowledge that:</p>
                                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                    <li><strong className="text-slate-300">Summarization Errors:</strong> AI-generated summaries may occasionally misinterpret the original news source or omit context.</li>
                                    <li><strong className="text-slate-300">Third-Party Sources:</strong> We do not create the news content. We are not responsible for the accuracy, reliability, or completeness of the articles fetched from third-party APIs.</li>
                                    <li><strong className="text-slate-300">Hallucinations:</strong> While we utilize Retrieval-Augmented Generation (RAG) to ground answers in data, the AI may still occasionally generate incorrect information.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-white">5. Acceptable Use</h3>
                                <p>You agree not to:</p>
                                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                    <li>Use the Service for any illegal purpose.</li>
                                    <li>Attempt to "scrape" or bulk-download news data from our platform (which may violate our third-party data agreements).</li>
                                    <li>Interfere with the security or integrity of our APIs.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-white">6. Intellectual Property</h3>
                                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                    <li><strong className="text-slate-300">Our Rights:</strong> The VeloMarketSense platform, code, and AI retrieval architecture are the property of VeloMarketSense.</li>
                                    <li><strong className="text-slate-300">Third-Party Content:</strong> Headlines, snippets, and links to news articles remain the intellectual property of their respective publishers. We display this content under fair use/licensing for aggregation purposes.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-white">7. Limitation of Liability</h3>
                                <p>To the fullest extent permitted by law, VeloMarketSense shall not be liable for any damages, including loss of profits or trading losses, resulting from:</p>
                                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                    <li>Your reliance on news data provided by the Service;</li>
                                    <li>Delays or interruptions in real-time news delivery;</li>
                                    <li>Errors in AI-generated summaries or query responses.</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-white">8. Modifications</h3>
                                <p>We reserve the right to modify these Terms at any time. Continued use of the Service constitutes acceptance of the updated Terms.</p>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <h3 className="text-base font-semibold text-white">9. Contact Information</h3>
                                <p>If you have questions about these Terms, please contact us at:</p>
                                <p className="text-primary hover:text-primary/80 transition-colors">
                                    <a href="mailto:support@velomarketsense.com">support@velomarketsense.com</a>
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'help':
                return (
                    <div className="space-y-6 animate-fade-in-up pb-10">
                        <div>
                            <h2 className="text-2xl font-semibold mb-1">Help & Support</h2>
                            <p className="text-slate-400 text-sm">Have a question or need assistance? Fill out the form below and we'll get back to you.</p>
                        </div>

                        <div className="bg-surface-dark border border-border-dark rounded-lg p-6 max-w-2xl">
                            <form className="space-y-4" onSubmit={(e) => {
                                e.preventDefault();
                                toast.success("Message sent successfully! We'll contact you soon.");
                                e.target.reset();
                            }}>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label className="text-sm text-slate-400">Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Enter your name"
                                            className="w-full bg-background-dark border border-border-dark rounded px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm text-slate-400">Email <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            required
                                            defaultValue={user?.email}
                                            placeholder="Enter your email"
                                            className="w-full bg-background-dark border border-border-dark rounded px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm text-slate-400">Phone Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="Enter your phone number"
                                        className="w-full bg-background-dark border border-border-dark rounded px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm text-slate-400">Question / Issue <span className="text-red-500">*</span></label>
                                    <textarea
                                        required
                                        rows="4"
                                        placeholder="Describe your issue or question..."
                                        className="w-full bg-background-dark border border-border-dark rounded px-3 py-2 text-white focus:outline-none focus:border-primary transition-colors placeholder:text-slate-600 resize-none"
                                    ></textarea>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="bg-primary text-white px-6 py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors"
                                    >
                                        Send Message
                                    </button>
                                </div>
                            </form>
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
