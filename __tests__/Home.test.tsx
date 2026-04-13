import React from 'react';
import { render, screen, act } from '@testing-library/react';
import Home from '@/app/page';

// Mock useAuth hook - must be mocked BEFORE component renders
jest.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        isAuthenticated: false,
        isGuestMode: false,
        isLoading: false, // Critical: must be false so loading screen is skipped
        handleLoginSuccess: jest.fn(),
        handleLogout: jest.fn(),
        activateGuestMode: jest.fn(),
    })
}));

// Mock useProfile hook
jest.mock('@/hooks/useProfile', () => ({
    useProfile: () => ({
        userProfile: null,
        avatarUrl: null,
        handleChangePassword: jest.fn(),
        handleAvatarChange: jest.fn(),
    })
}));

// Mock useChat hook
jest.mock('@/hooks/useChat', () => ({
    useChat: () => ({
        messages: [],
        isLoading: false,
        sendMessage: jest.fn(),
        startNewChat: jest.fn(),
        deleteConversation: jest.fn(),
        isChatStarted: false,
        inputText: '',
        setInputText: jest.fn(),
        isGuest: false,
        currentConversationId: null,
        guestAlias: 'Misafir',
        conversations: [],
        loadConversation: jest.fn(),
        stopGeneration: jest.fn(),
        setConversations: jest.fn()
    })
}));

// Mock API
jest.mock('@/lib/api', () => ({
    api: {
        me: jest.fn(),
        changePassword: jest.fn(),
        logout: jest.fn(),
        updateConversation: jest.fn(),
        uploadFile: jest.fn(),
    }
}));

// Mock child components
jest.mock('@/components/sidebar/sidebar', () => {
    return function DummySidebar() {
        return <div data-testid="sidebar">Sidebar</div>;
    };
});

jest.mock('@/components/header/userMenu', () => {
    return function DummyUserMenu() {
        return <div data-testid="user-menu">UserMenu</div>;
    };
});

jest.mock('@/components/auth/loginForm', () => {
    return function DummyLoginForm() {
        return <div data-testid="login-form">Login Form</div>;
    };
});

jest.mock('@/components/chat/messageList', () => {
    return function DummyMessageList() {
        return <div data-testid="message-list">Message List</div>;
    };
});

jest.mock('@/components/ui/typewriter', () => ({
    Typewriter: () => <span data-testid="typewriter">Typewriter</span>
}));

jest.mock('@/components/chat/textSelectionPopup', () => {
    return function DummyTextSelectionPopup() {
        return null;
    };
});

describe('Home Page', () => {
    it('renders login form when not authenticated', async () => {
        await act(async () => {
            render(<Home />);
        });
        const loginForm = screen.getByTestId('login-form');
        expect(loginForm).toBeInTheDocument();
    });
});
