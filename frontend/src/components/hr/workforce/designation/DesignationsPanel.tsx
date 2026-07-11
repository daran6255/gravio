import React, { useState, useEffect } from 'react';
import {
	Box, Typography, Button, Grid, Skeleton,
	FormControl, InputLabel, Select, MenuItem, alpha, useTheme
} from '@mui/material';
import { Add as AddIcon, WorkOutlined as DesignationIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchDesignations, deleteDesignation, fetchDepartments } from '../../../../store/slices/hrSlice';
import type { HRDesignationListItem } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';
import DesignationCard from './DesignationCard';
import DesignationDialog from './DesignationDialog';

export const DesignationsPanel: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { error, success } = useToast();
	const { designations, designationsLoading: loading, departments } = useAppSelector((state) => state.hr);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<HRDesignationListItem | null>(null);
	const [deptFilter, setDeptFilter] = useState<number | ''>('');

	useEffect(() => {
		dispatch(fetchDepartments(undefined));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchDesignations(deptFilter as number | undefined)).unwrap().catch(() => error('Failed to load designations'));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch, deptFilter]);

	const handleDelete = async (d: HRDesignationListItem) => {
		if (!window.confirm(`Delete "${d.name}"?`)) return;
		try {
			await dispatch(deleteDesignation(d.id)).unwrap();
			success('Designation deleted');
		} catch {
			error('Failed to delete designation');
		}
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
				<Typography variant="body2" color="text.secondary">
					{designations.length} designation{designations.length !== 1 ? 's' : ''} defined
				</Typography>
				<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
					<FormControl size="small" sx={{ minWidth: 180 }}>
						<InputLabel>Filter by Department</InputLabel>
						<Select
							value={deptFilter}
							label="Filter by Department"
							onChange={(e) => setDeptFilter(e.target.value as number | '')}
						>
							<MenuItem value="">All Departments</MenuItem>
							{departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
						</Select>
					</FormControl>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						size="small"
						onClick={() => { setEditTarget(null); setDialogOpen(true); }}
						sx={{ fontWeight: 600 }}
					>
						New Designation
					</Button>
				</Box>
			</Box>

			{loading ? (
				<Grid container spacing={2}>
					{Array.from({ length: 8 }).map((_, i) => (
						<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
							<Skeleton variant="rounded" height={100} />
						</Grid>
					))}
				</Grid>
			) : designations.length === 0 ? (
				<Box
					sx={{
						textAlign: 'center', py: 10,
						borderRadius: 3,
						border: `2px dashed ${alpha(theme.palette.divider, 0.6)}`,
					}}
				>
					<DesignationIcon sx={{ fontSize: '3rem', color: 'text.disabled', mb: 2 }} />
					<Typography variant="h6" fontWeight={600} gutterBottom>No designations yet</Typography>
					<Typography variant="body2" color="text.secondary" mb={3}>
						{deptFilter ? 'No designations in this department.' : 'Define job designations to assign to employees.'}
					</Typography>
					{!deptFilter && (
						<Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditTarget(null); setDialogOpen(true); }}>
							Create Designation
						</Button>
					)}
				</Box>
			) : (
				<Grid container spacing={2}>
					{designations.map((d) => (
						<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={d.id}>
							<DesignationCard
								designation={d}
								onEdit={() => { setEditTarget(d); setDialogOpen(true); }}
								onDelete={() => handleDelete(d)}
							/>
						</Grid>
					))}
				</Grid>
			)}

			<DesignationDialog
				open={dialogOpen}
				onClose={() => { setDialogOpen(false); setEditTarget(null); }}
				existing={editTarget}
				departments={departments}
			/>
		</Box>
	);
};

export default DesignationsPanel;
