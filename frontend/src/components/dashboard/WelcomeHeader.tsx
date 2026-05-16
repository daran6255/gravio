import React from 'react';
import { Box, Typography } from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import RegistrationLinkModal from './RegistrationLinkModal';

const WelcomeHeader: React.FC = () => {
    const { user } = useAppSelector((state) => state.auth);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formattedDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date());

    return (
        <Box sx={{
            mb: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 2
        }}>
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#16191f', letterSpacing: '-0.02em' }}>
                        {getGreeting()}, {user?.full_name?.split(' ')[0] || user?.username}! 👋
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: '#545b64', fontWeight: 500 }}>
                    Welcome back to the WinVinaya MIS. Here's what's happening today, {formattedDate}.
                </Typography>
            </Box>
            <RegistrationLinkModal />
        </Box>
    );
};

export default WelcomeHeader;
