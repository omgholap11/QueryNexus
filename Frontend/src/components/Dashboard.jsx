import React, { useState, useRef, useEffect } from 'react';
import Header from './Header';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

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
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

    const chatTitle = messages.length > 0 && messages[1]?.type === 'ai'
        ? messages[0]?.content
        : null;

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

    useEffect(() => {
        if (streamingIndex === null) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading]);

    const handleSend = async (customMessage = null) => {
        const messageToSend = customMessage || input;
        if (!messageToSend.trim() || isLoading) return;

        const userMessage = { type: 'user', content: messageToSend };
        setMessages(prev => [...prev, userMessage]);

        if (!customMessage) setInput("");
        setIsLoading(true);

        try {
            const payload = {
                payload: {
                    question: messageToSend,
                    session_id: sessionId ? sessionId : "null"
                }
            };

            const response = await axios.post('http://localhost:8000/api/chat/getresponse', payload);

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
        } catch (error) {
            console.error("Error fetching response:", error);
            const errorMessage = { type: 'ai', content: "**Error**: Unable to connect to VeloMarketSense engine." };
            setMessages(prev => [...prev, errorMessage]);
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
        <div className="flex flex-col h-full w-full">
            <Header title={chatTitle} />

            <div className={`flex-1 overflow-y-auto custom-scrollbar w-full ${hasMessages ? 'pb-28' : ''}`}>
                <div className={`w-full max-w-3xl mx-auto transition-all duration-500 ease-in-out min-h-full flex flex-col px-4 ${hasMessages ? 'justify-start pt-6 md:pt-8' : 'items-center justify-center'}`}>

                    {!hasMessages && (
                        <div className="text-center mb-16 animate-fade-in-up relative z-10 w-full">
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-[48px] md:text-[64px] text-primary animate-pulse-slow">bolt</span>
                                </div>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
                                Unlock Market Intelligence
                            </h2>
                            <p className="text-slate-400 text-base md:text-lg font-light max-w-lg mx-auto leading-relaxed">
                                Real-time analysis fueled by <span className="text-primary font-semibold">Live Data</span> and <span className="text-purple-400 font-semibold">Deep RAG</span> chains.
                            </p>
                        </div>
                    )}

                    {hasMessages && (
                        <div className="w-full space-y-6">
                            {messages.map((msg, idx) => (
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
                                                <div className="size-8 md:size-9 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary text-[18px] md:text-[20px]">bolt</span>
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
                                        <div className="size-8 md:size-9 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary text-[18px] md:text-[20px] animate-spin">sync</span>
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

            <div className="w-full px-4 py-4 bg-background-dark">
                <div className="w-full max-w-3xl mx-auto relative bg-[#1E1F20] rounded-2xl border border-white/10 focus-within:border-primary/50 transition-all duration-200">
                    <div className="flex items-end">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            autoFocus
                            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 font-normal outline-none resize-none custom-scrollbar px-4 md:px-5 py-4 text-sm md:text-base max-h-[200px]"
                            placeholder="Ask VeloMarketSense..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{ minHeight: '56px' }}
                        />

                        <div className="flex items-center pr-3 pb-3">
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading || streamingIndex !== null}
                                className={`
                                    size-10 rounded-full flex items-center justify-center transition-all duration-200
                                    ${input.trim() && !isLoading && streamingIndex === null
                                        ? 'bg-primary text-white hover:brightness-110'
                                        : 'bg-transparent text-slate-600 cursor-not-allowed'}
                                `}
                            >
                                <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                            </button>
                        </div>
                    </div>
                </div>
                <p className="mt-3 text-center text-[10px] md:text-xs text-slate-500">
                    VeloMarketSense can make mistakes. Verify important info.
                </p>
            </div>
        </div>
    );
}
