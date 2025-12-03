'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import api from '@/lib/axios';

interface SearchHistory {
    id: number;
    name: string;
    address_text: string;
    radius_meter: number;
    latitude: number;
    longitude: number;
    created_at: string;
}

interface HistoryListProps {
    onLoadHistory: (history: SearchHistory) => void;
    refreshTrigger: number;
}

export default function HistoryList({ onLoadHistory, refreshTrigger }: HistoryListProps) {
    const [histories, setHistories] = useState<SearchHistory[]>([]);
    const [editingHistory, setEditingHistory] = useState<SearchHistory | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        address_text: '',
        radius_meter: 0,
    });
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchHistories();
    }, [refreshTrigger]);

    const fetchHistories = async () => {
        const res = await api.get('/histories');
        setHistories(res.data);
    };

    const handleDelete = async (id: number) => {
        if (confirm('本当にこの履歴を削除しますか？')) {
            await api.delete(`/histories/${id}`);
            fetchHistories();
        }
    };

    /**
     * 編集ダイアログを開く
     * 
     * @param history 編集する履歴
     */
    const handleEditOpen = (history: SearchHistory) => {
        setEditingHistory(history);
        setEditForm({
            name: history.name,
            address_text: history.address_text,
            radius_meter: history.radius_meter,
        });
        setIsEditDialogOpen(true);
    };

    /**
     * 編集ダイアログを閉じる
     */
    const handleEditClose = () => {
        if (isSaving) return; // 保存中は閉じられないようにする
        setIsEditDialogOpen(false);
        setEditingHistory(null);
        setEditForm({
            name: '',
            address_text: '',
            radius_meter: 0,
        });
        setIsSaving(false);
    };

    /**
     * 履歴を更新する
     */
    const handleUpdate = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }
        if (!editingHistory || isSaving) return;

        // バリデーション
        if (!editForm.name || !editForm.address_text || editForm.radius_meter <= 0) {
            return;
        }

        setIsSaving(true);
        try {
            await api.put(`/histories/${editingHistory.id}`, {
                name: editForm.name,
                address_text: editForm.address_text,
                latitude: editingHistory.latitude,
                longitude: editingHistory.longitude,
                radius_meter: editForm.radius_meter,
            });
            fetchHistories();
            handleEditClose();
        } catch (error) {
            console.error('履歴の更新に失敗しました:', error);
            alert('履歴の更新に失敗しました。');
            setIsSaving(false);
        }
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="h6">検索履歴</Typography>
            {histories.length === 0 ? (
                <Typography color="text.secondary">履歴がありません。</Typography>
            ) : (
                <List>
                    {histories.map((history) => (
                        <ListItem
                            key={history.id}
                            secondaryAction={
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                    <Button
                                        startIcon={<PlayArrowIcon />}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => onLoadHistory(history)}
                                        sx={{ mr: 1 }}
                                    >
                                        読み込む
                                    </Button>
                                    <IconButton edge="end" aria-label="edit" onClick={() => handleEditOpen(history)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(history.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            }
                        >
                            <ListItemText
                                primary={history.name}
                                secondary={`${history.address_text} (${history.radius_meter}m) - ${new Date(history.created_at).toLocaleDateString()}`}
                            />
                        </ListItem>
                    ))}
                </List>
            )}
            <Dialog open={isEditDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
                <DialogTitle>履歴を編集</DialogTitle>
                <form onSubmit={handleUpdate}>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <TextField
                                label="履歴名"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                fullWidth
                                required
                                autoFocus
                                disabled={isSaving}
                            />
                            <TextField
                                label="住所"
                                value={editForm.address_text}
                                onChange={(e) => setEditForm({ ...editForm, address_text: e.target.value })}
                                fullWidth
                                required
                                multiline
                                rows={2}
                                disabled={isSaving}
                            />
                            <TextField
                                label="検索半径 (m)"
                                type="number"
                                value={editForm.radius_meter}
                                onChange={(e) => setEditForm({ ...editForm, radius_meter: parseInt(e.target.value) || 0 })}
                                fullWidth
                                required
                                inputProps={{ min: 0, max: 10000 }}
                                disabled={isSaving}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && !isSaving) {
                                        e.preventDefault();
                                        handleUpdate();
                                    }
                                }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button type="button" onClick={handleEditClose} disabled={isSaving}>
                            キャンセル
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!editForm.name || !editForm.address_text || editForm.radius_meter <= 0 || isSaving}
                            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isSaving ? '保存中...' : '保存'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
