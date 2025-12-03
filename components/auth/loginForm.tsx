'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface LoginFormProps {
    onLoginSuccess: (token: string) => void;
    onGuestMode: () => void;
}

export default function LoginForm({ onLoginSuccess, onGuestMode }: LoginFormProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isRegister) {
                // Kayıt ol
                await api.register({
                    username,
                    email,
                    password,
                    full_name: fullName || undefined,
                });
                // Kayıt sonrası otomatik login
                const loginResponse = await api.login(username, password);
                localStorage.setItem('auth_token', loginResponse.access_token);
                onLoginSuccess(loginResponse.access_token);
            } else {
                // Giriş yap
                const response = await api.login(username, password);
                localStorage.setItem('auth_token', response.access_token);
                onLoginSuccess(response.access_token);
            }
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
                {isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Ad Soyad
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ad Soyad (opsiyonel)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                E-posta
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="ornek@email.com"
                            />
                        </div>
                    </>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Kullanıcı Adı
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="kullanici_adi"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Şifre
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-200 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium shadow-lg"
                >
                    {isLoading ? 'Yükleniyor...' : isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
                </button>
            </form>

            <div className="mt-4 space-y-2">
                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError(null);
                        }}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        {isRegister ? 'Zaten hesabınız var mı? Giriş yapın' : 'Hesabınız yok mu? Kayıt olun'}
                    </button>
                </div>
                <div className="relative flex items-center my-4">
                    <div className="flex-grow border-t border-gray-700"></div>
                    <span className="px-3 text-sm text-gray-500">veya</span>
                    <div className="flex-grow border-t border-gray-700"></div>
                </div>
                <button
                    type="button"
                    onClick={onGuestMode}
                    className="w-full py-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-all duration-200 text-white font-medium border border-gray-600 hover:border-gray-500"
                >
                    Misafir Olarak Devam Et
                </button>
            </div>
        </div>
    );
}

