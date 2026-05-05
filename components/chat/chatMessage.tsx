// components/chat/chatMessage.tsx
import React, { useMemo, useState } from 'react';
import MarkdownRenderer from './markdownRenderer';
// TIP TANIMLARI İÇİN 'type' ANAHTAR KELİMESİNİ KULLANIYORUZ
import type { ChatMessage } from '@/types/chat';
import { useLightbox } from '@/components/ui/lightbox-provider';

interface ChatMessageProps {
    message: ChatMessage;
    userProfile?: { email?: string; full_name?: string | null; username?: string };
    avatarOverride?: string;
    isGuest?: boolean;
    onRegenerate?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, userProfile, avatarOverride, isGuest, onRegenerate }) => {
    const isUser = message.sender === 'user';
    const isStreaming = message.id === 'streaming-ai';
    const { openLightbox } = useLightbox();
    const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);

    const handleFeedback = (type: 'like' | 'dislike') => {
        if (feedback === type) {
            setFeedback(null);
            console.log(`[Feedback] Removed ${type} for message ${message.id}`);
        } else {
            setFeedback(type);
            console.log(`[Feedback] Set ${type} for message ${message.id}`);
        }
    };

    const defaultAvatarUrl = '/default-avatar.svg';

    const { gravatarUrl, fallbackAvatarUrl } = useMemo(() => {
        if (isGuest) {
            return { gravatarUrl: defaultAvatarUrl, fallbackAvatarUrl: defaultAvatarUrl };
        }
        if (avatarOverride) {
            return { gravatarUrl: avatarOverride, fallbackAvatarUrl: defaultAvatarUrl };
        }
        return { gravatarUrl: defaultAvatarUrl, fallbackAvatarUrl: defaultAvatarUrl };
    }, [avatarOverride, isGuest]);

    const [imgSrc, setImgSrc] = useState(gravatarUrl || fallbackAvatarUrl);

    React.useEffect(() => {
        setImgSrc(gravatarUrl || fallbackAvatarUrl);
    }, [gravatarUrl, fallbackAvatarUrl]);

    // Mesajın stil ve ikonunu belirleme
    const containerClasses = isUser ? 'justify-end' : 'justify-start';

    // Avatar boyutunu küçült (ChatGPT tarzı - 8x8 = 2rem)
    const icon = isUser ? (
        <img
            src={imgSrc}
            alt="Kullanıcı"
            className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-white/10"
            loading="lazy"
            onError={() => {
                if (imgSrc !== fallbackAvatarUrl) {
                    setImgSrc(fallbackAvatarUrl);
                }
            }}
        />
    ) : (
        <div className="w-9 h-9 flex items-center justify-center shrink-0 drop-shadow-md">
            <img
                src="/lumora_logo.png"
                alt="Lumora AI"
                className="w-full h-auto object-contain"
            />
        </div>
    );

    return (
        <div className={`flex w-full mb-2 ${containerClasses} animate-fade-in group`}>

            {/* İkon / Avatar (AI için sola) - Sadece AI için göster, kullanıcı için gizle (ChatGPT stilinde genelde kullanıcı avatarı yoktur ama isteğe bağlı) */}
            {!isUser && (
                <div className="mr-4 flex-shrink-0 mt-1">
                    {icon}
                </div>
            )}

            {/* Mesaj İçeriği */}
            <div className={`flex flex-col ${isUser ? 'max-w-3xl ml-auto' : 'max-w-5xl w-full'}`}>

                {/* İsim alanı (Opsiyonel - ChatGPT'de var) */}
                <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-xs font-semibold text-gray-400">
                        {isUser ? 'Siz' : 'Lumora AI'}
                    </span>
                </div>

                <div className={`
                    relative px-5 py-3 text-[15px] leading-relaxed
                    ${isUser
                        ? 'bg-[#2F2F2F] text-gray-100 rounded-3xl rounded-tr-sm shadow-sm' // Kullanıcı: Koyu gri bubble
                        : 'bg-transparent text-gray-100 pl-0' // AI: Transparent, bubble yok
                    } 
                    ${message.isStopped ? 'opacity-60 italic' : ''}
                    break-words overflow-hidden
                `}>

                    {/* Resim gösterimi */}
                    {(message.imageUrls && message.imageUrls.length > 0) || message.imageUrl ? (
                        <div className="mb-4">
                            <div className="flex flex-wrap gap-3">
                                {(message.imageUrls && message.imageUrls.length > 0 ? message.imageUrls : message.imageUrl ? [message.imageUrl] : []).map((imageUrl, index) => {
                                    // Gerekli URL normalizasyonu
                                    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8000';
                                    const normalizedUrl = (imageUrl.startsWith('/') && !imageUrl.startsWith('http'))
                                        ? `${BACKEND_URL}${imageUrl}`
                                        : imageUrl;
                                    return (
                                        <div key={index} className="relative rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-gray-900/50 group/img cursor-pointer max-w-sm w-full aspect-square" onClick={() => openLightbox(normalizedUrl)}>
                                            <img
                                                src={normalizedUrl}
                                                alt={`AI generated ${index + 1}`}
                                                className="w-full h-full object-cover transition-all duration-300 group-hover/img:scale-[1.05]"
                                                loading="eager"
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : null}

                    {/* Metin içeriği */}
                    {message.content && (
                        <div className="text-gray-100">
                            {isUser ? (
                                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            ) : (
                                <>
                                    <div className="prose prose-invert prose-p:text-gray-50 prose-headings:text-white prose-strong:text-white prose-li:text-gray-50 prose-p:leading-relaxed prose-pre:bg-[#0d0d0d] prose-pre:border prose-pre:border-white/10 max-w-none">
                                        <MarkdownRenderer content={message.content} />

                                        {/* Görsel linkleri */}
                                        {(message.imageUrls && message.imageUrls.length > 0) && (
                                            <div className="mt-4 pt-3 border-t border-white/5">
                                                <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Referans Görseller</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {message.imageUrls.map((u, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={u}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-blue-400 transition-colors truncate max-w-[200px]"
                                                        >
                                                            Görsel {idx + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {!isStreaming && (
                                        <div className="flex items-center gap-1 mt-2 text-gray-400 select-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-fade-in">
                                            <button
                                                onClick={() => navigator.clipboard.writeText(message.content)}
                                                className="p-1.5 hover:bg-[#2F2F2F] rounded-md hover:text-gray-200 transition-colors"
                                                title="Kopyala"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
                                                </svg>
                                            </button>
                                            <button
                                                className={`p-1.5 rounded-md transition-colors ${feedback === 'like' ? 'text-green-400 bg-green-400/10' : 'hover:bg-[#2F2F2F] hover:text-gray-200'}`}
                                                title="Beğen"
                                                onClick={() => handleFeedback('like')}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill={feedback === 'like' ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                                </svg>
                                            </button>
                                            <button
                                                className={`p-1.5 rounded-md transition-colors ${feedback === 'dislike' ? 'text-red-400 bg-red-400/10' : 'hover:bg-[#2F2F2F] hover:text-gray-200'}`}
                                                title="Beğenme"
                                                onClick={() => handleFeedback('dislike')}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill={feedback === 'dislike' ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                                </svg>
                                            </button>
                                            <button className="p-1.5 hover:bg-[#2F2F2F] rounded-md hover:text-gray-200 transition-colors" title="Yeniden Yanıtla" onClick={onRegenerate}>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                </svg>
                                            </button>
                                            <button className="p-1.5 hover:bg-[#2F2F2F] rounded-md hover:text-gray-200 transition-colors" title="Paylaş">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                                </svg>
                                            </button>
                                            <button className="p-1.5 hover:bg-[#2F2F2F] rounded-md hover:text-gray-200 transition-colors" title="Daha fazla">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* İkon / Avatar (Kullanıcı için sağa) */}
            {isUser && (
                <div className="ml-4 flex-shrink-0 mt-1">
                    {icon}
                </div>
            )}

        </div>
    );
};

export default ChatMessage;