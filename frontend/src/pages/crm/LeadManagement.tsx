import React, { useRef, useCallback } from 'react';
import { Box, Container, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import LeadList from '../../components/crm/leads/LeadList';
import { useAppSelector } from '../../store/hooks';

const LeadManagement: React.FC = () => {
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin = user?.role === 'admin';
	
	const addLeadTrigger = useRef<(() => void) | null>(null);

	const handleAddClick = useCallback(() => {
		if (addLeadTrigger.current) {
			addLeadTrigger.current();
		}
	}, []);

	return (
		<Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
			<Container maxWidth="xl">
				<PageHeader
					title="Lead Management"
					subtitle="Track and qualify potential business opportunities"
					action={
						isAdmin ? (
							<Button
								variant="contained"
								color="primary"
								startIcon={<AddIcon />}
								onClick={handleAddClick}
							>
								Add Lead
							</Button>
						) : undefined
					}
				/>
				
				<LeadList onAddClick={(trigger) => { addLeadTrigger.current = trigger; }} />
			</Container>
		</Box>
	);
};

export default LeadManagement;
