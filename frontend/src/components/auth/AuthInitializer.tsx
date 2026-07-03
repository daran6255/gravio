import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { validateSession } from '../../store/slices/authSlice';
import { Spinner } from '../common/spinner';

// Upper bound on how long the initial loading screen can show — if session
// validation is slow or hangs, fall through to rendering children rather than
// blocking the app indefinitely.
const MAX_LOADING_MS = 5000;

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
    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        // Validate session on mount
        if (!isInitialized) {
            dispatch(validateSession());
        }

        const timer = setTimeout(() => setTimedOut(true), MAX_LOADING_MS);
        return () => clearTimeout(timer);
    }, [dispatch, isInitialized]);

    // Show loading screen while validating session, capped at MAX_LOADING_MS
    if (!timedOut && (!isInitialized || loading)) {
        return (
            <Spinner
                fullPage
                size={96}
                text="Initializing Gravit"
            />
        );
    }

    // Session validated (or the timeout cap was hit), render children
    return <>{children}</>;
};

export default AuthInitializer;
