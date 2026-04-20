'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

interface AppSwitcherProps {
    className?: string;
}

export default function AppSwitcher({ className = '' }: AppSwitcherProps) {
    const pathname = usePathname();
    const isChat = pathname === '/';
    const isDashboard = pathname === '/dashboard';

    return (
        <div className={`flex items-center p-1 bg-black/10 dark:bg-black/40 backdrop-blur-2xl rounded-full border border-white/5 dark:border-white/10 shadow-lg ${className}`}>
            <div className="flex items-center gap-1">
                {/* Lumora Chat */}
                <a
                    href="/"
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300 ${isChat
                        ? 'bg-white/10 dark:bg-white/5 text-white shadow-sm ring-1 ring-white/10'
                        : 'text-white/40 hover:text-sky-400 hover:bg-white/5'
                        }`}
                >
                    <div className={`w-3.5 h-3.5 flex items-center justify-center ${isChat ? 'text-sky-400' : 'text-white/40'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <span className="tracking-wide">Sohbet</span>
                </a>

                {/* Üretim Paneli */}
                <a
                    href="/dashboard"
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300 group ${isDashboard
                        ? 'bg-white/10 dark:bg-white/5 text-white shadow-sm ring-1 ring-white/10'
                        : 'text-white/40 hover:text-emerald-400 hover:bg-white/5'
                        }`}
                >
                    <div className={`w-3.5 h-3.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${isDashboard ? 'text-emerald-400' : 'text-white/40'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm2.25 0c0-.414.336-.75.75-.75h12c.414 0 .75.336.75.75v12c0 .414-.336.75-.75.75H6a.75.75 0 01-.75-.75V6zM8.25 8.25a.75.75 0 00-1.5 0v6.75a.75.75 0 001.5 0v-6.75zM12 5.25a.75.75 0 00-1.5 0v9.75a.75.75 0 001.5 0v-9.75zm3.75 5.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <span className="tracking-wide">Üretim</span>
                </a>
            </div>
        </div>
    );
}
