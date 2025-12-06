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
    history: Array<{ id: number | string; title: string; isGuest?: boolean }>;
    activeId: number | string | null;
    onSelect: (id: number | string, isGuest?: boolean) => void;
    userProfile?: { username: string; email: string; full_name?: string | null };
    onLogout?: () => void;
    onChangePassword?: (currentPassword: string, newPassword: string) => Promise<void>;
    avatarOverride?: string;
    onAvatarChange?: (url: string | null) => void;
    onConversationDeleted?: (id: number | string) => void;
    isGuest?: boolean;
    guestAlias?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({
    isVisible,
    isLocked,
    onMenuClick,
    onNewChat,
    history,
    activeId,
    onSelect,
    userProfile,
    onLogout,
    onChangePassword,
    avatarOverride,
    onAvatarChange,
    onConversationDeleted,
    isGuest,
    guestAlias,
}) => {

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [pwdMessage, setPwdMessage] = useState<string | null>(null);
    const [pwdError, setPwdError] = useState<string | null>(null);
    const [pwdLoading, setPwdLoading] = useState(false);

    // Şimdilik delete/rename UI'da tutuluyor ama state kontrollü olmadığı için sadece onSelect kullanılıyor
    const handleDelete = (convId: number | string) => {
        onConversationDeleted?.(convId);
    };
    const handleRename = () => {};

    // Avatar url (gravatar varsa onu kullan, yoksa ui-avatars)
    const initials = userProfile?.full_name?.trim()
        ? userProfile.full_name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : (userProfile?.username?.slice(0, 2).toUpperCase() || 'PR');

    const md5 = (str: string) => {
        /* c8 ignore start */
        const utf8 = new TextEncoder().encode(str);
        let output = '';
        const r = (x: number, n: number) => (x << n) | (x >>> (32 - n));
        const k = [
            0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
            0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
            0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
            0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
            0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
            0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
            0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
            0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
        ];
        const s = [7,12,17,22, 5,9,14,20, 4,11,16,23, 6,10,15,21];
        const m: number[] = [];
        for (let i = 0; i < utf8.length; i++) m[i >> 2] |= utf8[i] << ((i % 4) * 8);
        const l = utf8.length * 8;
        m[l >> 5] |= 0x80 << (l % 32);
        m[((l + 64 >>> 9) << 4) + 14] = l;
        let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
        for (let i = 0; i < m.length; i += 16) {
            const [oa, ob, oc, od] = [a, b, c, d];
            for (let j = 0; j < 64; j++) {
                let f: number; let g: number;
                if (j < 16) { f = (b & c) | (~b & d); g = j; }
                else if (j < 32) { f = (d & b) | (~d & c); g = (5*j + 1) % 16; }
                else if (j < 48) { f = b ^ c ^ d; g = (3*j + 5) % 16; }
                else { f = c ^ (b | ~d); g = (7*j) % 16; }
                const tmp = d;
                d = c;
                c = b;
                b = b + r((a + f + k[j] + (m[i + g] | 0)) | 0, s[(j>>4)*4 + (j%4)]);
                a = tmp;
            }
            a = (a + oa) | 0; b = (b + ob) | 0; c = (c + oc) | 0; d = (d + od) | 0;
        }
        const toHex = (n: number) => ('00000000' + (n >>> 0).toString(16)).slice(-8);
        output = toHex(a) + toHex(b) + toHex(c) + toHex(d);
        return output;
        /* c8 ignore end */
    };

    const defaultAvatar = '/default-avatar.svg';

const { avatarUrl, fallbackAvatar } = (() => {
    if (isGuest) {
        return { avatarUrl: defaultAvatar, fallbackAvatar: defaultAvatar };
    }
    if (avatarOverride) {
        return { avatarUrl: avatarOverride, fallbackAvatar: avatarOverride };
    }
    const email = userProfile?.email?.trim().toLowerCase();
    if (!email) return { avatarUrl: defaultAvatar, fallbackAvatar: defaultAvatar };
    const hash = md5(email);
    const gravUrl = `https://www.gravatar.com/avatar/${hash}?d=404`;
    return { avatarUrl: gravUrl, fallbackAvatar: defaultAvatar };
})();

    return (
        <div className="w-64 h-full relative">
            <div className="flex flex-col h-full bg-gray-950/90 backdrop-blur-xl text-white p-4">

                <div className="flex flex-col space-y-3 items-start">
                    <div className="flex items-center w-full justify-between">
                        <MenuButton isVisible={isVisible} isLocked={isLocked} onClick={onMenuClick} />
                        {(userProfile || isGuest) && (
                            <div className="relative">
                                <img
                                    src={avatarUrl}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (target.src !== fallbackAvatar) {
                                            target.src = fallbackAvatar;
                                        }
                                    }}
                                    onClick={() => setIsProfileOpen(prev => !prev)}
                                    className="w-10 h-10 rounded-full object-cover shadow-lg border border-white/10 cursor-pointer"
                                    title="Profil"
                                    alt="Profil"
                                />
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-gray-900/95 border border-gray-700 rounded-xl shadow-2xl p-4 z-20">
                                        <div className="text-sm font-semibold text-white mb-1">
                                            {userProfile?.full_name || userProfile?.username || guestAlias || 'Misafir'}
                                        </div>
                                        <div className="text-xs text-gray-400 mb-3">
                                            {userProfile?.email || (isGuest ? 'Misafir modunda' : '')}
                                        </div>

                                        {!showChangePassword && (
                                            <div className="space-y-2">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-400">Profil Fotoğrafı (URL)</label>
                                                    <input
                                                        type="url"
                                                        defaultValue={isGuest ? '' : (avatarOverride || '')}
                                                        placeholder={isGuest ? 'Misafir modunda kapalı' : 'https://...'}
                                                        disabled={isGuest}
                                                        className="w-full px-3 py-2 text-xs bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                                        onBlur={(e) => {
                                                            if (isGuest) return;
                                                            onAvatarChange?.(e.target.value?.trim() || null);
                                                        }}
                                                    />
                                                    {!isGuest && (
                                                        <div className="flex items-center justify-between pt-1">
                                                            <button
                                                                onClick={() => {
                                                                    onAvatarChange?.(null);
                                                                }}
                                                                className="text-xs text-gray-400 hover:text-gray-300"
                                                            >
                                                                Varsayılanı kullan
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setShowChangePassword(true)}
                                                    className="w-full text-xs text-blue-300 hover:text-blue-200 text-left"
                                                >
                                                    Şifre Değiştir
                                                </button>
                                                {onLogout && (
                                                    <button
                                                        onClick={onLogout}
                                                        className="w-full text-xs text-red-300 hover:text-red-200 text-left"
                                                    >
                                                        Çıkış
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {showChangePassword && (
                                            <div className="space-y-2">
                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    placeholder="Mevcut şifre"
                                                    className="w-full px-3 py-2 text-xs bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Yeni şifre"
                                                    className="w-full px-3 py-2 text-xs bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                                {pwdError && <div className="text-red-300 text-xs">{pwdError}</div>}
                                                {pwdMessage && <div className="text-green-300 text-xs">{pwdMessage}</div>}
                                                <div className="flex items-center justify-between pt-1">
                                                    <button
                                                        onClick={() => {
                                                            setShowChangePassword(false);
                                                            setPwdError(null);
                                                            setPwdMessage(null);
                                                            setCurrentPassword('');
                                                            setNewPassword('');
                                                        }}
                                                        className="text-xs text-gray-400 hover:text-gray-300"
                                                    >
                                                        Geri
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
                                                        className="text-xs text-blue-300 hover:text-blue-200 disabled:text-gray-500"
                                                    >
                                                        {pwdLoading ? 'Kaydediliyor...' : 'Kaydet'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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