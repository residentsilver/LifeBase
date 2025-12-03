'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, Grid, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import FavoritesManager from '@/components/Favorites/FavoritesManager';
import SearchPanel from '@/components/Search/SearchPanel';
import MapComponent from '@/components/Search/MapComponent';
import SearchResults from '@/components/Search/SearchResults';
import HistoryList from '@/components/History/HistoryList';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [address, setAddress] = useState('');
    const [radius, setRadius] = useState(500);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number; address_resolved?: string } | null>(null);
    const [loading, setLoading] = useState(false);

    // History State
    const [openSaveDialog, setOpenSaveDialog] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

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

    const handleSearch = async () => {
        if (!address) return;
        setLoading(true);
        try {
            const response = await api.post('/search/nearby', {
                address,
                radius_m: radius
            });
            setSearchResults(response.data.results);
            setSearchCenter(response.data.search_point);
        } catch (error) {
            console.error('Search failed', error);
            alert('検索に失敗しました。もう一度お試しください。');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveHistory = async () => {
        if (!searchCenter || !saveName) return;
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
        }
    };

    const handleLoadHistory = (history: any) => {
        setAddress(history.address_text);
        setRadius(history.radius_meter);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                            />
                        ) : (
                            <Typography>地図を読み込み中...</Typography>
                        )}
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <SearchResults results={searchResults} />
                    </Grid>
                </Grid>
            </Box>

            {/* History Section */}
            <Box sx={{ mt: 4, mb: 8 }}>
                <HistoryList onLoadHistory={handleLoadHistory} refreshTrigger={historyRefreshTrigger} />
            </Box>

            {/* Save History Dialog */}
            <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)}>
                <DialogTitle>検索履歴を保存</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="名称 (例: 東京駅周辺)"
                        fullWidth
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSaveDialog(false)}>キャンセル</Button>
                    <Button onClick={handleSaveHistory}>保存</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
