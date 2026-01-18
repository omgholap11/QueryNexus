import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="flex bg-background-dark text-slate-100 h-screen overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <main className="flex-1 flex flex-col relative overflow-hidden bg-background-dark w-full">
                {/* Mobile Toggle Button */}
                <button
                    className="absolute top-4 left-4 z-20 md:hidden text-slate-400 p-2"
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                {React.cloneElement(children, { isSidebarCollapsed })}
            </main>
        </div>
    );
}
