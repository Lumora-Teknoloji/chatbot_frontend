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
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
    </svg>
);

export default function Home() {
    const { messages, isLoading, sendMessage, startNewChat, isChatStarted, inputText, setInputText } = useChat();

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

    useEffect(() => {
        return () => {
            attachedFiles.forEach(file => URL.revokeObjectURL(file.previewUrl));
        };
    }, [attachedFiles]);

    const handleMenuClick = () => setIsSidebarLocked(prev => !prev);
    const handleAttachClick = () => fileInputRef.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) handleFileUpload(file);
            });
        }
    };

    const handleFileUpload = (file: File) => {
        const id = `${file.name}-${Date.now()}`;
        const previewUrl = URL.createObjectURL(file);
        const newFile: AttachedFile = { id, file, status: 'uploading', name: file.name, type: file.type, previewUrl };
        setAttachedFiles(prev => [...prev, newFile]);

        setTimeout(() => {
            setAttachedFiles(prev =>
                prev.map(f => f.id === id ? { ...f, status: 'success', path: `uploaded_files/${f.name}` } : f)
            );
        }, 1500);
    };

    const handleRemoveAttachedFile = (idToRemove: string) => {
        const fileToRemove = attachedFiles.find(f => f.id === idToRemove);
        if (fileToRemove) URL.revokeObjectURL(fileToRemove.previewUrl);
        setAttachedFiles(prev => prev.filter(f => f.id !== idToRemove));
    };

    const handleInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const allUploaded = attachedFiles.every(f => f.status === 'success');
        if (isLoading || !allUploaded) return;

        let messageToSend = inputText.trim();
        if (attachedFiles.length > 0) {
            const fileNames = attachedFiles.map(f => f.name).join(', ');
            messageToSend = `[DOSYALAR: ${fileNames}] ${messageToSend}`;
        }
        if (!messageToSend) return;

        sendMessage(messageToSend);
        setAttachedFiles([]);
        setInputText('');
    };

    const renderForm = () => (
        <form onSubmit={handleInputSubmit} className="w-full max-w-3xl mx-auto">
            {attachedFiles.length > 0 && (
                <div className="mb-2 p-1 bg-gray-800 rounded-lg flex flex-col gap-1">
                    {attachedFiles.map(file => (
                        <div key={file.id} className="p-1 bg-gray-800 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Image src={file.previewUrl} alt={file.name} width={32} height={32} className="rounded object-cover"/>
                                <span className="text-xs text-gray-300 truncate">{file.name}</span>
                                {file.status === 'uploading' && <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
                            </div>
                            <button type="button" onClick={() => handleRemoveAttachedFile(file.id)} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700">
                                <CloseIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="relative flex">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" multiple />
                <button type="button" onClick={handleAttachClick} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white rounded-full cursor-pointer" title="Dosya Yükle">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.41-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"/></svg>
                </button>
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInputSubmit(e); } }}
                    disabled={isLoading || attachedFiles.some(f => f.status === 'uploading')}
                    placeholder={attachedFiles.length > 0 ? "Dosyalar hakkında bir soru sorun..." : "Mesajınızı yazın..."}
                    className="w-full p-4 pl-12 pr-20 bg-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg placeholder:text-gray-400 resize-none overflow-y-auto"
                    style={{ minHeight: '56px', maxHeight: '120px' }}
                />
                <button type="submit" disabled={isLoading || attachedFiles.some(f => f.status === 'uploading') || (!inputText.trim() && attachedFiles.length === 0)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 rounded-xl hover:bg-blue-700 transition disabled:bg-gray-500 disabled:cursor-not-allowed cursor-pointer">
                    {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>}
                </button>
            </div>
        </form>
    );

    return (
        <div className="flex h-screen w-screen bg-gray-900">
            <div
                onMouseEnter={() => !isSidebarLocked && setIsHovered(true)}
                onMouseLeave={() => !isSidebarLocked && setIsHovered(false)}
                className={`h-screen bg-gray-950 transition-all duration-300 ease-in-out 
                           ${isSidebarVisible ? 'w-64' : 'w-20'} flex-shrink-0 overflow-hidden`}
            >
                <Sidebar
                    isVisible={isSidebarVisible}
                    isLocked={isSidebarLocked}
                    onMenuClick={handleMenuClick}
                    onNewChat={startNewChat}
                />
            </div>

            <main className="flex flex-1 flex-col overflow-hidden p-4">
                {!isChatStarted && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="pb-8">
                            <h1 className="text-5xl font-bold text-white mb-4">Lumora AI</h1>
                            <p className="text-gray-400">Tekstil odaklı sanal asistanınızla bir sohbet başlatın.</p>
                        </div>
                        <div className="w-full max-w-3xl">
                            {renderForm()}
                        </div>
                    </div>
                )}

                {isChatStarted && (
                    <>
                        <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto">
                            <MessageList messages={messages} isLoading={isLoading} />
                        </div>

                        <div className="pt-4 w-full max-w-3xl mx-auto">
                            {renderForm()}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}