import React, { useState, useRef, useEffect } from 'react';
import Header from './Header';
import axios from 'axios';

export default function Dashboard() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { type: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // Updated to match the backend Pydantic model (input_data)
            const response = await axios.post('http://localhost:8000/api/response', {
                payload: input
            });

            // Handle response: Backend returns { "msg": "..." }
            const responseContent = response.data?.msg || response.data?.response || response.data?.message || JSON.stringify(response.data);
            const aiMessage = { type: 'ai', content: responseContent };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Error fetching response:", error);
            const errorMessage = { type: 'ai', content: "Unable to connect to VeloMarketSense engine. Please ensure the backend is running." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const hasMessages = messages.length > 0;

    return (
        <>
            <Header />
            <div className={`flex-1 flex flex-col w-full max-w-4xl mx-auto transition-all duration-500 ease-in-out ${hasMessages ? 'justify-end pb-32 pt-12 md:pt-4' : 'items-center justify-center pb-32 pt-0'}`}>

                {/* Hero Section - Fades out when chat starts */}
                {!hasMessages && (
                    <div className="text-center mb-16 animate-fade-in-up">
                        <div className="flex justify-center mb-8">
                            <span className="material-symbols-outlined text-[72px] text-primary/20 animate-pulse-slow">tsunami</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-500 tracking-tight mb-4">
                            What are we researching?
                        </h2>
                        <p className="text-slate-400 text-lg font-light max-w-lg mx-auto leading-relaxed">
                            Access deep market liquidity pools and sentiment analysis via <span className="text-primary font-medium border-b border-primary/20 pb-0.5">RAG</span>.
                        </p>
                    </div>
                )}

                {/* Messages List */}
                {hasMessages && (
                    <div className="w-full space-y-6 px-4 mb-8 overflow-y-auto custom-scrollbar">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-base leading-relaxed break-words whitespace-pre-wrap ${msg.type === 'user'
                                    ? 'bg-primary/10 text-primary border border-primary/20 rounded-tr-sm'
                                    : 'bg-surface-dark border border-white/10 text-slate-200 rounded-tl-sm shadow-lg'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-fade-in-up">
                                <div className="bg-surface-dark border border-white/10 rounded-2xl p-4 flex gap-2 items-center rounded-tl-sm">
                                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Input Area */}
                <div className={`w-full px-4 transition-all duration-500 z-20 ${hasMessages ? 'fixed bottom-6 left-0 right-0 max-w-3xl mx-auto' : 'max-w-2xl relative'}`}>
                    <div className={`relative flex items-end bg-surface-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/5 focus-within:border-primary/50 transition-all ${hasMessages ? 'p-2' : 'px-4 py-3'}`}>
                        {!hasMessages && (
                            <div className="flex items-center justify-center h-[32px] pr-4 border-r border-white/10 mr-4 text-slate-500 mb-1.5">
                                <span className="material-symbols-outlined text-[24px]">search_insights</span>
                            </div>
                        )}

                        <textarea
                            ref={textareaRef}
                            rows={1}
                            autoFocus
                            className={`w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-600 font-normal outline-none resize-none custom-scrollbar py-2 ${hasMessages ? 'text-sm pl-2 max-h-[150px]' : 'text-lg max-h-[200px]'}`}
                            placeholder="Ask VeloMarketSense..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />

                        <div className="flex items-center gap-2 pl-2 pb-1">
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className={`bg-primary hover:bg-primary/90 text-background-dark p-2 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-[0_0_10px_rgba(0,229,255,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <span className="material-symbols-outlined font-bold text-[20px]">arrow_upward</span>
                            </button>
                        </div>
                    </div>
                    {!hasMessages && (
                        <p className="mt-4 text-center text-xs text-slate-500 font-medium tracking-wide">
                            Press <kbd className="font-sans px-1.5 py-0.5 bg-white/10 rounded text-slate-300 mx-1">Enter</kbd> to search
                        </p>
                    )}
                </div>
            </div>

            {/* Background Glows */}
            <div className="absolute -bottom-24 -right-24 size-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute -top-24 -left-24 size-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        </>
    );
}
