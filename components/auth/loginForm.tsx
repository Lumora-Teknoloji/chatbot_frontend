'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface LoginFormProps {
    onLoginSuccess: () => void;
    // Guest mode option removed for internal security simplification
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await api.login(username, password);
            onLoginSuccess();
        } catch (err: any) {
            let msg = err.message || 'Hata oluştu. Bilgilerinizi kontrol ediniz.';
            if (msg.includes('Failed to fetch') || msg.includes('Network request failed')) {
                msg = 'Sistem ağına bağlanılamıyor. Lütfen bağlantınızı kontrol edin.';
            } else if (msg.toLowerCase().includes('field required')) {
                msg = 'Lütfen zorunlu alanları eksiksiz girin.';
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto relative group">
            {/* Deep Aesthetic Glow */}
            <div className="absolute -inset-1 bg-gradient-to-b from-sky-200 via-blue-100 to-sky-50 dark:from-sky-900/40 dark:via-[#050505] dark:to-sky-900/20 blur-2xl rounded-[3rem] opacity-70 group-hover:opacity-100 transition duration-1000"></div>

            <div className="relative bg-white/70 dark:bg-[#050505]/95 backdrop-blur-3xl rounded-[2.5rem] border border-sky-100 dark:border-white/5 shadow-[0_30px_60px_rgba(56,189,248,0.15)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.9)] overflow-hidden">
                {/* Micro-Ornaments */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-sky-200/50 dark:bg-sky-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-200/40 dark:bg-blue-600/10 blur-[60px] rounded-full pointer-events-none"></div>

                <div className="p-10 sm:p-12 relative z-10">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-10 space-y-4">
                        <div className="relative w-24 h-24 rounded-full border border-sky-200 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] shadow-[0_0_15px_rgba(186,230,253,0.5)] dark:shadow-inner flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 rounded-full border border-sky-300/30 dark:border-sky-500/20 blur-sm"></div>
                            <img src="/lumora_logo.png" alt="Lumora" className="w-16 h-16 object-contain relative z-10" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                Sistem Erişimi
                            </h2>
                            <p className="text-sm font-medium text-sky-500/90 dark:text-sky-400/80 uppercase tracking-[0.2em] mt-2">
                                Lumora Intelligence
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">Kullanıcı Adı</label>
                                <div className="relative group/input">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300 dark:text-gray-500 group-focus-within/input:text-sky-500 dark:group-focus-within/input:text-sky-400 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        className="w-full bg-sky-50/50 dark:bg-[#0a0a0a]/80 border border-sky-100 dark:border-gray-800 focus:border-sky-400/50 dark:focus:border-sky-500/40 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 outline-none transition-all shadow-inner"
                                        placeholder="Kullanıcı adınız"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">Şifre</label>
                                <div className="relative group/input">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300 dark:text-gray-500 group-focus-within/input:text-sky-500 dark:group-focus-within/input:text-sky-400 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full bg-sky-50/50 dark:bg-[#0a0a0a]/80 border border-sky-100 dark:border-gray-800 focus:border-sky-400/50 dark:focus:border-sky-500/40 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 outline-none transition-all shadow-inner"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-300 text-sm py-4 px-5 rounded-2xl flex items-center gap-3 animate-shake">
                                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="relative w-full overflow-hidden bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 dark:from-sky-500 dark:via-blue-600 dark:to-sky-800 text-white font-black py-4.5 rounded-2xl shadow-[0_10px_20px_rgba(56,189,248,0.2)] dark:shadow-[0_10px_20px_rgba(56,189,248,0.1)] hover:shadow-[0_15px_30px_rgba(56,189,248,0.3)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mt-8 group/btn"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative z-10 flex items-center gap-2">
                                {isLoading ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        GİRİŞ YAP
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:translate-x-1 transition-transform"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

