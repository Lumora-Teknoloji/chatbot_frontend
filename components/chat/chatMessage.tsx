// components/chat/chatMessage.tsx
import React, { useMemo } from 'react';
import MarkdownRenderer from './markdownRenderer';
// TIP TANIMLARI İÇİN 'type' ANAHTAR KELİMESİNİ KULLANIYORUZ
import type { ChatMessage } from '@/types/chat';

interface ChatMessageProps {
    message: ChatMessage;
    userProfile?: { email?: string; full_name?: string | null; username?: string };
    avatarOverride?: string;
    isGuest?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, userProfile, avatarOverride, isGuest }) => {
    const isUser = message.sender === 'user';

    // Basit MD5 (Gravatar için)
    const md5 = (str: string) => {
        /* c8 ignore start */
        const utf8 = new TextEncoder().encode(str);
        let output = '';
        // Minimal MD5 implementation (non-optimized, short input)
        const r = (x: number, n: number) => (x << n) | (x >>> (32 - n));
        const k = [
            0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
            0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
            0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
            0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
            0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
            0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
            0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
            0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
        ];
        const s = [7,12,17,22, 5,9,14,20, 4,11,16,23, 6,10,15,21];
        const m: number[] = [];
        for (let i = 0; i < utf8.length; i++) m[i >> 2] |= utf8[i] << ((i % 4) * 8);
        const l = utf8.length * 8;
        m[l >> 5] |= 0x80 << (l % 32);
        m[((l + 64 >>> 9) << 4) + 14] = l;
        let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
        for (let i = 0; i < m.length; i += 16) {
            const [oa, ob, oc, od] = [a, b, c, d];
            for (let j = 0; j < 64; j++) {
                let f: number; let g: number;
                if (j < 16) { f = (b & c) | (~b & d); g = j; }
                else if (j < 32) { f = (d & b) | (~d & c); g = (5*j + 1) % 16; }
                else if (j < 48) { f = b ^ c ^ d; g = (3*j + 5) % 16; }
                else { f = c ^ (b | ~d); g = (7*j) % 16; }
                const tmp = d;
                d = c;
                c = b;
                b = b + r((a + f + k[j] + (m[i + g] | 0)) | 0, s[(j>>4)*4 + (j%4)]);
                a = tmp;
            }
            a = (a + oa) | 0; b = (b + ob) | 0; c = (c + oc) | 0; d = (d + od) | 0;
        }
        const toHex = (n: number) => ('00000000' + (n >>> 0).toString(16)).slice(-8);
        output = toHex(a) + toHex(b) + toHex(c) + toHex(d);
        return output;
        /* c8 ignore end */
    };

    const defaultAvatarUrl = '/default-avatar.svg';

    const { gravatarUrl, fallbackAvatarUrl } = useMemo(() => {
        if (isGuest) {
            return { gravatarUrl: null, fallbackAvatarUrl: defaultAvatarUrl };
        }
        if (avatarOverride) {
            return { gravatarUrl: avatarOverride, fallbackAvatarUrl: avatarOverride };
        }
        const email = userProfile?.email?.trim().toLowerCase();
        if (!email) return { gravatarUrl: null, fallbackAvatarUrl: defaultAvatarUrl };
        const hash = md5(email);
        const gravUrl = `https://www.gravatar.com/avatar/${hash}?d=404`;
        return { gravatarUrl: gravUrl, fallbackAvatarUrl: defaultAvatarUrl };
    }, [userProfile, avatarOverride, isGuest]);

    // Mesajın stil ve ikonunu belirleme
    const containerClasses = isUser ? 'justify-end' : 'justify-start';
    const icon = isUser ? (
        <img
            src={gravatarUrl || fallbackAvatarUrl}
            alt="Kullanıcı"
            className="w-10 h-10 rounded-full object-cover shadow-lg ring-2 ring-blue-500/20 bg-gray-800"
            loading="lazy"
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== fallbackAvatarUrl) {
                    target.src = fallbackAvatarUrl;
                }
            }}
        />
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

                    {/* Resim gösterimi - Birden fazla görseli destekle */}
                    {(message.imageUrls && message.imageUrls.length > 0) || message.imageUrl ? (
                        <div className="mb-3 -mx-1">
                            <div className="grid grid-cols-1 gap-3">
                                {(message.imageUrls && message.imageUrls.length > 0 ? message.imageUrls : message.imageUrl ? [message.imageUrl] : []).map((imageUrl, index) => (
                                    <div key={index} className="relative rounded-xl overflow-hidden border border-gray-700/50 shadow-lg bg-gray-900/50">
                                        <img 
                                            src={imageUrl} 
                                            alt={`AI tarafından üretilen görsel ${index + 1}`} 
                                            className="max-w-full h-auto object-contain max-h-96 w-full"
                                            onError={(e) => {
                                                // eslint-disable-next-line no-console
                                                console.error('Görsel yüklenemedi:', imageUrl);
                                                const target = e.target as HTMLImageElement;
                                                const parent = target.parentElement;
                                                if (parent && !parent.querySelector('.error-message')) {
                                                    const errorDiv = document.createElement('div');
                                                    errorDiv.className = 'error-message absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 p-4';
                                                    errorDiv.innerHTML = `
                                                        <div class="text-red-400 text-sm mb-2">Görsel yüklenemedi</div>
                                                        <a href="${imageUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 text-xs hover:underline">
                                                            Linki aç
                                                        </a>
                                                    `;
                                                    parent.appendChild(errorDiv);
                                                    target.style.opacity = '0.3';
                                                }
                                            }}
                                            onLoad={() => {
                                                // eslint-disable-next-line no-console
                                                console.log('Görsel başarıyla yüklendi:', imageUrl);
                                            }}
                                            loading="lazy"
                                            referrerPolicy="no-referrer-when-downgrade"
                                            decoding="async"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

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