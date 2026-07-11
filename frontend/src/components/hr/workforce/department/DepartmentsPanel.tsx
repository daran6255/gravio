import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Skeleton, alpha, useTheme } from '@mui/material';
import { Add as AddIcon, AccountTreeOutlined as DeptIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchDepartments, deleteDepartment } from '../../../../store/slices/hrSlice';
import type { HRDepartmentListItem } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';
import DepartmentCard from './DepartmentCard';
import DepartmentDialog from './DepartmentDialog';

export const DepartmentsPanel: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const { departments, departmentsLoading: loading } = useAppSelector((state) => state.hr);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<HRDepartmentListItem | null>(null);

	useEffect(() => {
		dispatch(fetchDepartments(true));
	}, [dispatch]);

	const handleDelete = async (dept: HRDepartmentListItem) => {
		if (!window.confirm(`Delete "${dept.name}"? This cannot be undone.`)) return;
		try {
			await dispatch(deleteDepartment(dept.id)).unwrap();
			success('Department deleted');
		} catch {
			error('Failed to delete department');
		}
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Typography variant="body2" color="text.secondary">
					{departments.length} department{departments.length !== 1 ? 's' : ''} configured
				</Typography>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					size="small"
					onClick={() => { setEditTarget(null); setDialogOpen(true); }}
					sx={{ fontWeight: 600 }}
				>
					New Department
				</Button>
			</Box>

			{loading ? (
				<Grid container spacing={2}>
					{Array.from({ length: 6 }).map((_, i) => (
						<Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
							<Skeleton variant="rounded" height={140} />
						</Grid>
					))}
				</Grid>
			) : departments.length === 0 ? (
				<Box
					sx={{
						textAlign: 'center', py: 10,
						borderRadius: 3,
						border: `2px dashed ${alpha(theme.palette.divider, 0.6)}`,
					}}
				>
					<DeptIcon sx={{ fontSize: '3rem', color: 'text.disabled', mb: 2 }} />
					<Typography variant="h6" fontWeight={600} gutterBottom>No departments yet</Typography>
					<Typography variant="body2" color="text.secondary" mb={3}>
						Create your first department to structure your organization.
					</Typography>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={() => { setEditTarget(null); setDialogOpen(true); }}
					>
						Create Department
					</Button>
				</Box>
			) : (
				<Grid container spacing={2}>
					{departments.map((dept) => (
						<Grid size={{ xs: 12, sm: 6, md: 4 }} key={dept.id}>
							<DepartmentCard
								dept={dept}
								onEdit={() => { setEditTarget(dept); setDialogOpen(true); }}
								onDelete={() => handleDelete(dept)}
							/>
						</Grid>
					))}
				</Grid>
			)}

			<DepartmentDialog
				open={dialogOpen}
				onClose={() => { setDialogOpen(false); setEditTarget(null); }}
				existing={editTarget}
				departments={departments}
			/>
		</Box>
	);
};

export default DepartmentsPanel;
