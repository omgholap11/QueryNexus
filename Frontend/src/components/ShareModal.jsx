import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ShareModal({ isOpen, onClose }) {
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUrl(window.location.href);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const shareOptions = [
        {
            id: 'whatsapp',
            label: 'WhatsApp',
            icon: 'chat', // Material icon name, approximating WhatsApp
            bg: 'bg-[#25D366]/20',
            text: 'text-[#25D366]',
            action: () => {
                window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
            }
        },
        {
            id: 'email',
            label: 'Email',
            icon: 'mail',
            bg: 'bg-blue-500/20',
            text: 'text-blue-400',
            action: () => {
                window.open(`mailto:?subject=Check this out&body=${encodeURIComponent(url)}`, '_self');
            }
        },
        {
            id: 'copy',
            label: 'Copy Link',
            icon: 'link',
            bg: 'bg-slate-500/20',
            text: 'text-slate-300',
            action: () => {
                navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard');
            }
        },
        // Adding more options for a "complete" feel
        {
            id: 'twitter',
            label: 'X (Twitter)',
            icon: 'flutter_dash', // Alternative icon
            bg: 'bg-white/10',
            text: 'text-white',
            action: () => {
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, '_blank');
            }
        },
        {
            id: 'linkedin',
            label: 'LinkedIn',
            icon: 'work',
            bg: 'bg-[#0077b5]/20',
            text: 'text-[#0077b5]',
            action: () => {
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
            }
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div
                className="w-full max-w-sm bg-surface-dark border border-white/10 rounded-2xl p-6 shadow-2xl transform transition-all animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Share this page</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <span className="material-symbols-outlined text-[24px]">close</span>
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    {shareOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => {
                                option.action();
                                if (option.id === 'copy') {
                                    // Don't close immediately on copy, maybe? 
                                    // Actually usually user wants to copy and leave.
                                    // Let's keep it open for a moment or correct UX.
                                    // Standard behavior: close after action for external links, maybe keep for copy?
                                    // Let's close for all for simplicity, simpler UX.
                                    onClose();
                                }
                            }}
                            className="flex flex-col items-center gap-3 group"
                        >
                            <div className={`size-14 rounded-2xl flex items-center justify-center ${option.bg} group-hover:scale-105 transition-transform duration-200`}>
                                {/* Using simple material icons or SVG logos if available manually, sticking to symbols for now as requested by user environment usually */}
                                {option.id === 'whatsapp' ? (
                                    /* Custom SVG for WhatsApp since material icon might not be enough */
                                    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current text-[#25D366]" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.305-5.252c0-5.458 4.432-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.879-9.879 9.879m0-11.413h.0019l-.002-.0019z" /></svg>
                                ) : option.id === 'twitter' ? (
                                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-white" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zl-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                ) : option.id === 'facebook' ? (
                                    <span className="material-symbols-outlined text-[28px] text-blue-500">facebook</span>
                                ) : (
                                    <span className={`material-symbols-outlined text-[28px] ${option.text}`}>{option.icon}</span>
                                )}
                            </div>
                            <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">
                                {option.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Copy Link Input Field */}
                <div className="bg-background-dark/50 border border-white/10 rounded-lg p-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">link</span>
                    <input
                        type="text"
                        readOnly
                        value={url}
                        className="bg-transparent border-none text-slate-300 text-sm w-full focus:outline-none truncate"
                    />
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(url);
                            toast.success('Link copied');
                        }}
                        className="text-primary hover:text-primary-light font-medium text-sm whitespace-nowrap"
                    >
                        Copy
                    </button>
                </div>

            </div>
        </div>
    );
}
