'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';

interface AppSwitcherProps {
    className?: string;
}

export default function AppSwitcher({ className = '' }: AppSwitcherProps) {
    const pathname = usePathname();
    const isChat = pathname === '/';
    const isDashboard = pathname === '/dashboard';
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Collapsed state: small floating toggle button
    if (isCollapsed) {
        return (
            <button
                onClick={() => setIsCollapsed(false)}
                className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center w-10 h-10 bg-black/30 dark:bg-black/50 backdrop-blur-2xl rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white/40 hover:text-sky-400 hover:bg-black/50 transition-all duration-300 hover:scale-110 ${className}`}
                title="Dock'u aç"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z" clipRule="evenodd" />
                </svg>
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center p-1 bg-black/10 dark:bg-black/40 backdrop-blur-2xl rounded-full border border-white/5 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-fade-in-up ${className}`}>
            <div className="flex items-center gap-1">
                {/* Lumora Chat */}
                <a
                    href="/"
                    className={`flex items-center gap-2.5 px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 ${isChat
                        ? 'bg-white/10 dark:bg-white/5 text-white shadow-sm'
                        : 'text-white/40 hover:text-sky-400 hover:bg-white/5'
                        }`}
                >
                    <div className={`w-4 h-4 flex items-center justify-center ${isChat ? 'text-sky-400' : 'text-white/40'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <span className="tracking-wide">Sohbet</span>
                </a>

                {/* Üretim Paneli */}
                <a
                    href="/dashboard"
                    className={`flex items-center gap-2.5 px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 group ${isDashboard
                        ? 'bg-white/10 dark:bg-white/5 text-white shadow-sm'
                        : 'text-white/40 hover:text-emerald-400 hover:bg-white/5'
                        }`}
                >
                    <div className={`w-4 h-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${isDashboard ? 'text-emerald-400' : 'text-white/40'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm2.25 0c0-.414.336-.75.75-.75h12c.414 0 .75.336.75.75v12c0 .414-.336.75-.75.75H6a.75.75 0 01-.75-.75V6zM8.25 8.25a.75.75 0 00-1.5 0v6.75a.75.75 0 001.5 0v-6.75zM12 5.25a.75.75 0 00-1.5 0v9.75a.75.75 0 001.5 0v-9.75zm3.75 5.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <span className="tracking-wide">Üretim</span>
                </a>

                {/* Collapse button */}
                <button
                    onClick={() => setIsCollapsed(true)}
                    className="flex items-center justify-center w-7 h-7 ml-1 rounded-full text-white/20 hover:text-white/60 hover:bg-white/5 transition-all duration-300"
                    title="Dock'u gizle"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
