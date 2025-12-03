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

interface SelectedStore {
    name: string;
    latitude: number;
    longitude: number;
    vicinity?: string;
    distance_m?: number;
    place_id?: string;
}

interface SearchResultsProps {
    results: SearchResultItem[];
    selectedStore: SelectedStore | null;
    onStoreClick: (store: SelectedStore | null) => void;
}

/**
 * 検索結果を表示するコンポーネント
 * - ジャンルごとにソートして表示
 * - 各アイテムをアコーディオンで展開/折りたたみ可能
 * - 店舗クリックでマップ上の対応するピンをハイライト
 */
export default function SearchResults({ results, selectedStore, onStoreClick }: SearchResultsProps) {
    // 店舗が選択されているかどうかを判定する関数
    const isStoreSelected = (store: SearchResultItem['stores'][0]) => {
        if (!selectedStore || !store.latitude || !store.longitude) return false;
        return (
            store.latitude === selectedStore.latitude &&
            store.longitude === selectedStore.longitude
        );
    };
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
                                        {item.stores.map((store, storeIdx) => {
                                            const isSelected = isStoreSelected(store);
                                            return (
                                                <React.Fragment key={storeIdx}>
                                                    <ListItem
                                                        button
                                                        onClick={() => {
                                                            if (store.latitude && store.longitude) {
                                                                onStoreClick({
                                                                    name: store.name,
                                                                    latitude: store.latitude,
                                                                    longitude: store.longitude,
                                                                    vicinity: store.vicinity,
                                                                    distance_m: store.distance_m,
                                                                    place_id: store.place_id,
                                                                });
                                                            }
                                                        }}
                                                        sx={{
                                                            backgroundColor: isSelected ? 'action.selected' : 'transparent',
                                                            '&:hover': {
                                                                backgroundColor: isSelected ? 'action.selected' : 'action.hover',
                                                            },
                                                            borderLeft: isSelected ? '4px solid' : '4px solid transparent',
                                                            borderColor: isSelected ? 'primary.main' : 'transparent',
                                                            pl: isSelected ? 1.5 : 2,
                                                        }}
                                                    >
                                                        <ListItemText
                                                            primary={
                                                                <Typography
                                                                    sx={{
                                                                        fontWeight: isSelected ? 'bold' : 'normal',
                                                                        color: isSelected ? 'primary.main' : 'text.primary',
                                                                    }}
                                                                >
                                                                    {store.name}
                                                                </Typography>
                                                            }
                                                            secondary={`${store.distance_m}m - ${store.vicinity || ''}`}
                                                        />
                                                    </ListItem>
                                                    {storeIdx < item.stores.length - 1 && <Divider />}
                                                </React.Fragment>
                                            );
                                        })}
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
