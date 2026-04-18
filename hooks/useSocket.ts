import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '@/types/chat';
import { BACKEND_URL } from '@/lib/config';
import { isGuestModeActive } from '@/lib/guest';
import { useAuth } from '@/components/AuthContext';

const SOCKET_URL = BACKEND_URL;

interface UseSocketProps {
    isGuest: boolean;
    setIsGuest: (val: boolean) => void;
    setGuestAlias: (val: string) => void;
    clearGuestSession: () => void;
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    setConversations: React.Dispatch<React.SetStateAction<Array<{ id: number | string; title: string; isGuest: boolean }>>>;
    setIsLoading: (val: boolean) => void;
    currentConversationId: number | string | null;
    setCurrentConversationId: React.Dispatch<React.SetStateAction<number | string | null>>;
    cancellationRef: React.MutableRefObject<boolean>;
    startNewChat: () => void;
}

export const useSocket = ({
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
}: UseSocketProps) => {
    const socketRef = useRef<Socket | null>(null);
    const { isAuthenticated, isGuestMode } = useAuth();

    // Socket.IO bağlantısını kur
    useEffect(() => {
        console.log('[USECHAT] 🔴 Socket.IO useEffect RUNNING, isGuest=', isGuest, 'isAuthenticated=', isAuthenticated, 'isGuestMode=', isGuestMode);

        if (typeof window === 'undefined') return;

        const shouldConnect = isAuthenticated || isGuestMode || isGuest;
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

        if (socketRef.current && socketRef.current.connected) {
            console.log('[USECHAT] 🔴 Already connected, skipping socket setup');
            return;
        }

        socketRef.current = io(SOCKET_URL, {
            // Ingress tarafında /socket.io path eşleşmesini netleştirmek için açık veriyoruz
            path: '/socket.io',
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            withCredentials: true
        });
        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('✅ Socket.IO connected successfully');
            const currentGuestMode = isGuestModeActive();
            if (currentGuestMode) {
                setIsGuest(true);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Socket.IO disconnected:', reason);
            const currentGuestMode = isGuestModeActive();
            if (currentGuestMode) {
                clearGuestSession();
                setMessages([]);
                setCurrentConversationId(null);
            }
        });

        socket.on('connect_error', (error) => {
            console.error('Socket.IO bağlantı hatası:', error?.message || error);
            setIsLoading(false);
        });

        socket.on('ai_message_chunk', (data: { conversation_id: number | string; content: string }) => {
            if (cancellationRef.current) return;

            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];

                if (lastMsg && lastMsg.sender === 'ai' && lastMsg.id === 'streaming-ai') {
                    return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, content: lastMsg.content + data.content }
                    ];
                }

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
            setIsLoading(false);
        });

        socket.on('ai_message', (data: {
            id: number | string;
            conversation_id: number | string;
            content?: string;
            image_url?: string;
            image_urls?: string[];
            created_at: string;
            alias?: string;
        }) => {
            if (cancellationRef.current) {
                setIsLoading(false);
                return;
            }

            const currentGuestMode = isGuestModeActive();
            if (currentGuestMode && !currentConversationId) {
                setCurrentConversationId(data.conversation_id);
                setIsGuest(true);
            }

            if (data.alias) {
                const alias = data.alias;
                if (currentGuestMode) {
                    setGuestAlias(alias);
                }
                setConversations(prev => {
                    const exists = prev.find(p => p.id === data.conversation_id);
                    if (exists) {
                        const shouldUpdate = exists.title === 'Yeni Konuşma' ||
                            exists.title === 'Misafir Sohbeti' ||
                            exists.title.startsWith('Sohbet ');
                        if (shouldUpdate) {
                            return prev.map(p => p.id === data.conversation_id ? { ...p, title: alias } : p);
                        }
                        return prev;
                    }
                    const newList = [...prev, { id: data.conversation_id, title: alias, isGuest: currentGuestMode }];
                    return newList.filter((item, idx, arr) => arr.findIndex(x => x.id === item.id) === idx);
                });
            }

            const aiMessage: ChatMessage = {
                id: `ai-${data.id}`,
                sender: 'ai',
                content: data.content || '',
                imageUrl: data.image_url,
                imageUrls: data.image_urls || (data.image_url ? [data.image_url] : undefined),
                timestamp: new Date(data.created_at).getTime(),
            };

            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.id === 'streaming-ai') {
                    return [...prev.slice(0, -1), aiMessage];
                }
                return [...prev, aiMessage];
            });
            setIsLoading(false);
        });

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

        socket.on('guest_conversation_created', (data: { id: string; alias: string }) => {
            setConversations(prev => [
                ...prev.filter(c => !(c.isGuest && c.id === data.id)),
                { id: data.id, title: data.alias || 'Misafir Sohbeti', isGuest: true },
            ]);
            setCurrentConversationId(data.id);
            setGuestAlias(data.alias || 'Misafir Sohbeti');
            setMessages([]);
        });

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
                setConversations([]);
                setCurrentConversationId(null);
                setMessages([]);
                startNewChat();
            }
            setIsLoading(false);
        });

        return () => {
            socket.disconnect();
        };
    }, [isGuest, isAuthenticated, isGuestMode]);

    return socketRef;
};
