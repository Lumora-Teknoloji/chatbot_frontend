// app/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
// DEĞİŞİKLİK: Dosya yolları küçük harf ve camelCase olarak güncellendi
import Sidebar from '@/components/sidebar/sidebar';
import MessageList from '@/components/chat/messageList';
import { useChat } from '@/hooks/useChat';
import Image from 'next/image';

// Tipler ve ikon bileşeni
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
interface AttachedFile {
    id: string;
    file: File;
    status: UploadStatus;
    name: string;
    type: string;
    path?: string;
    previewUrl: string;
    uploadedUrl?: string; // Yüklenen görselin URL'i
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
    </svg>
);

export default function Home() {
    const { messages, isLoading, sendMessage, startNewChat, isChatStarted, inputText, setInputText, uploadFile, addImageMessages } = useChat();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [isSidebarLocked, setIsSidebarLocked] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isSidebarVisible = isSidebarLocked || isHovered;

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

    useEffect(() => {
        return () => {
            attachedFiles.forEach(file => URL.revokeObjectURL(file.previewUrl));
        };
    }, [attachedFiles]);

    const handleMenuClick = () => setIsSidebarLocked(prev => !prev);
    const handleAttachClick = () => fileInputRef.current?.click();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            Array.from(files).forEach(async (file) => {
                if (file.type.startsWith('image/')) {
                    // Preview ekle ve hemen yükle (ama chat'e ekleme)
                    const id = `${file.name}-${Date.now()}`;
                    const previewUrl = URL.createObjectURL(file);
                    const newFile: AttachedFile = { 
                        id, 
                        file, 
                        status: 'uploading', // Hemen yüklemeye başla
                        name: file.name, 
                        type: file.type, 
                        previewUrl 
                    };
                    setAttachedFiles(prev => [...prev, newFile]);
                    
                    // Hemen yükle ama chat'e ekleme
                    try {
                        const url = await uploadFile(file, false); // addToChat: false
                        setAttachedFiles(prev =>
                            prev.map(f => f.id === id ? { ...f, status: 'success', uploadedUrl: url } : f)
                        );
                    } catch (error) {
                        console.error('Dosya yükleme hatası:', error);
                        setAttachedFiles(prev =>
                            prev.map(f => f.id === id ? { ...f, status: 'error' } : f)
                        );
                    }
                }
            });
        }
        // Input'u temizle ki aynı dosya tekrar seçilebilsin
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };


    const handleRemoveAttachedFile = (idToRemove: string) => {
        const fileToRemove = attachedFiles.find(f => f.id === idToRemove);
        if (fileToRemove) URL.revokeObjectURL(fileToRemove.previewUrl);
        setAttachedFiles(prev => prev.filter(f => f.id !== idToRemove));
    };

    const handleInputSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Eğer yükleme devam ediyorsa bekle
        const hasUploading = attachedFiles.some(f => f.status === 'uploading');
        const hasError = attachedFiles.some(f => f.status === 'error');
        
        if (isLoading || hasUploading) return;
        
        // Hata olan dosyalar varsa işlemi durdur
        if (hasError) {
            console.error('Bazı dosyalar yüklenemedi');
            return;
        }

        // Başarıyla yüklenen görsellerin URL'lerini al
        const uploadedUrls = attachedFiles
            .filter(f => f.status === 'success' && f.uploadedUrl)
            .map(f => f.uploadedUrl!);

        // Görselleri chat'e ekle
        if (uploadedUrls.length > 0) {
            addImageMessages(uploadedUrls);
        }

        // Metin mesajı varsa gönder
        const messageToSend = inputText.trim();
        if (messageToSend) {
            sendMessage(messageToSend);
        }
        
        // Dosyaları ve input'u temizle
        attachedFiles.forEach(file => {
            if (file.previewUrl) {
                URL.revokeObjectURL(file.previewUrl);
            }
        });
        setAttachedFiles([]);
        setInputText('');
        
        // Mesaj gönderildikten sonra textarea'ya focus yap
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 0);
    };

    const renderForm = () => (
        <form onSubmit={handleInputSubmit} className="w-full mx-auto">
            {attachedFiles.length > 0 && (
                <div className="mb-3 p-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 flex flex-col gap-2 shadow-lg">
                    {attachedFiles.map(file => (
                        <div key={file.id} className="p-2 bg-gray-800/30 rounded-lg flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Image src={file.previewUrl} alt={file.name} width={40} height={40} className="rounded-lg object-cover border border-gray-700"/>
                                    {file.status === 'uploading' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                    {file.status === 'success' && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800" />
                                    )}
                                </div>
                                <span className="text-sm text-gray-300 truncate max-w-[200px]">{file.name}</span>
                                {file.status === 'error' && <span className="text-xs text-red-400 px-2 py-1 bg-red-500/10 rounded">Hata</span>}
                            </div>
                            <button type="button" onClick={() => handleRemoveAttachedFile(file.id)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/50 transition-colors">
                                <CloseIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="relative flex items-end gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" multiple />
                <button 
                    type="button" 
                    onClick={handleAttachClick} 
                    className="flex-shrink-0 p-3 text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-blue-500/20" 
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
                    disabled={isLoading || attachedFiles.some(f => f.status === 'uploading')}
                    placeholder={attachedFiles.length > 0 ? "Mesajınızı yazın (görseller yükleniyor)..." : "Mesajınızı yazın..."}
                    className="flex-1 p-4 pr-16 bg-gray-800/50 backdrop-blur-sm text-white rounded-2xl border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 shadow-xl placeholder:text-gray-500 resize-none overflow-y-auto transition-all duration-200"
                    style={{ minHeight: '56px', maxHeight: '120px' }}
                />
                <button type="submit" disabled={isLoading || attachedFiles.some(f => f.status === 'uploading') || (!inputText.trim() && attachedFiles.length === 0)} className="absolute right-3 bottom-3 p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all duration-200 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed cursor-pointer shadow-lg hover:shadow-blue-500/50 disabled:shadow-none group" title={attachedFiles.length > 0 ? "Görselleri chat'e ekle ve mesajı gönder" : "Mesajı gönder"}>
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <svg className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                    )}
                </button>
            </div>
        </form>
    );

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