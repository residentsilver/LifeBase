'use client';

import React from 'react';
import { Box, CircularProgress, Typography, BoxProps } from '@mui/material';

interface LoadingInlineProps extends Omit<BoxProps, 'display' | 'flexDirection' | 'alignItems' | 'justifyContent'> {
    /**
     * 表示するメッセージ
     */
    message?: string;
    /**
     * スピナーのサイズ
     * @default 40
     */
    spinnerSize?: number;
    /**
     * メッセージの位置（'bottom' | 'right'）
     * @default 'bottom'
     */
    messagePosition?: 'bottom' | 'right';
}

/**
 * インライン表示型のローディングコンポーネント
 * ダイアログ内や特定のエリア内に表示するローディング表示に使用
 */
export default function LoadingInline({
    message,
    spinnerSize = 40,
    messagePosition = 'bottom',
    sx,
    ...props
}: LoadingInlineProps) {
    return (
        <Box
            {...props}
            sx={{
                display: 'flex',
                flexDirection: messagePosition === 'bottom' ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                ...sx,
            }}
        >
            <CircularProgress size={spinnerSize} />
            {message && (
                <Typography variant="body2" color="primary">
                    {message}
                </Typography>
            )}
        </Box>
    );
}

