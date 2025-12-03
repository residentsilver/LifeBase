'use client';

import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';

interface SearchResultsProps {
    results: any[];
}

export default function SearchResults({ results }: SearchResultsProps) {
    if (!results || results.length === 0) {
        return <Typography sx={{ mt: 2 }}>検索結果がありません。</Typography>;
    }

    return (
        <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
            {results.map((group, idx) => (
                <Box key={idx} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {group.favorite_keyword} ({group.genre})
                    </Typography>
                    <List dense>
                        {group.stores.map((store: any, sIdx: number) => (
                            <React.Fragment key={sIdx}>
                                <ListItem>
                                    <ListItemText
                                        primary={store.name}
                                        secondary={`${store.distance_m}m - ${store.vicinity || ''}`}
                                    />
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                        {group.stores.length === 0 && (
                            <ListItem><ListItemText secondary="近くに店舗が見つかりませんでした" /></ListItem>
                        )}
                    </List>
                </Box>
            ))}
        </Box>
    );
}
