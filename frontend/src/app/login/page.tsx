'use client';

import React from 'react';
import { Container, Box, Typography, Link } from '@mui/material';
import LoginForm from '@/components/Auth/LoginForm';
import NextLink from 'next/link';

export default function LoginPage() {
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
