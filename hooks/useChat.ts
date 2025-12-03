// hooks/useChat.ts - Backend Socket.IO ve REST API entegrasyonu
'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8000';
const SOCKET_URL = BACKEND_URL;

export const useChat = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [currentConversationId, setCurrentConversationId] = useState<number | string | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    // Auth token'ı localStorage'dan al ve misafir modunu kontrol et
    useEffect(() => {
        const updateAuthState = () => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('auth_token');
                const guestMode = localStorage.getItem('guest_mode') === 'true';
                const isGuestMode = guestMode && !token;
                setAuthToken(token);
                setIsGuest(isGuestMode); // Misafir modu: guest_mode true ve token yok
                
            }
        };
        
        // İlk mount'ta kontrol et
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth_token');
            const guestMode = localStorage.getItem('guest_mode') === 'true';
            const isGuestMode = guestMode && !token;
            setAuthToken(token);
            setIsGuest(isGuestMode);
            
        }
        
        // Custom event dinle (misafir modu aktifleştirildiğinde)
        if (typeof window !== 'undefined') {
            window.addEventListener('guestModeActivated', updateAuthState);
            return () => {
                window.removeEventListener('guestModeActivated', updateAuthState);
            };
        }
    }, []); // Sadece mount'ta çalışır

    // Socket.IO bağlantısını kur
    useEffect(() => {
        // İlk render'da henüz state set edilmemiş olabilir, localStorage'dan kontrol et
        if (typeof window === 'undefined') return;
        
        const token = localStorage.getItem('auth_token');
        const guestMode = localStorage.getItem('guest_mode') === 'true';
        const shouldConnect = token || (guestMode && !token);
        
        if (!shouldConnect) {
            // Mevcut bağlantıyı kapat
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }
        
        // State'i güncelle (localStorage'dan okunan değerle)
        if (guestMode && !token) {
            setIsGuest(true);
            setAuthToken(null);
        }
        if (token) {
            setAuthToken(token);
            setIsGuest(false);
        }

        // Eğer zaten bağlıysa ve aynı moddaysa yeniden bağlanma
        if (socketRef.current && socketRef.current.connected) {
            const currentToken = localStorage.getItem('auth_token');
            const currentGuestMode = localStorage.getItem('guest_mode') === 'true';
            const sameMode = (token && currentToken === token) || (!token && currentGuestMode && !currentToken);
            
            if (sameMode) {
                return;
            } else {
                // Farklı modda, bağlantıyı kapat ve yeniden kur
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        }

        // Socket.IO bağlantısı
        const socketOptions: any = {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        };

        // Token varsa auth'a ekle, yoksa misafir modu (auth gönderme)
        if (token) {
            socketOptions.auth = { token: token };
        }
        // Misafir modunda auth göndermiyoruz, backend otomatik misafir olarak kabul edecek

        socketRef.current = io(SOCKET_URL, socketOptions);

        const socket = socketRef.current;

        socket.on('connect', () => {
            // Misafir modunu tekrar kontrol et (state güncellenmiş olabilir)
            const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token')) : false;
            if (currentGuestMode) {
                setIsGuest(true); // State'i güncelle
            }
        });
        
        socket.on('connect_error', (error) => {
            console.error('❌ Socket.IO bağlantı hatası:', error);
        });

        socket.on('disconnect', (reason) => {
            // Misafir modunda oturum kapandığında tüm verileri temizle
            const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token')) : false;
            if (currentGuestMode) {
                localStorage.removeItem('guest_mode');
                setMessages([]);
                setCurrentConversationId(null);
                setIsGuest(false);
            }
        });

        socket.on('connect_error', (error) => {
            console.error('Socket.IO bağlantı hatası:', error);
        });

        // AI mesajını dinle
        socket.on('ai_message', (data: {
            id: number | string;
            conversation_id: number | string;
            content?: string;
            image_url?: string;
            image_urls?: string[];
            created_at: string;
        }) => {

            // Misafir modunda conversation ID'yi set et
            const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token')) : false;
            if (currentGuestMode && !currentConversationId) {
                setCurrentConversationId(data.conversation_id);
                setIsGuest(true); // State'i güncelle
            }

            const aiMessage: ChatMessage = {
                id: `ai-${data.id}`,
                sender: 'ai',
                content: data.content || '',
                imageUrl: data.image_url,  // Backward compatibility için
                imageUrls: data.image_urls || (data.image_url ? [data.image_url] : undefined),  // Tüm görselleri al
                timestamp: new Date(data.created_at).getTime(),
            };

            setMessages(prev => [...prev, aiMessage]);
            setIsLoading(false);
        });

        socket.on('error', (error: { message: string }) => {
            console.error('Socket.IO hatası:', error);
            setIsLoading(false);
        });

        // Sayfa kapatıldığında veya component unmount olduğunda misafir verilerini temizle
        const handleBeforeUnload = () => {
            if (isGuest) {
                localStorage.removeItem('guest_mode');
            }
        };

        // Sayfa kapatıldığında temizle
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }

        return () => {
            socket.disconnect();
            // Component unmount olduğunda temizle
            const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token')) : false;
            if (currentGuestMode && typeof window !== 'undefined') {
                localStorage.removeItem('guest_mode');
                window.removeEventListener('beforeunload', handleBeforeUnload);
            }
        };
    }, [isGuest, authToken]); // isGuest ve authToken değiştiğinde yeniden bağlan

    // Yeni konuşma başlat
    const startNewChat = useCallback(async () => {
        const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token')) : false;
        if (currentGuestMode) {
            // Misafir modunda conversation ID backend'de otomatik oluşturulacak
            setMessages([]);
            setCurrentConversationId(null); // Socket bağlantısından gelecek
            setIsGuest(true); // State'i güncelle
            return;
        }

        if (!authToken) {
            console.error('Auth token bulunamadı');
            return;
        }

        try {
            const conversation = await api.createConversation(authToken, 'Yeni Konuşma');
            setCurrentConversationId(conversation.id);
            setMessages([]);
        } catch (error) {
            console.error('Konuşma oluşturma hatası:', error);
        }
    }, [authToken]);

    // İlk konuşmayı otomatik oluştur
    useEffect(() => {
        const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token')) : false;
        if ((authToken || currentGuestMode) && !currentConversationId && socketRef.current?.connected) {
            // Misafir modunda conversation ID socket'ten gelecek
            if (!currentGuestMode) {
                startNewChat();
            }
        }
    }, [authToken, currentConversationId, startNewChat]);

    // Mesaj gönder
    const sendMessage = useCallback(async (
        text: string,
        imageUrls?: string[]
    ) => {
        if ((!text.trim() && (!imageUrls || imageUrls.length === 0)) || isLoading) {
            return;
        }

        if (!socketRef.current || !socketRef.current.connected) {
            return;
        }

        // Misafir modunu tekrar kontrol et
        const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token')) : false;
        
        // Misafir modunda conversation ID henüz yoksa bekleyelim (ilk AI mesajından gelecek)
        // Kayıtlı kullanıcılar için conversation ID gerekli
        if (!currentGuestMode && (!authToken || !currentConversationId)) {
            return;
        }

        // Kullanıcı mesajını UI'a ekle
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            sender: 'user',
            content: text || '',
            imageUrl: imageUrls && imageUrls.length > 0 ? imageUrls[0] : undefined,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            // Kayıtlı kullanıcılar için REST API ile mesajı kaydet
            if (!currentGuestMode && authToken && currentConversationId) {
                await api.saveMessage(authToken, {
                    conversation_id: currentConversationId as number,
                    sender: 'user',
                    content: text || undefined,
                    image_url: imageUrls && imageUrls.length > 0 ? imageUrls[0] : undefined,
                });
            }

            // Socket.IO ile mesajı gönder (AI yanıtı için)
            // Misafir modunda conversation_id null olabilir, backend handle edecek
            socketRef.current.emit('user_message', {
                conversation_id: currentConversationId || null,
                message: text || '',
                image_url: imageUrls && imageUrls.length > 0 ? imageUrls[0] : undefined,
            });
        } catch (error) {
            console.error('Mesaj gönderme hatası:', error);
            setIsLoading(false);
        }
    }, [authToken, currentConversationId, isLoading]);

    return useMemo(() => ({
        messages,
        isLoading,
        sendMessage,
        startNewChat,
        isChatStarted: messages.length > 0,
        inputText,
        setInputText,
        isGuest,
    }), [messages, isLoading, sendMessage, startNewChat, inputText, isGuest]);
};
