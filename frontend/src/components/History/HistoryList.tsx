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
    Checkbox,
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
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchHistories();
    }, [refreshTrigger]);

    /**
     * 履歴一覧を取得する
     */
    const fetchHistories = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/histories');
            setHistories(res.data);
        } catch (error) {
            console.error('履歴の取得に失敗しました:', error);
            alert('履歴の取得に失敗しました。');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 単一の履歴を削除する
     * 
     * @param id 削除する履歴のID
     */
    const handleDelete = async (id: number) => {
        if (confirm('本当にこの履歴を削除しますか？')) {
            // 削除中のIDを追加
            setDeletingIds((prev) => new Set(prev).add(id));
            try {
                await api.delete(`/histories/${id}`);
                fetchHistories();
                // 選択状態からも削除
                setSelectedIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                });
            } catch (error) {
                console.error('履歴の削除に失敗しました:', error);
                alert('履歴の削除に失敗しました。');
            } finally {
                // 削除中のIDを削除
                setDeletingIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(id);
                    return newSet;
                });
            }
        }
    };

    /**
     * チェックボックスの選択状態を切り替える
     * 
     * @param id 履歴のID
     */
    const handleToggleSelect = (id: number) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    /**
     * 全選択/全解除を切り替える
     */
    const handleSelectAll = () => {
        if (selectedIds.size === histories.length) {
            // 全解除
            setSelectedIds(new Set());
        } else {
            // 全選択
            setSelectedIds(new Set(histories.map((h) => h.id)));
        }
    };

    /**
     * 選択された履歴を一括削除する
     */
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        const count = selectedIds.size;
        if (!confirm(`選択した${count}件の履歴を削除しますか？`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.post('/histories/bulk-delete', {
                ids: Array.from(selectedIds),
            });
            fetchHistories();
            setSelectedIds(new Set());
        } catch (error) {
            console.error('履歴の一括削除に失敗しました:', error);
            alert('履歴の一括削除に失敗しました。');
        } finally {
            setIsDeleting(false);
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

    const isAllSelected = histories.length > 0 && selectedIds.size === histories.length;
    const isIndeterminate = selectedIds.size > 0 && selectedIds.size < histories.length;

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">検索履歴</Typography>
                {histories.length > 0 && !isLoading && (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleSelectAll}
                            disabled={isDeleting || isLoading}
                        >
                            {isAllSelected ? '全解除' : '全選択'}
                        </Button>
                        {selectedIds.size > 0 && (
                            <Button
                                size="small"
                                variant="contained"
                                color="error"
                                startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                                onClick={handleBulkDelete}
                                disabled={isDeleting || isLoading}
                            >
                                {isDeleting ? '削除中...' : `一括削除 (${selectedIds.size}件)`}
                            </Button>
                        )}
                    </Box>
                )}
            </Box>
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : histories.length === 0 ? (
                <Typography color="text.secondary">履歴がありません。</Typography>
            ) : (
                <List>
                    {histories.map((history) => {
                        const isSelected = selectedIds.has(history.id);
                        const isDeletingItem = deletingIds.has(history.id);
                        const isItemDisabled = isDeleting || isDeletingItem || isLoading;
                        return (
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
                                            disabled={isItemDisabled}
                                        >
                                            読み込む
                                        </Button>
                                        <IconButton
                                            edge="end"
                                            aria-label="edit"
                                            onClick={() => handleEditOpen(history)}
                                            disabled={isItemDisabled}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            edge="end"
                                            aria-label="delete"
                                            onClick={() => handleDelete(history.id)}
                                            disabled={isItemDisabled}
                                            sx={{ position: 'relative' }}
                                        >
                                            {isDeletingItem ? (
                                                <CircularProgress size={20} color="inherit" />
                                            ) : (
                                                <DeleteIcon />
                                            )}
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <Checkbox
                                    checked={isSelected}
                                    onChange={() => handleToggleSelect(history.id)}
                                    disabled={isItemDisabled}
                                    sx={{ mr: 1 }}
                                />
                                <ListItemText
                                    primary={history.name}
                                    secondary={`${history.address_text} (${history.radius_meter}m) - ${new Date(history.created_at).toLocaleDateString()}`}
                                />
                            </ListItem>
                        );
                    })}
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
