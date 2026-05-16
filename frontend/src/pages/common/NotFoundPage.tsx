import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Container,
	Typography,
	Button,
	Box,
	useTheme,
} from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

const NotFoundPage: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();

	return (
		<Container component="main" maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
			<Box
				component="img"
				src="https://illustrations.popsy.co/amber/falling.svg" // Placeholder or use a local asset if available. Using an icon for now to be safe.
				sx={{
					width: '100%',
					maxWidth: 400,
					height: 'auto',
					mb: 4,
					display: 'none' // Hidden for now, relying on Icon
				}}
				alt="404 Illustration"
				aria-hidden="true"
			/>
			<ErrorIcon color="error" sx={{ fontSize: 100, mb: 2, opacity: 0.5 }} aria-hidden="true" />

			<Typography variant="h1" component="div" gutterBottom sx={{ fontWeight: 900, color: theme.palette.text.secondary }}>
				404
			</Typography>

			<Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold">
				Page Not Found
			</Typography>


			<Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 5, maxWidth: 500 }}>
				Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
			</Typography>

			<Button
				variant="contained"
				size="large"
				onClick={() => navigate('/')}
				sx={{
					px: 4,
					py: 1.5,
					borderRadius: 2,
				}}
			>
				Back to Home
			</Button>
		</Container>
	);
};

export default NotFoundPage;
