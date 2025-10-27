// hooks/useChat.ts
'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'; // 1. useRef'i import et
import { ChatMessage } from '@/types/chat';

const RASA_API_URL = 'http://localhost:5005/webhooks/rest/webhook';

const getSenderId = () => {
    if (typeof window === 'undefined') {
        return '';
    }
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

    // 2. Çift göndermeyi engellemek için anlık bir kilit (ref) ekle
    const isSending = useRef(false);

    useEffect(() => {
        const id = getSenderId();
        setSenderId(id);
    }, []);

    const sendMessage = useCallback(async (text: string) => {

        // 3. Guard (koruma) kontrolüne 'isSending.current'ı ekle
        if (!text.trim() || isLoading || !senderId || isSending.current) return;

        // 4. Kilidi anında (senkron olarak) aktif et
        isSending.current = true;
        setIsLoading(true);

        const userMessage: ChatMessage = {
            id: Date.now().toString() + '-u',
            sender: 'user',
            content: text,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');

        try {
            const response = await fetch(RASA_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: senderId,
                    message: text,
                }),
            });

            if (!response.ok) {
                throw new Error('Rasa server response was not ok.');
            }

            const rasaResponse = await response.json();
            const aiMessages: ChatMessage[] = rasaResponse.map((msg: any, index: number) => ({
                id: `${Date.now()}-ai-${index}`,
                sender: 'ai',
                content: msg.text || 'Boş yanıt.',
                timestamp: Date.now(),
            }));

            setMessages(prev => [...prev, ...aiMessages]);

        } catch (error) {
            console.error("Rasa'ya mesaj gönderilirken hata oluştu:", error);
            const aiErrorMessage: ChatMessage = {
                id: Date.now().toString() + '-ai-error',
                sender: 'ai',
                content: 'Üzgünüm, bir sorunla karşılaştım. Lütfen daha sonra tekrar deneyin.',
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, aiErrorMessage]);
        } finally {
            // 5. Kilidi 'finally' bloğunda serbest bırak
            isSending.current = false;
            setIsLoading(false);
        }

    }, [isLoading, senderId]);

    const startNewChat = useCallback(() => {
        setMessages([]);
    }, []);

    return useMemo(() => ({
        messages,
        isLoading,
        sendMessage,
        startNewChat,
        isChatStarted: messages.length > 0,
        inputText,
        setInputText,
    }), [messages, isLoading, sendMessage, startNewChat, inputText]);
};