import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
	Container,
	Paper,
	Typography,
	Button,
	useTheme,
} from '@mui/material';
import { CheckCircleOutline as CheckCircleIcon } from '@mui/icons-material';

const SuccessPage: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const location = useLocation();
	const state = location.state as { title?: string; message?: string; actionText?: string; actionPath?: string } | null;

	const title = state?.title || 'Submission Successful';
	const message = state?.message || 'Your information has been successfully submitted.';
	const actionText = state?.actionText || 'Back to Registration';
	const actionPath = state?.actionPath || '/candidate-registration';

	return (
		<Container component="main" maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
			<Paper
				elevation={0}
				sx={{
					p: 6,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					border: `1px solid ${theme.palette.divider}`,
					borderRadius: 4,
				}}
			>
				<CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 3 }} aria-hidden="true" />

				<Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold">
					{title}
				</Typography>


				<Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4, whiteSpace: 'pre-line' }}>
					{message}
				</Typography>

				<Button
					variant="contained"
					size="large"
					onClick={() => navigate(actionPath)}
					sx={{
						px: 4,
						py: 1.5,
						borderRadius: 2,
					}}
				>
					{actionText}
				</Button>
			</Paper>
		</Container>
	);
};

export default SuccessPage;
