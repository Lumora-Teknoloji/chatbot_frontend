// hooks/useChat.ts (SİZİN TİP TANIMINIZA GÖRE DÜZELTİLDİ)
'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat'; // Sizin dosyanız
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/app/context/authContext';
import { api } from '@/lib/api';

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
    const [conversationId, setConversationId] = useState<number | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const conversationIdRef = useRef<number | null>(null);
    const { token } = useAuth();

    useEffect(() => {
        conversationIdRef.current = conversationId;
    }, [conversationId]);

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
        socket.on('bot_uttered', async (data: any) => {
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

            if (token && conversationIdRef.current) {
                try {
                    await api.saveMessage(token, {
                        conversation_id: conversationIdRef.current,
                        sender: 'ai',
                        content: aiMessage.content,
                        image_url: aiMessage.imageUrl || undefined,
                    });
                } catch (error) {
                    console.error('Bot mesajı kaydedilemedi:', error);
                }
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [token]);

    const ensureConversation = useCallback(async () => {
        if (!token) return null;
        if (conversationIdRef.current) return conversationIdRef.current;
        const conversation = await api.createConversation(token);
        setConversationId(conversation.id);
        conversationIdRef.current = conversation.id;
        return conversation.id;
    }, [token]);

    // --- 3. MESAJ GÖNDERME (Socket Üzerinden) ---
    const sendMessage = useCallback(async (text: string, imageUrls?: string[]) => {
        if ((!text.trim() && (!imageUrls || imageUrls.length === 0)) || !socketRef.current || isLoading) return;

        let activeConversationId: number | null = null;
        if (token) {
            activeConversationId = await ensureConversation();
        }

        // Kullanıcı mesajını chat'e ekle
        const userMessage: ChatMessage = {
            id: Date.now().toString() + '-u',
            sender: 'user',
            content: text || '',
            imageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : undefined,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        if (token && activeConversationId) {
            try {
                await api.saveMessage(token, {
                    conversation_id: activeConversationId,
                    sender: 'user',
                    content: userMessage.content,
                    image_url: userMessage.imageUrl,
                });
            } catch (error) {
                console.error('Mesaj kaydedilemedi:', error);
            }
        }

        // Eğer görsel varsa, görsel intent'i ile gönder
        if (imageUrls && imageUrls.length > 0) {
            const imageUrl = imageUrls[0]; // İlk görseli gönder
            socketRef.current.emit('user_uttered', {
                message: text.trim() || `/gorsel_yuklendi{"gorsel_url": "${imageUrl}"}`,
                session_id: senderId,
            });
        } else {
            socketRef.current.emit('user_uttered', {
                message: text,
                session_id: senderId,
            });
        }
    }, [senderId, isLoading, token, ensureConversation]);

    // --- 4. DOSYA YÜKLEME (Sadece S3'e yükle, chat'e ekleme) ---
    const uploadFile = useCallback(async (file: File): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadResponse = await fetch('/api/s3-upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error('S3 yükleme isteği başarısız oldu');
            }

            const { url } = await uploadResponse.json();
            if (!url) throw new Error("S3 URL'i alınamadı.");

            return url;
        } catch (error) {
            console.error("Yükleme hatası:", error);
            return null;
        }
    }, []);

    const startNewChat = useCallback(() => {
        setMessages([]);
        setConversationId(null);
        conversationIdRef.current = null;
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
        conversationId,
    }), [messages, isLoading, sendMessage, uploadFile, inputText, conversationId]);
};