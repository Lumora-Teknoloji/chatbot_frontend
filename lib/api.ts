import { BACKEND_URL } from './config';

const API_BASE = BACKEND_URL;
const API_URL = `${API_BASE}/api`;

export interface ApiUser {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    created_at?: string;
    avatar_url?: string;
}

export interface LoginResponse {
    message: string;
    user: ApiUser;
}

export interface ConversationDto {
    id: number;
    title?: string;
    alias?: string;
    history_json?: any[];
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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isFormData = options.body instanceof FormData;

    const headers: Record<string, string> = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers as Record<string, string> || {}),
    };

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: 'include',  // Send cookies automatically
        headers,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        let errorMessage = error.detail || error.error || 'İstek başarısız';

        if (Array.isArray(errorMessage)) {
            // Pydantic validation errors
            errorMessage = errorMessage.map((e: any) => {
                if (typeof e === 'object' && e.msg) return e.msg;
                return String(e);
            }).join(', ');
        } else if (typeof errorMessage === 'object') {
            errorMessage = JSON.stringify(errorMessage);
        }

        throw new Error(errorMessage);
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

    logout: () =>
        request<{ message: string }>('/auth/logout', {
            method: 'POST',
        }),

    me: () =>
        request<ApiUser>('/users/me'),

    uploadAvatar: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return request<ApiUser>('/users/avatar', {
            method: 'POST',
            body: formData,
        });
    },

    changePassword: (current_password: string, new_password: string) =>
        request<{ detail: string }>('/users/change-password', {
            method: 'POST',
            body: JSON.stringify({ current_password, new_password }),
        }),

    listConversations: () =>
        request<ConversationDto[]>('/conversations'),

    createConversation: (title?: string, alias?: string) =>
        request<ConversationDto>('/conversations', {
            method: 'POST',
            body: JSON.stringify({ title, alias }),
        }),

    deleteConversation: (conversationId: number) =>
        request<{ detail: string }>(`/conversations/${conversationId}`, {
            method: 'DELETE',
        }),

    getMessages: (conversationId: number) =>
        request<MessageDto[]>(`/conversations/${conversationId}/messages`),

    saveMessage: (
        payload: { conversation_id: number; sender: 'user' | 'ai'; content?: string; image_url?: string }
    ) =>
        request<MessageDto>('/messages', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    updateConversation: (conversationId: number, data: { title?: string; alias?: string }) =>
        request<ConversationDto>(`/conversations/${conversationId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return request<{ url: string }>('/messages/upload', {
            method: 'POST',
            body: formData,
        });
    },

    // ─── Dashboard ───────────────────────────────────────────────

    dashboardCreateProduct: (data: UserProductCreateDto) =>
        request<UserProductDto>('/dashboard/products', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    dashboardListProducts: (params?: { category?: string; performance_tag?: string; watching_only?: boolean }) => {
        const qs = new URLSearchParams();
        if (params?.category) qs.set('category', params.category);
        if (params?.performance_tag) qs.set('performance_tag', params.performance_tag);
        if (params?.watching_only) qs.set('watching_only', 'true');
        const suffix = qs.toString() ? `?${qs}` : '';
        return request<UserProductDto[]>(`/dashboard/products${suffix}`);
    },

    dashboardGetProduct: (id: number) =>
        request<UserProductDto>(`/dashboard/products/${id}`),

    dashboardUpdateProduct: (id: number, data: Partial<UserProductCreateDto & { performance_tag?: string; performance_note?: string; is_watching?: boolean }>) =>
        request<UserProductDto>(`/dashboard/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    dashboardDeleteProduct: (id: number) =>
        request<{}>(`/dashboard/products/${id}`, { method: 'DELETE' }),

    dashboardTagProduct: (id: number, tag: string, note?: string) =>
        request<UserProductDto>(`/dashboard/products/${id}/tag`, {
            method: 'PATCH',
            body: JSON.stringify({ performance_tag: tag, performance_note: note }),
        }),

    dashboardSimilarProducts: (id: number, limit = 20) =>
        request<SimilarProductDto[]>(`/dashboard/products/${id}/similar?limit=${limit}`),

    dashboardStats: () =>
        request<DashboardStatsDto>('/dashboard/stats'),

    dashboardWatchlist: () =>
        request<WatchlistItemDto[]>('/dashboard/watchlist'),

    // ─── Products & Production List ────────────────────────────────

    searchDbProducts: (params?: { search?: string; page?: number; page_size?: number }) => {
        const qs = new URLSearchParams();
        if (params?.search) qs.set('search', params.search);
        if (params?.page) qs.set('page', String(params.page));
        if (params?.page_size) qs.set('page_size', String(params.page_size));
        const suffix = qs.toString() ? `?${qs}` : '';
        return request<ProductListResponse>(`/products${suffix}`);
    },

    getDbProductDetails: (id: number) =>
        request<ProductOut>(`/products/${id}`),

    getProductionList: () =>
        request<ProductionListItem[]>('/products/production-list'),

    addToProductionList: (product_id: number) =>
        request<ProductionListItem>('/products/production-list', {
            method: 'POST',
            body: JSON.stringify({ product_id }),
        }),

    removeFromProductionList: (list_id: number) =>
        request<{}>(`/products/production-list/${list_id}`, {
            method: 'DELETE',
        }),
};

// ─── Dashboard Types ─────────────────────────────────────────────

export interface UserProductCreateDto {
    name: string;
    category?: string;
    brand?: string;
    price?: number;
    image_url?: string;
    description?: string;
    attributes?: Record<string, any>;
    product_id?: number;
}

export interface UserProductDto {
    id: number;
    user_id: number;
    product_id?: number | null;
    name: string;
    category?: string | null;
    brand?: string | null;
    price?: number | null;
    image_url?: string | null;
    description?: string | null;
    attributes?: Record<string, any> | null;
    performance_tag?: string | null;
    performance_note?: string | null;
    is_watching: boolean;
    created_at?: string | null;
    updated_at?: string | null;
    trend_score?: number | null;
    trend_direction?: string | null;
}

export interface SimilarProductDto {
    id: number;
    product_code?: string | null;
    name?: string | null;
    brand?: string | null;
    category?: string | null;
    image_url?: string | null;
    last_price?: number | null;
    trend_score?: number | null;
    trend_direction?: string | null;
    dominant_color?: string | null;
    fabric_type?: string | null;
    url?: string | null;
    similarity_reason?: string | null;
}

export interface DashboardStatsDto {
    total_products: number;
    watching_count: number;
    bestseller_count: number;
    impactful_count: number;
    potential_count: number;
    flop_count: number;
    trending_count: number;
    avg_trend_score?: number | null;
}

export interface WatchlistItemDto {
    id: number;
    name: string;
    category?: string | null;
    image_url?: string | null;
    performance_tag?: string | null;
    trend_score?: number | null;
    trend_direction?: string | null;
    last_price?: number | null;
    rank_change_1d?: number | null;
}

// ─── Products (DB) ────────────────────────────────────────────────

export interface ProductOut {
    id: number;
    product_code?: string | null;
    name?: string | null;
    brand?: string | null;
    seller?: string | null;
    url?: string | null;
    image_url?: string | null;
    category_tag?: string | null;
    category?: string | null;
    attributes?: Record<string, any> | null;
    review_summary?: string | null;
    sizes?: any[] | null;
    last_price?: number | null;
    last_discount_rate?: number | null;
    avg_sales_velocity?: number | null;
    first_seen_at?: string | null;
    last_scraped_at?: string | null;
    favorite_count?: number | null;
    cart_count?: number | null;
    view_count?: number | null;
    avg_rating?: number | null;
    rating_count?: number | null;
    qa_count?: number | null;
    original_price?: number | null;
    discounted_price?: number | null;
    page_number?: number | null;
    search_rank?: number | null;
    absolute_rank?: number | null;
    search_term?: string | null;
    bot_mode?: string | null;
    task_name?: string | null;
    scrape_mode?: string | null;
    // Intelligence (from product model)
    trend_score?: number | null;
    trend_direction?: string | null;
    dominant_color?: string | null;
    fabric_type?: string | null;
    fit_type?: string | null;
}

export interface ProductListResponse {
    items: ProductOut[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface ProductionListItem {
    list_id: number;
    product_id: number;
    added_at?: string | null;
    name?: string | null;
    brand?: string | null;
    category?: string | null;
    image_url?: string | null;
    last_price?: number | null;
    trend_direction?: string | null;
    trend_score?: number | null;
}
