export const isGuestModeActive = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('guest_mode') === 'true' && !localStorage.getItem('auth_token');
};

export const hasGuestFallback = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('guest_mode') === 'true';
};

export const clearGuestMode = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('guest_mode');
    }
};

export const enableGuestMode = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('guest_mode', 'true');
    }
};
