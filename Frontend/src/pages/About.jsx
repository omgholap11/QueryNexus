import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function About() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('intro');

    // Refs for sections to track scroll
    const sectionRefs = {
        intro: useRef(null),
        architecture: useRef(null),
        data: useRef(null),
        security: useRef(null),
        faq: useRef(null),
    };

    // Sidebar Items
    const navItems = [
        { id: 'intro', label: 'Introduction' },
        { id: 'architecture', label: 'Architecture' },
        { id: 'data', label: 'Data Sources' },
        { id: 'security', label: 'Security' },
        { id: 'faq', label: 'FAQ' },
    ];

    // Scroll Spy Effect
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 100; // Offset for header/padding

            for (const item of navItems) {
                const element = sectionRefs[item.id].current;
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (
                        scrollPosition >= offsetTop &&
                        scrollPosition < offsetTop + offsetHeight
                    ) {
                        setActiveSection(item.id);
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        const element = sectionRefs[id].current;
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 80,
                behavior: 'smooth'
            });
            setActiveSection(id);
        }
    };

    return (
        <div className="min-h-screen bg-background-dark text-slate-300 font-sans selection:bg-primary/30">
            {/* Minimal Header with correct Back Logo placement */}
            <div className="fixed top-0 left-0 p-6 z-50">
                <button
                    onClick={() => navigate('/')}
                    className="group flex items-center justify-center p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-white transition-colors">arrow_back</span>
                </button>
            </div>

            <div className="flex max-w-7xl mx-auto pt-24 px-6 md:px-12 gap-16">
                {/* Left Sidebar Navigation */}
                <aside className="hidden md:block w-64 fixed top-32 left-12 lg:left-24 h-[calc(100vh-8rem)]">
                    <nav className="relative flex flex-col gap-1 border-l border-white/10">
                        {/* Orange Slider Indicator */}
                        <div
                            className="absolute left-[-2px] w-[3px] h-8 bg-primary rounded-full transition-all duration-300 ease-out"
                            style={{
                                top: `${navItems.findIndex(i => i.id === activeSection) * 44 + 4}px`
                            }}
                        />

                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className={`text-left px-6 py-2.5 text-sm font-medium transition-all duration-300 ${activeSection === item.id
                                        ? 'text-white'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 md:ml-72 pb-32 space-y-24">

                    {/* Introduction / Hero */}
                    <section id="intro" ref={sectionRefs.intro} className="space-y-6 pt-10 scroll-mt-32">
                        <div className="size-14 bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-white text-[28px]">bolt</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                            Real-Time Market Intelligence. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Zero Noise.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed border-l-2 border-primary/30 pl-6">
                            Welcome to VeloMarketSense, your advanced intelligence platform for real-time financial news retrieval. In an era of information overload, we exist to streamline your access to the facts—instantly and accurately.
                        </p>
                    </section>

                    {/* Architecture */}
                    <section id="architecture" ref={sectionRefs.architecture} className="space-y-6 scroll-mt-32">
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                            <span className="text-primary">01.</span> Architecture
                        </h2>
                        <div className="space-y-4">
                            <p className="text-slate-300 leading-relaxed">
                                At the heart of VeloMarketSense lies a sophisticated <strong className="text-white">Retrieval-Augmented Generation (RAG)</strong> engine. Unlike standard AI chatbots that can "hallucinate" or invent facts, our system is grounded in reality.
                            </p>
                            <div className="grid gap-4 pt-4">
                                <div className="group">
                                    <h3 className="text-white font-medium mb-1 group-hover:text-primary transition-colors">Retrieve</h3>
                                    <p className="text-slate-400 text-sm">When you ask a question, our system instantly scans thousands of live articles from our trusted financial database.</p>
                                </div>
                                <div className="group">
                                    <h3 className="text-white font-medium mb-1 group-hover:text-primary transition-colors">Verify</h3>
                                    <p className="text-slate-400 text-sm">It selects only the most relevant, credible snippets from top-tier news sources.</p>
                                </div>
                                <div className="group">
                                    <h3 className="text-white font-medium mb-1 group-hover:text-primary transition-colors">Answer</h3>
                                    <p className="text-slate-400 text-sm">Our Secure LLM synthesizes these facts into a clear, concise answer, citing the sources directly.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Data Sources */}
                    <section id="data" ref={sectionRefs.data} className="space-y-8 scroll-mt-32">
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                            <span className="text-primary">02.</span> Trusted Data Sources
                        </h2>
                        <div className="grid md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">APIs & Drivers</h4>
                                <ul className="space-y-3">
                                    {['NewsAPI', 'Finnhub', 'Marketaux', 'MoneyControl'].map(src => (
                                        <li key={src} className="flex items-center gap-2 text-slate-400">
                                            <span className="size-1.5 rounded-full bg-primary/60"></span>
                                            {src}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Publications</h4>
                                <ul className="space-y-3">
                                    {['Bloomberg', 'CNBC', 'MarketWatch', 'Reuters', 'The Economic Times'].map(src => (
                                        <li key={src} className="flex items-center gap-2 text-slate-400">
                                            <span className="size-1.5 rounded-full bg-primary/60"></span>
                                            {src}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Security */}
                    <section id="security" ref={sectionRefs.security} className="space-y-6 scroll-mt-32">
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                            <span className="text-primary">03.</span> Security
                        </h2>
                        <div className="space-y-6">
                            <p className="text-slate-300">We believe that market research should be private and secure.</p>
                            <div className="grid gap-6 md:grid-cols-3">
                                {[
                                    { title: 'Sandboxed LLM', desc: 'Secure integration ensuring your queries remain private.' },
                                    { title: 'No Training Details', desc: 'Your search history is never used to train public AI models.' },
                                    { title: 'HttpOnly Cookies', desc: 'Enterprise-grade session protection and validation.' }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-2">
                                        <h4 className="text-white font-medium">{item.title}</h4>
                                        <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section id="faq" ref={sectionRefs.faq} className="space-y-8 scroll-mt-32">
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                            <span className="text-primary">04.</span> FAQ
                        </h2>
                        <div className="divide-y divide-white/5">
                            {[
                                { q: "Does VeloMarketSense provide financial advice?", a: "No. We provide news and data for you to make decisions, not financial advice." },
                                { q: "How fresh is the news?", a: "Real-time. As soon as a story breaks on major networks, it is indexed." },
                                { q: "Can the AI make up fake news?", a: "We minimize this with RAG. The system answers only using provided news articles." },
                                { q: "Is my search history private?", a: "Yes. Encrypted and isolated. Not used for training." }
                            ].map((faq, i) => (
                                <div key={i} className="py-6 first:pt-0">
                                    <h4 className="text-white font-medium mb-2">{faq.q}</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                </main>
            </div>
        </div>
    );
}
