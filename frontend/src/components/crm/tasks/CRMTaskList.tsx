import React, { useEffect, useState, useCallback } from 'react';
import { Box, Grid } from '@mui/material';
import {
	Assignment as TotalIcon,
	Pending as PendingIcon,
	CheckCircle as CompletedIcon,
	Warning as UrgentIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCRMTasks, createCRMTask, updateCRMTask, deleteCRMTask } from '../../../store/slices/crmTaskSlice';
import { DataTable, type ColumnDefinition } from '../../common/table';
import TaskTableRow from './table/TaskTableRow';
import CRMTaskFormDialog from './CRMTaskFormDialog';
import FilterDrawer, { type FilterField } from '../../common/drawer/FilterDrawer';
import { ConfirmationDialog } from '../../common/dialogbox';
import StatCard from '../../common/stats/StatCard';
import type { CRMTask, CRMTaskCreate, CRMTaskUpdate } from '../../../models/crmTask';
import useToast from '../../../hooks/useToast';

interface CRMTaskListProps {
	onAddClick?: (trigger: () => void) => void;
}

const COLUMNS: ColumnDefinition<CRMTask>[] = [
	{ id: 'title',        label: 'Task Title', sortable: true,  width: 250 },
	{ id: 'status',       label: 'Status',     sortable: true,  width: 130 },
	{ id: 'priority',     label: 'Priority',   sortable: true,  width: 120 },
	{ id: 'due_date',     label: 'Due Date',   sortable: true,  width: 140 },
	{ id: 'related_to_type', label: 'Related To', sortable: false, width: 180 },
	{ id: 'assigned_to',  label: 'Assigned',   sortable: false, width: 150 },
	{ id: 'actions',      label: 'Actions',    sortable: false, width: 100, align: 'right' },
];

const CRMTaskList: React.FC<CRMTaskListProps> = ({ onAddClick }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { list, total, loading } = useAppSelector((state) => state.crmTasks);
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin = user?.role === 'admin';

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState('due_date');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
	const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
	const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedTask, setSelectedTask] = useState<CRMTask | null>(null);
	const [formLoading, setFormLoading] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const handleRefresh = useCallback(() => {
		dispatch(fetchCRMTasks({
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			search: search || undefined,
			sortBy,
			sortOrder,
			...activeFilters
		}));
	}, [dispatch, page, rowsPerPage, search, sortBy, sortOrder, activeFilters]);

	useEffect(() => {
		handleRefresh();
	}, [handleRefresh]);

	useEffect(() => {
		if (onAddClick) {
			onAddClick(() => {
				setSelectedTask(null);
				setDialogOpen(true);
			});
		}
	}, [onAddClick]);

	const handleOpenEdit = (task: CRMTask) => {
		setSelectedTask(task);
		setDialogOpen(true);
	};

	const handleFormSubmit = async (data: CRMTaskCreate | CRMTaskUpdate) => {
		setFormLoading(true);
		try {
			if (selectedTask) {
				await dispatch(updateCRMTask({ publicId: selectedTask.public_id, task: data as CRMTaskUpdate })).unwrap();
				toast.success('Task updated successfully');
			} else {
				await dispatch(createCRMTask(data as CRMTaskCreate)).unwrap();
				toast.success('Task created successfully');
			}
			setDialogOpen(false);
			handleRefresh();
		} catch (error: any) {
			toast.error(error || 'Failed to save task');
		} finally {
			setFormLoading(false);
		}
	};

	const handleDeleteClick = (task: CRMTask) => {
		setSelectedTask(task);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!selectedTask) return;
		setDeleting(true);
		try {
			await dispatch(deleteCRMTask(selectedTask.public_id)).unwrap();
			toast.success('Task deleted successfully');
			setDeleteDialogOpen(false);
			handleRefresh();
		} catch (error: any) {
			toast.error(error || 'Failed to delete task');
		} finally {
			setDeleting(false);
		}
	};

	const filterFields: FilterField[] = [
		{
			key: 'status',
			label: 'Status',
			type: 'single-select',
			options: [
				{ value: 'pending', label: 'Pending' },
				{ value: 'in_progress', label: 'In Progress' },
				{ value: 'completed', label: 'Completed' },
				{ value: 'cancelled', label: 'Cancelled' }
			]
		},
		{
			key: 'priority',
			label: 'Priority',
			type: 'single-select',
			options: [
				{ value: 'low', label: 'Low' },
				{ value: 'medium', label: 'Medium' },
				{ value: 'high', label: 'High' },
				{ value: 'urgent', label: 'Urgent' }
			]
		}
	];

	// Calculate stats
	const pendingCount = list.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
	const completedCount = list.filter(t => t.status === 'completed').length;
	const urgentCount = list.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

	return (
		<Box>
			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Total Tasks" value={total} icon={<TotalIcon />} color="#007eb9" />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Pending" value={pendingCount} icon={<PendingIcon />} color="#ec7211" />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Completed" value={completedCount} icon={<CompletedIcon />} color="#1d8102" />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Urgent Action" value={urgentCount} icon={<UrgentIcon />} color="#d13212" />
				</Grid>
			</Grid>

			<DataTable<CRMTask>
				columns={COLUMNS}
				data={list}
				totalCount={total}
				loading={loading}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, p) => setPage(p)}
				onRowsPerPageChange={(r) => { setRowsPerPage(r); setPage(0); }}
				orderBy={sortBy as keyof CRMTask}
				order={sortOrder}
				onSortRequest={(p) => {
					const isAsc = sortBy === p && sortOrder === 'asc';
					setSortOrder(isAsc ? 'desc' : 'asc');
					setSortBy(p as string);
					setPage(0);
				}}
				searchTerm={search}
				onSearchChange={(v) => { setSearch(v); setPage(0); }}
				searchPlaceholder="Search tasks..."
				onFilterOpen={() => setFilterDrawerOpen(true)}
				activeFilterCount={Object.keys(activeFilters).length}
				onRefresh={handleRefresh}
				renderRow={(task) => (
					<TaskTableRow
						key={task.public_id}
						task={task}
						isAdmin={isAdmin}
						onEdit={handleOpenEdit}
						onDelete={handleDeleteClick}
						onClick={() => {}} // Could navigate to detail if exists
					/>
				)}
			/>

			<CRMTaskFormDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onSubmit={handleFormSubmit}
				task={selectedTask}
				loading={formLoading}
			/>

			<FilterDrawer
				open={filterDrawerOpen}
				onClose={() => setFilterDrawerOpen(false)}
				fields={filterFields}
				activeFilters={activeFilters}
				onFilterChange={(k, v) => setActiveFilters(prev => ({ ...prev, [k]: v }))}
				onClearFilters={() => { setActiveFilters({}); setFilterDrawerOpen(false); setPage(0); }}
				onApplyFilters={() => { setFilterDrawerOpen(false); setPage(0); }}
			/>

			<ConfirmationDialog
				open={deleteDialogOpen}
				title="Delete Task"
				message={`Are you sure you want to delete task "${selectedTask?.title}"?`}
				confirmLabel="Delete"
				onClose={() => setDeleteDialogOpen(false)}
				onConfirm={handleDeleteConfirm}
				loading={deleting}
				severity="error"
			/>
		</Box>
	);
};

export default CRMTaskList;
