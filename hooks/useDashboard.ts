'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    api,
    UserProductDto,
    UserProductCreateDto,
    SimilarProductDto,
    DashboardStatsDto,
    WatchlistItemDto,
} from '@/lib/api';

export function useDashboard() {
    const [products, setProducts] = useState<UserProductDto[]>([]);
    const [stats, setStats] = useState<DashboardStatsDto | null>(null);
    const [watchlist, setWatchlist] = useState<WatchlistItemDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ─── Fetch all user products ─────────────────────────
    const fetchProducts = useCallback(async (params?: { category?: string; performance_tag?: string; watching_only?: boolean }) => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.dashboardListProducts(params);
            setProducts(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Fetch stats ─────────────────────────────────────
    const fetchStats = useCallback(async () => {
        try {
            const data = await api.dashboardStats();
            setStats(data);
        } catch (e: any) {
            console.error('Stats fetch error:', e);
        }
    }, []);

    // ─── Fetch watchlist ─────────────────────────────────
    const fetchWatchlist = useCallback(async () => {
        try {
            const data = await api.dashboardWatchlist();
            setWatchlist(data);
        } catch (e: any) {
            console.error('Watchlist fetch error:', e);
        }
    }, []);

    // ─── Create product ──────────────────────────────────
    const createProduct = useCallback(async (data: UserProductCreateDto) => {
        setError(null);
        try {
            const newProduct = await api.dashboardCreateProduct(data);
            setProducts(prev => [newProduct, ...prev]);
            // Refresh stats after create
            fetchStats();
            return newProduct;
        } catch (e: any) {
            setError(e.message);
            throw e;
        }
    }, [fetchStats]);

    // ─── Update product ──────────────────────────────────
    const updateProduct = useCallback(async (id: number, data: Partial<UserProductCreateDto & { performance_tag?: string; performance_note?: string; is_watching?: boolean }>) => {
        setError(null);
        try {
            const updated = await api.dashboardUpdateProduct(id, data);
            setProducts(prev => prev.map(p => p.id === id ? updated : p));
            fetchStats();
            return updated;
        } catch (e: any) {
            setError(e.message);
            throw e;
        }
    }, [fetchStats]);

    // ─── Delete product ──────────────────────────────────
    const deleteProduct = useCallback(async (id: number) => {
        setError(null);
        try {
            await api.dashboardDeleteProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
            fetchStats();
        } catch (e: any) {
            setError(e.message);
            throw e;
        }
    }, [fetchStats]);

    // ─── Tag product ─────────────────────────────────────
    const tagProduct = useCallback(async (id: number, tag: string, note?: string) => {
        setError(null);
        try {
            const updated = await api.dashboardTagProduct(id, tag, note);
            setProducts(prev => prev.map(p => p.id === id ? updated : p));
            fetchStats();
            return updated;
        } catch (e: any) {
            setError(e.message);
            throw e;
        }
    }, [fetchStats]);

    // ─── Find similar products ───────────────────────────
    const findSimilar = useCallback(async (id: number, limit = 20): Promise<SimilarProductDto[]> => {
        try {
            return await api.dashboardSimilarProducts(id, limit);
        } catch (e: any) {
            setError(e.message);
            return [];
        }
    }, []);

    // ─── Initial load ────────────────────────────────────
    useEffect(() => {
        fetchProducts();
        fetchStats();
        fetchWatchlist();
    }, [fetchProducts, fetchStats, fetchWatchlist]);

    return {
        products,
        stats,
        watchlist,
        loading,
        error,
        fetchProducts,
        fetchStats,
        fetchWatchlist,
        createProduct,
        updateProduct,
        deleteProduct,
        tagProduct,
        findSimilar,
    };
}
