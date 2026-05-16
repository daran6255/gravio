import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAllocations } from '../../store/slices/trainingSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	Box,
	Container,
	Typography,
	Tabs,
	Tab,
	Button,
	Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MockInterviewList from '../../components/training/mock-interview/MockInterviewList';

const TrainingBatchDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { allocations } = useAppSelector((state) => state.training);
	const [tabIndex, setTabIndex] = useState(0);

	useEffect(() => {
		if (id) {
			dispatch(fetchAllocations({ batchPublicId: id }));
		}
	}, [id, dispatch]);

	const parsedId = parseInt(id || '0');

	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setTabIndex(newValue);
	};

	return (
		<Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 3 }}>
			<Container maxWidth="xl">
				<Button
					startIcon={<ArrowBackIcon />}
					onClick={() => navigate('/training/batches')}
					sx={{ mb: 2 }}
				>
					Back to Batches
				</Button>

				<Paper sx={{ mb: 3, p: 3 }}>
					<Typography variant="h4" gutterBottom>
						Training Batch Details
					</Typography>
					<Typography color="textSecondary">
						Batch ID: {id}
					</Typography>
				</Paper>

				<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
					<Tabs value={tabIndex} onChange={handleTabChange}>
						<Tab label="Overview" />
						<Tab label="Mock Interviews" />
						<Tab label="Assignments" />
						<Tab label="Attendance" />
					</Tabs>
				</Box>

				{tabIndex === 0 && (
					<Box>
						<Typography>Overview Content (Placeholder)</Typography>
					</Box>
				)}

				{tabIndex === 1 && (
					<MockInterviewList
						batchId={parsedId || 1}
						allocations={allocations}
					/>
				)}

				{tabIndex === 2 && (
					<Box>
						<Typography>Assignments Content (Placeholder)</Typography>
					</Box>
				)}

				{tabIndex === 3 && (
					<Box>
						<Typography>Attendance Content (Placeholder)</Typography>
					</Box>
				)}

			</Container>
		</Box>
	);
};

export default TrainingBatchDetail;
