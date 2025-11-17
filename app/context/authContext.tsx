// app/context/authContext.tsx
'use client';

// DEĞİŞİKLİK BURADA: 'React,' sonrasındaki virgül kaldırıldı ve eksik hook'lar eklendi.
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// --- TİPLER VE SAHTE VERİTABANI ---
interface User {
    username: string;
    email: string;
    full_name: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

const MOCK_USERS: Record<string, User & { password: string }> = {
    "onder": {
        username: "onder",
        email: "onder@example.com",
        full_name: "Önder Özmen",
        password: "123456"
    },
    "admin": {
        username: "admin",
        email: "admin@example.com",
        full_name: "Admin User",
        password: "adminpass"
    }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('authUser');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Auth user parse error:", error);
            localStorage.removeItem('authUser');
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string) => {
        console.log(`Giriş denemesi: ${username}`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const foundUser = MOCK_USERS[username];

        if (foundUser && foundUser.password === password) {
            const { password, ...userData } = foundUser;
            localStorage.setItem('authUser', JSON.stringify(userData));
            setUser(userData);
            router.push('/');
        } else {
            throw new Error('Kullanıcı adı veya şifre hatalı.');
        }
    };

    const logout = () => {
        localStorage.removeItem('authUser');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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