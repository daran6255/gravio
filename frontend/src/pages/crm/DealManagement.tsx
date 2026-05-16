import React, { useRef, useCallback } from 'react';
import { Box, Container, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import DealList from '../../components/crm/deals/DealList';
import { useAppSelector } from '../../store/hooks';

const DealManagement: React.FC = () => {
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin = user?.role === 'admin';
	
	const addDealTrigger = useRef<(() => void) | null>(null);

	const handleAddClick = useCallback(() => {
		if (addDealTrigger.current) {
			addDealTrigger.current();
		}
	}, []);

	return (
		<Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
			<Container maxWidth="xl">
				<PageHeader
					title="Deal Management"
					subtitle="Track sales opportunities and revenue pipeline"
					action={
						isAdmin ? (
							<Button
								variant="contained"
								color="primary"
								startIcon={<AddIcon />}
								onClick={handleAddClick}
							>
								Add Deal
							</Button>
						) : undefined
					}
				/>
				
				<DealList onAddClick={(trigger) => { addDealTrigger.current = trigger; }} />
			</Container>
		</Box>
	);
};

export default DealManagement;
