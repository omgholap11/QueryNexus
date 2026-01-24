import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { prependMessages, setIsLoadingOlderMessages, setIsLoadingMessages, setActiveSession, setMessages as setReduxMessages, addMessage, MESSAGES_LIMIT_CONST } from '../Features/chatSlice';

// Typewriter component for streaming effect
const TypewriterText = ({ text, onComplete, scrollRef }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (!text) return;

        let currentIndex = 0;
        const words = text.split(' ');

        const timer = setInterval(() => {
            if (currentIndex < words.length) {
                setDisplayedText(words.slice(0, currentIndex + 1).join(' '));
                currentIndex++;
                // Scroll as text appears
                scrollRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            } else {
                clearInterval(timer);
                setIsComplete(true);
                onComplete?.();
            }
        }, 30); // Speed: 30ms per word

        return () => clearInterval(timer);
    }, [text]);

    return (
        <ReactMarkdown
            components={{
                strong: ({ node, ...props }) => <span className="font-semibold text-white" {...props} />,
                p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 mb-4 space-y-1 text-slate-300" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 mb-4 space-y-1 text-slate-300" {...props} />,
                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mb-3 mt-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-white mb-2 mt-3" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-base font-bold text-slate-200 mb-2 mt-2" {...props} />,
                code: ({ node, ...props }) => <code className="bg-white/10 text-slate-200 px-1.5 py-0.5 rounded font-mono text-xs" {...props} />
            }}
        >
            {displayedText}
        </ReactMarkdown>
    );
};

