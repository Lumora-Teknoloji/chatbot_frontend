import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { ChatMessage } from '@/types/chat';
import { useAuth } from '@/components/AuthContext';

export const useConversationManager = (isGuest: boolean = false) => {
    const { isAuthenticated } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return !!params.get('chatId');
        }
        return false;
    });
    const [inputText, setInputText] = useState('');
    const [currentConversationId, setCurrentConversationId] = useState<number | string | null>(null);
    const [conversations, setConversations] = useState<Array<{ id: number | string; title: string; isGuest: boolean }>>([]);
    const cancellationRef = useRef<boolean>(false);

    // Auth değiştiğinde kullanıcı sohbet listesini yenile
    useEffect(() => {
        const fetchConversations = async () => {
            if (isAuthenticated) {
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
            } else if (!isGuest) {
                setConversations([]);
            }
        };
        fetchConversations();
    }, [isAuthenticated, isGuest]);

    // Yeni konuşma başlat
    const startNewChat = useCallback(() => {
        setMessages([]);
        setCurrentConversationId(null);

        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('chatId');
            window.history.pushState({}, '', url.toString());
        }
    }, []);

    // Konuşma sil
    const deleteConversation = useCallback(async (conversationId: number | string) => {
        if (!isAuthenticated) return;
        try {
            await api.deleteConversation(Number(conversationId));

            const remainingConversations = conversations.filter(c => c.id !== conversationId);
            setConversations(remainingConversations);

            if (currentConversationId === conversationId) {
                setMessages([]);

                if (remainingConversations.length > 0) {
                    const nextConversation = remainingConversations[0];
                    setCurrentConversationId(nextConversation.id);
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
                    setCurrentConversationId(null);
                }
            }
        } catch (e) {
            console.error('Konuşma silinemedi', e);
        }
    }, [isAuthenticated, currentConversationId, conversations]);

    // Seçilen sohbeti yükle (REST)
    const loadConversationRest = useCallback(async (id: number | string) => {
        try {
            console.log(`[USECHAT] 📂 Loading conversation via REST: ${id}`);
            setIsLoading(true);

            if (!isAuthenticated) {
                console.error('Giriş yapmanız gerekiyor');
                setIsLoading(false);
                return;
            }

            setCurrentConversationId(id);

            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.set('chatId', id.toString());
                window.history.pushState({}, '', url.toString());
            }

            const fetchedMessages = await api.getMessages(Number(id));

            if (!Array.isArray(fetchedMessages)) {
                console.warn('Mesajlar dizi formatında gelmedi:', fetchedMessages);
                setMessages([]);
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

        } catch (error) {
            console.error('Sohbet yüklenirken hata:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    // stopGeneration moved to useChat.ts

    return {
        messages,
        setMessages,
        isLoading,
        setIsLoading,
        inputText,
        setInputText,
        currentConversationId,
        setCurrentConversationId,
        conversations,
        setConversations,
        cancellationRef,
        startNewChat,
        deleteConversation,
        loadConversationRest
    };
};
