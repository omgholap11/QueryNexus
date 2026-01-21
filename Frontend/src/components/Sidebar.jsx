import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { setActiveSession, setMessages, setIsLoadingMessages } from '../Fetatures/chatSlice';

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const activeSessionId = useSelector((state) => state.chat.activeSessionId);
    const [sessions, setSessions] = useState([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);

    useEffect(() => {
        const fetchSessions = async () => {
            if (!isAuthenticated) return;

            setIsLoadingSessions(true);
            try {
                const response = await axios.get("/api/chat/get-all-sessions", {
                    withCredentials: true
                });

                if (response.status === 200) {
                    setSessions(response.data);
                    console.log("Sessions fetched:", response.data);
                }
            } catch (error) {
                console.log("Error fetching sessions:", error);
            } finally {
                setIsLoadingSessions(false);
            }
        };

        fetchSessions();
    }, [isAuthenticated]);

    const handleChatClick = async (sessionId, title) => {
        console.log("Fetching session messages for:", sessionId);

        // Set active session immediately
        dispatch(setActiveSession({ sessionId, title }));
        dispatch(setIsLoadingMessages(true));

        try {
            const response = await axios.get(`/api/chat/get-session-messages/${sessionId}`, {
                withCredentials: true
            });

            if (response.status === 200) {
                const data = response.data;
                console.log("Chat session messages:", data);
                dispatch(setMessages(data));
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            dispatch(setIsLoadingMessages(false));
        }
    };

    return (
        <aside className={`
            ${isCollapsed ? 'w-0 md:w-16' : 'w-[260px]'} 
            bg-surface-dark flex flex-col h-screen shrink-0 z-50 
            transition-all duration-300 fixed md:relative
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            border-r border-border-dark
        `}>
            <div className="p-3 flex flex-col h-full overflow-hidden">
                {/* Collapsed State */}
                {isCollapsed && (
                    <div className="hidden md:flex flex-col items-center gap-3 pt-2">
                        {/* Logo */}
                        <div className="size-10 bg-primary rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[20px]">bolt</span>
                        </div>
                        <button
                            onClick={onToggleCollapse}
                            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                            title="Expand sidebar"
                        >
                            <span className="material-symbols-outlined text-[20px]">menu</span>
                        </button>
                    </div>
                )}

                {/* Expanded State */}
                {!isCollapsed && (
                    <>
                        {/* Header - Logo & Actions */}
                        <div className="flex items-center justify-between mb-6">
                            {/* Logo */}
                            <div className="flex items-center gap-2">
                                <div className="size-9 bg-primary rounded flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-[18px]">bolt</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                                    <span className="material-symbols-outlined text-[20px]">search</span>
                                </button>
                                {/* Mobile Close */}
                                <button onClick={onClose} className="md:hidden text-slate-400 p-2">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                                {/* Desktop Collapse */}
                                <button
                                    onClick={onToggleCollapse}
                                    className="hidden md:flex text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                                    title="Collapse sidebar"
                                >
                                    <span className="material-symbols-outlined text-[20px]">menu_open</span>
                                </button>
                            </div>
                        </div>

                        {/* Navigation Items */}
                        <nav className="space-y-1 mb-4">
                            <button className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 hover:bg-white/5 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-[20px]">chat_bubble_outline</span>
                                <span className="text-sm">New Chat</span>
                            </button>
                            <button className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 hover:bg-white/5 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                                <span className="text-sm">Agents</span>
                            </button>
                            <button className="flex items-center justify-between w-full px-3 py-2.5 text-slate-300 hover:bg-white/5 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                                    <span className="text-sm">Intelligence</span>
                                </div>
                                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">Beta</span>
                            </button>
                        </nav>

                        <div className="h-px bg-border-dark my-2"></div>

                        {/* Projects Section */}
                        <nav className="space-y-1 mb-4">
                            <button className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 hover:bg-white/5 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-[20px]">folder_open</span>
                                <span className="text-sm">New Project</span>
                            </button>
                        </nav>

                        {/* Chats Section */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <p className="px-3 mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Chats</p>
                            <div className="space-y-0.5">
                                {isLoadingSessions ? (
                                    <div className="px-3 py-4 text-center">
                                        <span className="material-symbols-outlined text-slate-500 animate-spin">sync</span>
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <p className="px-3 py-4 text-sm text-slate-500 text-center">No chats yet</p>
                                ) : (
                                    sessions.map((session, idx) => (
                                        <div
                                            key={session.session_id || idx}
                                            onClick={() => handleChatClick(session.session_id, session.title)}
                                            className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors group ${activeSessionId === session.session_id
                                                    ? 'bg-white/5 text-white border-l-2 border-primary'
                                                    : 'hover:bg-white/5 hover:border-l-2 hover:border-primary/50 text-slate-400'
                                                }`}
                                        >
                                            <p className="text-sm truncate">{session.title}</p>
                                            <button
                                                onClick={(e) => e.stopPropagation()}
                                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">more_vert</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Footer - User Profile */}
                        <div className="pt-3 mt-auto border-t border-border-dark">
                            {/* User Profile */}
                            <button className="flex items-center justify-between w-full px-3 py-2.5 text-slate-300 hover:bg-white/5 rounded cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded bg-slate-600 flex items-center justify-center text-xs font-medium text-white uppercase">
                                        {isAuthenticated && user?.name ? user.name.charAt(0) : 'G'}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-white">
                                            {isAuthenticated && user?.name ? user.name : 'Guest'}
                                        </p>
                                        <p className="text-xs text-slate-500">Free Plan</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-slate-500 text-[18px]">unfold_more</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
}
