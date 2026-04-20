'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useTheme } from '../ThemeContext';

interface UserMenuProps {
    userProfile?: { username: string; email: string; full_name?: string | null };
    isGuest?: boolean;
    guestAlias?: string | null;
    avatarOverride?: string;
    onLogout?: () => void;
    onChangePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
    onAvatarChange?: (url: string | null) => void;
    onNewChat?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
    userProfile,
    isGuest,
    guestAlias,
    avatarOverride,
    onLogout,
    onChangePassword,
    onAvatarChange,
    onNewChat
}) => {
    const { theme, toggleTheme } = useTheme();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [pwdMessage, setPwdMessage] = useState<string | null>(null);
    const [pwdError, setPwdError] = useState<string | null>(null);
    const [pwdLoading, setPwdLoading] = useState(false);
    const [avatarInput, setAvatarInput] = useState(avatarOverride || '');
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const user = await api.uploadAvatar(file);
            if (user.avatar_url && onAvatarChange) {
                onAvatarChange(user.avatar_url);
            }
        } catch (error) {
            console.error('Avatar yükleme hatası:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const md5 = (str: string) => {
        const utf8 = new TextEncoder().encode(str);
        const r = (x: number, n: number) => (x << n) | (x >>> (32 - n));
        const k = [0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8, 0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665, 0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391];
        const s = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
        const m: number[] = [];
        for (let i = 0; i < utf8.length; i++) m[i >> 2] |= utf8[i] << ((i % 4) * 8);
        const l = utf8.length * 8;
        m[l >> 5] |= 0x80 << (l % 32);
        m[((l + 64 >>> 9) << 4) + 14] = l;
        let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
        for (let i = 0; i < m.length; i += 16) {
            const [oa, ob, oc, od] = [a, b, c, d];
            for (let j = 0; j < 64; j++) {
                let f: number, g: number;
                if (j < 16) { f = (b & c) | (~b & d); g = j; }
                else if (j < 32) { f = (d & b) | (~d & c); g = (5 * j + 1) % 16; }
                else if (j < 48) { f = b ^ c ^ d; g = (3 * j + 5) % 16; }
                else { f = c ^ (b | ~d); g = (7 * j) % 16; }
                const tmp = d; d = c; c = b; b = b + r((a + f + k[j] + (m[i + g] | 0)) | 0, s[(j >> 4) * 4 + (j % 4)]); a = tmp;
            }
            a = (a + oa) | 0; b = (b + ob) | 0; c = (c + oc) | 0; d = (d + od) | 0;
        }
        return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0') + (c >>> 0).toString(16).padStart(8, '0') + (d >>> 0).toString(16).padStart(8, '0');
    };

    const defaultAvatar = '/default-avatar.svg';
    const { avatarUrl, fallbackAvatar } = (() => {
        if (isGuest) return { avatarUrl: defaultAvatar, fallbackAvatar: defaultAvatar };
        if (avatarOverride) return { avatarUrl: avatarOverride, fallbackAvatar: defaultAvatar };
        return { avatarUrl: defaultAvatar, fallbackAvatar: defaultAvatar };
    })();

    return (
        <div className="relative">
            <img
                src={avatarUrl}
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== fallbackAvatar) target.src = fallbackAvatar;
                }}
                onClick={() => setIsProfileOpen(prev => !prev)}
                className="w-10 h-10 rounded-full object-cover shadow-lg border border-white/10 cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all"
                title="Profil"
                alt="Profil"
            />
            {isProfileOpen && (
                <>
                    {/* Backdrop overlay */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900/95 border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-0 z-50 backdrop-blur-2xl overflow-hidden">
                        {/* Header */}
                        <div className="px-5 pt-5 pb-3">
                            <div className="text-sm font-semibold text-white">
                                {isGuest ? 'Misafir Sohbeti' : (userProfile?.full_name || userProfile?.username || 'Kullanıcı')}
                            </div>
                            <div className="text-xs text-white/40 mt-0.5 truncate">
                                {isGuest ? 'Misafir modunda' : (userProfile?.email || '')}
                            </div>
                        </div>

                        <div className="h-px bg-white/5 mx-4" />

                        {!showChangePassword && (
                            <div className="px-2 py-2">
                                {!isGuest && (
                                    <>
                                        <label className={`
                                            flex items-center gap-3 w-full px-3 py-2.5 rounded-lg 
                                            cursor-pointer hover:bg-white/5 transition-colors text-white/60 hover:text-white/90
                                            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                disabled={isUploading}
                                            />
                                            {isUploading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/20 border-t-sky-400 rounded-full animate-spin" />
                                                    <span className="text-xs">Yükleniyor...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                                                    </svg>
                                                    <span className="text-xs">Profil Fotoğrafı Değiştir</span>
                                                </>
                                            )}
                                        </label>

                                        <button
                                            onClick={() => setShowChangePassword(true)}
                                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                            </svg>
                                            <span className="text-xs">Şifre Değiştir</span>
                                        </button>
                                    </>
                                )}

                                {/* Theme toggle */}
                                <div className="px-3 pt-2 pb-1">
                                    <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Tema</div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            onClick={() => theme !== 'light' && toggleTheme()}
                                            className={`
                                                flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all
                                                ${theme === 'light'
                                                    ? 'bg-white/10 text-white ring-1 ring-white/20'
                                                    : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                                                }
                                            `}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            Aydınlık
                                        </button>
                                        <button
                                            onClick={() => theme !== 'dark' && toggleTheme()}
                                            className={`
                                                flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all
                                                ${theme === 'dark'
                                                    ? 'bg-white/10 text-white ring-1 ring-white/20'
                                                    : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                                                }
                                            `}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                            </svg>
                                            Karanlık
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showChangePassword && (
                            <div className="px-4 py-3 space-y-2">
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Mevcut şifre"
                                    className="w-full px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                                />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Yeni şifre"
                                    className="w-full px-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-sky-500/50"
                                />
                                {pwdError && <div className="text-red-400 text-xs">{pwdError}</div>}
                                {pwdMessage && <div className="text-emerald-400 text-xs">{pwdMessage}</div>}
                                <div className="flex items-center justify-between pt-1">
                                    <button
                                        onClick={() => {
                                            setShowChangePassword(false);
                                            setPwdError(null);
                                            setPwdMessage(null);
                                            setCurrentPassword('');
                                            setNewPassword('');
                                        }}
                                        className="text-xs text-white/40 hover:text-white/70 transition-colors"
                                    >
                                        ← Geri
                                    </button>
                                    <button
                                        disabled={pwdLoading || !currentPassword || !newPassword}
                                        onClick={async () => {
                                            if (!onChangePassword) return;
                                            setPwdError(null);
                                            setPwdMessage(null);
                                            setPwdLoading(true);
                                            try {
                                                await onChangePassword(currentPassword, newPassword);
                                                setPwdMessage('Şifre güncellendi');
                                                setCurrentPassword('');
                                                setNewPassword('');
                                            } catch (err: any) {
                                                setPwdError(err?.message || 'Şifre değiştirilemedi');
                                            } finally {
                                                setPwdLoading(false);
                                            }
                                        }}
                                        className="text-xs text-sky-400 hover:text-sky-300 disabled:text-white/20 transition-colors"
                                    >
                                        {pwdLoading ? 'Kaydediliyor...' : 'Kaydet'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Navigation links (Sohbet / Üretim) */}
                        <div className="h-px bg-white/5 mx-4" />
                        <div className="px-2 py-2">
                            <a href="/" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/60 hover:text-sky-400 hover:bg-white/5 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs">Sohbet</span>
                            </a>
                            <a href="/dashboard" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/60 hover:text-emerald-400 hover:bg-white/5 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm2.25 0c0-.414.336-.75.75-.75h12c.414 0 .75.336.75.75v12c0 .414-.336.75-.75.75H6a.75.75 0 01-.75-.75V6zM8.25 8.25a.75.75 0 00-1.5 0v6.75a.75.75 0 001.5 0v-6.75zM12 5.25a.75.75 0 00-1.5 0v9.75a.75.75 0 001.5 0v-9.75zm3.75 5.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs">Üretim Paneli</span>
                            </a>
                        </div>

                        {/* Logout */}
                        {onLogout && (
                            <>
                                <div className="h-px bg-white/5 mx-4" />
                                <div className="px-2 py-2">
                                    <button
                                        onClick={onLogout}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                        </svg>
                                        <span className="text-xs">Çıkış Yap</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default UserMenu;
