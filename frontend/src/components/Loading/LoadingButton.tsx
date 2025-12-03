'use client';

import React from 'react';
import { Button, ButtonProps, CircularProgress } from '@mui/material';

interface LoadingButtonProps extends ButtonProps {
    /**
     * ローディング状態
     */
    loading: boolean;
    /**
     * ローディング時のテキスト
     */
    loadingText?: string;
    /**
     * スピナーのサイズ
     * @default 16
     */
    spinnerSize?: number;
}

/**
 * ローディング状態を表示するボタンコンポーネント
 * ボタン内にスピナーを表示し、ローディング中は無効化される
 */
export default function LoadingButton({
    loading,
    loadingText,
    children,
    spinnerSize = 16,
    disabled,
    startIcon,
    ...props
}: LoadingButtonProps) {
    return (
        <Button
            {...props}
            disabled={loading || disabled}
            startIcon={loading ? <CircularProgress size={spinnerSize} /> : startIcon}
        >
            {loading && loadingText ? loadingText : children}
        </Button>
    );
}

