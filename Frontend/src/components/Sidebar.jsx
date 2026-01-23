import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setActiveSession, setMessages, setIsLoadingMessages, clearChat, MESSAGES_LIMIT_CONST } from '../Features/chatSlice';

const SESSIONS_LIMIT = 8;

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state) => state.auth.user);
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const activeSessionId = useSelector((state) => state.chat.activeSessionId);
    const [sessions, setSessions] = useState([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Internal function to load a chat session's messages
    const handleChatClickInternal = useCallback(async (sessionId, title) => {
        console.log("Fetching session messages for:", sessionId);

        // Navigate to the chat URL
        navigate(`/chat/${sessionId}`);

        // Close mobile sidebar if open
        if (isOpen) onClose();

        // Set active session immediately
        dispatch(setActiveSession({ sessionId, title }));
        dispatch(setIsLoadingMessages(true));

        try {
            // Fetch first page of messages (most recent)
            const response = await axios.get(`/api/chat/get-session-messages/${sessionId}?offset=0&limit=${MESSAGES_LIMIT_CONST}`, {
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
    }, [dispatch, navigate, isOpen, onClose]);

    // Fetch sessions with pagination
    const fetchSessions = useCallback(async (currentOffset = 0, append = false, autoSelectFirst = false) => {
        if (!isAuthenticated) return;

        if (append) {
            setIsLoadingMore(true);
        } else {
            setIsLoadingSessions(true);
        }

        try {
            const response = await axios.get(`/api/chat/get-all-sessions?offset=${currentOffset}&limit=${SESSIONS_LIMIT}`, {
                withCredentials: true
            });

            if (response.status === 200) {
                const data = response.data;
                console.log("Sessions fetched:", data, "offset:", currentOffset);

                if (append) {
                    // Append new sessions to existing list
                    setSessions(prev => [...prev, ...data]);
                } else {
                    // Replace sessions (initial load)
                    setSessions(data);

                    // Auto-select first session on initial load
                    if (autoSelectFirst && data.length > 0 && !activeSessionId) {
                        const firstSession = data[0];
                        // Trigger chat click for the most recent session
                        setTimeout(() => {
                            handleChatClickInternal(firstSession.session_id, firstSession.title);
                        }, 100);
                    }
                }

                // Check if there are more sessions to load
                setHasMore(data.length === SESSIONS_LIMIT);
                setOffset(currentOffset + data.length);
            }
        } catch (error) {
            console.log("Error fetching sessions:", error);
        } finally {
            setIsLoadingSessions(false);
            setIsLoadingMore(false);
        }
    }, [isAuthenticated, activeSessionId]);

    // Initial fetch on authentication change
    useEffect(() => {
        if (isAuthenticated) {
            setOffset(0);
            setHasMore(true);
            fetchSessions(0, false, false); // Don't auto-select - show new chat view
        } else {
            setSessions([]);
            setOffset(0);
            setHasMore(true);
        }
    }, [isAuthenticated]);

    // Load more sessions handler
    const handleLoadMore = useCallback(() => {
        if (!isLoadingMore && hasMore) {
            fetchSessions(offset, true);
        }
    }, [isLoadingMore, hasMore, offset, fetchSessions]);

    // Scroll container ref for infinite scroll
    const scrollContainerRef = useRef(null);

    // Handle scroll for infinite loading
    const handleScroll = useCallback((e) => {
        const container = e.target;
        const { scrollTop, scrollHeight, clientHeight } = container;

        // Trigger load more when scrolled within 50px of bottom
        if (scrollHeight - scrollTop - clientHeight < 50) {
            handleLoadMore();
        }
    }, [handleLoadMore]);

    // Alias for use in JSX (same as internal function)
    const handleChatClick = handleChatClickInternal;

    // Handle new chat - clear state and navigate to root
    const handleNewChat = () => {
        dispatch(clearChat());
        navigate('/');
        // Close mobile sidebar if open
        if (isOpen) onClose();
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
                        {/* Logo - click to start new chat */}
                        <button
                            onClick={handleNewChat}
                            className="size-10 bg-primary rounded-lg flex items-center justify-center hover:brightness-110 transition-all"
                            title="New Chat"
                        >
                            <span className="material-symbols-outlined text-white text-[20px]">bolt</span>
                        </button>
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
                            {/* Logo - click to start new chat */}
                            <button
                                onClick={handleNewChat}
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                title="New Chat"
                            >
                                <div className="size-9 bg-primary rounded flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-[18px]">bolt</span>
                                </div>
                            </button>

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
                            <button
                                onClick={handleNewChat}
                                className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                            >
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
                        <div
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto custom-scrollbar relative"
                        >
                            <p className="px-3 mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Chats</p>
                            <div className="space-y-0.5">
                                {isLoadingSessions ? (
                                    /* Skeleton placeholders for initial load */
                                    <div className="space-y-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="px-3 py-2.5 flex items-center gap-3">
                                                <div className="flex-1 h-4 bg-white/5 rounded animate-pulse"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : sessions.length === 0 ? (
                                    <p className="px-3 py-4 text-sm text-slate-500 text-center">No chats yet</p>
                                ) : (
                                    <>
                                        {sessions.map((session, idx) => (
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
                                        ))}

                                        {/* Orange flowing loading indicator for load more */}
                                        {isLoadingMore && (
                                            <div className="py-3 px-3">
                                                <div className="h-1 w-full bg-border-dark rounded-full relative overflow-hidden">
                                                    <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer"></div>
                                                </div>
                                            </div>
                                        )}
                                    </>
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
