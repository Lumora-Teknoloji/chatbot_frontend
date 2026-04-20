'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useProductionList } from '@/hooks/useProductionList';
import type { ProductOut, ProductionListItem } from '@/lib/api';
import AppSwitcher from '@/components/ui/AppSwitcher';

import './dashboard.css';

const TREND_ICONS: Record<string, { emoji: string; color: string }> = {
    TREND: { emoji: '🚀', color: '#10b981' },
    POTANSIYEL: { emoji: '📈', color: '#6366f1' },
    STABIL: { emoji: '➡️', color: '#8b8b8b' },
    DUSEN: { emoji: '📉', color: '#ef4444' },
};

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
        <div className="modal-overlay" onClick={onClose}>
            <div className="search-modal" onClick={e => e.stopPropagation()}>
                <div className="modal__header">
                    <h2>🔍 Veritabanında Ürün Ara</h2>
                    <button className="modal__close" onClick={onClose}>✕</button>
                </div>
                <div className="search-input-wrapper">
                    <form onSubmit={handleSearch}>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Ürün adı, marka, kategori... (Enter'a bas)"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            autoFocus
                        />
                    </form>
                </div>
                <div className="search-modal__body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>⏳ Aranıyor...</div>
                    ) : results.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {results.map(r => (
                                <div key={r.id} className="search-result-item">
                                    {r.image_url ? (
                                        <img src={r.image_url} alt={r.name || ''} className="search-result-item__image" />
                                    ) : (
                                        <div className="search-result-item__image" style={{ background: '#30363d' }}>📦</div>
                                    )}
                                    <div className="search-result-item__info">
                                        <div className="search-result-item__name">{r.name}</div>
                                        <div className="search-result-item__price">
                                            {r.brand} {r.last_price != null ? `• ${r.last_price}₺` : ''}
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn--sm btn--primary"
                                        onClick={() => handleAdd(r)}
                                        disabled={addingIds[r.id]}
                                    >
                                        {addingIds[r.id] ? '⏳' : '➕ Ekle'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#8b949e' }}>
                            Arama sonucu bulunamadı veya arama yapmadınız.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailField({ label, value, render }: { label: string; value?: any; render?: React.ReactNode }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="detail-card">
            <div className="detail-card__label">{label}</div>
            <div className="detail-card__value">
                {render ? render : value}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { userProfile } = useProfile(isAuthenticated);
    const {
        list,
        loading,
        error,
        addProduct,
        removeProduct,
        getProductDetails,
        searchProducts,
    } = useProductionList(isAuthenticated);

    const [selectedItem, setSelectedItem] = useState<ProductionListItem | null>(null);
    const [detailProduct, setDetailProduct] = useState<ProductOut | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);

    const handleSelect = async (item: ProductionListItem) => {
        setSelectedItem(item);
        setDetailLoading(true);
        try {
            const data = await getProductDetails(item.product_id);
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

    if (authLoading) {
        return <div className="dashboard-loading" style={{ color: 'white', padding: '2rem' }}>⏳ Yükleniyor...</div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="dashboard-auth-required" style={{ color: 'white', padding: '2rem' }}>
                <h2>🔒 Giriş Gerekli</h2>
                <p>Dashboard'a erişmek için lütfen giriş yapın.</p>
            </div>
        );
    }

    return (
        <div className="dashboard-v2">
            {/* Header */}
            <div className="dashboard__header-v2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="dashboard__title-v2">🏭 Üretim Karar Paneli</h1>
                    <p className="dashboard__subtitle-v2">Merhaba {userProfile?.full_name || userProfile?.username || ''}, üreteceğin ürünlerin kapsamlı analizini yap</p>
                </div>

                {/* Switcher & Navs */}
                <div style={{ zIndex: 20 }}>
                    <AppSwitcher />
                </div>
            </div>

            {/* Error */}
            {error && <div style={{ background: '#f85149', color: 'white', padding: '0.75rem', textAlign: 'center' }}>⚠️ {error}</div>}

            {/* Body */}
            <div className="dashboard__body-v2">

                {/* Left Panel: Production List */}
                <div className="production-list-pane">
                    <div className="production-list-pane__header">
                        <div className="production-list-pane__title">
                            📋 Listem ({list.length})
                            <button className="btn btn--sm btn--primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setShowSearchModal(true)}>
                                ➕ Ürün Bul
                            </button>
                        </div>
                    </div>
                    <div className="production-list-items">
                        {loading && list.length === 0 ? (
                            <div style={{ padding: '1rem', color: '#8b949e', textAlign: 'center' }}>Yükleniyor...</div>
                        ) : list.length === 0 ? (
                            <div style={{ padding: '2rem 1rem', color: '#8b949e', textAlign: 'center' }}>
                                Üretim listeniz boş. "Ürün Bul" butonuna tıklayarak veritabanından ürün ekleyebilirsiniz.
                            </div>
                        ) : (
                            list.map(item => {
                                const trend = item.trend_direction ? TREND_ICONS[item.trend_direction] : null;
                                return (
                                    <div
                                        key={item.list_id}
                                        className={`production-item ${selectedItem?.list_id === item.list_id ? 'production-item--active' : ''}`}
                                        onClick={() => handleSelect(item)}
                                    >
                                        <div className="production-item__image">
                                            {item.image_url ? <img src={item.image_url} alt={item.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} /> : '📦'}
                                        </div>
                                        <div className="production-item__info">
                                            <div className="production-item__name">{item.name || 'İsimsiz Ürün'}</div>
                                            <div className="production-item__meta">
                                                <span>{item.last_price != null ? `${item.last_price}₺` : 'Fiyat Yok'}</span>
                                                {trend && (
                                                    <span className="production-item__trend" style={{ color: trend.color }}>
                                                        {trend.emoji} {item.trend_score?.toFixed(0)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn--sm"
                                            style={{ background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer', padding: '0.25rem' }}
                                            onClick={(e) => handleRemove(e, item)}
                                            title="Listeden Çıkar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Panel: Detail View */}
                <div className="production-detail-pane">
                    {!selectedItem ? (
                        <div className="detail-empty">
                            <h2>🏭 Üretim Analiz Ekranı</h2>
                            <p>Tüm detaylarını incelemek için soldaki listeden bir ürün seçin.</p>
                        </div>
                    ) : detailLoading ? (
                        <div className="detail-empty">⏳ Veritabanından ürün bilgileri çekiliyor...</div>
                    ) : detailProduct ? (
                        <div className="detail-content">

                            <div className="detail-header">
                                <div className="detail-header__image-container">
                                    {detailProduct.image_url ? (
                                        <img src={detailProduct.image_url} alt={detailProduct.name || ''} className="detail-header__image" />
                                    ) : (
                                        <div style={{ fontSize: '4rem' }}>📦</div>
                                    )}
                                </div>
                                <div className="detail-header__info">
                                    <div className="detail-header__brand">{detailProduct.brand || 'MARKASIZ'}</div>
                                    <h2 className="detail-header__name">{detailProduct.name}</h2>
                                    <div className="detail-header__price">{detailProduct.last_price ? `${detailProduct.last_price}₺` : 'Fiyat Bilinmiyor'}</div>

                                    <div className="detail-header__actions">
                                        {detailProduct.url && (
                                            <a href={detailProduct.url} target="_blank" rel="noopener noreferrer" className="btn btn--secondary">
                                                🔗 Orijinal İlana Git
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section: Kimlik & Stil */}
                            <div className="detail-section">
                                <h3 className="detail-section__title">🏷️ Ürün Kimliği & Stil</h3>
                                <div className="detail-grid">
                                    <DetailField label="Kategori" value={detailProduct.category} />
                                    <DetailField label="Barkod / Kod" value={detailProduct.product_code} />
                                    <DetailField label="Satıcı" value={detailProduct.seller} />
                                    <DetailField label="Ana Renk" value={detailProduct.dominant_color} />
                                    <DetailField label="Kumaş" value={detailProduct.fabric_type} />
                                    <DetailField label="Kalıp" value={detailProduct.fit_type} />
                                </div>
                            </div>

                            {/* Section: Metrikler */}
                            <div className="detail-section">
                                <h3 className="detail-section__title">📊 Performans & Pazaryeri Metrikleri</h3>
                                <div className="detail-grid">
                                    <DetailField
                                        label="Favori Sayısı"
                                        value={detailProduct.favorite_count}
                                        render={<span className="detail-card__value--highlight">❤️ {detailProduct.favorite_count}</span>}
                                    />
                                    <DetailField
                                        label="Değerlendirme"
                                        value={detailProduct.avg_rating}
                                        render={<span style={{ color: '#f59e0b' }}>⭐ {detailProduct.avg_rating} ({detailProduct.rating_count} Yorum)</span>}
                                    />
                                    <DetailField label="Arama Terimi" value={detailProduct.search_term} />
                                    <DetailField label="Sıra / Sayfa" value={detailProduct.search_rank ? `${detailProduct.search_rank}. Sıra (Sayfa ${detailProduct.page_number})` : null} />
                                    <DetailField label="Görüntülenme" value={detailProduct.view_count} />
                                    <DetailField label="Sepete Eklenme" value={detailProduct.cart_count} />
                                </div>
                            </div>

                            {/* Section: Intelligence */}
                            <div className="detail-section">
                                <h3 className="detail-section__title">🧠 Yapay Zeka Analizi</h3>
                                <div className="detail-grid">
                                    <DetailField
                                        label="Trend Skoru (0-100)"
                                        value={detailProduct.trend_score}
                                        render={<span className="detail-card__value--highlight">{detailProduct.trend_score?.toFixed(1) || '—'}</span>}
                                    />
                                    <DetailField
                                        label="Trend Durumu"
                                        value={detailProduct.trend_direction}
                                        render={
                                            detailProduct.trend_direction ? (
                                                <span style={{ color: TREND_ICONS[detailProduct.trend_direction]?.color, fontWeight: 'bold' }}>
                                                    {TREND_ICONS[detailProduct.trend_direction]?.emoji} {detailProduct.trend_direction}
                                                </span>
                                            ) : '—'
                                        }
                                    />
                                    <DetailField label="Satış Hızı" value={detailProduct.avg_sales_velocity} />
                                </div>
                            </div>

                            {/* Section: Detaylı Özellikler */}
                            {(detailProduct.attributes || detailProduct.sizes || detailProduct.review_summary) && (
                                <div className="detail-section">
                                    <h3 className="detail-section__title">📋 Ekstra Detaylar</h3>

                                    {detailProduct.sizes && detailProduct.sizes.length > 0 && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Bedenler</div>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {detailProduct.sizes.map((s, idx) => {
                                                    const displaySize = typeof s === 'object' && s !== null ? (s.name || s.size || JSON.stringify(s)) : String(s);
                                                    const inStock = typeof s === 'object' && s !== null ? s.in_stock : true;
                                                    return (
                                                        <span key={idx} style={{ padding: '0.25rem 0.75rem', background: '#21262d', borderRadius: '4px', fontSize: '0.85rem', opacity: inStock ? 1 : 0.5, border: inStock ? 'none' : '1px solid #f85149' }}>
                                                            {displaySize} {inStock === false && '(Tükendi)'}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {detailProduct.review_summary && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Yorum Özeti (AI)</div>
                                            <div style={{ padding: '1rem', background: '#21262d', borderRadius: '8px', fontStyle: 'italic', fontSize: '0.95rem' }}>
                                                "{detailProduct.review_summary}"
                                            </div>
                                        </div>
                                    )}

                                    {detailProduct.attributes && Object.keys(detailProduct.attributes).length > 0 && (
                                        <div>
                                            <div style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Tüm Özellikler</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.5rem' }}>
                                                {Object.entries(detailProduct.attributes).map(([k, v]) => {
                                                    const displayVal = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
                                                    return (
                                                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#161b22', border: '1px solid #30363d', borderRadius: '4px', fontSize: '0.85rem' }}>
                                                            <span style={{ color: '#8b949e' }} title={k}>{k.length > 20 ? k.substring(0, 20) + '...' : k}</span>
                                                            <span style={{ fontWeight: 500, textAlign: 'right', wordBreak: 'break-word', marginLeft: '1rem' }}>{displayVal}</span>
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
                        <div className="detail-empty">Ürün bilgisi yüklenemedi.</div>
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

        </div>
    );
}
