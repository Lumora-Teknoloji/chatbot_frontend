import { useState, useEffect, useCallback, useRef } from 'react';
import { clearGuestMode, hasGuestFallback, isGuestModeActive } from '@/lib/guest';

export const useGuestSession = () => {
    const [isGuest, setIsGuest] = useState(false);
    const [guestAlias, setGuestAlias] = useState<string>('Misafir Sohbeti');
    const isGuestRef = useRef(isGuest);

    useEffect(() => {
        isGuestRef.current = isGuest;
    }, [isGuest]);

    // Misafir modunu kontrol et
    useEffect(() => {
        const updateGuestState = () => {
            if (typeof window !== 'undefined') {
                const guestMode = hasGuestFallback();
                setIsGuest(guestMode);
            }
        };

        if (typeof window !== 'undefined') {
            const guestMode = hasGuestFallback();
            setIsGuest(guestMode);
        }

        if (typeof window !== 'undefined') {
            window.addEventListener('guestModeActivated', updateGuestState);
            return () => {
                window.removeEventListener('guestModeActivated', updateGuestState);
            };
        }
    }, []);

    // Sayfa kapatıldığında veya component unmount olduğunda misafir verilerini temizle
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (isGuestRef.current) {
                clearGuestMode();
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', handleBeforeUnload);
            
            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
                const currentGuestMode = isGuestModeActive();
                if (currentGuestMode) {
                    clearGuestMode();
                }
            };
        }
    }, []);

    const clearGuestSession = useCallback(() => {
        clearGuestMode();
        setIsGuest(false);
        setGuestAlias('Misafir Sohbeti');
    }, []);

    return {
        isGuest,
        setIsGuest,
        guestAlias,
        setGuestAlias,
        clearGuestSession
    };
};
