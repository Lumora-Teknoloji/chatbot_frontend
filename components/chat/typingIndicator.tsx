// components/Chat/TypingIndicator.tsx
import React from 'react';

const TypingIndicator: React.FC = () => {
    return (
        <div className="flex w-full mb-6 justify-start animate-fade-in">
            {/* AI Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-bold text-green-400 flex-shrink-0 shadow-lg ring-2 ring-green-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </div>

            {/* Yazıyor Balonu */}
            <div className="ml-3">
                <div className="p-4 rounded-2xl bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 shadow-xl flex items-center space-x-2">
                    <span className="text-gray-300 text-sm">Lumora AI yazıyor</span>
                    {/* Animasyonlu Noktalar */}
                    <div className="flex space-x-1.5">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TypingIndicator;