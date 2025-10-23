// hooks/useChat.ts
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';

// RASA SUNUCU AYARLARI (Şimdilik kullanılmıyor)
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

    useEffect(() => {
        const id = getSenderId();
        setSenderId(id);
    }, []);

    // GÜNCELLENMİŞ sendMessage FONKSİYONU
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || isLoading || !senderId) return;

        setIsLoading(true);

        // 1. Kullanıcının mesajını anında arayüze ekle (bu davranış aynı kalıyor)
        const userMessage: ChatMessage = {
            id: Date.now().toString() + '-u',
            sender: 'user',
            content: text,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');

        // --- RASA BAĞLANTISI YAPILANA KADAR GEÇİCİ KOD BAŞLANGICI ---

        // 2. Botun "denemesini" simüle etmek için 1 saniye bekle
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. Otomatik hata mesajını oluştur
        const aiErrorMessage: ChatMessage = {
            id: Date.now().toString() + '-ai-error',
            sender: 'ai',
            content: 'Mesaj gönderilemedi. Backend bağlantısı henüz aktif değil.',
            timestamp: Date.now(),
        };

        // 4. Hata mesajını sohbet listesine ekle
        setMessages(prev => [...prev, aiErrorMessage]);

        // 5. Yükleme durumunu bitir
        setIsLoading(false);

        // --- GEÇİCİ KOD BİTİŞİ ---


        /* --- GERÇEK API ÇAĞRISI (Gelecekte bu kısmı kullanacaksınız) ---

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
            setIsLoading(false);
        }

        */

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