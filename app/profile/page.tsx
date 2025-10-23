// app/profile/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/app/context/authContext'; // Yolu @/app/... olarak düzelttik
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    // KORUMALI SAYFA MANTIĞI
    useEffect(() => {
        // Veri yükleniyorsa bekle, ama yükleme bittiğinde kullanıcı yoksa login'e yönlendir.
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    // Yükleme sırasında veya yönlendirme gerçekleşirken boş bir ekran göster
    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Kullanıcı giriş yapmışsa profil bilgilerini göster
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="w-full max-w-lg p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-center">Profil</h1>
                <div className="space-y-4 text-lg">
                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-400">Tam Ad:</span>
                        <span>{user.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-400">Kullanıcı Adı:</span>
                        <span>{user.username}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-400">E-posta:</span>
                        <span>{user.email}</span>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                    Çıkış Yap
                </button>
                <button
                    onClick={() => router.push('/')}
                    className="w-full py-2 mt-2 font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-700 transition-colors"
                >
                    Ana Sayfaya Dön
                </button>
            </div>
        </div>
    );
}