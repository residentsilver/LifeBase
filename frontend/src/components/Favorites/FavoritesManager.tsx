'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Tabs, Tab, Button, List, ListItem, ListItemText,
    IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions,
    FormControl, InputLabel, Select, MenuItem, Snackbar, Alert, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import api from '@/lib/axios';

interface Genre {
    id: number;
    name: string;
}

interface FavoriteItem {
    id: number;
    genre_id: number;
    keyword: string;
}

export default function FavoritesManager() {
    const [genres, setGenres] = useState<Genre[]>([]);
    const [items, setItems] = useState<FavoriteItem[]>([]);
    const [selectedGenreId, setSelectedGenreId] = useState<number | false>(false);
    const [openGenreDialog, setOpenGenreDialog] = useState(false);
    const [openItemDialog, setOpenItemDialog] = useState(false);
    const [newGenreName, setNewGenreName] = useState('');
    const [newItemKeyword, setNewItemKeyword] = useState('');
    const [newItemGenreId, setNewItemGenreId] = useState<number | ''>('');
    const [genreError, setGenreError] = useState('');
    const [keywordError, setKeywordError] = useState('');
    const [loading, setLoading] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
    const [deletingGenreId, setDeletingGenreId] = useState<number | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        fetchGenres();
        fetchItems();
    }, []);

    const fetchGenres = async () => {
        const res = await api.get('/genres');
        setGenres(res.data);
        if (res.data.length > 0 && selectedGenreId === false) {
            setSelectedGenreId(res.data[0].id);
        }
    };

    const fetchItems = async () => {
        const res = await api.get('/favorite-items');
        setItems(res.data);
    };

    /**
     * ジャンル名のバリデーション
     * @returns {boolean} バリデーションが成功したかどうか
     */
    const validateGenreName = (): boolean => {
        const trimmed = newGenreName.trim();
        if (!trimmed) {
            setGenreError('ジャンル名を入力してください');
            return false;
        }
        setGenreError('');
        return true;
    };

    /**
     * キーワードのバリデーション
     * @returns {boolean} バリデーションが成功したかどうか
     */
    const validateKeyword = (): boolean => {
        const trimmed = newItemKeyword.trim();
        if (!trimmed) {
            setKeywordError('キーワードを入力してください');
            return false;
        }
        if (!newItemGenreId) {
            setKeywordError('ジャンルを選択してください');
            return false;
        }
        setKeywordError('');
        return true;
    };

    /**
     * ジャンル作成処理
     */
    const handleCreateGenre = async () => {
        if (!validateGenreName()) {
            return;
        }

        try {
            setLoading(true);
            await api.post('/genres', { name: newGenreName.trim() });
            setNewGenreName('');
            setGenreError('');
            setOpenGenreDialog(false);
            await fetchGenres();
            setSnackbar({ open: true, message: 'ジャンルを追加しました', severity: 'success' });
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'ジャンルの追加に失敗しました',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * アイテム作成処理
     */
    const handleCreateItem = async () => {
        if (!validateKeyword()) {
            return;
        }

        try {
            setLoading(true);
            await api.post('/favorite-items', {
                genre_id: newItemGenreId,
                keyword: newItemKeyword.trim()
            });
            setNewItemKeyword('');
            setNewItemGenreId('');
            setKeywordError('');
            setOpenItemDialog(false);
            await fetchItems();
            setSnackbar({ open: true, message: 'アイテムを追加しました', severity: 'success' });
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'アイテムの追加に失敗しました',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * エンターキー押下時の処理（ジャンル作成）
     * @param {React.KeyboardEvent<HTMLInputElement>} e キーボードイベント
     */
    const handleGenreKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCreateGenre();
        }
    };

    /**
     * エンターキー押下時の処理（アイテム作成）
     * @param {React.KeyboardEvent<HTMLInputElement>} e キーボードイベント
     */
    const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCreateItem();
        }
    };

    /**
     * アイテム削除処理
     * @param {number} id 削除するアイテムのID
     */
    const handleDeleteItem = async (id: number) => {
        if (deletingItemId !== null) return; // 既に削除処理中の場合は何もしない
        setDeletingItemId(id);
        try {
            await api.delete(`/favorite-items/${id}`);
            await fetchItems();
            setSnackbar({ open: true, message: 'アイテムを削除しました', severity: 'success' });
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'アイテムの削除に失敗しました',
                severity: 'error'
            });
        } finally {
            setDeletingItemId(null);
        }
    };

    /**
     * ジャンル削除処理
     * @param {number} id 削除するジャンルのID
     */
    const handleDeleteGenre = async (id: number) => {
        if (deletingGenreId !== null) return; // 既に削除処理中の場合は何もしない
        if (confirm("本当に削除しますか？このジャンル内のすべてのアイテムも削除されます。")) {
            setDeletingGenreId(id);
            try {
                await api.delete(`/genres/${id}`);
                await fetchGenres();
                // Reset selection if deleted
                if (selectedGenreId === id) setSelectedGenreId(false);
                setSnackbar({ open: true, message: 'ジャンルを削除しました', severity: 'success' });
            } catch (error: any) {
                setSnackbar({
                    open: true,
                    message: error.response?.data?.message || 'ジャンルの削除に失敗しました',
                    severity: 'error'
                });
            } finally {
                setDeletingGenreId(null);
            }
        }
    };

    const filteredItems = items.filter(item => item.genre_id === selectedGenreId);

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">お気に入り管理</Typography>
                <Box>
                    <Button startIcon={<AddIcon />} onClick={() => setOpenGenreDialog(true)} sx={{ mr: 1 }}>
                        ジャンル追加
                    </Button>
                    <Button startIcon={<AddIcon />} variant="contained" onClick={() => {
                        setNewItemGenreId(typeof selectedGenreId === 'number' ? selectedGenreId : '');
                        setOpenItemDialog(true);
                    }}>
                        アイテム追加
                    </Button>
                </Box>
            </Box>

            {genres.length > 0 ? (
                <>
                    <Tabs
                        value={selectedGenreId}
                        onChange={(_, val) => setSelectedGenreId(val)}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        {genres.map((genre) => (
                            <Tab key={genre.id} label={genre.name} value={genre.id} />
                        ))}
                    </Tabs>

                    <List>
                        {filteredItems.map((item) => {
                            const isDeleting = deletingItemId === item.id;
                            return (
                                <ListItem
                                    key={item.id}
                                    secondaryAction={
                                        <IconButton 
                                            edge="end" 
                                            aria-label="delete" 
                                            onClick={() => handleDeleteItem(item.id)}
                                            disabled={isDeleting || deletingItemId !== null}
                                        >
                                            {isDeleting ? (
                                                <CircularProgress size={20} />
                                            ) : (
                                                <DeleteIcon />
                                            )}
                                        </IconButton>
                                    }
                                >
                                    <ListItemText primary={item.keyword} />
                                </ListItem>
                            );
                        })}
                        {filteredItems.length === 0 && (
                            <ListItem><ListItemText secondary="このジャンルにはアイテムがありません" /></ListItem>
                        )}
                    </List>

                    {/* Genre Actions (Delete current genre) */}
                    {typeof selectedGenreId === 'number' && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button 
                                color="error" 
                                size="small" 
                                onClick={() => handleDeleteGenre(selectedGenreId)}
                                disabled={deletingGenreId !== null}
                                startIcon={deletingGenreId === selectedGenreId ? <CircularProgress size={16} /> : null}
                            >
                                {deletingGenreId === selectedGenreId ? '削除中...' : 'このジャンルを削除'}
                            </Button>
                        </Box>
                    )}
                </>
            ) : (
                <Typography color="text.secondary">ジャンルが見つかりません。まずはジャンルを作成してください。</Typography>
            )}

            {/* Create Genre Dialog */}
            <Dialog
                open={openGenreDialog}
                onClose={() => {
                    setOpenGenreDialog(false);
                    setNewGenreName('');
                    setGenreError('');
                }}
            >
                <DialogTitle>新しいジャンルを追加</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="ジャンル名"
                        fullWidth
                        value={newGenreName}
                        onChange={(e) => {
                            setNewGenreName(e.target.value);
                            if (genreError) setGenreError('');
                        }}
                        onKeyDown={handleGenreKeyDown}
                        error={!!genreError}
                        helperText={genreError}
                        disabled={loading}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setOpenGenreDialog(false);
                            setNewGenreName('');
                            setGenreError('');
                        }}
                        disabled={loading}
                    >
                        キャンセル
                    </Button>
                    <Button
                        onClick={handleCreateGenre}
                        variant="contained"
                        disabled={loading || !newGenreName.trim()}
                        startIcon={loading ? <CircularProgress size={16} /> : null}
                    >
                        作成
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Item Dialog */}
            <Dialog
                open={openItemDialog}
                onClose={() => {
                    setOpenItemDialog(false);
                    setNewItemKeyword('');
                    setNewItemGenreId('');
                    setKeywordError('');
                }}
            >
                <DialogTitle>新しいアイテムを追加</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="dense" error={!!keywordError && !newItemGenreId}>
                        <InputLabel>ジャンル</InputLabel>
                        <Select
                            value={newItemGenreId}
                            label="ジャンル"
                            onChange={(e) => {
                                setNewItemGenreId(Number(e.target.value));
                                if (keywordError && !newItemGenreId) setKeywordError('');
                            }}
                            disabled={loading}
                        >
                            {genres.map((g) => (
                                <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        margin="dense"
                        label="キーワード (例: スターバックス)"
                        fullWidth
                        value={newItemKeyword}
                        onChange={(e) => {
                            setNewItemKeyword(e.target.value);
                            if (keywordError) setKeywordError('');
                        }}
                        onKeyDown={handleKeywordKeyDown}
                        error={!!keywordError}
                        helperText={keywordError}
                        disabled={loading}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setOpenItemDialog(false);
                            setNewItemKeyword('');
                            setNewItemGenreId('');
                            setKeywordError('');
                        }}
                        disabled={loading}
                    >
                        キャンセル
                    </Button>
                    <Button
                        onClick={handleCreateItem}
                        variant="contained"
                        disabled={loading || !newItemKeyword.trim() || !newItemGenreId}
                        startIcon={loading ? <CircularProgress size={16} /> : null}
                    >
                        作成
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
