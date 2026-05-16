import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { validateSession } from '../../store/slices/authSlice';

interface AuthInitializerProps {
    children: React.ReactNode;
}

/**
 * AuthInitializer validates the user's session on app load
 * Shows loading state until validation is complete
 */
const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
    const dispatch = useAppDispatch();
    const { isInitialized, loading } = useAppSelector((state) => state.auth);

    useEffect(() => {
        // Validate session on mount
        if (!isInitialized) {
            dispatch(validateSession());
        }
    }, [dispatch, isInitialized]);

    // Show loading screen while validating session
    if (!isInitialized || loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    backgroundColor: '#f2f3f3',
                    gap: 2,
                }}
            >
                <CircularProgress size={60} thickness={4} />
                <Typography variant="h6" color="text.secondary">
                    Loading...
                </Typography>
            </Box>
        );
    }

    // Session validated, render children
    return <>{children}</>;
};

export default AuthInitializer;
