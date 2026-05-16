import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import JobRoleList from '../../components/placement/jobroles/JobRoleList';

const JobRoleManagement: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	return (
		<Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: isMobile ? 2 : 3 }}>
			<Container maxWidth="xl" sx={{ px: isMobile ? 1 : { sm: 2, md: 3 } }}>
				<JobRoleList
					title="Job Role Management"
					subtitle="Configure job requirements, placement tracking, and vacancy definitions"
				/>
			</Container>
		</Box>
	)
};

export default JobRoleManagement;
