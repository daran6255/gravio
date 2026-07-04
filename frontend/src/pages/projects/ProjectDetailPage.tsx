import React from 'react';
import { Box, Container, Paper, Typography, CircularProgress } from '@mui/material';
import { ChecklistOutlined } from '@mui/icons-material';
import { ProjectDetailHeader, useProjectDetail } from '../../components/projects';

const ProjectDetailPage: React.FC = () => {
	const { project, loading, handleBack } = useProjectDetail();

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				{loading && !project ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
						<CircularProgress size={40} thickness={3} />
					</Box>
				) : project ? (
					<>
						<ProjectDetailHeader project={project} onBack={handleBack} />

						<Paper
							variant="outlined"
							sx={{
								p: 6,
								borderRadius: '20px',
								textAlign: 'center',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 1.5,
							}}
						>
							<ChecklistOutlined sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.5 }} />
							<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
								Task board coming soon
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
								This project's task board and activity will show up here.
							</Typography>
						</Paper>
					</>
				) : (
					<Box sx={{ py: 10, textAlign: 'center' }}>
						<Typography color="text.secondary">Project not found.</Typography>
					</Box>
				)}
			</Container>
		</Box>
	);
};

export default ProjectDetailPage;
