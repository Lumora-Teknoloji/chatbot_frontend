'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface LoginFormProps {
    onLoginSuccess: () => void;
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
                await api.register({
                    username,
                    email,
                    password,
                    full_name: fullName || undefined,
                });
                await api.login(username, password);
                onLoginSuccess();
            } else {
                await api.login(username, password);
                onLoginSuccess();
            }
        } catch (err: any) {
            let msg = err.message || 'Hata oluştu. Bilgilerinizi kontrol ediniz.';
            if (msg.includes('Failed to fetch') || msg.includes('Network request failed')) {
                msg = 'Sistem ağına bağlanılamıyor. Lütfen bağlantınızı kontrol edin.';
            } else if (msg.toLowerCase().includes('field required')) {
                msg = 'Lütfen zorunlu alanları eksiksiz girin.';
            } else if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('not valid')) {
                msg = 'E-posta veya yetkilendirme bilginiz geçersiz.';
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
                        <div className="relative w-20 h-20 rounded-full border border-sky-200 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] shadow-[0_0_15px_rgba(186,230,253,0.5)] dark:shadow-inner flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border border-sky-300/30 dark:border-sky-500/20 blur-sm"></div>
                            {isRegister ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500 dark:text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.3)] dark:drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" y1="8" x2="19" y2="14" />
                                    <line x1="22" y1="11" x2="16" y2="11" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500 dark:text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.3)] dark:drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            )}
                        </div>
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                {isRegister ? 'Hesap Oluştur' : 'Sisteme Bağlan'}
                            </h2>
                            <p className="text-sm font-medium text-sky-500/90 dark:text-sky-400/80 uppercase tracking-[0.2em] mt-2">
                                Lumora Intelligence
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isRegister && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">Ad Soyad</label>
                                    <div className="relative group/input">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300 dark:text-gray-500 group-focus-within/input:text-sky-500 dark:group-focus-within/input:text-sky-400 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-sky-50/50 dark:bg-[#0a0a0a]/80 border border-sky-100 dark:border-gray-800 focus:border-sky-400/50 dark:focus:border-sky-500/40 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 outline-none transition-all shadow-inner"
                                            placeholder="Sistem üzerindeki isminiz"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">E-Posta</label>
                                    <div className="relative group/input">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300 dark:text-gray-500 group-focus-within/input:text-sky-500 dark:group-focus-within/input:text-sky-400 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full bg-sky-50/50 dark:bg-[#0a0a0a]/80 border border-sky-100 dark:border-gray-800 focus:border-sky-400/50 dark:focus:border-sky-500/40 rounded-2xl py-4 pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 outline-none transition-all shadow-inner"
                                            placeholder="ornek@lumora.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

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
                                        {isRegister ? 'KAYIT OL' : 'GİRİŞ YAP'}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:translate-x-1 transition-transform"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </>
                                )}
                            </span>
                        </button>
                    </form>

                    <div className="mt-8 flex flex-col items-center gap-6">
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError(null);
                            }}
                            className="text-sm font-medium text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors"
                        >
                            {isRegister ? 'Hesabınız var mı? Giriş yapın.' : 'Hesabınız yok mu? Yeni bir tane oluşturun.'}
                        </button>

                        <div className="flex items-center w-full gap-4 px-4 opacity-50">
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
                            <span className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold">Veya</span>
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
                        </div>

                        <button
                            type="button"
                            onClick={onGuestMode}
                            className="group/guest w-full py-4 bg-sky-50/50 dark:bg-[#0a0a0a]/50 hover:bg-sky-100 dark:hover:bg-[#111111]/80 rounded-xl transition-all duration-300 text-gray-500 dark:text-gray-400 hover:text-sky-600 dark:hover:text-gray-200 font-medium border border-sky-100 dark:border-gray-800 hover:border-sky-200 dark:hover:border-gray-700 flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover/guest:opacity-100 transition-opacity"><path d="M22 17v1c0 .5-.5 1-1 1H3c-.5 0-1-.5-1-1v-1" /><path d="M12 22v-4" /><path d="M8 18v-2" /><path d="M16 18v-2" /><rect width="20" height="12" x="2" y="2" rx="2" /></svg>
                            Misafir Olarak Devam Et
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

