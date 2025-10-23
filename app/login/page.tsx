// app/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/authContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [username, setUsername] = useState('onder'); // Hızlı test için varsayılan değer
    const [password, setPassword] = useState('123456'); // Hızlı test için varsayılan değer
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (isLoading || user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-950 px-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-gray-900 rounded-2xl shadow-xl">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-2">Hoş Geldiniz</h1>
                    <p className="text-gray-400">Devam etmek için oturum açın</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm font-medium text-gray-300 sr-only">Kullanıcı Adı</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Kullanıcı Adı"
                            className="w-full px-4 py-3 text-white bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-300 sr-only">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Şifre"
                            className="w-full px-4 py-3 text-white bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>
                    {error && <p className="text-sm text-red-400 text-center animate-shake">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>
                <div className="text-center text-sm text-gray-500">
                    <Link href="/" className="hover:underline">Ana Sayfaya Dön</Link>
                </div>
            </div>
        </div>
    );
}