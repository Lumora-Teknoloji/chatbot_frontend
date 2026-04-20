'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useProductionList } from '@/hooks/useProductionList';
import type { ProductOut, ProductionListItem, CollectionOut } from '@/lib/api';
import { api } from '@/lib/api';
import AppSwitcher from '@/components/ui/AppSwitcher';

const TREND_ICONS: Record<string, { emoji: string; color: string }> = {
    TREND: { emoji: '🚀', color: 'text-emerald-400' },
    POTANSIYEL: { emoji: '📈', color: 'text-indigo-400' },
    STABIL: { emoji: '➡️', color: 'text-gray-400' },
    DUSEN: { emoji: '📉', color: 'text-red-400' },
};

const TREND_COLORS: Record<string, string> = {
    TREND: '#10b981',
    POTANSIYEL: '#6366f1',
    STABIL: '#8b8b8b',
    DUSEN: '#ef4444',
};

const COLLECTION_COLORS = [
    '#4cc9f0', '#f72585', '#7209b7', '#3a0ca3',
    '#4361ee', '#06d6a0', '#ffd166', '#ef476f',
];

/* ─── Search Modal ─────────────────────────────────────────────── */
function SearchModal({
    onClose,
    onAdd,
    searchProducts,
}: {
    onClose: () => void;
    onAdd: (product: ProductOut) => Promise<void>;
    searchProducts: (query: string, page?: number) => Promise<any>;
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ProductOut[]>([]);
    const [loading, setLoading] = useState(false);
    const [addingIds, setAddingIds] = useState<Record<number, boolean>>({});

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        try {
            const data = await searchProducts(query);
            setResults(data.items || []);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleAdd = async (product: ProductOut) => {
        setAddingIds(prev => ({ ...prev, [product.id]: true }));
        try {
            await onAdd(product);
        } catch { }
        setAddingIds(prev => ({ ...prev, [product.id]: false }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="w-[640px] max-w-[92vw] max-h-[80vh] bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d]">
                    <h2 className="text-lg font-semibold">🔍 Veritabanında Ürün Ara</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/5 rounded-lg px-2 py-1 transition-colors">✕</button>
                </div>
                {/* Search Input */}
                <div className="px-4 py-3 border-b border-[#21262d]">
                    <form onSubmit={handleSearch}>
                        <input
                            type="text"
                            className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                            placeholder="Ürün adı, marka, kategori... (Enter'a bas)"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            autoFocus
                        />
                    </form>
                </div>
                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">⏳ Aranıyor...</div>
                    ) : results.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                            {results.map(r => (
                                <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-transparent hover:bg-[#0d1117] hover:border-[#21262d] transition-all">
                                    <div className="w-10 h-10 rounded-md overflow-hidden bg-[#21262d] flex items-center justify-center shrink-0">
                                        {r.image_url ? (
                                            <img src={r.image_url} alt={r.name || ''} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg">📦</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{r.name}</div>
                                        <div className="text-xs text-gray-500">{r.brand} {r.last_price != null ? `• ${r.last_price}₺` : ''}</div>
                                    </div>
                                    <button
                                        onClick={() => handleAdd(r)}
                                        disabled={addingIds[r.id]}
                                        className="shrink-0 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md text-sm hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {addingIds[r.id] ? '⏳' : '➕'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 text-sm">Arama sonucu bulunamadı veya arama yapmadınız.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Detail Field ─────────────────────────────────────────────── */
function DetailField({ label, value, render }: { label: string; value?: any; render?: React.ReactNode }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="bg-[#161b22] border border-[#21262d] rounded-lg p-3">
            <div className="text-[0.7rem] text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</div>
            <div className="text-sm font-medium text-gray-200">
                {render ? render : value}
            </div>
        </div>
    );
}

/* ─── Main Dashboard ───────────────────────────────────────────── */
export default function DashboardPage() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { userProfile } = useProfile(isAuthenticated);
    const {
        list,
        loading,
        error,
        addProduct,
        removeProduct,
        fetchList,
        getProductDetails,
        searchProducts,
    } = useProductionList(isAuthenticated);

    const [selectedItem, setSelectedItem] = useState<ProductionListItem | null>(null);
    const [detailProduct, setDetailProduct] = useState<ProductOut | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);

    // Collections
    const [collections, setCollections] = useState<CollectionOut[]>([]);
    const [activeCollection, setActiveCollection] = useState<number | null>(null);
    const [collectionProducts, setCollectionProducts] = useState<ProductOut[]>([]);
    const [showNewCollection, setShowNewCollection] = useState(false);
    const [newColName, setNewColName] = useState('');
    const [newColColor, setNewColColor] = useState(COLLECTION_COLORS[0]);

    // Reactions
    const [reactions, setReactions] = useState<Record<number, string>>({});

    // Add to collection dropdown
    const [addToColProduct, setAddToColProduct] = useState<number | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;
        api.listCollections().then(setCollections).catch(console.error);
        api.getAllReactions().then(setReactions).catch(console.error);
    }, [isAuthenticated]);

    useEffect(() => {
        if (activeCollection) {
            api.listCollectionProducts(activeCollection).then(setCollectionProducts).catch(console.error);
        } else {
            setCollectionProducts([]);
        }
    }, [activeCollection]);

    const handleSelect = async (item: ProductionListItem) => {
        setSelectedItem(item);
        setDetailLoading(true);
        try {
            const data = await getProductDetails(item.product_id);
            setDetailProduct(data);
        } catch { }
        setDetailLoading(false);
    };

    const handleSelectProduct = async (product: ProductOut) => {
        setSelectedItem(null);
        setDetailLoading(true);
        try {
            const data = await getProductDetails(product.id);
            setDetailProduct(data);
        } catch { }
        setDetailLoading(false);
    };

    const handleRemove = async (e: React.MouseEvent, item: ProductionListItem) => {
        e.stopPropagation();
        if (confirm('Bu ürünü üretim listenizden çıkarmak istediğinize emin misiniz?')) {
            await removeProduct(item.list_id);
            if (selectedItem?.list_id === item.list_id) {
                setSelectedItem(null);
                setDetailProduct(null);
            }
        }
    };

    const handleAddFromSearch = async (product: ProductOut) => {
        try {
            await addProduct(product.id);
            alert('Ürün listeye eklendi!');
        } catch (err: any) {
            alert(err.message || 'Eklenirken hata oluştu');
        }
    };

    const handleReaction = async (productId: number, reaction: string) => {
        try {
            const res = await api.toggleReaction(productId, reaction);
            setReactions(prev => {
                const next = { ...prev };
                if (res.reaction) {
                    next[productId] = res.reaction;
                } else {
                    delete next[productId];
                }
                return next;
            });
        } catch (err) {
            console.error('Reaction error:', err);
        }
    };

    const handleCreateCollection = async () => {
        if (!newColName.trim()) return;
        try {
            const col = await api.createCollection({ name: newColName, color: newColColor });
            setCollections(prev => [...prev, col]);
            setNewColName('');
            setShowNewCollection(false);
        } catch (err) {
            console.error('Create collection error:', err);
        }
    };

    const handleDeleteCollection = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            await api.deleteCollection(id);
            setCollections(prev => prev.filter(c => c.id !== id));
            if (activeCollection === id) setActiveCollection(null);
        } catch (err) {
            console.error('Delete collection error:', err);
        }
    };

    const handleAddToCollection = async (collectionId: number, productId: number) => {
        try {
            await api.addProductToCollection(collectionId, productId);
            setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, product_count: c.product_count + 1 } : c));
            setAddToColProduct(null);
        } catch (err) {
            console.error('Add to collection error:', err);
        }
    };

    const handleRemoveFromCollection = async (productId: number) => {
        if (!activeCollection) return;
        try {
            await api.removeProductFromCollection(activeCollection, productId);
            setCollectionProducts(prev => prev.filter(p => p.id !== productId));
            setCollections(prev => prev.map(c => c.id === activeCollection ? { ...c, product_count: Math.max(0, c.product_count - 1) } : c));
        } catch (err) {
            console.error('Remove from collection error:', err);
        }
    };

    const formatPrice = (n: number | null | undefined) => !n ? '–' : `${n.toFixed(2)}₺`;
    const formatNumber = (n: number | null | undefined) => {
        if (n === null || n === undefined) return '–';
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toLocaleString('tr-TR');
    };

    if (authLoading) return <div className="text-white p-8">⏳ Yükleniyor...</div>;

    if (!isAuthenticated) {
        return (
            <div className="text-white p-8">
                <h2 className="text-xl font-bold mb-2">🔒 Giriş Gerekli</h2>
                <p className="text-gray-400">Dashboard&apos;a erişmek için lütfen giriş yapın.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#0d1117] text-gray-200 overflow-hidden">
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262d] bg-gradient-to-b from-[#161b22] to-[#0d1117]">
                <div>
                    <h1 className="text-xl font-bold">🏭 Üretim Karar Paneli</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Merhaba {userProfile?.full_name || userProfile?.username || ''}, ürünleri koleksiyonla ve analiz et</p>
                </div>
                <div className="z-20">
                    <AppSwitcher />
                </div>
            </div>

            {error && <div className="bg-red-500 text-white text-center py-2 text-sm">⚠️ {error}</div>}

            {/* ─── Body ─── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ═══ LEFT PANEL ═══ */}
                <div className="w-[360px] border-r border-[#21262d] flex flex-col bg-[#0d1117] shrink-0">

                    {/* Collections */}
                    <div className="p-3 flex flex-col gap-1">
                        <div className="text-[0.65rem] font-bold text-gray-600 uppercase tracking-widest px-2 mb-1">📂 Koleksiyonlar</div>

                        {/* Üretim Listem */}
                        <button
                            onClick={() => { setActiveCollection(null); setDetailProduct(null); setSelectedItem(null); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${!activeCollection ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:bg-white/[0.03] border border-transparent'}`}
                        >
                            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: '#4cc9f0' }} />
                            <span className="flex-1 text-left truncate">Üretim Listem</span>
                            <span className="text-[0.7rem] text-gray-600">{list.length}</span>
                        </button>

                        {/* Beğenilenler */}
                        <div className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-500 opacity-60">
                            <span className="text-xs">❤️</span>
                            <span className="flex-1 truncate">Beğenilenler</span>
                            <span className="text-[0.7rem] text-gray-600">{Object.values(reactions).filter(r => r === 'like').length}</span>
                        </div>

                        {/* User Collections */}
                        {collections.map(col => (
                            <div key={col.id} className="group relative flex items-center">
                                <button
                                    onClick={() => { setActiveCollection(col.id); setDetailProduct(null); setSelectedItem(null); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeCollection === col.id ? 'bg-white/[0.05] border border-white/10 text-white' : 'text-gray-400 hover:bg-white/[0.03] border border-transparent'}`}
                                >
                                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: col.color }} />
                                    <span className="flex-1 text-left truncate">{col.name}</span>
                                    <span className="text-[0.7rem] text-gray-600">{col.product_count}</span>
                                </button>
                                <button
                                    onClick={(e) => handleDeleteCollection(e, col.id)}
                                    className="absolute right-1 opacity-0 group-hover:opacity-100 p-1 text-[0.65rem] hover:bg-red-500/10 rounded transition-opacity"
                                    title="Sil"
                                >🗑️</button>
                            </div>
                        ))}

                        {/* New Collection */}
                        {showNewCollection ? (
                            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 flex flex-col gap-2 mt-1">
                                <input
                                    type="text"
                                    placeholder="Koleksiyon adı..."
                                    className="w-full px-2.5 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                                    value={newColName}
                                    onChange={e => setNewColName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
                                    autoFocus
                                />
                                <div className="flex gap-1.5">
                                    {COLLECTION_COLORS.map(c => (
                                        <button
                                            key={c}
                                            className={`w-[18px] h-[18px] rounded-full border-2 transition-transform ${newColColor === c ? 'border-white scale-125' : 'border-transparent'}`}
                                            style={{ background: c }}
                                            onClick={() => setNewColColor(c)}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleCreateCollection} className="flex-1 py-1 bg-cyan-500/15 border border-cyan-500/30 rounded-md text-cyan-400 text-xs font-semibold hover:bg-cyan-500/25 transition-colors">Oluştur</button>
                                    <button onClick={() => setShowNewCollection(false)} className="px-2 text-gray-500 text-xs hover:text-gray-300 transition-colors">İptal</button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowNewCollection(true)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-600 border border-dashed border-[#30363d] hover:border-cyan-500/30 hover:text-cyan-400 hover:bg-cyan-500/[0.03] transition-all mt-1"
                            >
                                ➕ Yeni Koleksiyon
                            </button>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[#21262d]" />

                    {/* Production List Items */}
                    {!activeCollection && (
                        <>
                            <div className="px-4 py-3 border-b border-[#21262d] bg-white/[0.01]">
                                <div className="flex items-center justify-between text-sm font-semibold text-gray-300">
                                    📋 Listem ({list.length})
                                    <button onClick={() => setShowSearchModal(true)} className="px-2 py-1 text-[0.7rem] bg-cyan-500/10 border border-cyan-500/20 rounded-md text-cyan-400 hover:bg-cyan-500/20 transition-colors font-medium">
                                        ➕ Ürün Bul
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {loading && list.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">Yükleniyor...</div>
                                ) : list.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500 text-xs leading-relaxed">
                                        Üretim listeniz boş. &ldquo;Ürün Bul&rdquo; butonuna tıklayarak veritabanından ürün ekleyebilirsiniz.
                                    </div>
                                ) : (
                                    list.map(item => {
                                        const trend = item.trend_direction ? TREND_ICONS[item.trend_direction] : null;
                                        const reaction = reactions[item.product_id];
                                        return (
                                            <div
                                                key={item.list_id}
                                                onClick={() => handleSelect(item)}
                                                className={`flex items-center gap-2.5 px-3 py-2.5 border-b border-[#161b22] cursor-pointer transition-colors hover:bg-[#161b22] ${selectedItem?.list_id === item.list_id ? 'bg-[#1c2128] border-l-[3px] border-l-cyan-400' : ''}`}
                                            >
                                                <div className="w-11 h-11 rounded-md overflow-hidden bg-[#161b22] flex items-center justify-center text-lg shrink-0">
                                                    {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : '📦'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[0.85rem] font-medium truncate">{item.name || 'İsimsiz Ürün'}</div>
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>{item.last_price != null ? `${item.last_price}₺` : '–'}</span>
                                                        {trend && <span className={trend.color}>{trend.emoji} {item.trend_score?.toFixed(0)}</span>}
                                                    </div>
                                                </div>
                                                {/* Reactions */}
                                                <div className="flex gap-0.5 shrink-0">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleReaction(item.product_id, 'like'); }}
                                                        className={`p-1 rounded text-xs border transition-all ${reaction === 'like' ? 'bg-emerald-500/15 border-emerald-500/30 opacity-100' : 'border-transparent opacity-30 hover:opacity-100'}`}
                                                    >👍</button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleReaction(item.product_id, 'dislike'); }}
                                                        className={`p-1 rounded text-xs border transition-all ${reaction === 'dislike' ? 'bg-red-500/15 border-red-500/30 opacity-100' : 'border-transparent opacity-30 hover:opacity-100'}`}
                                                    >👎</button>
                                                </div>
                                                {/* Add to collection */}
                                                <div className="relative shrink-0">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setAddToColProduct(addToColProduct === item.product_id ? null : item.product_id); }}
                                                        className="p-1 text-xs opacity-25 hover:opacity-100 transition-opacity"
                                                        title="Koleksiyona Ekle"
                                                    >📂</button>
                                                    {addToColProduct === item.product_id && (
                                                        <div className="absolute right-0 top-full w-44 bg-[#1c2128] border border-[#30363d] rounded-xl shadow-xl z-20 p-1 animate-fade-in">
                                                            {collections.length === 0 ? (
                                                                <div className="p-2 text-[0.7rem] text-gray-600 text-center">Henüz koleksiyon yok</div>
                                                            ) : collections.map(col => (
                                                                <button
                                                                    key={col.id}
                                                                    onClick={(e) => { e.stopPropagation(); handleAddToCollection(col.id, item.product_id); }}
                                                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-gray-300 hover:bg-white/[0.05] transition-colors text-left"
                                                                >
                                                                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: col.color }} />
                                                                    {col.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => handleRemove(e, item)}
                                                    className="p-1 text-[0.7rem] opacity-25 hover:opacity-100 transition-opacity shrink-0"
                                                    title="Listeden Çıkar"
                                                >🗑️</button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}

                    {/* Collection Products */}
                    {activeCollection && (
                        <>
                            <div className="px-4 py-3 border-b border-[#21262d] bg-white/[0.01]">
                                <div className="text-sm font-semibold text-gray-300">
                                    {collections.find(c => c.id === activeCollection)?.name || 'Koleksiyon'} ({collectionProducts.length})
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {collectionProducts.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500 text-xs leading-relaxed">
                                        Bu koleksiyonda henüz ürün yok. Ürünleri listeden koleksiyona ekleyebilirsiniz.
                                    </div>
                                ) : (
                                    collectionProducts.map(p => {
                                        const reaction = reactions[p.id];
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => handleSelectProduct(p)}
                                                className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#161b22] cursor-pointer hover:bg-[#161b22] transition-colors"
                                            >
                                                <div className="w-11 h-11 rounded-md overflow-hidden bg-[#161b22] flex items-center justify-center text-lg shrink-0">
                                                    {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : '📦'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[0.85rem] font-medium truncate">{p.name || 'İsimsiz Ürün'}</div>
                                                    <div className="text-xs text-gray-500">{p.last_price != null ? `${p.last_price}₺` : ''} {p.brand ? `· ${p.brand}` : ''}</div>
                                                </div>
                                                <div className="flex gap-0.5 shrink-0">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleReaction(p.id, 'like'); }}
                                                        className={`p-1 rounded text-xs border transition-all ${reaction === 'like' ? 'bg-emerald-500/15 border-emerald-500/30 opacity-100' : 'border-transparent opacity-30 hover:opacity-100'}`}
                                                    >👍</button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleReaction(p.id, 'dislike'); }}
                                                        className={`p-1 rounded text-xs border transition-all ${reaction === 'dislike' ? 'bg-red-500/15 border-red-500/30 opacity-100' : 'border-transparent opacity-30 hover:opacity-100'}`}
                                                    >👎</button>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveFromCollection(p.id); }}
                                                    className="p-1 text-xs text-gray-600 hover:text-red-400 transition-colors shrink-0"
                                                    title="Koleksiyondan Çıkar"
                                                >✕</button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ═══ RIGHT PANEL: Detail ═══ */}
                <div className="flex-1 flex flex-col overflow-y-auto bg-[#0d1117]">
                    {!detailProduct && !detailLoading ? (
                        <div className="m-auto text-center text-gray-600 p-8">
                            <div className="text-5xl mb-3">🏭</div>
                            <h2 className="text-xl font-semibold text-gray-300 mb-2">Üretim Analiz Ekranı</h2>
                            <p className="text-sm">Tüm detaylarını incelemek için soldaki listeden bir ürün seçin.</p>
                        </div>
                    ) : detailLoading ? (
                        <div className="m-auto text-gray-500 text-lg">⏳ Veritabanından ürün bilgileri çekiliyor...</div>
                    ) : detailProduct ? (
                        <div className="p-8 max-w-[1000px] mx-auto w-full">
                            {/* Header */}
                            <div className="flex gap-8 mb-8">
                                <div className="w-64 shrink-0 bg-[#161b22] rounded-2xl overflow-hidden border border-[#21262d] flex items-center justify-center">
                                    {detailProduct.image_url ? (
                                        <img src={detailProduct.image_url} alt="" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-5xl">📦</span>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">{detailProduct.brand || 'MARKASIZ'}</div>
                                    <h2 className="text-2xl font-bold text-gray-100 mb-3 leading-tight">{detailProduct.name}</h2>
                                    <div className="text-2xl font-bold text-emerald-400 mb-4">{detailProduct.last_price ? `${detailProduct.last_price}₺` : 'Fiyat Bilinmiyor'}</div>

                                    {/* Reaction Buttons */}
                                    <div className="flex gap-2 mb-4">
                                        <button
                                            onClick={() => handleReaction(detailProduct.id, 'like')}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${reactions[detailProduct.id] === 'like' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-[#161b22] border-[#30363d] text-gray-400 hover:border-emerald-500/40 hover:text-emerald-400'}`}
                                        >
                                            👍 Beğen
                                        </button>
                                        <button
                                            onClick={() => handleReaction(detailProduct.id, 'dislike')}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${reactions[detailProduct.id] === 'dislike' ? 'bg-red-500/15 border-red-500/40 text-red-400' : 'bg-[#161b22] border-[#30363d] text-gray-400 hover:border-red-500/40 hover:text-red-400'}`}
                                        >
                                            👎 Beğenme
                                        </button>
                                    </div>

                                    <div className="mt-auto flex gap-3">
                                        {detailProduct.url && (
                                            <a href={detailProduct.url} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-sm text-gray-300 hover:bg-[#30363d] hover:text-white transition-colors">
                                                🔗 Orijinal İlana Git
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Metrics Strip */}
                            <div className="grid grid-cols-4 gap-3 mb-8">
                                <div className="flex flex-col items-center gap-0.5 p-4 bg-[#161b22] border border-[#21262d] rounded-xl hover:border-[#30363d] transition-colors">
                                    <span className="text-base">⭐</span>
                                    <span className="text-xl font-bold text-amber-400">{detailProduct.avg_rating?.toFixed(1) || '–'}</span>
                                    <span className="text-[0.6rem] text-gray-600 font-medium">{formatNumber(detailProduct.rating_count)} Değ.</span>
                                </div>
                                <div className="flex flex-col items-center gap-0.5 p-4 bg-[#161b22] border border-[#21262d] rounded-xl hover:border-[#30363d] transition-colors">
                                    <span className="text-base">❤️</span>
                                    <span className="text-xl font-bold text-pink-400">{formatNumber(detailProduct.favorite_count)}</span>
                                    <span className="text-[0.6rem] text-gray-600 font-medium">Favori</span>
                                </div>
                                <div className="flex flex-col items-center gap-0.5 p-4 bg-[#161b22] border border-[#21262d] rounded-xl hover:border-[#30363d] transition-colors">
                                    <span className="text-base">🛒</span>
                                    <span className="text-xl font-bold text-orange-400">{formatNumber(detailProduct.cart_count)}</span>
                                    <span className="text-[0.6rem] text-gray-600 font-medium">Sepet</span>
                                </div>
                                <div className="flex flex-col items-center gap-0.5 p-4 bg-[#161b22] border border-[#21262d] rounded-xl hover:border-[#30363d] transition-colors">
                                    <span className="text-base">👁️</span>
                                    <span className="text-xl font-bold text-blue-400">{formatNumber(detailProduct.view_count)}</span>
                                    <span className="text-[0.6rem] text-gray-600 font-medium">Görüntülenme</span>
                                </div>
                            </div>

                            {/* Sections */}
                            <div className="mb-8">
                                <h3 className="text-sm font-semibold text-gray-300 mb-3 pb-2 border-b border-[#21262d]">🏷️ Ürün Kimliği & Stil</h3>
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                                    <DetailField label="Kategori" value={detailProduct.category} />
                                    <DetailField label="Barkod / Kod" value={detailProduct.product_code} />
                                    <DetailField label="Satıcı" value={detailProduct.seller} />
                                    <DetailField label="Ana Renk" value={detailProduct.dominant_color} />
                                    <DetailField label="Kumaş" value={detailProduct.fabric_type} />
                                    <DetailField label="Kalıp" value={detailProduct.fit_type} />
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-sm font-semibold text-gray-300 mb-3 pb-2 border-b border-[#21262d]">📊 Performans & Pazaryeri Metrikleri</h3>
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                                    <DetailField label="Arama Terimi" value={detailProduct.search_term} />
                                    <DetailField label="Sıra / Sayfa" value={detailProduct.search_rank ? `${detailProduct.search_rank}. Sıra (Sayfa ${detailProduct.page_number})` : null} />
                                    <DetailField label="Satış Hızı" value={detailProduct.avg_sales_velocity} />
                                    <DetailField label="Soru & Cevap" value={detailProduct.qa_count} />
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-sm font-semibold text-gray-300 mb-3 pb-2 border-b border-[#21262d]">🧠 Yapay Zeka Analizi</h3>
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                                    <DetailField
                                        label="Trend Skoru (0-100)"
                                        value={detailProduct.trend_score}
                                        render={<span className="text-blue-400 text-lg font-bold">{detailProduct.trend_score?.toFixed(1) || '—'}</span>}
                                    />
                                    <DetailField
                                        label="Trend Durumu"
                                        value={detailProduct.trend_direction}
                                        render={
                                            detailProduct.trend_direction ? (
                                                <span style={{ color: TREND_COLORS[detailProduct.trend_direction] }} className="font-bold">
                                                    {TREND_ICONS[detailProduct.trend_direction]?.emoji} {detailProduct.trend_direction}
                                                </span>
                                            ) : '—'
                                        }
                                    />
                                </div>
                            </div>

                            {/* Sizes & Attributes */}
                            {(detailProduct.attributes || detailProduct.sizes || detailProduct.review_summary) && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3 pb-2 border-b border-[#21262d]">📋 Ekstra Detaylar</h3>

                                    {detailProduct.sizes && detailProduct.sizes.length > 0 && (
                                        <div className="mb-4">
                                            <div className="text-xs text-gray-500 mb-2">Bedenler</div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {detailProduct.sizes.map((s, idx) => {
                                                    const displaySize = typeof s === 'object' && s !== null ? (s.name || s.size || JSON.stringify(s)) : String(s);
                                                    const inStock = typeof s === 'object' && s !== null ? s.in_stock : true;
                                                    return (
                                                        <span key={idx} className={`px-2.5 py-1 bg-[#161b22] border rounded-md text-xs ${inStock ? 'border-[#21262d]' : 'border-red-500/50 opacity-40 line-through'}`}>
                                                            {displaySize} {inStock === false && '(Tükendi)'}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {detailProduct.review_summary && (
                                        <div className="mb-4">
                                            <div className="text-xs text-gray-500 mb-2">Yorum Özeti (AI)</div>
                                            <div className="p-3 bg-[#161b22] border border-[#21262d] rounded-xl italic text-sm text-gray-300 leading-relaxed">
                                                &ldquo;{detailProduct.review_summary}&rdquo;
                                            </div>
                                        </div>
                                    )}

                                    {detailProduct.attributes && Object.keys(detailProduct.attributes).length > 0 && (
                                        <div>
                                            <div className="text-xs text-gray-500 mb-2">Tüm Özellikler</div>
                                            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-1.5">
                                                {Object.entries(detailProduct.attributes).map(([k, v]) => {
                                                    const displayVal = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
                                                    return (
                                                        <div key={k} className="flex justify-between px-2.5 py-1.5 bg-[#161b22] border border-[#21262d] rounded-md text-xs">
                                                            <span className="text-gray-500">{k.length > 20 ? k.substring(0, 20) + '...' : k}</span>
                                                            <span className="font-medium text-right ml-3 break-words">{displayVal}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="m-auto text-gray-500">Ürün bilgisi yüklenemedi.</div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showSearchModal && (
                <SearchModal
                    onClose={() => setShowSearchModal(false)}
                    searchProducts={searchProducts}
                    onAdd={handleAddFromSearch}
                />
            )}

            {addToColProduct !== null && (
                <div className="fixed inset-0 z-10" onClick={() => setAddToColProduct(null)} />
            )}
        </div>
    );
}
