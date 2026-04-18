'use client';

import { useCallback, useEffect } from 'react';
import { useGuestSession } from './useGuestSession';
import { useConversationManager } from './useConversationManager';
import { useSocket } from './useSocket';
import { api } from '@/lib/api';
import { ChatMessage } from '@/types/chat';
import { hasGuestFallback, isGuestModeActive } from '@/lib/guest';
import { useAuth } from '@/components/AuthContext';

export const useChat = () => {
    // 1. Auth Context
    const { isAuthenticated, isGuestMode } = useAuth();

    // 2. Guest Session Hook
    const {
        isGuest,
        setIsGuest,
        guestAlias,
        setGuestAlias,
        clearGuestSession
    } = useGuestSession();

    // 2. Conversation Manager Hook
    const {
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
    } = useConversationManager(isGuest);

    // 3. Socket Hook
    const socketRef = useSocket({
        isGuest,
        setIsGuest,
        setGuestAlias,
        clearGuestSession,
        setMessages,
        setConversations,
        setIsLoading,
        currentConversationId,
        setCurrentConversationId,
        cancellationRef,
        startNewChat
    });

    // Üretimi durdur
    const stopGeneration = useCallback(() => {
        if (isLoading) {
            cancellationRef.current = true;
            setIsLoading(false);

            // Backend'e durdurma sinyali gönder
            if (socketRef.current && socketRef.current.connected && currentConversationId) {
                socketRef.current.emit('stop_generation', { conversation_id: currentConversationId });
            }

            setMessages((prev: ChatMessage[]) => [
                ...prev,
                {
                    id: `stopped-${Date.now()}`,
                    sender: 'ai',
                    content: 'Mesaj durduruldu.',
                    timestamp: Date.now(),
                    isStopped: true
                } as ChatMessage
            ]);
        }
    }, [isLoading, currentConversationId, socketRef, setMessages, setIsLoading, cancellationRef]);

    // İlk konuşmayı otomatik oluştur
    useEffect(() => {
        const currentGuestMode = hasGuestFallback();
        if ((isAuthenticated || currentGuestMode) && !currentConversationId && socketRef.current?.connected) {
            // Misafir modunda conversation ID socket'ten gelecek
            if (!currentGuestMode) {
                startNewChat();
            }
        }
    }, [isAuthenticated, currentConversationId, startNewChat]);

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

        cancellationRef.current = false;

        const currentGuestMode = isGuestModeActive();

        let conversationIdToUse: number | string | null = currentConversationId;

        // 1. Kayıtlı kullanıcı için LAZY CREATION
        if (!currentGuestMode) {
            if (!isAuthenticated) {
                console.error('Giriş yapmanız gerekiyor');
                return;
            }
            if (!conversationIdToUse) {
                try {
                    const conversation = await api.createConversation(undefined, undefined);
                    conversationIdToUse = conversation.id;
                    setCurrentConversationId(conversation.id);

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
        // 2. Misafir modu için LAZY CREATION
        else {
            if (!conversationIdToUse) {
                if (socketRef.current) {
                    socketRef.current.emit('guest_new_conversation');
                }
            }
        }

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

                setConversations(prev =>
                    prev.map(c => c.id === conversationIdToUse ? { ...c, title: autoTitle } : c)
                );
            }
        }

        try {
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
    }, [isAuthenticated, currentConversationId, isLoading, startNewChat, guestAlias, conversations]);

    // Seçilen sohbeti yükle (REST & Socket Dispatcher)
    const loadConversation = useCallback(async (id: number | string, isGuestConversation: boolean = false) => {
        setIsLoading(true);
        if (isGuestConversation) {
            setCurrentConversationId(id);
            if (socketRef.current) {
                socketRef.current.emit('guest_get_conversation', { conversation_id: id });
            }
        } else {
            await loadConversationRest(id);
        }
    }, [loadConversationRest, setCurrentConversationId, socketRef, setIsLoading]);

    // URL'den sohbeti geri yükle (F5 desteği)
    useEffect(() => {
        if (typeof window !== 'undefined' && !currentConversationId) {
            const params = new URLSearchParams(window.location.search);
            const chatId = params.get('chatId');

            if (chatId) {
                const isLocalGuest = hasGuestFallback();
                if (isAuthenticated || isLocalGuest) {
                    console.log(`[USECHAT] 🔄 URL'den sohbet geri yükleniyor: ${chatId}`);
                    loadConversation(chatId, isLocalGuest);
                } else {
                    if (isLoading) setIsLoading(false);
                }
            } else {
                if (isLoading) setIsLoading(false);
            }
        }
    }, [loadConversation, currentConversationId, isAuthenticated]);

    return {
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
    };
};
