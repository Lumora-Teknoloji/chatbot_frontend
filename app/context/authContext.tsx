// app/context/authContext.tsx
'use client';

// DEĞİŞİKLİK BURADA: 'React,' sonrasındaki virgül kaldırıldı ve eksik hook'lar eklendi.
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

// --- TİPLER ---
interface User {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    created_at?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const STORAGE_KEY = 'authData';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadSession = async () => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.token) {
                        const profile = await api.me(parsed.token);
                        setUser(profile);
                        setToken(parsed.token);
                    }
                }
            } catch (error) {
                console.error("Auth load error:", error);
                localStorage.removeItem(STORAGE_KEY);
            } finally {
                setIsLoading(false);
            }
        };
        loadSession();
    }, []);

    const login = async (username: string, password: string) => {
        const response = await api.login(username, password);
        setUser(response.user);
        setToken(response.access_token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            token: response.access_token,
            user: response.user,
        }));
        router.push('/');
    };

    const logout = () => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setToken(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};