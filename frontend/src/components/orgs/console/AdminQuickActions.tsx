import React from 'react';
import { Card, CardContent, Button, useTheme, alpha } from '@mui/material';
import { PostAdd, Launch } from '@mui/icons-material';

interface AdminQuickActionsProps {
	onCreateClick: () => void;
}

export const AdminQuickActions: React.FC<AdminQuickActionsProps> = ({ onCreateClick }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Card
			sx={{
				borderRadius: '16px',
				background: isDark 
					? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
					: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)',
				backdropFilter: 'blur(20px)',
				border: `1px solid ${theme.palette.divider}`,
				boxShadow: isDark
					? '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
					: '0 8px 32px 0 rgba(139, 124, 246, 0.04)',
				transition: 'transform 0.3s ease',
				'&:hover': {
					transform: 'translateY(-2px)'
				}
			}}
		>
			<CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
				<Button
					variant="outlined"
					fullWidth
					startIcon={<PostAdd />}
					onClick={onCreateClick}
					sx={{
						textTransform: 'none',
						py: 1.25,
						borderRadius: '10px',
						fontWeight: 700,
						borderColor: 'primary.main',
						color: 'primary.main',
						'&:hover': {
							bgcolor: alpha(theme.palette.primary.main, 0.06),
							borderColor: 'primary.dark',
						}
					}}
				>
					Provision Tenant
				</Button>
				
				<Button
					variant="text"
					fullWidth
					disabled
					startIcon={<Launch sx={{ fontSize: 16 }} />}
					sx={{
						textTransform: 'none',
						color: 'text.secondary',
						fontWeight: 500,
						justifyContent: 'center',
						'&.Mui-disabled': { color: 'text.disabled' }
					}}
				>
					Platform Settings
				</Button>
			</CardContent>
		</Card>
	);
};

export default AdminQuickActions;
