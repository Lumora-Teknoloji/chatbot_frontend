'use client';

import React, { useState } from 'react';
import NewChatButton from './chatButton';
import HistoryItem from './historyItem';
import MenuButton from './menuButton';

interface SidebarProps {
    isVisible: boolean;
    isLocked: boolean;
    onMenuClick: () => void;
    onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible, isLocked, onMenuClick, onNewChat }) => {
    const [history, setHistory] = useState<Array<{ id: number; title: string; active: boolean }>>([]);

    const handleDelete = (idToDelete: number) => {
        if (typeof window !== 'undefined' && window.confirm("Bu sohbeti silmek istediğinizden emin misiniz?")) {
            setHistory(prevHistory => prevHistory.filter(item => item.id !== idToDelete));
        }
    };

    const handleRename = (idToRename: number) => {
        if (typeof window === 'undefined') return;
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
            <div className="flex flex-col h-full bg-gray-950/90 backdrop-blur-xl text-white p-4">

                <div className="flex flex-col space-y-2 items-start">
                    <MenuButton isVisible={isVisible} isLocked={isLocked} onClick={onMenuClick} />
                    <NewChatButton isVisible={isVisible} onClick={onNewChat} />
                </div>

                <div className={`flex-grow mt-6 flex flex-col overflow-hidden transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    <p className="text-xs font-semibold uppercase text-gray-400 mb-3 px-2 flex-shrink-0 tracking-wider">
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

            </div>
        </div>
    );
};

export default Sidebar;