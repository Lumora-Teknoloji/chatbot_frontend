'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { clearGuestMode, enableGuestMode, hasGuestFallback } from '@/lib/guest';

interface AuthContextType {
    isAuthenticated: boolean;
    isGuestMode: boolean;
    isLoading: boolean;
    handleLoginSuccess: () => void;
    handleLogout: () => Promise<void>;
    activateGuestMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Initialize authentication state on mount
    useEffect(() => {
        console.log('[AuthContext] 🔵 Initializing auth state');

        const initAuth = async () => {
            try {
                // Check if user is authenticated via cookie
                await api.me();
                console.log('[AuthContext] ✅ User authenticated');
                setIsAuthenticated(true);
                setIsGuestMode(false);
            } catch (err) {
                // Not authenticated - check guest mode
                console.log('[AuthContext] ❌ Not authenticated, checking guest mode');
                if (typeof window !== 'undefined') {
                    const guestMode = hasGuestFallback();
                    console.log('[AuthContext] 🔍 Guest mode:', guestMode);
                    setIsGuestMode(guestMode);
                    setIsAuthenticated(false);
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (typeof window !== 'undefined') {
            initAuth();

            // Clean up guest mode on page close
            const handleBeforeUnload = () => {
                const isGuest = hasGuestFallback();
                if (isGuest) {
                    clearGuestMode();
                }
            };

            window.addEventListener('beforeunload', handleBeforeUnload);
            return () => window.removeEventListener('beforeunload', handleBeforeUnload);
        } else {
            setIsLoading(false);
        }
    }, []);

    const handleLoginSuccess = () => {
        clearGuestMode();
        setIsAuthenticated(true);
        setIsGuestMode(false);
        window.location.reload();
    };

    const handleLogout = async () => {
        try {
            await api.logout();
        } catch (e) {
            console.error('Logout error:', e);
        }
        if (typeof window !== 'undefined') {
            clearGuestMode();
            window.location.reload();
        }
    };

    const activateGuestMode = () => {
        if (typeof window !== 'undefined') {
            enableGuestMode();
            setIsAuthenticated(false);
            setIsGuestMode(true);
            window.dispatchEvent(new Event('guestModeActivated'));
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            isGuestMode,
            isLoading,
            handleLoginSuccess,
            handleLogout,
            activateGuestMode,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
