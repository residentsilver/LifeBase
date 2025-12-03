'use client';

import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface SearchResultItem {
    favorite_keyword: string;
    genre: string;
    stores: Array<{
        name: string;
        distance_m: number;
        vicinity?: string;
        latitude?: number;
        longitude?: number;
        place_id?: string;
    }>;
}

interface SearchResultsProps {
    results: SearchResultItem[];
}

/**
 * 検索結果を表示するコンポーネント
 * - ジャンルごとにソートして表示
 * - 各アイテムをアコーディオンで展開/折りたたみ可能
 */
export default function SearchResults({ results }: SearchResultsProps) {
    // ジャンルごとにソートしてグループ化
    const sortedResults = useMemo(() => {
        if (!results || results.length === 0) {
            return [];
        }

        // ジャンルごとにグループ化
        const genreMap = new Map<string, SearchResultItem[]>();
        results.forEach((item) => {
            const genre = item.genre || 'その他';
            if (!genreMap.has(genre)) {
                genreMap.set(genre, []);
            }
            genreMap.get(genre)!.push(item);
        });

        // ジャンル名でソート
        const sortedGenres = Array.from(genreMap.keys()).sort();

        // ジャンルごとの結果を返す
        return sortedGenres.map((genre) => ({
            genre,
            items: genreMap.get(genre)!,
        }));
    }, [results]);

    if (!results || results.length === 0) {
        return <Typography sx={{ mt: 2 }}>検索結果がありません。</Typography>;
    }

    return (
        <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
            {sortedResults.map((genreGroup, genreIdx) => (
                <Box key={genreIdx} sx={{ mb: 2 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 'bold',
                            mb: 1,
                            color: 'primary.main',
                            borderBottom: '2px solid',
                            borderColor: 'primary.main',
                            pb: 0.5,
                        }}
                    >
                        {genreGroup.genre}
                    </Typography>
                    {genreGroup.items.map((item, itemIdx) => (
                        <Accordion key={itemIdx} sx={{ mb: 1 }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls={`panel-${genreIdx}-${itemIdx}-content`}
                                id={`panel-${genreIdx}-${itemIdx}-header`}
                            >
                                <Typography sx={{ fontWeight: 'medium' }}>
                                    {item.favorite_keyword}
                                    {item.stores.length > 0 && (
                                        <Typography
                                            component="span"
                                            sx={{ ml: 1, color: 'text.secondary', fontSize: '0.875rem' }}
                                        >
                                            ({item.stores.length}件)
                                        </Typography>
                                    )}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                {item.stores.length > 0 ? (
                                    <List dense>
                                        {item.stores.map((store, storeIdx) => (
                                            <React.Fragment key={storeIdx}>
                                                <ListItem>
                                                    <ListItemText
                                                        primary={store.name}
                                                        secondary={`${store.distance_m}m - ${store.vicinity || ''}`}
                                                    />
                                                </ListItem>
                                                {storeIdx < item.stores.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        近くに店舗が見つかりませんでした
                                    </Typography>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            ))}
        </Box>
    );
}
