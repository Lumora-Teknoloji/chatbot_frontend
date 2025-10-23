// components/Chat/TypingIndicator.tsx
import React from 'react';

const TypingIndicator: React.FC = () => {
    return (
        <div className="flex w-full mb-6 justify-start animate-fade-in">
            {/* AI Avatırı */}
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-green-400 flex-shrink-0">
                AI
            </div>

            {/* Yazıyor Balonu */}
            <div className="ml-3">
                <div className="p-4 rounded-xl bg-gray-800/50 flex items-center space-x-1">
                    <span className="text-gray-400">Lumora AI yazıyor</span>
                    {/* Animasyonlu Noktalar */}
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse delay-200"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse delay-400"></span>
                </div>
            </div>
        </div>
    );
};

export default TypingIndicator;