// hooks/useChat.ts (SİZİN TİP TANIMINIZA GÖRE DÜZELTİLDİ)
'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat'; // Sizin dosyanız
import { io, Socket } from 'socket.io-client';

const RASA_SERVER_URL = 'http://localhost:5005';

const getSenderId = () => {
    if (typeof window === 'undefined') return '';
    let senderId = localStorage.getItem('rasa-sender-id');
    if (!senderId) {
        senderId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('rasa-sender-id', senderId);
    }
    return senderId;
};

export const useChat = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [senderId, setSenderId] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);

    // --- 1. BAĞLANTIYI KUR (Socket.IO) ---
    useEffect(() => {
        const id = getSenderId();
        setSenderId(id);

        socketRef.current = io(RASA_SERVER_URL, {
            transports: ['websocket'],
        });
        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log("✅ Rasa'ya bağlandı (Socket.IO)");
            socket.emit('session_request', { session_id: id });
        });

        socket.on('disconnect', () => {
            console.log("❌ Rasa bağlantısı koptu.");
        });

        // --- 2. BOT MESAJINI DİNLE (Kritik Kısım) ---
        socket.on('bot_uttered', (data: any) => {
            console.log("📩 Bot mesajı geldi:", data);

            const aiMessage: ChatMessage = {
                id: `${Date.now()}-ai-${Math.random()}`,
                sender: 'ai',

                // DÜZELTME: content: string olduğu için null yerine '' (boş string)
                content: data.text || '',

                // DÜZELTME: 'image' yerine 'imageUrl' kullanıldı
                imageUrl: data.image || (data.attachment ? data.attachment.payload.src : null),

                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, aiMessage]);
            setIsLoading(false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // --- 3. MESAJ GÖNDERME (Socket Üzerinden) ---
    const sendMessage = useCallback((text: string) => {
        if (!text.trim() || !socketRef.current || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString() + '-u',
            sender: 'user',
            content: text,
            // imageUrl: null, (Opsiyonel olduğu için eklemeye gerek yok)
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        socketRef.current.emit('user_uttered', {
            message: text,
            session_id: senderId,
        });
    }, [senderId, isLoading]);

    // --- 4. DOSYA YÜKLEME (Hibrit: REST Upload + Socket Trigger) ---
    const uploadFile = useCallback(async (file: File) => {
        if (isLoading || !senderId || !socketRef.current) return;

        setIsLoading(true);

        const optimisticMessage: ChatMessage = {
            id: Date.now().toString() + '-u-file',
            sender: 'user',
            content: `Dosya yükleniyor: ${file.name}`,
            // imageUrl: null,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, optimisticMessage]);

        try {
            // (Mevcut kodunuzdaki '/api/s3-upload' rotasını kullandığınızı varsayıyorum)
            const formData = new FormData();
            formData.append('file', file);
            const uploadResponse = await fetch('/api/s3-upload', {
                method: 'POST',
                body: formData,
            });
            const { url } = await uploadResponse.json();
            if (!url) throw new Error("S3 URL'i alınamadı.");

            console.log("📤 Dosya S3'e yüklendi:", url);

            socketRef.current.emit('user_uttered', {
                message: `/gorsel_yuklendi{"gorsel_url": "${url}"}`,
                session_id: senderId,
            });

            setMessages(prev => prev.slice(0, -1));

        } catch (error) {
            console.error("Yükleme hatası:", error);
            setIsLoading(false);
            setMessages(prev => [...prev.slice(0, -1), {
                id: Date.now().toString(),
                sender: 'ai',
                content: 'Dosya yüklenirken bir hata oluştu.',
                // imageUrl: null,
                timestamp: Date.now()
            }]);
        }
    }, [isLoading, senderId]);

    const startNewChat = useCallback(() => {
        setMessages([]);
    }, []);

    return useMemo(() => ({
        messages,
        isLoading,
        sendMessage,
        uploadFile,
        startNewChat,
        isChatStarted: messages.length > 0,
        inputText,
        setInputText,
        // addImageMessages'i çıkardım, 'uploadFile' ana fonksiyondur.
    }), [messages, isLoading, sendMessage, uploadFile, inputText]);
};