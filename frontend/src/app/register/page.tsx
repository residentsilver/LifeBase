'use client';

import React from 'react';
import { Container, Box, Typography, Link } from '@mui/material';
import RegisterForm from '@/components/Auth/RegisterForm';
import NextLink from 'next/link';

export default function RegisterPage() {
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
                    LifeBase 新規登録
                </Typography>
                <RegisterForm />
                <Box sx={{ mt: 2 }}>
                    <Link component={NextLink} href="/login" variant="body2">
                        {"すでにアカウントをお持ちの方はこちら（ログイン）"}
                    </Link>
                </Box>
            </Box>
        </Container>
    );
}
