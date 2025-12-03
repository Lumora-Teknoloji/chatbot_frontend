// app/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
// DEĞİŞİKLİK: Dosya yolları küçük harf ve camelCase olarak güncellendi
import Sidebar from '@/components/sidebar/sidebar';
import MessageList from '@/components/chat/messageList';
import { useChat } from '@/hooks/useChat';
import LoginForm from '@/components/auth/loginForm';
import Image from 'next/image';
// Görsel durumu için tip
type UploadStatus = 'uploading' | 'success' | 'error';
interface AttachedImage {
    id: string;
    file: File;
    previewUrl: string;
    uploadedUrl?: string;
    status: UploadStatus;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
    </svg>
);

export default function Home() {
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
    const [isMounted, setIsMounted] = useState(false);
    
    const { messages, isLoading, sendMessage, startNewChat, isChatStarted, inputText, setInputText, uploadFile } = useChat();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [isSidebarLocked, setIsSidebarLocked] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
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
            
            // Debug log
            console.log('🔍 Auth kontrol:', { 
                token: token ? 'var' : 'yok', 
                guestMode, 
                isGuestMode: isGuest,
                localStorage_guest_mode: localStorage.getItem('guest_mode'),
                localStorage_auth_token: localStorage.getItem('auth_token')
            });
            
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
        console.log('👤 Misafir modu aktifleştiriliyor...');
        
        // localStorage'a yaz
        if (typeof window !== 'undefined') {
            localStorage.setItem('guest_mode', 'true');
            localStorage.removeItem('auth_token');
            
            // State'i güncelle - sayfa yenileme yerine state güncellemesi
            setAuthToken(null);
            setIsGuestMode(true);
            
            console.log('✅ localStorage ve state güncellendi:', { 
                guest_mode: localStorage.getItem('guest_mode'), 
                auth_token: localStorage.getItem('auth_token'),
                isGuestMode_state: true,
                authToken_state: null
            });
            
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

    // Preview URL'lerini temizle
    useEffect(() => {
        return () => {
            attachedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
        };
    }, [attachedImages]);

    const handleMenuClick = () => setIsSidebarLocked(prev => !prev);
    const handleAttachClick = () => fileInputRef.current?.click();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            // Sadece ilk resmi al
            const file = files[0];
            if (file.type.startsWith('image/')) {
                // Eski resmi temizle
                attachedImages.forEach(img => {
                    URL.revokeObjectURL(img.previewUrl);
                });
                
                const id = `${file.name}-${Date.now()}`;
                const previewUrl = URL.createObjectURL(file);
                
                const newImage: AttachedImage = {
                    id,
                    file,
                    previewUrl,
                    status: 'uploading',
                };
                
                // Eski resmi kaldırıp yeni resmi ekle (sadece 1 resim)
                setAttachedImages([newImage]);
                
                // S3'e yükle
                const uploadedUrl = await uploadFile(file);
                
                if (uploadedUrl) {
                    setAttachedImages(prev =>
                        prev.map(img =>
                            img.id === id
                                ? { ...img, uploadedUrl, status: 'success' }
                                : img
                        )
                    );
                } else {
                    setAttachedImages(prev =>
                        prev.map(img =>
                            img.id === id
                                ? { ...img, status: 'error' }
                                : img
                        )
                    );
                }
            }
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (id: string) => {
        const imageToRemove = attachedImages.find(img => img.id === id);
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.previewUrl);
        }
        setAttachedImages(prev => prev.filter(img => img.id !== id));
    };

    const handleInputSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
        e.preventDefault();
        
        if (isLoading) return;

        // Yükleme devam ediyorsa bekle (sadece 1 resim)
        const currentImage = attachedImages[0];
        if (currentImage?.status === 'uploading') return;

        // Hata olan görsel varsa işlemi durdur
        if (currentImage?.status === 'error') {
            console.error('Görsel yüklenemedi');
            return;
        }

        // Başarıyla yüklenen görselin URL'ini al (sadece 1 resim)
        const uploadedUrl = currentImage?.status === 'success' && currentImage?.uploadedUrl 
            ? [currentImage.uploadedUrl] 
            : undefined;

        const messageToSend = inputText.trim();

        // Mesaj veya görsel varsa gönder
        if (messageToSend || uploadedUrl) {
            sendMessage(messageToSend, uploadedUrl);
        }

        // Preview URL'lerini temizle ve state'i sıfırla
        attachedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
        setAttachedImages([]);
        setInputText('');
        
        // Mesaj gönderildikten sonra textarea'ya focus yap
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 0);
    };

    const renderForm = () => {
        const currentImage = attachedImages[0]; // Sadece 1 resim olduğu için ilk elemanı al
        const hasUploading = currentImage?.status === 'uploading';
        const hasError = currentImage?.status === 'error';
        const canSend = (inputText.trim() || currentImage?.status === 'success') && !hasUploading && !hasError;

        return (
            <form onSubmit={handleInputSubmit} className="w-full mx-auto">
                {currentImage && (
                    <div className="mb-3 p-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-lg">
                        <div className="p-2 bg-gray-800/30 rounded-lg flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Image 
                                        src={currentImage.previewUrl} 
                                        alt={currentImage.file.name} 
                                        width={40} 
                                        height={40} 
                                        className="rounded-lg object-cover border border-gray-700"
                                    />
                                    {currentImage.status === 'uploading' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                    {currentImage.status === 'success' && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800" />
                                    )}
                                    {currentImage.status === 'error' && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-800" />
                                    )}
                                </div>
                                <span className="text-sm text-gray-300 truncate max-w-[200px]">{currentImage.file.name}</span>
                                {currentImage.status === 'error' && (
                                    <span className="text-xs text-red-400 px-2 py-1 bg-red-500/10 rounded">Hata</span>
                                )}
                            </div>
                            <button 
                                type="button" 
                                onClick={() => handleRemoveImage(currentImage.id)} 
                                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                    </div>
                )}
                <div className="relative flex items-end gap-3">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" disabled={isLoading || hasUploading} />
                    <button 
                        type="button" 
                        onClick={handleAttachClick} 
                        disabled={isLoading || hasUploading}
                        className={`flex-shrink-0 p-3 rounded-xl border transition-all duration-200 group shadow-lg ${
                            isLoading || hasUploading
                                ? 'text-gray-500 bg-gray-800/30 border-gray-700/30 cursor-not-allowed'
                                : 'text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 border-gray-700/50 hover:border-blue-500/50 cursor-pointer hover:shadow-blue-500/20'
                        }`} 
                        title="Resim Ekle"
                    >
                        <svg className="w-6 h-6 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInputSubmit(e); } }}
                        disabled={isLoading || hasUploading}
                        placeholder={hasUploading ? "Görsel yükleniyor..." : "Mesajınızı yazın..."}
                        className="flex-1 p-4 pr-16 bg-gray-800/50 backdrop-blur-sm text-white rounded-2xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 shadow-xl placeholder:text-gray-500 resize-none overflow-y-auto transition-all duration-200"
                        style={{ minHeight: '56px', maxHeight: '120px' }}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !canSend} 
                        className="absolute right-3 bottom-3 p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all duration-200 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed cursor-pointer shadow-lg hover:shadow-blue-500/50 disabled:shadow-none group" 
                        title={currentImage ? "Görseli ve mesajı gönder" : "Mesajı gönder"}
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
    
    console.log('🎯 Render kontrol:', { 
        currentAuthToken: currentAuthToken ? 'var' : 'yok',
        currentGuestMode,
        localStorage_guest_mode: typeof window !== 'undefined' ? localStorage.getItem('guest_mode') : 'N/A',
        localStorage_auth_token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : 'N/A',
        isMounted,
        authToken: authToken ? 'var' : 'yok',
        isGuestMode
    });
    
    if (!currentAuthToken && !currentGuestMode) {
        console.log('🚫 Login formu gösteriliyor');
        return (
            <div className="flex h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 items-center justify-center">
                <LoginForm onLoginSuccess={handleLoginSuccess} onGuestMode={handleGuestMode} />
            </div>
        );
    }
    
    console.log('✅ Chat arayüzü gösteriliyor');

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
                            <p className="text-sm text-gray-500">Sorularınızı sorun, görseller yükleyin ve anında yanıt alın</p>
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