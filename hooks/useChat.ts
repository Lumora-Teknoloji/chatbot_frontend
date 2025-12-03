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
                
                console.log('🔑 useChat auth kontrol (event):', { 
                    token: token ? 'var' : 'yok', 
                    guestMode, 
                    isGuestMode 
                });
            }
        };
        
        // İlk mount'ta kontrol et
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth_token');
            const guestMode = localStorage.getItem('guest_mode') === 'true';
            const isGuestMode = guestMode && !token;
            setAuthToken(token);
            setIsGuest(isGuestMode);
            
            console.log('🔑 useChat auth kontrol (mount):', { 
                token: token ? 'var' : 'yok', 
                guestMode, 
                isGuestMode 
            });
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
        
        console.log('🔌 Socket.IO bağlantı kontrolü:', { 
            token: token ? 'var' : 'yok', 
            guestMode, 
            shouldConnect,
            isGuest_state: isGuest,
            authToken_state: authToken ? 'var' : 'yok'
        });
        
        if (!shouldConnect) {
            console.log('⚠️ Auth token bulunamadı ve misafir modu aktif değil');
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
                console.log('✅ Socket.IO zaten bağlı ve aynı modda');
                return;
            } else {
                // Farklı modda, bağlantıyı kapat ve yeniden kur
                console.log('🔄 Mod değişti, bağlantı yeniden kuruluyor...');
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

        console.log('🔗 Socket.IO bağlantısı kuruluyor...');
        socketRef.current = io(SOCKET_URL, socketOptions);

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('✅ Backend Socket.IO bağlantısı kuruldu, Socket ID:', socket.id);
            console.log('📊 Bağlantı durumu:', { 
                connected: socket.connected,
                id: socket.id 
            });
            // Misafir modunu tekrar kontrol et (state güncellenmiş olabilir)
            const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token')) : false;
            if (currentGuestMode) {
                console.log('👤 Misafir modu aktif');
                setIsGuest(true); // State'i güncelle
            }
        });
        
        socket.on('connect_error', (error) => {
            console.error('❌ Socket.IO bağlantı hatası:', error);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Backend Socket.IO bağlantısı koptu, Sebep:', reason);
            
            // Misafir modunda oturum kapandığında tüm verileri temizle
            const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token')) : false;
            if (currentGuestMode) {
                console.log('🧹 Misafir modu: Oturum kapandı, tüm veriler temizleniyor...');
                localStorage.removeItem('guest_mode');
                setMessages([]);
                setCurrentConversationId(null);
                setIsGuest(false);
            }
        });

        socket.on('connect_error', (error) => {
            console.error('Socket.IO bağlantı hatası:', error);
            // Bağlantı hatası durumunda tekrar deneme yapılabilir
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
            console.log('📩 AI mesajı geldi:', data);
            
            // AI cevabını detaylı olarak konsola yazdır
            console.group('🤖 AI Cevabı Detayları');
            console.log('📋 Mesaj ID:', data.id);
            console.log('💬 Konuşma ID:', data.conversation_id);
            console.log('📝 İçerik:', data.content || '(boş)');
            console.log('🖼️ Görsel URL (eski):', data.image_url || '(yok)');
            console.log('🖼️ Görsel URL\'leri:', data.image_urls || []);
            console.log('📊 Görsel Sayısı:', data.image_urls?.length || 0);
            console.log('⏰ Oluşturulma Zamanı:', data.created_at);
            console.log('📦 Ham Veri:', JSON.stringify(data, null, 2));
            console.groupEnd();

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

            console.log('✅ Oluşturulan ChatMessage:', aiMessage);
            console.log('🖼️ ChatMessage Görseller:', aiMessage.imageUrls || (aiMessage.imageUrl ? [aiMessage.imageUrl] : []));

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
            console.log('✅ Misafir modunda yeni konuşma başlatıldı');
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
            console.log('✅ Yeni konuşma oluşturuldu:', conversation.id);
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

        if (!socketRef.current) {
            console.error('❌ Socket bağlantısı yok (socketRef.current null)');
            return;
        }
        
        if (!socketRef.current.connected) {
            console.error('❌ Socket bağlantısı hazır değil (connected: false)', {
                socketId: socketRef.current.id,
                connected: socketRef.current.connected
            });
            // Bağlantıyı yeniden kurmayı dene
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            const guestMode = typeof window !== 'undefined' ? localStorage.getItem('guest_mode') === 'true' : false;
            if (token || (guestMode && !token)) {
                console.log('🔄 Bağlantıyı yeniden kurmayı deniyor...');
                socketRef.current.connect();
            }
            return;
        }

        // Misafir modunu tekrar kontrol et
        const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token')) : false;
        
        // Misafir modunda conversation ID henüz yoksa bekleyelim (ilk AI mesajından gelecek)
        // Kayıtlı kullanıcılar için conversation ID gerekli
        if (!currentGuestMode && (!authToken || !currentConversationId)) {
            console.error('Bağlantı hazır değil');
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

    // Dosya yükleme (S3'e yükle)
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
            console.error('Yükleme hatası:', error);
            return null;
        }
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
        isGuest,
    }), [messages, isLoading, sendMessage, uploadFile, startNewChat, inputText, isGuest]);
};
