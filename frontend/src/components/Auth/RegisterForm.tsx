'use client';

import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert, Backdrop, CircularProgress } from '@mui/material';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const validateEmail = (value: string) => {
        if (!value.includes('@')) {
            setEmailError('メールアドレスには「@」を含めてください。');
        } else {
            setEmailError('');
        }
    };

    const validatePassword = (value: string) => {
        if (value.length < 8) {
            setPasswordError('パスワードは8文字以上で入力してください。');
        } else {
            setPasswordError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setNameError('');
        setEmailError('');
        setPasswordError('');

        // 送信前にもバリデーションチェック
        let hasError = false;
        if (!email.includes('@')) {
            validateEmail(email);
            hasError = true;
        }
        if (password.length < 8) {
            validatePassword(password);
            hasError = true;
        }
        if (hasError) return;

        setLoading(true);
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
                // バリデーションエラーを各フィールドに割り当て
                const errors = err.response.data.errors;
                
                if (errors.name) {
                    setNameError(errors.name[0]);
                } else {
                    setNameError('');
                }
                
                if (errors.email) {
                    setEmailError(errors.email[0]);
                } else {
                    setEmailError('');
                }
                
                if (errors.password) {
                    setPasswordError(errors.password[0]);
                } else {
                    setPasswordError('');
                }
                
                // その他のエラーは全体エラーとして表示
                const otherErrors = Object.entries(errors)
                    .filter(([key]) => !['name', 'email', 'password'].includes(key))
                    .map(([, messages]) => messages)
                    .flat();
                
                if (otherErrors.length > 0) {
                    setError(otherErrors.join('\n'));
                } else {
                    setError('');
                }
            } else {
                setError(err.response?.data?.message || err.message || '登録に失敗しました');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, position: 'relative' }}>
            {error && <Alert severity="error" sx={{ mb: 2 }} style={{ whiteSpace: 'pre-line' }}>{error}</Alert>}
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
                onChange={(e) => {
                    setName(e.target.value);
                    setNameError('');
                }}
                error={!!nameError}
                helperText={nameError}
                disabled={loading}
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
                onChange={(e) => {
                    setEmail(e.target.value);
                    validateEmail(e.target.value);
                    setEmailError('');
                }}
                error={!!emailError}
                helperText={emailError}
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    validatePassword(e.target.value);
                    setPasswordError('');
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !loading) {
                        e.preventDefault();
                        handleSubmit(e as any);
                    }
                }}
                error={!!passwordError}
                helperText={passwordError}
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
                {loading ? '登録中...' : '登録する'}
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
                        登録中...
                    </Typography>
                </Box>
            </Backdrop>
        </Box>
    );
}
