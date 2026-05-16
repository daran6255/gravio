import React, { useRef, useCallback } from 'react';
import { Box, Container, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import CRMTaskList from '../../components/crm/tasks/CRMTaskList';
import { useAppSelector } from '../../store/hooks';

const TaskManagement: React.FC = () => {
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin = user?.role === 'admin';
	
	const addTaskTrigger = useRef<(() => void) | null>(null);

	const handleAddClick = useCallback(() => {
		if (addTaskTrigger.current) {
			addTaskTrigger.current();
		}
	}, []);

	return (
		<Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
			<Container maxWidth="xl">
				<PageHeader
					title="Task Management"
					subtitle="Organize and track your daily CRM activities and follow-ups"
					action={
						isAdmin ? (
							<Button
								variant="contained"
								color="primary"
								startIcon={<AddIcon />}
								onClick={handleAddClick}
							>
								Add Task
							</Button>
						) : undefined
					}
				/>
				
				<CRMTaskList onAddClick={(trigger) => { addTaskTrigger.current = trigger; }} />
			</Container>
		</Box>
	);
};

export default TaskManagement;
