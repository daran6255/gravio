import React, { useState } from 'react';
import { Box, Button, useTheme } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createJobRole, updateJobRole } from '../../../store/slices/jobRoleSlice';
import PageHeader from '../../common/page-header';
import type { JobRole, JobRoleCreate, JobRoleUpdate } from '../../../models/jobRole';

// Modular Components
import JobRoleStats from './stats/JobRoleStats';
import JobRoleTable from './table/JobRoleTable';
import JobRoleFormDialog from './forms/JobRoleFormDialog';

interface JobRoleListProps {
	title?: string;
	subtitle?: string;
}

const JobRoleList: React.FC<JobRoleListProps> = ({ title = "Job Role Management", subtitle }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { enqueueSnackbar } = useSnackbar();
	const { list, total } = useAppSelector((state: any) => state.jobRoles);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedJobRole, setSelectedJobRole] = useState<JobRole | null>(null);

	const handleFormSubmit = async (data: JobRoleCreate | JobRoleUpdate) => {
		try {
			if (selectedJobRole) {
				await dispatch(updateJobRole({ publicId: selectedJobRole.public_id, jobRole: data as JobRoleUpdate })).unwrap();
				enqueueSnackbar('Job Role updated successfully', { variant: 'success' });
			} else {
				await dispatch(createJobRole(data as JobRoleCreate)).unwrap();
				enqueueSnackbar('Job Role created successfully', { variant: 'success' });
			}
			setDialogOpen(false);
			// The list is already updated in the Redux store via the fulfilled actions.
			// No need to fetch again with default params which would reset filters.
		} catch (error: any) {
			enqueueSnackbar(error || 'Failed to save job role', { variant: 'error' });
		}
	};

	const handleEdit = (jobRole: JobRole) => {
		setSelectedJobRole(jobRole);
		setDialogOpen(true);
	};

	const handleAdd = () => {
		setSelectedJobRole(null);
		setDialogOpen(true);
	};

	return (
		<>
			<PageHeader
				title={title}
				subtitle={subtitle}
				action={
					<Button
						variant="contained"
						color="primary"
						startIcon={<AddIcon />}
						onClick={handleAdd}
						sx={{
							px: 3,
							fontWeight: 700,
							borderRadius: `${theme.shape.borderRadius}px`,
							boxShadow: '0 2px 4px 0 rgba(0,77,230,0.2)', // Thematic shadow based on primary color
							'&:hover': {
								bgcolor: theme.palette.primary.dark,
								boxShadow: '0 4px 8px 0 rgba(0,77,230,0.3)',
							}
						}}
					>
						Add Job Role
					</Button>
				}
			/>

			<Box sx={{ mt: { xs: 2, md: 3 } }}>
				<JobRoleStats list={list} total={total} />
				<Box sx={{ mt: { xs: 2, md: 3 } }}>
					<JobRoleTable onEditJobRole={handleEdit} />
				</Box>
			</Box>

			<JobRoleFormDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onSubmit={handleFormSubmit}
				jobRole={selectedJobRole}
			/>
		</>
	);
};

export default JobRoleList;
