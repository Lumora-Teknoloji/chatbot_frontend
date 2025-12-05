'use client';

import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '@/components/sidebar/sidebar';
import MessageList from '@/components/chat/messageList';
import { useChat } from '@/hooks/useChat';
import LoginForm from '@/components/auth/loginForm';

export default function Home() {
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
    const [isMounted, setIsMounted] = useState(false);
    
    const { messages, isLoading, sendMessage, startNewChat, isChatStarted, inputText, setInputText, isGuest, currentConversationId, guestAlias, conversations, loadConversation } = useChat();

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [isSidebarLocked, setIsSidebarLocked] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isSidebarVisible = isSidebarLocked || isHovered;

    // Client-side mount kontrolü ve auth token kontrolü
    useEffect(() => {
        setIsMounted(true);
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth_token');
            const guestMode = localStorage.getItem('guest_mode') === 'true';
            setAuthToken(token);
            // Misafir modu: guest_mode true VE token yok
            const isGuest = guestMode && !token;
            setIsGuestMode(isGuest);
            
            
            // Sayfa kapatıldığında misafir modunu temizle
            const handleBeforeUnload = () => {
                const isGuest = localStorage.getItem('guest_mode') === 'true';
                if (isGuest) {
                    localStorage.removeItem('guest_mode');
                }
            };
            
            window.addEventListener('beforeunload', handleBeforeUnload);
            
            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }
    }, []);

    const handleLoginSuccess = (token: string) => {
        localStorage.setItem('auth_token', token);
        localStorage.removeItem('guest_mode');
        setAuthToken(token);
        setIsGuestMode(false);
        // Sayfayı yenile ki useChat hook'u yeni token'ı alsın
        window.location.reload();
    };

    const handleGuestMode = () => {
        // localStorage'a yaz
        if (typeof window !== 'undefined') {
            localStorage.setItem('guest_mode', 'true');
            localStorage.removeItem('auth_token');
            
            // State'i güncelle - sayfa yenileme yerine state güncellemesi
            setAuthToken(null);
            setIsGuestMode(true);
            
            // Custom event dispatch et ki useChat hook'u dinlesin
            window.dispatchEvent(new Event('guestModeActivated'));
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [inputText]);

    // Mesaj gönderildikten ve yükleme tamamlandıktan sonra textarea'ya focus yap
    useEffect(() => {
        if (!isLoading && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isLoading]);

    const handleMenuClick = () => setIsSidebarLocked(prev => !prev);

    const handleInputSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault();
        
        if (isLoading) return;

        const messageToSend = inputText.trim();

        // Mesaj varsa gönder
        if (messageToSend) {
            sendMessage(messageToSend);
        }

        setInputText('');
        
        // Mesaj gönderildikten sonra textarea'ya focus yap
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 0);
    };

    const renderForm = () => {
        const canSend = inputText.trim() && !isLoading;

        return (
            <form onSubmit={handleInputSubmit} className="w-full mx-auto">
                <div className="relative flex items-end gap-3">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInputSubmit(e); } }}
                        disabled={isLoading}
                        placeholder="Mesajınızı yazın..."
                        className="flex-1 p-4 pr-16 bg-gray-800/50 backdrop-blur-sm text-white rounded-2xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 shadow-xl placeholder:text-gray-500 resize-none overflow-y-auto transition-all duration-200"
                        style={{ minHeight: '56px', maxHeight: '120px' }}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !canSend} 
                        className="absolute right-3 bottom-3 p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all duration-200 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed cursor-pointer shadow-lg hover:shadow-blue-500/50 disabled:shadow-none group" 
                        title="Mesajı gönder"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                        )}
                    </button>
                </div>
            </form>
        );
    };

    // Login olmamışsa login formunu göster (hydration hatasını önlemek için mounted kontrolü)
    if (!isMounted) {
        // Server-side render için loading state
        return (
            <div className="flex h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 items-center justify-center">
                <div className="text-white">Yükleniyor...</div>
            </div>
        );
    }

    // localStorage'dan direkt kontrol et (state güncellenmemiş olabilir)
    const currentGuestMode = typeof window !== 'undefined' ? (localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token')) : false;
    const currentAuthToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    if (!currentAuthToken && !currentGuestMode) {
        return (
            <div className="flex h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 items-center justify-center">
                <LoginForm onLoginSuccess={handleLoginSuccess} onGuestMode={handleGuestMode} />
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
            <div
                onMouseEnter={() => !isSidebarLocked && setIsHovered(true)}
                onMouseLeave={() => !isSidebarLocked && setIsHovered(false)}
                className={`h-screen bg-gray-950/80 backdrop-blur-xl border-r border-gray-800/50 transition-all duration-300 ease-in-out 
                           ${isSidebarVisible ? 'w-64' : 'w-20'} flex-shrink-0 overflow-hidden shadow-2xl`}
            >
                <Sidebar
                    isVisible={isSidebarVisible}
                    isLocked={isSidebarLocked}
                    onMenuClick={handleMenuClick}
                    onNewChat={startNewChat}
                    history={conversations}
                    activeId={currentConversationId}
                    onSelect={(id, isGuestConversation) => loadConversation(id, !!isGuestConversation)}
                />
            </div>

            <main className="flex flex-1 flex-col overflow-hidden relative">
                {/* Arka plan gradient efekti */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 via-transparent to-purple-900/5 pointer-events-none" />
                
                {!isChatStarted && (
                    <div className="flex flex-col items-center justify-center h-full text-center relative z-10 px-4">
                        <div className="pb-12 animate-fade-in">
                            <div className="mb-6 flex justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-2xl opacity-30 animate-pulse" />
                                    <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent relative">
                                        Lumora AI
                                    </h1>
                                </div>
                            </div>
                            <p className="text-xl text-gray-300 mb-2">Tekstil odaklı sanal asistanınızla bir sohbet başlatın</p>
                            <p className="text-sm text-gray-500">Sorularınızı sorun ve anında yanıt alın</p>
                        </div>
                        <div className="w-full max-w-3xl animate-slide-up">
                            {renderForm()}
                        </div>
                    </div>
                )}

                {isChatStarted && (
                    <>
                        <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-4 py-6 relative z-10">
                            <MessageList messages={messages} isLoading={isLoading} />
                        </div>

                        <div className="pt-4 pb-6 w-full max-w-4xl mx-auto px-4 relative z-10">
                            {renderForm()}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}