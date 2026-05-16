import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
	Box,
	Container,
	Tabs,
	Tab,
	CircularProgress,
	Alert,
	TextField
} from '@mui/material';
import { ConfirmationDialog } from '../../components/common/dialogbox';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchJobRoleById, updateJobRole, updateJobRoleStatus, clearCurrentJobRole } from '../../store/slices/jobRoleSlice';
import useToast from '../../hooks/useToast';
import type { JobRoleUpdate } from '../../models/jobRole';

// Modular Components
import JobRoleHeader from '../../components/placement/jobroles/details/JobRoleHeader';
import JobRoleDetailsTab from '../../components/placement/jobroles/details/JobRoleDetailsTab';
import CandidateMappingTab from '../../components/placement/jobroles/details/CandidateMappingTab';
import JobRoleFormDialog from '../../components/placement/jobroles/forms/JobRoleFormDialog';
import PipelineKanbanTab from '../../components/placement/jobroles/details/kanban/PipelineKanbanTab';

const JobRoleDetail: React.FC = () => {
	const { publicId } = useParams<{ publicId: string }>();
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { currentJobRole: jobRole, loading, error } = useAppSelector((state) => state.jobRoles);

	const [tabIndex, setTabIndex] = useState(0);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [closeDialogOpen, setCloseDialogOpen] = useState(false);
	const [reason, setReason] = useState('');
	const [formLoading, setFormLoading] = useState(false);
	const [closeLoading, setCloseLoading] = useState(false);

	useEffect(() => {
		if (publicId) {
			dispatch(fetchJobRoleById(publicId));
		}
		return () => {
			dispatch(clearCurrentJobRole());
		};
	}, [publicId, dispatch]);

	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setTabIndex(newValue);
	};

	const handleEditSubmit = async (data: any) => {
		if (!publicId) return;
		setFormLoading(true);
		try {
			await dispatch(updateJobRole({ publicId, jobRole: data as JobRoleUpdate })).unwrap();
			toast.success('Job Role updated successfully');
			setEditDialogOpen(false);
			dispatch(fetchJobRoleById(publicId));
		} catch (error: any) {
			toast.error(error || 'Failed to update job role');
		} finally {
			setFormLoading(false);
		}
	};
	
	const handleStatusChange = async (newStatus: 'active' | 'closed') => {
		if (!publicId) return;
		if (newStatus === 'closed') {
			setCloseDialogOpen(true);
			return;
		}
		try {
			await dispatch(updateJobRoleStatus({ publicId, status: newStatus as any })).unwrap();
			toast.success(`Job Role re-opened successfully`);
			dispatch(fetchJobRoleById(publicId));
		} catch (error: any) {
			toast.error(error || 'Failed to update status');
		}
	};

	const handleCloseConfirm = async () => {
		if (!publicId) return;
		setCloseLoading(true);
		try {
			await dispatch(updateJobRoleStatus({ 
				publicId, 
				status: 'closed' as any,
				reason 
			})).unwrap();
			toast.success(`Job Role closed successfully`);
			setCloseDialogOpen(false);
			setReason('');
			dispatch(fetchJobRoleById(publicId));
		} catch (error: any) {
			toast.error(error || 'Failed to close job role');
		} finally {
			setCloseLoading(false);
		}
	};

	const handleCloseCancel = () => {
		setCloseDialogOpen(false);
		setReason('');
	};

	const handleRefresh = () => {
		if (publicId) {
			dispatch(fetchJobRoleById(publicId));
		}
	};

	if (loading && !jobRole) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
				<CircularProgress size={40} thickness={4} sx={{ color: '#ec7211' }} />
			</Box>
		);
	}

	if (error) {
		return (
			<Box sx={{ p: 4 }}>
				<Alert severity="error" variant="outlined" sx={{ borderRadius: 0, borderLeft: '4px solid #d91d11' }}>
					{error}
				</Alert>
			</Box>
		);
	}

	if (!jobRole) return null;

	return (
		<Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2, md: 3 } }}>
				
				<JobRoleHeader 
					jobRole={jobRole} 
					onEdit={() => setEditDialogOpen(true)} 
					onRefresh={handleRefresh} 
					onStatusChange={handleStatusChange}
				/>

				{/* Tabs Section */}
				<Box sx={{ borderBottom: 1, borderColor: '#d5dbdb', bgcolor: 'white' }}>
					<Tabs
						value={tabIndex}
						onChange={handleTabChange}
						sx={{
							px: 3,
							'& .MuiTab-root': {
								textTransform: 'none',
								fontWeight: 500,
								minWidth: 120,
								color: '#545b64',
								'&.Mui-selected': { color: '#ec7211' }
							},
							'& .MuiTabs-indicator': { bgcolor: '#ec7211', height: 2 }
						}}
					>
						<Tab label="Details" id="tab-0" />
						<Tab label="Candidate Mapping" id="tab-1" />
						<Tab label="Pipeline" id="tab-2" />
					</Tabs>
				</Box>

				{/* Tab Content Section */}
				<Box>
					{tabIndex === 0 && <JobRoleDetailsTab jobRole={jobRole} />}
					{tabIndex === 1 && <CandidateMappingTab jobRole={jobRole} />}
					{tabIndex === 2 && <PipelineKanbanTab jobRolePublicId={jobRole.public_id} />}
				</Box>

			</Container>

			<JobRoleFormDialog
				open={editDialogOpen}
				onClose={() => setEditDialogOpen(false)}
				onSubmit={handleEditSubmit}
				jobRole={jobRole}
				loading={formLoading}
			/>

			<ConfirmationDialog
				open={closeDialogOpen}
				title="Close Job Role"
				message={`Are you sure you want to close this job role? This will mark the position as filled or cancelled.`}
				onClose={handleCloseCancel}
				onConfirm={handleCloseConfirm}
				confirmLabel="Close Role"
				loading={closeLoading}
				severity="warning"
			>
				<TextField
					fullWidth
					label="Reason for closing"
					multiline
					rows={3}
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					sx={{ mt: 2 }}
					placeholder="Explain why this job role is being closed..."
				/>
			</ConfirmationDialog>
		</Box>
	);
};

export default JobRoleDetail;
