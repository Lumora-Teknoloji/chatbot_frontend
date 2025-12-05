// components/Sidebar/HistoryItem.tsx
import React from 'react';

interface HistoryItemProps {
    id: number | string; // Silme ve yeniden adlandırma için ID gerekli
    title: string;
    isActive?: boolean;
    // Tıklandığında ana bileşene haber verecek fonksiyonlar
    onDelete: (id: number | string) => void;
    onRename: (id: number | string) => void;
    onClick?: (id: number | string) => void;
}

// Yeniden Adlandırma (Kalem) ikonu için bir bileşen
const RenameIcon = () => (
    <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
    </svg>
);

// Silme (Çöp Kutusu) ikonu için bir bileşen
const DeleteIcon = () => (
    <svg className="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
    </svg>
);

const HistoryItem: React.FC<HistoryItemProps> = ({ id, title, isActive = false, onDelete, onRename, onClick }) => {
    const displayTitle = title.length > 25 ? title.substring(0, 25) + '...' : title;

    const baseClasses = 'flex items-center justify-between p-2 text-sm rounded-lg transition duration-150 group';
    const activeClasses = isActive ? 'bg-gray-700 text-white font-medium' : 'text-gray-300 hover:bg-gray-800';

    return (
        <li className={`${baseClasses} ${activeClasses}`} onClick={() => onClick?.(id)}>
            <button type="button" className="flex-grow text-left truncate" title={title}>
                {displayTitle}
            </button>
            {/* Bu ikonlar sadece parent 'group' üzerine gelindiğinde görünür olacak */}
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onRename(id)} title="Yeniden Adlandır">
                    <RenameIcon />
                </button>
                <button onClick={() => onDelete(id)} title="Sil">
                    <DeleteIcon />
                </button>
            </div>
        </li>
    );
};

export default HistoryItem;