// hooks/useChat.ts
'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'; // 1. useRef'i import et
import { ChatMessage } from '@/types/chat';

const RASA_API_URL = 'http://localhost:5005/webhooks/rest/webhook';
const RASA_ACTION_URL = 'http://localhost:5005/webhooks/rest/webhook';

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

    const uploadFile = useCallback(async (file: File, addToChat: boolean = true) => {
        if (!senderId) {
            throw new Error('Sender ID bulunamadı');
        }

        try {
            // Alternatif yöntem: Next.js API route üzerinden yükleme (CORS sorunu olmaz)
            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch('/api/s3-upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({ error: 'Bilinmeyen hata' }));
                throw new Error(errorData.error || `Dosya yüklenemedi (${uploadResponse.status})`);
            }

            const { url } = await uploadResponse.json();
            
            if (!url) {
                throw new Error('Yükleme yanıtı geçersiz');
            }

            // Eğer addToChat true ise mesaj olarak ekle
            if (addToChat) {
                // 2. Rasa'ya /gorsel_yuklendi event'ini gönder
                // Rasa formatı: /intent_name{"key": "value"} şeklinde JSON string olarak gönderilir
                try {
                    const rasaResponse = await fetch(RASA_ACTION_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sender: senderId,
                            message: `/gorsel_yuklendi{"gorsel_url": "${url}"}`,
                        }),
                    });

                    if (rasaResponse.ok) {
                        // Rasa'dan gelen yanıtları mesaj olarak ekle
                        const rasaMessages = await rasaResponse.json();
                        const aiMessages: ChatMessage[] = rasaMessages.map((msg: any, index: number) => ({
                            id: `${Date.now()}-ai-${index}`,
                            sender: 'ai',
                            content: msg.text || 'Görsel yüklendi.',
                            timestamp: Date.now(),
                        }));
                        setMessages(prev => [...prev, ...aiMessages]);
                    } else {
                        console.warn('Rasa\'ya görsel yükleme bildirimi gönderilemedi:', rasaResponse.status);
                    }
                } catch (rasaError) {
                    // Rasa'ya bildirim gönderilemese bile görsel yükleme başarılı
                    console.warn('Rasa\'ya görsel yükleme bildirimi gönderilemedi:', rasaError);
                }

                // 3. Kullanıcı mesajı olarak görseli ekle
                const userMessage: ChatMessage = {
                    id: Date.now().toString() + '-u-image',
                    sender: 'user',
                    content: '',
                    imageUrl: url,
                    timestamp: Date.now(),
                };
                
                console.log('Görsel mesajı ekleniyor:', userMessage);
                setMessages(prev => {
                    const newMessages = [...prev, userMessage];
                    console.log('Yeni mesaj listesi:', newMessages);
                    return newMessages;
                });
            }

            return url;
        } catch (error) {
            console.error('Dosya yüklenirken hata oluştu:', error);
            throw error;
        }
    }, [senderId]);

    // Görsel URL'lerini chat'e eklemek için yardımcı fonksiyon
    const addImageMessages = useCallback((imageUrls: string[]) => {
        if (!senderId) {
            console.error('Sender ID bulunamadı');
            return;
        }

        imageUrls.forEach(url => {
            // Rasa'ya bildirim gönder
            fetch(RASA_ACTION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender: senderId,
                    message: `/gorsel_yuklendi{"gorsel_url": "${url}"}`,
                }),
            }).catch(err => console.warn('Rasa\'ya görsel bildirimi gönderilemedi:', err));

            // Kullanıcı mesajı olarak görseli ekle
            const userMessage: ChatMessage = {
                id: Date.now().toString() + '-u-image-' + Math.random().toString(36).substring(7),
                sender: 'user',
                content: '',
                imageUrl: url,
                timestamp: Date.now(),
            };
            
            setMessages(prev => [...prev, userMessage]);
        });
    }, [senderId]);

    return useMemo(() => ({
        messages,
        isLoading,
        sendMessage,
        startNewChat,
        isChatStarted: messages.length > 0,
        inputText,
        setInputText,
        uploadFile,
        addImageMessages,
    }), [messages, isLoading, sendMessage, startNewChat, inputText, uploadFile, addImageMessages]);
};