import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { validateSession } from '../../store/slices/authSlice';
import { Spinner } from '../common/spinner';

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
    const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);

    useEffect(() => {
        // Validate session on mount
        if (!isInitialized) {
            dispatch(validateSession());
        }

        // Ensure loading page displays for at least 5 seconds for visual impact
        const timer = setTimeout(() => {
            setMinimumTimeElapsed(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, [dispatch, isInitialized]);

    // Show loading screen while validating session or during minimum display period
    if (!isInitialized || loading || !minimumTimeElapsed) {
        return (
            <Spinner
                fullPage
                size={96}
                text="Initializing Gravit"
            />
        );
    }

    // Session validated, render children
    return <>{children}</>;
};

export default AuthInitializer;
