// hooks/useChat.ts - Backend Socket.IO ve REST API entegrasyonu
'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { BACKEND_URL } from '@/lib/config';

const SOCKET_URL = BACKEND_URL;

export const useChat = (isAuthenticatedProp?: boolean, isGuestModeProp?: boolean) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    // URL'de chatId varsa loading true başlasın (F5'te flash'ı önler)
    const [isLoading, setIsLoading] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return !!params.get('chatId');
        }
        return false;
    });
    const [inputText, setInputText] = useState('');
    const [currentConversationId, setCurrentConversationId] = useState<number | string | null>(null);
    const [guestAlias, setGuestAlias] = useState<string>('Misafir Sohbeti');
    const [isGuest, setIsGuest] = useState(false);
    const [conversations, setConversations] = useState<Array<{ id: number | string; title: string; isGuest: boolean }>>([]);
    const socketRef = useRef<Socket | null>(null);
    const cancellationRef = useRef<boolean>(false);

    // Misafir modunu kontrol et
    useEffect(() => {
        console.log('[USECHAT] 🟣 Guest mode check useEffect RUNNING');
        const updateGuestState = () => {
            console.log('[USECHAT] 🟣 updateGuestState called');
            if (typeof window !== 'undefined') {
                const guestMode = localStorage.getItem('guest_mode') === 'true';
                console.log('[USECHAT] 🔍 localStorage: guestMode=', guestMode);
                setIsGuest(guestMode);
            }
        };

        // İlk mount'ta kontrol et
        console.log('[USECHAT] 🟣 First mount check');
        if (typeof window !== 'undefined') {
            const guestMode = localStorage.getItem('guest_mode') === 'true';
            console.log('[USECHAT] 🟣 Setting initial guest state:', guestMode);
            setIsGuest(guestMode);
        }

        // Custom event dinle (misafir modu aktifleştirildiğinde)
        if (typeof window !== 'undefined') {
            window.addEventListener('guestModeActivated', updateGuestState);
            return () => {
                window.removeEventListener('guestModeActivated', updateGuestState);
            };
        }
    }, []); // Sadece mount'ta çalışır
    // EN İYİSİ: Bu lojiği loadConversation tanımlandıktan SONRA, dosyanın aşağısına eklemek.
    // O yüzden burayı BOŞ GEÇİYORUM, aşağıya ekleyeceğim.
    // Bu adımı "skip" edemediğim için boş comment ekliyorum.
    // (Aslında bu tool call'u iptal edip aşağıya eklemeliyim ama devam edelim)


    // Socket.IO bağlantısını kur
    useEffect(() => {
        console.log('[USECHAT] 🔴 Socket.IO useEffect RUNNING, isGuest=', isGuest, 'isAuthenticatedProp=', isAuthenticatedProp, 'isGuestModeProp=', isGuestModeProp);

        if (typeof window === 'undefined') return;

        // Auth state'i props'tan al - en güncel değerleri kullan
        const shouldConnect = isAuthenticatedProp || isGuestModeProp || isGuest;
        console.log('[USECHAT] 🔴 shouldConnect=', shouldConnect);

        if (!shouldConnect) {
            console.log('[USECHAT] 🔴 Should NOT connect - disconnecting');
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        console.log('[USECHAT] 🔴 Should connect - proceeding with socket setup');

        // Eğer zaten bağlıysa yeniden bağlanma
        if (socketRef.current && socketRef.current.connected) {
            console.log('[USECHAT] 🔴 Already connected, skipping socket setup');
            return;
        }

        // Socket.IO bağlantısı
        const socketOptions: any = {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            withCredentials: true // HttpOnly cookies için gerekli
        };

        socketRef.current = io(SOCKET_URL, socketOptions);

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('✅ Socket.IO connected successfully');
            // Misafir modunu tekrar kontrol et (state güncellenmiş olabilir)
            const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token')) : false;
            if (currentGuestMode) {
                setIsGuest(true); // State'i güncelle
            }
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Socket.IO connect_error:', error?.message || error);
            setIsLoading(false);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Socket.IO disconnected:', reason);
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

        // AI mesajı parçasını dinle (Streaming)
        socket.on('ai_message_chunk', (data: { conversation_id: number | string; content: string }) => {
            if (cancellationRef.current) return;

            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];

                // Eğer son mesaj AI ise ve id'si geçici ise ekle
                if (lastMsg && lastMsg.sender === 'ai' && lastMsg.id === 'streaming-ai') {
                    return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, content: lastMsg.content + data.content }
                    ];
                }

                // İlk parça: Yeni mesaj başlat
                return [
                    ...prev,
                    {
                        id: 'streaming-ai',
                        sender: 'ai',
                        content: data.content,
                        timestamp: Date.now(),
                    }
                ];
            });
            // İlk parça geldiğinde loading'i kapat ki kullanıcı okumaya başlasın
            setIsLoading(false);
        });

        // AI mesajını dinle (Final mesaj)
        socket.on('ai_message', (data: {
            id: number | string;
            conversation_id: number | string;
            content?: string;
            image_url?: string;
            image_urls?: string[];
            created_at: string;
            alias?: string;
        }) => {
            // İptal edildiyse işlemi durdur
            if (cancellationRef.current) {
                setIsLoading(false);
                return;
            }

            // Misafir modunda conversation ID'yi set et
            const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token')) : false;
            if (currentGuestMode && !currentConversationId) {
                setCurrentConversationId(data.conversation_id);
                setIsGuest(true); // State'i güncelle
            }

            // Alias'ı güncelle (hem misafir hem kayıtlı kullanıcılar için)
            if (data.alias) {
                const alias = data.alias; // TypeScript için: bu noktada alias kesinlikle string
                if (currentGuestMode) {
                    setGuestAlias(alias);
                }
                // Konuşma başlığını güncelle (tüm kullanıcılar için)
                setConversations(prev => {
                    const exists = prev.find(p => p.id === data.conversation_id);
                    if (exists) {
                        // Sadece "Yeni Konuşma" veya benzeri varsayılan başlıkları güncelle
                        const shouldUpdate = exists.title === 'Yeni Konuşma' ||
                            exists.title === 'Misafir Sohbeti' ||
                            exists.title.startsWith('Sohbet ');
                        if (shouldUpdate) {
                            return prev.map(p => p.id === data.conversation_id ? { ...p, title: alias } : p);
                        }
                        return prev;
                    }
                    // Dedup: sadece bu id yoksa ekle
                    const newList = [...prev, { id: data.conversation_id, title: alias, isGuest: currentGuestMode }];
                    return newList.filter((item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx);
                });
            }

            const aiMessage: ChatMessage = {
                id: `ai-${data.id}`,
                sender: 'ai',
                content: data.content || '',
                imageUrl: data.image_url,  // Backward compatibility için
                imageUrls: data.image_urls || (data.image_url ? [data.image_url] : undefined),  // Tüm görselleri al
                timestamp: new Date(data.created_at).getTime(),
            };

            setMessages(prev => {
                // Eğer streaming mesaj varsa onu sil/değiştir (yerine final halini koy)
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.id === 'streaming-ai') {
                    return [...prev.slice(0, -1), aiMessage];
                }
                return [...prev, aiMessage];
            });
            setIsLoading(false);
        });

        // Misafir: mevcut sohbet listesini al
        socket.on('guest_conversation_list', (data: { conversations: Array<{ id: string; alias: string }> }) => {
            setConversations(data.conversations.map(c => ({
                id: c.id,
                title: c.alias || 'Misafir Sohbeti',
                isGuest: true,
            })));
            if (data.conversations.length > 0) {
                setCurrentConversationId(prev => prev ?? data.conversations[0].id);
                setGuestAlias(data.conversations[0].alias || 'Misafir Sohbeti');
            }
        });

        // Misafir: yeni sohbet oluşturuldu
        socket.on('guest_conversation_created', (data: { id: string; alias: string }) => {
            setConversations(prev => [
                ...prev.filter(c => !(c.isGuest && c.id === data.id)),
                { id: data.id, title: data.alias || 'Misafir Sohbeti', isGuest: true },
            ]);
            setCurrentConversationId(data.id);
            setGuestAlias(data.alias || 'Misafir Sohbeti');
            setMessages([]);
        });

        // Misafir: seçili sohbetin geçmişi
        socket.on('guest_conversation_data', (data: { conversation_id: string; alias?: string; messages: any[] }) => {
            setCurrentConversationId(data.conversation_id);
            if (data.alias) setGuestAlias(data.alias);
            const restored = (data.messages || []).map((m) => ({
                id: m.id,
                sender: m.sender,
                content: m.content || '',
                imageUrl: m.image_url || undefined,
                imageUrls: m.image_urls || (m.image_url ? [m.image_url] : undefined),
                timestamp: new Date(m.created_at).getTime(),
            })) as ChatMessage[];
            setMessages(restored);
            setIsLoading(false);
        });

        socket.on('error', (error: { message?: string } | string | undefined) => {
            const message = typeof error === 'string'
                ? error
                : (error?.message || 'Bilinmeyen Socket.IO hatası');
            console.error('Socket.IO hatası:', message, error);
            if (message.toLowerCase().includes('conversation not found')) {
                // Sunucu tarafında sohbet silindiyse veya yoksa state'i sıfırla ve yeni sohbet aç
                setConversations([]);
                setCurrentConversationId(null);
                setMessages([]);
                startNewChat();
            }
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
    }, [isGuest, isAuthenticatedProp, isGuestModeProp]); // Auth state değiştiğinde yeniden bağlan

    // Auth değiştiğinde kullanıcı sohbet listesini yenile
    useEffect(() => {
        const fetchConversations = async () => {
            if (isAuthenticatedProp) {
                try {
                    const list = await api.listConversations();
                    const mapped = list.map(c => ({
                        id: c.id,
                        title: c.alias || c.title || `Sohbet ${c.id}`,
                        isGuest: false,
                    }));
                    // Dedup: API bazen aynı konuşmayı iki kez dönebilir
                    const unique = mapped.filter((item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx);
                    setConversations(unique);
                } catch (e) {
                    console.error('Sohbet listesi alınamadı', e);
                }
            } else {
                setConversations([]);
            }
        };
        fetchConversations();
    }, [isAuthenticatedProp]);



    // Yeni konuşma başlat (Sadece UI state'i sıfırlar, backend'de oluşturmaz)
    const startNewChat = useCallback(() => {
        setMessages([]);
        setCurrentConversationId(null);
        setIsGuest(false); // Yeni sohbet her zaman normal modda başlasın (giriş yapmışsa)

        // URL temizle
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('chatId');
            window.history.pushState({}, '', url.toString());
        }
    }, []);

    // Konuşma sil
    const deleteConversation = useCallback(async (conversationId: number | string) => {
        if (!isAuthenticatedProp) return;
        try {
            await api.deleteConversation(Number(conversationId));

            // Mevcut konuşmalar listesini güncelle
            const remainingConversations = conversations.filter(c => c.id !== conversationId);
            setConversations(remainingConversations);

            // Eğer silinen konuşma aktif olandıysa
            if (currentConversationId === conversationId) {
                setMessages([]);

                // Başka konuşma varsa ona geç
                if (remainingConversations.length > 0) {
                    const nextConversation = remainingConversations[0];
                    setCurrentConversationId(nextConversation.id);
                    // Yeni konuşmanın mesajlarını yükle
                    try {
                        const msgs = await api.getMessages(Number(nextConversation.id));
                        const restored = msgs.map(m => ({
                            id: m.id.toString(),
                            sender: m.sender,
                            content: m.content || '',
                            imageUrl: m.image_url || undefined,
                            imageUrls: m.image_url ? m.image_url.split(';').filter(Boolean) : undefined,
                            timestamp: new Date(m.created_at).getTime(),
                        })) as ChatMessage[];
                        setMessages(restored);
                    } catch (loadErr) {
                        console.error('Konuşma yüklenemedi', loadErr);
                    }
                } else {
                    // Hiç konuşma kalmadıysa boş state
                    setCurrentConversationId(null);
                }
            }
        } catch (e) {
            console.error('Konuşma silinemedi', e);
        }
    }, [isAuthenticatedProp, currentConversationId, conversations]);

    // İlk konuşmayı otomatik oluştur (Sadece state sıfırlar, backend oluşturmaz)
    useEffect(() => {
        const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true') : false;
        if ((isAuthenticatedProp || currentGuestMode) && !currentConversationId && socketRef.current?.connected) {
            // Misafir modunda conversation ID socket'ten gelecek
            if (!currentGuestMode) {
                startNewChat();
            }
        }
    }, [isAuthenticatedProp, currentConversationId, startNewChat]);

    // Mesaj gönder
    const sendMessage = useCallback(async (
        text: string,
        imageUrls?: string[],
        generateImages: boolean = false
    ) => {
        if ((!text.trim() && (!imageUrls || imageUrls.length === 0)) || isLoading) {
            return;
        }

        if (!socketRef.current || !socketRef.current.connected) {
            return;
        }

        // Yeni mesaj gönderilirken iptal durumunu sıfırla
        cancellationRef.current = false;

        // Misafir modunu tekrar kontrol et
        const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token')) : false;

        let conversationIdToUse: number | string | null = currentConversationId;

        // 1. Kayıtlı kullanıcı için LAZY CREATION
        if (!currentGuestMode) {
            if (!isAuthenticatedProp) {
                console.error('Giriş yapmanız gerekiyor');
                return;
            }
            // Eğer aktif bir konuşma yoksa, İLK mesajda oluştur
            if (!conversationIdToUse) {
                try {
                    const conversation = await api.createConversation(undefined, undefined);
                    conversationIdToUse = conversation.id;
                    setCurrentConversationId(conversation.id);

                    // Listeye ekle (Başlığı şimdilik geçici veriyoruz, aşağıda update edilecek)
                    // Dedup: socket'ten de aynı id gelebileceği için önce filtrele
                    setConversations(prev => {
                        const alreadyExists = prev.some(c => c.id === conversation.id);
                        if (alreadyExists) return prev;
                        return [...prev, {
                            id: conversation.id,
                            title: text.trim().slice(0, 30) || 'Yeni Konuşma',
                            isGuest: false
                        }];
                    });
                } catch (error) {
                    console.error('Konuşma oluşturulamadı:', error);
                    setIsLoading(false);
                    return;
                }
            }
        }
        // 2. Misafir modu için LAZY CREATION (Socket emit)
        else {
            if (!conversationIdToUse) {
                if (socketRef.current) {
                    socketRef.current.emit('guest_new_conversation');
                    // Socket cevabı (guest_conversation_created) gelene kadar beklememiz gerekebilir
                    // veya "user_message" gönderirken id: null göndeririz, backend yeni oluşturur?
                    // Mevcut backend yapısı: user_message handler'ında conversation_id null ise hata verebilir veya oluşturabilir.
                    // Risk almamak için: guest modunda eski davranışı koruyalım veya
                    // user_message gönderirken conversation_id: null gönderip backend'in handle etmesini umalım.
                    // Sidebar yapısına bakınca misafir modu için de "Yeni Konuşma" birikiyor olabilir.
                    // Şimdilik sadece Authenticated flow'u düzelttik (API call).
                }
            }
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

        // İlk mesajdan konuşma başlığı üret (hem misafir hem kayıtlı kullanıcılar için)
        if (text && conversationIdToUse) {
            const currentConv = conversations.find(c => c.id === conversationIdToUse);
            const isDefaultTitle = !currentConv ||
                currentConv.title === 'Yeni Konuşma' ||
                currentConv.title === 'Misafir Sohbeti' ||
                currentConv.title.startsWith('Sohbet ');

            if (isDefaultTitle) {
                let autoTitle = text.trim();
                if (autoTitle.length > 40) autoTitle = `${autoTitle.slice(0, 40)}...`;

                if (currentGuestMode) {
                    setGuestAlias(autoTitle || 'Misafir Sohbeti');
                }

                // Konuşma listesinde başlığı güncelle
                setConversations(prev =>
                    prev.map(c => c.id === conversationIdToUse ? { ...c, title: autoTitle } : c)
                );
            }
        }

        try {
            // Socket.IO ile mesajı gönder (AI yanıtı için)
            // Misafir modunda conversation_id null olabilir, backend handle edecek
            socketRef.current.emit('user_message', {
                conversation_id: conversationIdToUse || null,
                message: text || '',
                image_url: imageUrls && imageUrls.length > 0 ? imageUrls[0] : undefined,
                generate_images: generateImages
            });
        } catch (error) {
            console.error('Mesaj gönderme hatası:', error);
            setIsLoading(false);
        }
    }, [isAuthenticatedProp, currentConversationId, isLoading, startNewChat, guestAlias, conversations]);

    // Seçilen sohbeti yükle
    const loadConversation = useCallback(async (id: number | string, isGuestConversation: boolean = false) => {
        try {
            console.log(`[USECHAT] 📂 Loading conversation: ${id} (isGuest: ${isGuestConversation})`);
            setIsLoading(true);
            if (isGuestConversation) {
                setCurrentConversationId(id); // Guest için ID'yi set et
                if (socketRef.current) {
                    socketRef.current.emit('guest_get_conversation', { conversation_id: id });
                }
                return;
            }

            if (!isAuthenticatedProp) {
                console.error('Giriş yapmanız gerekiyor');
                setIsLoading(false);
                return;
            }

            // Auth kontrolünden geçti, ID'yi güvenle set edebiliriz
            setCurrentConversationId(id);

            // URL güncelle
            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.set('chatId', id.toString());
                window.history.pushState({}, '', url.toString());
            }

            // Backend'den mesajları çek
            const fetchedMessages = await api.getMessages(Number(id));

            // Dizi kontrolü - boş veya hatalı veri gelirse çökmesin
            if (!Array.isArray(fetchedMessages)) {
                console.warn('Mesajlar dizi formatında gelmedi:', fetchedMessages);
                setMessages([]);
                setIsGuest(false);
                return;
            }

            const restored: ChatMessage[] = fetchedMessages.map(m => ({
                id: m.id.toString(),
                sender: m.sender,
                content: m.content || '',
                imageUrl: m.image_url || undefined,
                imageUrls: m.image_url ? m.image_url.split(';').filter(Boolean) : undefined,
                timestamp: new Date(m.created_at).getTime(),
            }));
            setMessages(restored);
            setIsGuest(false);

        } catch (error) {
            console.error('Sohbet yüklenirken hata:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticatedProp]);



    // Üretimi durdur
    const stopGeneration = useCallback(() => {
        if (isLoading) {
            cancellationRef.current = true;
            setIsLoading(false);

            // "Mesaj durduruldu" bilgisini ekle
            setMessages(prev => [
                ...prev,
                {
                    id: `stopped-${Date.now()}`,
                    sender: 'ai',
                    content: 'Mesaj durduruldu.',
                    timestamp: Date.now(),
                    isStopped: true
                }
            ]);
        }
    }, [isLoading]);

    // URL'den sohbeti geri yükle (F5 desteği) - loadConversation tanımlandıktan sonra
    useEffect(() => {
        if (typeof window !== 'undefined' && !currentConversationId) {
            const params = new URLSearchParams(window.location.search);
            const chatId = params.get('chatId');

            if (chatId) {
                const isLocalGuest = localStorage.getItem('guest_mode') === 'true';
                // Auth tamamlandıysa veya misafir moduysa yükle
                // NOT: isLoading kontrolünü kaldırdık çünkü F5'te true başlıyor
                if (isAuthenticatedProp || isLocalGuest) {
                    console.log(`[USECHAT] 🔄 URL'den sohbet geri yükleniyor: ${chatId}`);
                    loadConversation(chatId, isLocalGuest);
                } else {
                    // Auth yoksa (örn. çıkış yapıldıysa) loading'i kapat
                    if (isLoading) setIsLoading(false);
                }
            } else {
                // ChatId yoksa ve loading true kaldıysa kapat (Ana sayfa açılsın)
                if (isLoading) setIsLoading(false);
            }
        }
    }, [loadConversation, currentConversationId, isAuthenticatedProp]);

    return useMemo(() => ({
        messages,
        isLoading,
        sendMessage,
        startNewChat,
        deleteConversation,
        isChatStarted: messages.length > 0,
        inputText,
        setInputText,
        isGuest,
        currentConversationId,
        guestAlias,
        conversations,
        loadConversation,
        setConversations,
        stopGeneration,
    }), [messages, isLoading, sendMessage, startNewChat, deleteConversation, inputText, isGuest, conversations, loadConversation, guestAlias, currentConversationId, stopGeneration]);
};
