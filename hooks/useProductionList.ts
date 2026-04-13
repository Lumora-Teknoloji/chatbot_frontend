import { useState, useCallback, useEffect } from 'react';
import { api, ProductionListItem, ProductOut } from '@/lib/api';

export function useProductionList(isAuthenticated: boolean) {
    const [list, setList] = useState<ProductionListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchList = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const data = await api.getProductionList();
            setList(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Üretim listesi yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchList();
        } else {
            setList([]);
        }
    }, [isAuthenticated, fetchList]);

    const addProduct = async (productId: number) => {
        try {
            const newItem = await api.addToProductionList(productId);
            setList((prev) => [newItem, ...prev]);
            return newItem;
        } catch (err: any) {
            setError(err.message || 'Ürün listeye eklenemedi');
            throw err;
        }
    };

    const removeProduct = async (listId: number) => {
        try {
            await api.removeFromProductionList(listId);
            setList((prev) => prev.filter(item => item.list_id !== listId));
        } catch (err: any) {
            setError(err.message || 'Ürün listeden silinemedi');
            throw err;
        }
    };

    const getProductDetails = async (productId: number) => {
        try {
            return await api.getDbProductDetails(productId);
        } catch (err: any) {
            setError(err.message || 'Ürün detayları alınamadı');
            throw err;
        }
    };

    const searchProducts = async (query: string, page: number = 1) => {
        try {
            return await api.searchDbProducts({ search: query, page, page_size: 20 });
        } catch (err: any) {
            setError(err.message || 'Ürün araması başarısız');
            throw err;
        }
    };

    return {
        list,
        loading,
        error,
        fetchList,
        addProduct,
        removeProduct,
        getProductDetails,
        searchProducts,
    };
}
