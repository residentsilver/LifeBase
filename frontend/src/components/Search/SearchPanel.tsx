'use client';

import React from 'react';
import { Box, TextField, Slider, Typography, Button, Grid } from '@mui/material';
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

    return (
        <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="住所検索"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="例: 東京駅"
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
                        startIcon={<SearchIcon />}
                        onClick={onSearch}
                        disabled={loading}
                    >
                        検索
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
