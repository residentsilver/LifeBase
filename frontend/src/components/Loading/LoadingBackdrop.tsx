'use client';

import React from 'react';
import { Backdrop, Box, CircularProgress, Typography } from '@mui/material';

interface LoadingBackdropProps {
    /**
     * ローディング表示の有無
     */
    open: boolean;
    /**
     * 表示するメッセージ
     */
    message?: string;
    /**
     * 背景色の透明度（0-1）
     * @default 0.8
     */
    opacity?: number;
    /**
     * 背景色（rgba形式または色名）
     * @default 'rgba(255, 255, 255, 0.8)'
     */
    backgroundColor?: string;
    /**
     * 位置指定（'absolute' | 'fixed'）
     * @default 'absolute'
     */
    position?: 'absolute' | 'fixed';
    /**
     * スピナーのサイズ
     * @default 60
     */
    spinnerSize?: number;
    /**
     * テキストの色
     * @default 'primary'
     */
    textColor?: 'primary' | 'white' | 'inherit';
}

/**
 * 全画面オーバーレイ型のローディングコンポーネント
 * フォーム送信時や検索中など、画面全体をブロックするローディング表示に使用
 */
export default function LoadingBackdrop({
    open,
    message,
    opacity = 0.8,
    backgroundColor,
    position = 'absolute',
    spinnerSize = 60,
    textColor = 'primary',
}: LoadingBackdropProps) {
    // 背景色が指定されていない場合は、opacityとtextColorから自動決定
    const bgColor = backgroundColor || (textColor === 'white' 
        ? `rgba(0, 0, 0, ${opacity})` 
        : `rgba(255, 255, 255, ${opacity})`);

    return (
        <Backdrop
            open={open}
            sx={{
                position,
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: bgColor,
                borderRadius: position === 'absolute' ? 2 : 0,
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={spinnerSize} />
                {message && (
                    <Typography variant="h6" color={textColor}>
                        {message}
                    </Typography>
                )}
            </Box>
        </Backdrop>
    );
}

