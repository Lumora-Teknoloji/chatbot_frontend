// components/chat/chatMessage.tsx
import React from 'react';
import MarkdownRenderer from './markdownRenderer';
// TIP TANIMLARI İÇİN 'type' ANAHTAR KELİMESİNİ KULLANIYORUZ
import type { ChatMessage } from '@/types/chat';

interface ChatMessageProps {
    message: ChatMessage;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const isUser = message.sender === 'user';

    // Mesajın stil ve ikonunu belirleme
    const containerClasses = isUser ? 'justify-end' : 'justify-start';
    const icon = isUser ? (
        // Kullanıcı Avatar
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg ring-2 ring-blue-500/20">
            Ö
        </div>
    ) : (
        // AI Avatar
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-bold text-green-400 flex-shrink-0 shadow-lg ring-2 ring-green-500/20">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        </div>
    );

    return (
        <div className={`flex w-full mb-6 ${containerClasses} animate-fade-in`}>

            {/* İkon / Avatar (AI için sola, kullanıcı için sağa) */}
            {!isUser && <div className="mr-3">{icon}</div>}

            {/* Mesaj İçeriği */}
            <div className={`max-w-3xl ${isUser ? 'ml-auto' : 'mr-auto'}`}>
                <div className={`p-5 rounded-2xl shadow-xl backdrop-blur-sm transition-all duration-200 hover:shadow-2xl
                  ${isUser 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white border border-blue-500/30' 
                    : 'bg-gray-800/60 text-gray-100 border border-gray-700/50'
                  } 
                  break-words overflow-hidden`}>

                    {/* Resim gösterimi */}
                    {message.imageUrl && (
                        <div className="mb-3 -mx-1">
                            <div className="relative rounded-xl overflow-hidden border border-gray-700/50 shadow-lg">
                                <img 
                                    src={message.imageUrl} 
                                    alt="Yüklenen görsel" 
                                    className="max-w-full h-auto object-contain max-h-96 w-full"
                                />
                            </div>
                        </div>
                    )}

                    {/* Metin içeriği */}
                    {message.content && (
                        <div className={isUser ? 'text-white' : 'text-gray-100'}>
                            {isUser ? (
                                <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <MarkdownRenderer content={message.content} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* İkon / Avatar (Kullanıcı için sağa) */}
            {isUser && <div className="ml-3">{icon}</div>}

        </div>
    );
};

export default ChatMessage;