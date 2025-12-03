'use client';

import React from 'react';
import { IconButton, IconButtonProps, CircularProgress } from '@mui/material';

interface LoadingIconButtonProps extends IconButtonProps {
    /**
     * ローディング状態
     */
    loading: boolean;
    /**
     * スピナーのサイズ
     * @default 20
     */
    spinnerSize?: number;
    /**
     * ローディング時のアイコン（通常時のアイコンはchildrenで指定）
     */
    children: React.ReactNode;
}

/**
 * ローディング状態を表示するアイコンボタンコンポーネント
 * アイコンボタン内にスピナーを表示し、ローディング中は無効化される
 */
export default function LoadingIconButton({
    loading,
    spinnerSize = 20,
    children,
    disabled,
    ...props
}: LoadingIconButtonProps) {
    return (
        <IconButton
            {...props}
            disabled={loading || disabled}
        >
            {loading ? <CircularProgress size={spinnerSize} color="inherit" /> : children}
        </IconButton>
    );
}

