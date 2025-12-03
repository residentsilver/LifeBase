'use client';

import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            console.log('[RegisterForm] ユーザー登録処理を開始');

            // Sanctum CSRF cookie
            console.log('[RegisterForm] CSRF cookieを取得中...');
            try {
                await api.get('/sanctum/csrf-cookie');
                console.log('[RegisterForm] CSRF cookie取得成功');
            } catch (csrfError: any) {
                console.error('[RegisterForm] CSRF cookie取得エラー:', {
                    status: csrfError.response?.status,
                    statusText: csrfError.response?.statusText,
                    data: csrfError.response?.data,
                    url: csrfError.config?.url,
                    baseURL: csrfError.config?.baseURL,
                });
                // CSRF cookieの取得に失敗しても続行（Bearer Token認証の場合は不要）
                console.warn('[RegisterForm] CSRF cookie取得失敗を無視して続行');
            }

            console.log('[RegisterForm] ユーザー登録APIを呼び出し中...');
            const response = await api.post('/register', { name, email, password });
            console.log('[RegisterForm] ユーザー登録成功:', {
                status: response.status,
                hasToken: !!response.data.access_token,
                user: response.data.user,
            });

            localStorage.setItem('token', response.data.access_token);
            console.log('[RegisterForm] トークンをlocalStorageに保存');

            router.push('/dashboard');
        } catch (err: any) {
            console.error('[RegisterForm] ユーザー登録エラー:', {
                message: err.message,
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
                errors: err.response?.data?.errors,
                url: err.config?.url,
                baseURL: err.config?.baseURL,
            });

            if (err.response?.status === 422 && err.response?.data?.errors) {
                // バリデーションエラーの内容を連結して表示
                const errorMessages = Object.values(err.response.data.errors).flat().join('\n');
                setError(errorMessages);
            } else {
                setError(err.response?.data?.message || err.message || '登録に失敗しました');
            }
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="お名前"
                name="name"
                autoComplete="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="メールアドレス"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="パスワード"
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
            >
                登録する
            </Button>
        </Box>
    );
}
