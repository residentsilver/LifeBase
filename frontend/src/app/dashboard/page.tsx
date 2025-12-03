'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, Grid, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Backdrop, CircularProgress } from '@mui/material';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import FavoritesManager from '@/components/Favorites/FavoritesManager';
import SearchPanel from '@/components/Search/SearchPanel';
import MapComponent from '@/components/Search/MapComponent';
import SearchResults from '@/components/Search/SearchResults';
import HistoryList from '@/components/History/HistoryList';
import { useJsApiLoader } from '@react-google-maps/api';
import { getCache, setCache, cleanupExpiredCache } from '@/lib/searchCache';

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [address, setAddress] = useState('');
    const [radius, setRadius] = useState(500);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number; address_resolved?: string } | null>(null);
    const [loading, setLoading] = useState(false);
    // 選択された店舗の状態管理（店舗の一意の識別子としてplace_idまたはlat/lngの組み合わせを使用）
    const [selectedStore, setSelectedStore] = useState<{
        name: string;
        latitude: number;
        longitude: number;
        vicinity?: string;
        distance_m?: number;
        place_id?: string;
    } | null>(null);

    // History State
    const [openSaveDialog, setOpenSaveDialog] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
    const [savingHistory, setSavingHistory] = useState(false);

    const router = useRouter();

    // デバッグ用: 環境変数が読み込まれているか確認
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            console.error('❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY が設定されていません');
            console.log('環境変数を確認してください: frontend/.env.local または frontend/.env');
        } else {
            console.log('✅ Google Maps API Key が読み込まれました:', apiKey.substring(0, 10) + '...');
        }
    }, []);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: libraries,
        language: 'ja',
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/user');
                setUser(response.data);
            } catch (error) {
                router.push('/login');
            }
        };
        fetchUser();

        // 有効期限切れのキャッシュをクリーンアップ
        cleanupExpiredCache();
    }, [router]);

    const handleLogout = async () => {
        try {
            await api.post('/logout');
            localStorage.removeItem('token');
            router.push('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    /**
     * 検索実行処理
     * キャッシュ機能付き：同じ検索条件の場合はキャッシュから結果を取得
     * @param {string} searchAddress 検索する住所（省略時は現在のaddress状態を使用）
     * @param {number} searchRadius 検索半径（省略時は現在のradius状態を使用）
     */
    const handleSearch = async (searchAddress?: string, searchRadius?: number) => {
        // 引数の型チェックと正規化
        let targetAddress: string;
        let targetRadius: number;

        if (searchAddress !== undefined && searchAddress !== null) {
            // 引数が提供された場合
            if (typeof searchAddress !== 'string') {
                console.error('handleSearch: searchAddress is not a string:', searchAddress);
                return;
            }
            targetAddress = searchAddress.trim();
        } else {
            // 引数が提供されていない場合は状態から取得
            if (typeof address !== 'string' || !address) {
                console.error('handleSearch: address state is not a valid string:', address);
                return;
            }
            targetAddress = address.trim();
        }

        if (searchRadius !== undefined && searchRadius !== null) {
            // 引数が提供された場合
            if (typeof searchRadius !== 'number' || isNaN(searchRadius)) {
                console.error('handleSearch: searchRadius is not a valid number:', searchRadius);
                return;
            }
            targetRadius = searchRadius;
        } else {
            // 引数が提供されていない場合は状態から取得
            if (typeof radius !== 'number' || isNaN(radius)) {
                console.error('handleSearch: radius state is not a valid number:', radius);
                return;
            }
            targetRadius = radius;
        }

        // 空文字列チェック
        if (!targetAddress || targetAddress.length === 0) {
            console.warn('handleSearch: targetAddress is empty');
            return;
        }

        // キャッシュをチェック
        const cachedData = getCache(targetAddress, targetRadius);
        if (cachedData) {
            // キャッシュから結果を取得
            console.log('✅ キャッシュから検索結果を取得しました');
            setSearchResults(cachedData.results);
            setSearchCenter(cachedData.searchPoint);
            setSelectedStore(null); // 新しい検索時は選択をリセット
            return;
        }

        // キャッシュがない場合はAPIを呼び出し
        setLoading(true);
        try {
            const response = await api.post('/search/nearby', {
                address: targetAddress,
                radius_m: targetRadius
            });
            const results = response.data.results;
            const searchPoint = response.data.search_point;

            // 検索結果をキャッシュに保存
            setCache(targetAddress, targetRadius, results, searchPoint);
            console.log('💾 検索結果をキャッシュに保存しました');

            setSearchResults(results);
            setSearchCenter(searchPoint);
            setSelectedStore(null); // 新しい検索時は選択をリセット
        } catch (error) {
            console.error('Search failed', error);
            alert('検索に失敗しました。もう一度お試しください。');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveHistory = async () => {
        if (!searchCenter || !saveName || savingHistory) return;
        setSavingHistory(true);
        try {
            await api.post('/histories', {
                name: saveName,
                address_text: searchCenter.address_resolved || address, // Use resolved address if available
                latitude: searchCenter.lat,
                longitude: searchCenter.lng,
                radius_meter: radius
            });
            setOpenSaveDialog(false);
            setSaveName('');
            setHistoryRefreshTrigger(prev => prev + 1);
            alert('検索条件を保存しました！');
        } catch (error) {
            console.error('Save history failed', error);
            alert('履歴の保存に失敗しました。');
        } finally {
            setSavingHistory(false);
        }
    };

    /**
     * 履歴を読み込んで検索を自動実行
     * @param {any} history 読み込む履歴情報
     */
    const handleLoadHistory = async (history: any) => {
        setAddress(history.address_text);
        setRadius(history.radius_meter);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // 履歴の条件で自動的に検索を実行
        await handleSearch(history.address_text, history.radius_meter);
    };

    /**
     * マーカークリック時の処理
     * @param {any} store 選択された店舗情報（latitude/longitudeがオプショナル）
     */
    const handleMarkerClick = (store: any) => {
        if (!store) {
            setSelectedStore(null);
            return;
        }
        // latitudeとlongitudeが存在する場合のみ設定
        if (store.latitude !== undefined && store.longitude !== undefined) {
            setSelectedStore({
                name: store.name,
                latitude: store.latitude,
                longitude: store.longitude,
                vicinity: store.vicinity,
                distance_m: store.distance_m,
                place_id: store.place_id,
            });
        }
    };

    if (!user) return <Typography>Loading...</Typography>;

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">ダッシュボード</Typography>
                <Button variant="outlined" onClick={handleLogout}>ログアウト</Button>
            </Box>
            <Typography variant="body1" sx={{ mt: 2 }}>
                ようこそ、{user.name}さん！
            </Typography>

            {/* Favorites Manager */}
            <Box sx={{ mt: 4 }}>
                <FavoritesManager />
            </Box>

            {/* Search Section */}
            <Box sx={{ mt: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5">周辺検索</Typography>
                    {searchCenter && (
                        <Button variant="outlined" onClick={() => setOpenSaveDialog(true)}>
                            この検索を保存
                        </Button>
                    )}
                </Box>

                <SearchPanel
                    address={address}
                    setAddress={setAddress}
                    radius={radius}
                    setRadius={setRadius}
                    onSearch={handleSearch}
                    loading={loading}
                />

                <Box sx={{ position: 'relative' }}>
                    <Backdrop
                        open={loading}
                        sx={{
                            position: 'absolute',
                            zIndex: (theme) => theme.zIndex.drawer + 1,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: 2,
                        }}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <CircularProgress size={60} />
                            <Typography variant="h6" color="primary">
                                検索中...
                            </Typography>
                        </Box>
                    </Backdrop>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 8 }}>
                            {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                                <Box sx={{ p: 3, border: '2px dashed #f44336', borderRadius: 2, textAlign: 'center' }}>
                                    <Typography variant="h6" color="error" gutterBottom>
                                        ⚠️ Google Maps API キーが設定されていません
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        frontend/.env.local または frontend/.env に NEXT_PUBLIC_GOOGLE_MAPS_API_KEY を設定してください。
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        設定後、Dockerコンテナを再起動してください: docker-compose restart frontend
                                    </Typography>
                                </Box>
                            ) : isLoaded ? (
                                <MapComponent
                                    center={searchCenter || { lat: 35.681236, lng: 139.767125 }}
                                    results={searchResults}
                                    radius={radius}
                                    selectedStore={selectedStore}
                                    onMarkerClick={handleMarkerClick}
                                />
                            ) : (
                                <Typography>地図を読み込み中...</Typography>
                            )}
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SearchResults 
                                results={searchResults} 
                                selectedStore={selectedStore}
                                onStoreClick={setSelectedStore}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            {/* History Section */}
            <Box sx={{ mt: 4, mb: 8 }}>
                <HistoryList onLoadHistory={handleLoadHistory} refreshTrigger={historyRefreshTrigger} />
            </Box>

            {/* Save History Dialog */}
            <Dialog open={openSaveDialog} onClose={() => !savingHistory && setOpenSaveDialog(false)}>
                <DialogTitle>検索履歴を保存</DialogTitle>
                <DialogContent>
                    {savingHistory && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <CircularProgress size={20} />
                            <Typography variant="body2" color="primary">
                                保存中...
                            </Typography>
                        </Box>
                    )}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="名称 (例: 東京駅周辺)"
                        fullWidth
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !savingHistory) {
                                e.preventDefault();
                                if (saveName.trim() && searchCenter) {
                                    handleSaveHistory();
                                }
                            }
                        }}
                        disabled={savingHistory}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSaveDialog(false)} disabled={savingHistory}>キャンセル</Button>
                    <Button 
                        onClick={handleSaveHistory} 
                        disabled={!saveName.trim() || !searchCenter || savingHistory}
                        startIcon={savingHistory ? <CircularProgress size={16} /> : null}
                    >
                        {savingHistory ? '保存中...' : '保存'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
