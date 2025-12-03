'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Tabs, Tab, Button, List, ListItem, ListItemText,
    IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions,
    FormControl, InputLabel, Select, MenuItem
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

    const handleCreateGenre = async () => {
        await api.post('/genres', { name: newGenreName });
        setNewGenreName('');
        setOpenGenreDialog(false);
        fetchGenres();
    };

    const handleCreateItem = async () => {
        await api.post('/favorite-items', { genre_id: newItemGenreId, keyword: newItemKeyword });
        setNewItemKeyword('');
        setNewItemGenreId('');
        setOpenItemDialog(false);
        fetchItems();
    };

    const handleDeleteItem = async (id: number) => {
        await api.delete(`/favorite-items/${id}`);
        fetchItems();
    };

    const handleDeleteGenre = async (id: number) => {
        if (confirm("本当に削除しますか？このジャンル内のすべてのアイテムも削除されます。")) {
            await api.delete(`/genres/${id}`);
            fetchGenres();
            // Reset selection if deleted
            if (selectedGenreId === id) setSelectedGenreId(false);
        }
    }

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
                        {filteredItems.map((item) => (
                            <ListItem
                                key={item.id}
                                secondaryAction={
                                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteItem(item.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemText primary={item.keyword} />
                            </ListItem>
                        ))}
                        {filteredItems.length === 0 && (
                            <ListItem><ListItemText secondary="このジャンルにはアイテムがありません" /></ListItem>
                        )}
                    </List>

                    {/* Genre Actions (Delete current genre) */}
                    {typeof selectedGenreId === 'number' && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button color="error" size="small" onClick={() => handleDeleteGenre(selectedGenreId)}>
                                このジャンルを削除
                            </Button>
                        </Box>
                    )}
                </>
            ) : (
                <Typography color="text.secondary">ジャンルが見つかりません。まずはジャンルを作成してください。</Typography>
            )}

            {/* Create Genre Dialog */}
            <Dialog open={openGenreDialog} onClose={() => setOpenGenreDialog(false)}>
                <DialogTitle>新しいジャンルを追加</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="ジャンル名"
                        fullWidth
                        value={newGenreName}
                        onChange={(e) => setNewGenreName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenGenreDialog(false)}>キャンセル</Button>
                    <Button onClick={handleCreateGenre}>作成</Button>
                </DialogActions>
            </Dialog>

            {/* Create Item Dialog */}
            <Dialog open={openItemDialog} onClose={() => setOpenItemDialog(false)}>
                <DialogTitle>新しいアイテムを追加</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>ジャンル</InputLabel>
                        <Select
                            value={newItemGenreId}
                            label="Genre"
                            onChange={(e) => setNewItemGenreId(Number(e.target.value))}
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
                        onChange={(e) => setNewItemKeyword(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenItemDialog(false)}>キャンセル</Button>
                    <Button onClick={handleCreateItem}>作成</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
