// components/sidebar/customToolButton.tsx
import React from 'react';

interface CustomToolButtonProps {
    isVisible: boolean;
}

const CustomToolButton: React.FC<CustomToolButtonProps> = ({ isVisible }) => {
    return (
        <button
            className={`flex items-center text-sm font-medium transition-all duration-300 ease-in-out flex-shrink-0
                        text-white hover:bg-gray-800 focus:outline-none cursor-pointer p-2
                        ${isVisible
                ? 'w-full rounded-lg justify-start'
                : 'w-10 h-10 rounded-full justify-center pl-5'}`} // <-- GÖRSEL HİZALAMA İÇİN pl-1 EKLENDİ
            title="Kendin Tasarla Aracını Aç"
        >
            {/* İKON */}
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>

            {/* Metin */}
            <span className={`ml-3 self-center whitespace-nowrap overflow-hidden transition-opacity duration-300 ease-in-out
                            ${isVisible ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}
            >
                Kendin Tasarla
            </span>
        </button>
    );
};

export default CustomToolButton;