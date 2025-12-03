'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Box, Typography, Link, CircularProgress } from '@mui/material';
import LoginForm from '@/components/Auth/LoginForm';
import NextLink from 'next/link';
import api from '@/lib/axios';

/**
 * ルートページ
 * 認証状態に応じてログイン画面またはダッシュボードにリダイレクト
 */
export default function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            
            if (!token) {
                // トークンがない場合は未ログイン
                setIsAuthenticated(false);
                return;
            }

            try {
                // トークンがある場合、APIで認証状態を確認
                const response = await api.get('/user');
                if (response.data) {
                    // ログイン済みの場合はダッシュボードにリダイレクト
                    router.replace('/dashboard');
                    // リダイレクト中はローディング状態を維持
                    return;
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                // 認証に失敗した場合は未ログインとして扱う
                localStorage.removeItem('token');
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, [router]);

    // 認証状態の確認中はローディング表示
    if (isAuthenticated === null) {
        return (
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '50vh',
                    }}
                >
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                        読み込み中...
                    </Typography>
                </Box>
            </Container>
        );
    }

    // 未ログインの場合はログイン画面を表示
    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    LifeBaseへログイン
                </Typography>
                <LoginForm />
                <Box sx={{ mt: 2 }}>
                    <Link component={NextLink} href="/register" variant="body2">
                        {"アカウントをお持ちでない方はこちら（新規登録）"}
                    </Link>
                </Box>
            </Box>
        </Container>
    );
}
