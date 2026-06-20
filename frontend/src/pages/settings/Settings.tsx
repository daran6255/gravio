import React from 'react';
import {
	Container,
	Box,
	Paper,
	Typography,
	Stack
} from '@mui/material';
import { AIEngineSection } from '../../components/settings';

const Settings: React.FC = () => {
	return (
		<Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
			{/* Page Header */}
			<Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', pt: 3, pb: 3, px: 4 }}>
				<Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
					<Box>
						<Typography variant="h5" sx={{ fontWeight: 600, color: '#1e293b', letterSpacing: '-0.02em', mb: 0.5 }}>
							System Settings
						</Typography>
						<Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
							Manage your AI Engine settings, provider credentials, models, and custom behaviors.
						</Typography>
					</Box>
				</Stack>
			</Box>

			<Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
				<Container maxWidth="xl" sx={{ p: 0 }}>
					<Paper
						elevation={0}
						sx={{
							p: { xs: 3, md: 4 },
							borderRadius: '12px',
							bgcolor: '#ffffff',
							minHeight: '600px',
							border: '1px solid #e2e8f0',
							boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
						}}
					>
						<AIEngineSection />
					</Paper>
				</Container>
			</Box>
		</Box>
	);
};

export default Settings;
