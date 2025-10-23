// components/sidebar/sidebar.tsx
'use client';

import React, { useState } from 'react';
// DEĞİŞİKLİK: Dosya yolları küçük harf ve camelCase olarak güncellendi
import NewChatButton from './chatButton';
import HistoryItem from './historyItem';
import MenuButton from './menuButton';
import CustomToolButton from './customToolButton';
import { useAuth } from '@/app/context/authContext';
import Link from 'next/link';

interface SidebarProps {
    isVisible: boolean;
    isLocked: boolean;
    onMenuClick: () => void;
    onNewChat: () => void;
}

const initialMockHistory = [
    { id: 1, title: 'Kumaş Kalite Raporu', active: false },
    { id: 2, title: 'Son 3 Ayın Pamuk Fiyatları', active: true },
    { id: 3, title: 'Yeni Boya Formül Önerisi', active: false },
    { id: 4, title: 'Tedarikçi Sözleşme Detayları', active: false },
];

const Sidebar: React.FC<SidebarProps> = ({ isVisible, isLocked, onMenuClick, onNewChat }) => {
    const { user } = useAuth();
    const [history, setHistory] = useState(initialMockHistory);

    const handleDelete = (idToDelete: number) => {
        if (window.confirm("Bu sohbeti silmek istediğinizden emin misiniz?")) {
            setHistory(prevHistory => prevHistory.filter(item => item.id !== idToDelete));
        }
    };

    const handleRename = (idToRename: number) => {
        const currentItem = history.find(item => item.id === idToRename);
        const newTitle = window.prompt("Yeni sohbet başlığını girin:", currentItem?.title);
        if (newTitle && newTitle.trim() !== "") {
            setHistory(prevHistory =>
                prevHistory.map(item =>
                    item.id === idToRename ? { ...item, title: newTitle.trim() } : item
                )
            );
        }
    };

    return (
        <div className="w-64 h-full relative">
            <div className="flex flex-col h-full bg-gray-950 text-white p-4">

                <div className="flex flex-col space-y-2 items-start">
                    <MenuButton isVisible={isVisible} isLocked={isLocked} onClick={onMenuClick} />
                    <NewChatButton isVisible={isVisible} onClick={onNewChat} />
                    <CustomToolButton isVisible={isVisible} />
                </div>

                <div className={`flex-grow mt-6 flex flex-col overflow-hidden transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <p className="text-xs font-semibold uppercase text-gray-500 mb-2 px-2 flex-shrink-0">
                        Sohbet Geçmişi
                    </p>
                    {history.length > 0 ? (
                        <ul className="space-y-1 overflow-y-auto">
                            {history.map(item => (
                                <HistoryItem
                                    key={item.id} id={item.id} title={item.title}
                                    isActive={item.active} onDelete={handleDelete} onRename={handleRename}
                                />
                            ))}
                        </ul>
                    ) : (
                        <div className="mt-4 px-2 text-left">
                            <p className="text-sm text-gray-500">Henüz sohbet geçmişiniz yok.</p>
                            <p className="text-sm text-gray-500">Yeni sohbet başlatabilirsiniz.</p>
                        </div>
                    )}
                </div>

                {!isVisible && (
                    <div className="absolute top-1/2 left-10 -translate-x-1/2 -translate-y-1/2">
                        <span className="text-gray-500 text-xs [writing-mode:vertical-lr] transform rotate-180 select-none">Sohbeti Genişlet</span>
                    </div>
                )}

                <div className="pt-4 mt-auto border-t border-gray-800">
                    <Link href={user ? "/profile" : "/login"} className="w-full">
                        <div className="flex justify-start items-center p-2 hover:bg-gray-800 rounded-lg transition duration-150">
                            {user ? (
                                <>
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {user.full_name.charAt(0)}
                                    </div>
                                    <span className={`text-sm truncate ml-3 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>{user.full_name}</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                                    </div>
                                    <span className={`text-sm truncate ml-3 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>{ "Oturum Aç"}</span>
                                </>
                            )}
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;