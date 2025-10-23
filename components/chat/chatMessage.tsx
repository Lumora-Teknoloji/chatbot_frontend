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
        // Kullanıcı Avatırı
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">Ö</div>
    ) : (
        // AI Avatırı
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-green-400 flex-shrink-0">AI</div>
    );

    return (
        <div className={`flex w-full mb-6 ${containerClasses}`}>

            {/* İkon / Avatar (AI için sola, kullanıcı için sağa) */}
            {!isUser && <div className="mr-3">{icon}</div>}

            {/* Mesaj İçeriği */}
            <div className={`max-w-3xl ${isUser ? 'ml-auto' : 'mr-auto'}`}>
                <div className={`p-4 rounded-xl ${isUser ? 'bg-gray-800 text-white' : 'bg-gray-800/50'} 
                  // KRİTİK: Taşan kelimeleri zorla kır.
                  break-words overflow-hidden`}>

                    {isUser
                        // Kullanıcı metnini düz göster (whitespace-pre-wrap metni olduğu gibi tutar, break-words zorlar)
                        ? <p className="text-gray-200 whitespace-pre-wrap break-words">{message.content}</p>

                        // AI metnini Markdown ile render et
                        : <MarkdownRenderer content={message.content} />  // AI metnini Markdown ile render et
                    }
                </div>
            </div>

            {/* İkon / Avatar (Kullanıcı için sağa) */}
            {isUser && <div className="ml-3">{icon}</div>}

        </div>
    );
};

export default ChatMessage;