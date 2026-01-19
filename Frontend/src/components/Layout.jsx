import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    return (
        <div className="flex bg-background-dark text-slate-100 h-screen overflow-hidden">
            {/* Mobile Sidebar Overlay - only show if authenticated */}
            {isAuthenticated && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - only show if authenticated */}
            {isAuthenticated && (
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
            )}

            <main className="flex-1 flex flex-col relative overflow-hidden bg-background-dark w-full">
                {/* Mobile Toggle Button or Logo */}
                {isAuthenticated ? (
                    <button
                        className="absolute top-4 left-4 z-20 md:hidden text-slate-400 p-2"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                ) : (
                    /* Logo for unauthenticated users */
                    <div className="absolute top-4 left-4 z-20">
                        <div className="size-10 bg-primary rounded flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[20px]">bolt</span>
                        </div>
                    </div>
                )}
                {React.cloneElement(children, { isSidebarCollapsed: isAuthenticated ? isSidebarCollapsed : false })}
            </main>
        </div>
    );
}

