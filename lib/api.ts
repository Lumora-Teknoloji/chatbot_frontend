const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') ||
    'http://localhost:8000';
const API_URL = `${API_BASE}/api`;

export interface ApiUser {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    created_at?: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: ApiUser;
}

export interface ConversationDto {
    id: number;
    title?: string;
    created_at: string;
}

export interface MessageDto {
    id: number;
    conversation_id: number;
    sender: 'user' | 'ai';
    content?: string;
    image_url?: string;
    created_at: string;
}

interface RequestOptions extends RequestInit {
    token?: string | null;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || error.error || 'İstek başarısız');
    }

    if (res.status === 204) {
        return {} as T;
    }

    return res.json();
}

export const api = {
    login: (username: string, password: string) =>
        request<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }),

    register: (data: { username: string; password: string; email: string; full_name?: string }) =>
        request<ApiUser>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    me: (token: string) =>
        request<ApiUser>('/users/me', {
            token,
        }),

    listConversations: (token: string) =>
        request<ConversationDto[]>('/conversations', {
            token,
        }),

    createConversation: (token: string, title?: string) =>
        request<ConversationDto>('/conversations', {
            method: 'POST',
            token,
            body: JSON.stringify({ title }),
        }),

    getMessages: (token: string, conversationId: number) =>
        request<MessageDto[]>(`/conversations/${conversationId}/messages`, {
            token,
        }),

    saveMessage: (
        token: string,
        payload: { conversation_id: number; sender: 'user' | 'ai'; content?: string; image_url?: string }
    ) =>
        request<MessageDto>('/messages', {
            method: 'POST',
            token,
            body: JSON.stringify(payload),
        }),
};

