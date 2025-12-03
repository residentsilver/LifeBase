'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, IconButton, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import api from '@/lib/axios';

interface SearchHistory {
    id: number;
    name: string;
    address_text: string;
    radius_meter: number;
    created_at: string;
}

interface HistoryListProps {
    onLoadHistory: (history: SearchHistory) => void;
    refreshTrigger: number;
}

export default function HistoryList({ onLoadHistory, refreshTrigger }: HistoryListProps) {
    const [histories, setHistories] = useState<SearchHistory[]>([]);

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
                                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(history.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            }
                        >
                            <ListItemText
                                primary={history.name}
                                secondary={`${history.address_text} (${history.radius_meter}m) - ${new Date(history.created_at).toLocaleDateString()}`}
                            />
                            <Button
                                startIcon={<PlayArrowIcon />}
                                size="small"
                                onClick={() => onLoadHistory(history)}
                                sx={{ mr: 1 }}
                            >
                                読み込む
                            </Button>
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
}
