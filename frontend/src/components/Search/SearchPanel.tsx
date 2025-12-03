'use client';

import React from 'react';
import { Box, TextField, Slider, Typography, Button, Grid, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface SearchPanelProps {
    address: string;
    setAddress: (addr: string) => void;
    radius: number;
    setRadius: (rad: number) => void;
    onSearch: () => void;
    loading: boolean;
}

export default function SearchPanel({ address, setAddress, radius, setRadius, onSearch, loading }: SearchPanelProps) {
    const handleRadiusChange = (event: Event, newValue: number | number[]) => {
        setRadius(newValue as number);
    };

    /**
     * エンターキー押下時の処理（検索実行）
     * @param {React.KeyboardEvent<HTMLInputElement>} e キーボードイベント
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (address.trim() && !loading) {
                onSearch();
            }
        }
    };

    return (
        <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="住所検索"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="例: 東京駅"
                        disabled={loading}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Typography gutterBottom>検索半径: {radius}m</Typography>
                    <Slider
                        value={radius}
                        onChange={handleRadiusChange}
                        valueLabelDisplay="auto"
                        min={100}
                        max={5000}
                        step={100}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                        onClick={(e) => {
                            e.preventDefault();
                            onSearch();
                        }}
                        disabled={loading}
                    >
                        {loading ? '検索中...' : '検索'}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