export default function Dashboard({ isSidebarCollapsed = false }) {
    const dispatch = useDispatch();
    const { sessionId: urlSessionId } = useParams();
    const navigate = useNavigate();

    const reduxMessages = useSelector((state) => state.chat.messages);
    const activeSessionId = useSelector((state) => state.chat.activeSessionId);
    const activeSessionTitle = useSelector((state) => state.chat.activeSessionTitle);
    const isLoadingMessages = useSelector((state) => state.chat.isLoadingMessages);
    const isLoadingOlderMessages = useSelector((state) => state.chat.isLoadingOlderMessages);
    const messagesOffset = useSelector((state) => state.chat.messagesOffset);
    const hasMoreMessages = useSelector((state) => state.chat.hasMoreMessages);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editText, setEditText] = useState("");
    const [likedMessages, setLikedMessages] = useState({});
    const [dislikedMessages, setDislikedMessages] = useState({});
    const [copiedId, setCopiedId] = useState(null);
    const [streamingIndex, setStreamingIndex] = useState(null);
    const [researchActive, setResearchActive] = useState(false);
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const previousScrollHeightRef = useRef(0);
    const previousSessionIdRef = useRef(null);
    const urlSessionIdRef = useRef(null);

    // Rotating Placeholder Logic
    const placeholderOptions = [
        "Summarize how the conflict in the Middle East is currently impacting global oil prices.",
        "What are the key takeaways from the latest advancements in Generative AI this month?",
        "Analyze the impact of the latest Federal Reserve interest rate decision on tech stocks.",
        "How do recent US-China trade tensions affect the semiconductor supply chain?"
    ];
    const [placeholderText, setPlaceholderText] = useState(placeholderOptions[0]);

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % placeholderOptions.length;
            setPlaceholderText(placeholderOptions[index]);
        }, 3000); // Rotate every 3 seconds

        return () => clearInterval(interval);
    }, []);

    // Load session from URL param on mount or URL change
    useEffect(() => {
        if (urlSessionId && urlSessionId !== urlSessionIdRef.current && urlSessionId !== activeSessionId) {
            urlSessionIdRef.current = urlSessionId;
            // Load the session from URL
            loadSessionFromUrl(urlSessionId);
        }
    }, [urlSessionId, activeSessionId]);

    // Function to load session from URL
    const loadSessionFromUrl = async (sessionIdToLoad) => {
        dispatch(setIsLoadingMessages(true));
        dispatch(setActiveSession({ sessionId: sessionIdToLoad, title: null }));

        try {
            const response = await axios.get(`/api/chat/get-session-messages/${sessionIdToLoad}?offset=0&limit=${MESSAGES_LIMIT_CONST}`, {
                withCredentials: true
            });

            if (response.status === 200) {
                const data = response.data;
                // Handle both new format { messages: [], session_info: {} } and old format []
                const messagesList = Array.isArray(data) ? data : (data.messages || []);
                const sessionInfo = !Array.isArray(data) ? data.session_info : null;

                // Update title if available
                if (sessionInfo?.title) {
                    dispatch(setActiveSession({ sessionId: sessionIdToLoad, title: sessionInfo.title }));
                }

                // Transform backend format to frontend format (same as Redux does)
                const mappedMessages = messagesList.map(msg => ({
                    type: msg.role === 'User' ? 'user' : 'ai',
                    content: msg.content,
                })).reverse(); // Reverse because backend sends newest first

                // Set local state directly
                setMessages(mappedMessages);
                setSessionId(sessionIdToLoad);
                previousSessionIdRef.current = sessionIdToLoad;

                // Dispatch to Redux
                dispatch(setReduxMessages(messagesList));
            }
        } catch (error) {
            console.error("Error loading session from URL:", error);
            // Only redirect to home if session not found (404)
            // Don't redirect on auth errors (401/403) - user might need to sign in
            if (error.response?.status === 404) {
                navigate('/');
            }
        } finally {
            dispatch(setIsLoadingMessages(false));
        }
    };


    // Sync Redux messages to local state when session changes
    useEffect(() => {
        // Handle cleared state (new chat) - only if NOT loading from URL
        // Don't clear if we have a urlSessionId (we're waiting for that session to load)
        if (!activeSessionId && reduxMessages.length === 0 && !urlSessionId) {
            setMessages([]);
            setSessionId(null);
            setLikedMessages({});
            setDislikedMessages({});
            setCopiedId(null);
            setEditingIndex(null);
            setEditText("");
            previousSessionIdRef.current = null;
            return;
        }

        // Skip if we already handled this session (e.g., loaded from URL directly)
        if (previousSessionIdRef.current === activeSessionId) {
            return;
        }

        if (activeSessionId && reduxMessages.length > 0) {
            setMessages(reduxMessages);
            setSessionId(activeSessionId);
            // Reset interaction states for new session
            setLikedMessages({});
            setDislikedMessages({});
            setCopiedId(null);
            setEditingIndex(null);
            setEditText("");
            // Scroll to bottom on initial load of a NEW session
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            }, 100);
            previousSessionIdRef.current = activeSessionId;
        }
    }, [activeSessionId, reduxMessages, urlSessionId]);

    // Load older messages function
    const loadOlderMessages = useCallback(async () => {
        if (!activeSessionId || isLoadingOlderMessages || !hasMoreMessages) return;

        dispatch(setIsLoadingOlderMessages(true));

        // Save current scroll height to maintain position after prepending
        if (messagesContainerRef.current) {
            previousScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
        }

        try {
            const response = await axios.get(
                `/api/chat/get-session-messages/${activeSessionId}?offset=${messagesOffset}&limit=${MESSAGES_LIMIT_CONST}`,
                { withCredentials: true }
            );

            if (response.status === 200) {
                const data = response.data;
                const messagesList = Array.isArray(data) ? data : (data.messages || []);
                console.log("Older messages loaded:", messagesList);
                dispatch(prependMessages(messagesList));

                // Restore scroll position after prepending
                setTimeout(() => {
                    if (messagesContainerRef.current) {
                        const newScrollHeight = messagesContainerRef.current.scrollHeight;
                        const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
                        messagesContainerRef.current.scrollTop = scrollDiff;
                    }
                }, 50);
            }
        } catch (error) {
            console.error("Error loading older messages:", error);
        } finally {
            dispatch(setIsLoadingOlderMessages(false));
        }
    }, [activeSessionId, messagesOffset, hasMoreMessages, isLoadingOlderMessages, dispatch]);

    // Handle scroll for loading older messages (scroll up)
    const handleMessagesScroll = useCallback((e) => {
        const container = e.target;
        // Trigger load more when scrolled within 100px of top
        if (container.scrollTop < 100 && hasMoreMessages && !isLoadingOlderMessages) {
            loadOlderMessages();
        }
    }, [hasMoreMessages, isLoadingOlderMessages, loadOlderMessages]);

    const chatTitle = activeSessionTitle || (messages.length > 0 && messages[1]?.type === 'ai'
        ? messages[0]?.content
        : null);

    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [input]);

    // Only scroll to bottom for new messages, not when loading older ones
    useEffect(() => {
        if (streamingIndex === null && !isLoadingOlderMessages) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [isLoading]);

    const handleSend = async (customMessage = null) => {
        const messageToSend = customMessage || input;
        if (!messageToSend.trim() || isLoading) return;

        const userMessage = { type: 'user', content: messageToSend };
        setMessages(prev => [...prev, userMessage]);
        // Keep Redux offset in sync
        dispatch(addMessage(userMessage));

        if (!customMessage) setInput("");
        setIsLoading(true);

        try {
            const payload = {
                payload: {
                    question: messageToSend,
                    session_id: sessionId ? sessionId : "null"
                }
            };

            const response = await axios.post('http://localhost:8000/api/chat/get-response',
                payload,
                {
                    withCredentials: true
                }
            );

            const { answer, source, session_id } = response.data;

            if (session_id && session_id !== "null") {
                setSessionId(session_id);
            }

            const aiMessage = {
                type: 'ai',
                content: answer,
                sources: source || []
            };

            setMessages(prev => {
                const newMessages = [...prev, aiMessage];
                setStreamingIndex(newMessages.length - 1); // Start streaming the new message
                return newMessages;
            });
            // Keep Redux offset in sync
            dispatch(addMessage(aiMessage));
        } catch (error) {
            console.error("Error fetching response:", error);
            const errorMessage = { type: 'ai', content: "**Error**: Unable to connect to QueryNexus engine." };
            setMessages(prev => [...prev, errorMessage]);
            // Keep Redux offset in sync
            dispatch(addMessage(errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    const handleStreamComplete = () => {
        setStreamingIndex(null);
    };

    const handleRegenerate = () => {
        if (messages.length >= 2 && !isLoading) {
            const lastUserMsgIndex = messages.length - 2;
            const lastUserMsg = messages[lastUserMsgIndex];
            if (lastUserMsg?.type === 'user') {
                setMessages(prev => prev.slice(0, -1));
                handleSend(lastUserMsg.content);
            }
        }
    };

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleLike = (idx) => {
        setLikedMessages(prev => {
            const newState = { ...prev };
            if (newState[idx]) {
                delete newState[idx];
            } else {
                newState[idx] = true;
            }
            return newState;
        });
        setDislikedMessages(prev => {
            const newState = { ...prev };
            delete newState[idx];
            return newState;
        });
    };

    const handleDislike = (idx) => {
        setDislikedMessages(prev => {
            const newState = { ...prev };
            if (newState[idx]) {
                delete newState[idx];
            } else {
                newState[idx] = true;
            }
            return newState;
        });
        setLikedMessages(prev => {
            const newState = { ...prev };
            delete newState[idx];
            return newState;
        });
    };

    const handleEdit = (idx, content) => {
        setEditingIndex(idx);
        setEditText(content);
    };

    const handleSaveEdit = (idx) => {
        if (editText.trim()) {
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[idx] = { ...newMessages[idx], content: editText };
                return newMessages.slice(0, idx + 1);
            });
            handleSend(editText);
        }
        setEditingIndex(null);
        setEditText("");
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Don't send if loading or streaming
            if (!isLoading && streamingIndex === null) {
                handleSend();
            }
        }
    };

    const hasMessages = messages.length > 0;
    // Show skeleton loading state when:
    // 1. Redux is still loading messages
    // 2. OR we're on a chat URL but don't have messages yet (initial load)
    const isLoadingSession = isLoadingMessages || (urlSessionId && !hasMessages);
    const showChatLayout = hasMessages || isLoadingSession;
    const lastUserIndex = messages.map((m, i) => m.type === 'user' ? i : -1).filter(i => i !== -1).pop();
    const lastAiIndex = messages.map((m, i) => m.type === 'ai' ? i : -1).filter(i => i !== -1).pop();

    const IconBtn = ({ icon, onClick, title, isActive = false, isCopied = false }) => (
        <button
            onClick={onClick}
            title={title}
            className={`rounded-full transition-all p-2 ${isActive
                ? 'text-primary bg-primary/10'
                : isCopied
                    ? 'text-green-400 bg-green-400/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
        >
            <span className="material-symbols-outlined text-[18px] md:text-[20px]">
                {isCopied ? 'check' : icon}
            </span>
        </button>
    );

    return (
        <div className="flex flex-col h-full w-full relative">
            <Header title={chatTitle} />

            {/* Full-width shimmer loader - positioned below header */}
            {hasMessages && isLoadingOlderMessages && (
                <div className="absolute top-14 left-0 right-0 h-1 z-20">
                    <div className="h-1 w-full bg-border-dark relative overflow-hidden">
                        <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer-slow"></div>
                    </div>
                </div>
            )}

            <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className={`flex-1 overflow-y-auto custom-scrollbar w-full ${showChatLayout ? 'pb-28' : ''}`}
            >
                <div className={`w-full max-w-3xl mx-auto transition-all duration-500 ease-in-out min-h-full flex flex-col px-4 ${showChatLayout ? 'justify-start pt-6 md:pt-8' : 'items-center justify-center'}`}>

                    {!showChatLayout && (
                        <div className="text-center animate-fade-in-up relative z-10 w-full -mt-16 md:-mt-24">
                            {/* Logo */}
                            <div className="flex justify-center mb-4 md:mb-5">
                                <div className="size-12 md:size-14 bg-primary rounded flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-[24px] md:text-[28px]">bolt</span>
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2 md:mb-3">
                                QueryNexus
                            </h1>
                            <p className="text-slate-400 text-base md:text-lg font-light mb-8 md:mb-10">
                                Beyond the Headlines. Behind the Trends.
                            </p>

                            {/* Input Field - Centered */}
                            <div className="w-full max-w-2xl mx-auto">
                                <div className="relative bg-surface-dark rounded-2xl border border-border-dark focus-within:border-primary/50 transition-all duration-200">
                                    <textarea
                                        ref={textareaRef}
                                        rows={1}
                                        autoFocus
                                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 font-normal outline-none resize-none custom-scrollbar px-4 md:px-5 pt-4 pb-3 text-sm md:text-base max-h-[200px]"
                                        placeholder={placeholderText}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        style={{ minHeight: '50px' }}
                                    />
                                    <div className="flex items-center justify-between px-3 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="size-8 bg-primary rounded flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white text-[16px]">bolt</span>
                                            </div>
                                            <button
                                                onClick={() => setResearchActive(!researchActive)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${researchActive
                                                    ? 'bg-primary text-white'
                                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-[16px]">all_inclusive</span>
                                                Research
                                            </button>
                                        </div>
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => handleSend()}
                                                disabled={!input.trim() || isLoading || streamingIndex !== null}
                                                className={`
                                                    size-8 rounded flex items-center justify-center transition-all duration-200
                                                    ${input.trim() && !isLoading && streamingIndex === null
                                                        ? 'bg-primary text-white hover:brightness-110'
                                                        : 'bg-transparent text-slate-600 cursor-not-allowed'}
                                                `}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-3 text-center text-[10px] md:text-xs text-slate-500">
                                    QueryNexus can make mistakes. <span className="underline cursor-pointer hover:text-slate-400">Check answers.</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {showChatLayout && (
                        <div className="w-full space-y-6">
                            {/* Skeleton loading for session messages */}
                            {isLoadingSession && (
                                <>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={`skeleton-${i}`} className="space-y-6">
                                            {/* User message skeleton */}
                                            <div className="flex w-full justify-end">
                                                <div className="max-w-[70%] md:max-w-[60%]">
                                                    <div className="bg-[#1E1F20] rounded-2xl px-4 py-3 border border-white/5">
                                                        <div className="h-4 bg-white/10 rounded animate-pulse w-32 md:w-48"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* AI message skeleton */}
                                            <div className="flex gap-3 w-full">
                                                <div className="shrink-0 mt-0.5">
                                                    <div className="size-8 md:size-9 rounded bg-primary/50 flex items-center justify-center animate-pulse">
                                                        <span className="material-symbols-outlined text-white/50 text-[16px] md:text-[18px]">bolt</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-white/10 rounded animate-pulse w-full"></div>
                                                    <div className="h-4 bg-white/5 rounded animate-pulse w-[85%]"></div>
                                                    <div className="h-4 bg-white/5 rounded animate-pulse w-[60%]"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                            {/* Actual messages */}
                            {!isLoadingSession && messages.map((msg, idx) => (
                                <div key={idx} className={`flex w-full animate-fade-in-up ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>

                                    {msg.type === 'user' ? (
                                        <div className="max-w-[90%] md:max-w-[75%]">
                                            {editingIndex === idx ? (
                                                <div className="bg-[#1E1F20] rounded-2xl p-3 border border-primary/30">
                                                    <textarea
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        className="w-full bg-transparent text-white text-[14px] md:text-[15px] resize-none outline-none"
                                                        rows={3}
                                                    />
                                                    <div className="flex gap-2 mt-2">
                                                        <button onClick={() => handleSaveEdit(idx)} className="px-3 py-1.5 bg-primary text-white text-xs rounded-full font-medium">Save & Send</button>
                                                        <button onClick={() => setEditingIndex(null)} className="px-3 py-1.5 bg-white/10 text-slate-300 text-xs rounded-full">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="bg-[#1E1F20] text-slate-100 rounded-2xl px-4 md:px-5 py-3 border border-white/5">
                                                        <p className="text-[14px] md:text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                    </div>
                                                    <div className="flex justify-end gap-1 mt-2">
                                                        <IconBtn
                                                            icon="content_copy"
                                                            onClick={() => handleCopy(msg.content, `user-${idx}`)}
                                                            title="Copy"
                                                            isCopied={copiedId === `user-${idx}`}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex gap-3 max-w-full w-full">
                                            <div className="shrink-0 mt-0.5">
                                                <div className="size-8 md:size-9 rounded bg-primary flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-white text-[16px] md:text-[18px]">bolt</span>
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="text-slate-200 text-[14px] md:text-[15px] leading-7 markdown-content">
                                                    {streamingIndex === idx ? (
                                                        <TypewriterText
                                                            text={msg.content}
                                                            onComplete={handleStreamComplete}
                                                            scrollRef={messagesEndRef}
                                                        />
                                                    ) : (
                                                        <ReactMarkdown
                                                            components={{
                                                                strong: ({ node, ...props }) => <span className="font-semibold text-white" {...props} />,
                                                                p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                                                                ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 mb-4 space-y-1 text-slate-300" {...props} />,
                                                                ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 mb-4 space-y-1 text-slate-300" {...props} />,
                                                                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mb-3 mt-4" {...props} />,
                                                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-white mb-2 mt-3" {...props} />,
                                                                h3: ({ node, ...props }) => <h3 className="text-base font-bold text-slate-200 mb-2 mt-2" {...props} />,
                                                                code: ({ node, ...props }) => <code className="bg-white/10 text-slate-200 px-1.5 py-0.5 rounded font-mono text-xs" {...props} />
                                                            }}
                                                        >
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    )}
                                                </div>

                                                {/* Sources - only show after streaming complete */}
                                                {streamingIndex !== idx && msg.sources && msg.sources.length > 0 && (
                                                    <div className="mt-4 pt-2">
                                                        <div className="flex flex-wrap gap-2">
                                                            {msg.sources.map((src, i) => (
                                                                <a
                                                                    key={i}
                                                                    href={src}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 px-3 py-1.5 bg-[#1E1F20] hover:bg-[#2A2B2D] rounded-full transition-colors border border-primary/40"
                                                                >
                                                                    <div className="size-5 bg-primary/30 border border-primary/50 rounded-full flex items-center justify-center text-[10px] text-white font-medium">
                                                                        {i + 1}
                                                                    </div>
                                                                    <span className="text-xs text-slate-300 truncate max-w-[100px] md:max-w-[150px]">
                                                                        {(() => {
                                                                            try {
                                                                                return new URL(src).hostname.replace('www.', '');
                                                                            } catch {
                                                                                return "Source";
                                                                            }
                                                                        })()}
                                                                    </span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Actions - only show after streaming complete */}
                                                {streamingIndex !== idx && (
                                                    <div className="flex gap-1 mt-3">
                                                        <IconBtn
                                                            icon="content_copy"
                                                            onClick={() => handleCopy(msg.content, `ai-${idx}`)}
                                                            title="Copy"
                                                            isCopied={copiedId === `ai-${idx}`}
                                                        />
                                                        <IconBtn
                                                            icon="thumb_up"
                                                            onClick={() => handleLike(idx)}
                                                            title="Like"
                                                            isActive={likedMessages[idx]}
                                                        />
                                                        <IconBtn
                                                            icon="thumb_down"
                                                            onClick={() => handleDislike(idx)}
                                                            title="Dislike"
                                                            isActive={dislikedMessages[idx]}
                                                        />
                                                        <IconBtn icon="share" onClick={() => { }} title="Share" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3 w-full animate-fade-in-up">
                                    <div className="shrink-0 mt-0.5">
                                        <div className="size-8 md:size-9 rounded bg-primary flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white text-[16px] md:text-[18px] animate-spin">sync</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-2"></div>
                                        <div className="h-4 w-[60%] bg-white/5 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Input - Show when in chat layout (loading or has messages) */}
            {showChatLayout && (
                <div className="w-full px-4 py-4 bg-background-dark">
                    <div className="w-full max-w-3xl mx-auto">
                        <div className="relative bg-surface-dark rounded-2xl border border-border-dark focus-within:border-primary/50 transition-all duration-200">
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                autoFocus
                                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 font-normal outline-none resize-none custom-scrollbar px-4 md:px-5 pt-4 pb-3 text-sm md:text-base max-h-[200px]"
                                placeholder="Ask QueryNexus anything"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                style={{ minHeight: '50px' }}
                            />
                            <div className="flex items-center justify-between px-3 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="size-8 bg-primary rounded flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-[16px]">bolt</span>
                                    </div>
                                    <button
                                        onClick={() => setResearchActive(!researchActive)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${researchActive
                                            ? 'bg-primary text-white'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">all_inclusive</span>
                                        Research
                                    </button>
                                </div>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!input.trim() || isLoading || streamingIndex !== null}
                                        className={`
                                            size-8 rounded flex items-center justify-center transition-all duration-200
                                            ${input.trim() && !isLoading && streamingIndex === null
                                                ? 'bg-primary text-white hover:brightness-110'
                                                : 'bg-transparent text-slate-600 cursor-not-allowed'}
                                        `}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="mt-3 text-center text-[10px] md:text-xs text-slate-500">
                            QueryNexus can make mistakes. <span className="underline cursor-pointer hover:text-slate-400">Check answers.</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
