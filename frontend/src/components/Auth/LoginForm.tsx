'use client';

import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert, Backdrop, CircularProgress } from '@mui/material';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            console.log('[LoginForm] ログイン処理を開始');
            
            // Sanctum CSRF cookie
            console.log('[LoginForm] CSRF cookieを取得中...');
            try {
                await api.get('/sanctum/csrf-cookie');
                console.log('[LoginForm] CSRF cookie取得成功');
            } catch (csrfError: any) {
                console.error('[LoginForm] CSRF cookie取得エラー:', {
                    status: csrfError.response?.status,
                    statusText: csrfError.response?.statusText,
                    data: csrfError.response?.data,
                    url: csrfError.config?.url,
                    baseURL: csrfError.config?.baseURL,
                });
                // CSRF cookieの取得に失敗しても続行（Bearer Token認証の場合は不要）
                console.warn('[LoginForm] CSRF cookie取得失敗を無視して続行');
            }

            console.log('[LoginForm] ログインAPIを呼び出し中...');
            const response = await api.post('/login', { login, password });
            console.log('[LoginForm] ログイン成功:', {
                status: response.status,
                hasToken: !!response.data.access_token,
                user: response.data.user,
            });

            localStorage.setItem('token', response.data.access_token);
            console.log('[LoginForm] トークンをlocalStorageに保存');
            
            router.push('/dashboard');
        } catch (err: any) {
            console.error('[LoginForm] ログインエラー:', {
                message: err.message,
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
                url: err.config?.url,
                baseURL: err.config?.baseURL,
            });
            setError(err.response?.data?.message || err.message || 'ログインに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, position: 'relative' }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
                margin="normal"
                required
                fullWidth
                id="login"
                label="メールアドレスまたはユーザー名"
                name="login"
                autoComplete="username"
                autoFocus
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                disabled={loading}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="パスワード"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : null}
            >
                {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
            <Backdrop
                open={loading}
                sx={{
                    position: 'absolute',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 2,
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={60} />
                    <Typography variant="h6" color="primary">
                        ログイン中...
                    </Typography>
                </Box>
            </Backdrop>
        </Box>
    );
}
