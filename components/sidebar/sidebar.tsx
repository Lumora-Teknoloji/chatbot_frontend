'use client';

import React from 'react';
import NewChatButton from './chatButton';
import HistoryItem from './historyItem';
import MenuButton from './menuButton';

interface SidebarProps {
    isVisible: boolean;
    isLocked: boolean;
    onMenuClick: () => void;
    onNewChat: () => void;
    history: Array<{ id: number | string; title: string; isGuest?: boolean }>;
    activeId: number | string | null;
    onSelect: (id: number | string, isGuest?: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible, isLocked, onMenuClick, onNewChat, history, activeId, onSelect }) => {

    // Şimdilik delete/rename UI'da tutuluyor ama state kontrollü olmadığı için sadece onSelect kullanılıyor
    const handleDelete = () => {};
    const handleRename = () => {};

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
                                    isActive={item.id === activeId} onDelete={handleDelete} onRename={handleRename}
                                    onClick={() => onSelect(item.id, item.isGuest)}
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