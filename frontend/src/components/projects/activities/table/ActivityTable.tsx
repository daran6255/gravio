import React, { useState, useMemo } from 'react';
import {
	TableRow,
	TableCell,
	Box,
	Typography,
	Stack,
	Chip,
	Checkbox,
	Button,
	Menu,
	MenuItem,
	useTheme,
	alpha
} from '@mui/material';
import { 
	AssignmentOutlined as ActivityIcon,
	Delete as DeleteIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

import type { DSRActivity } from '../../../../models/dsr';
import { DSRActivityStatusValues } from '../../../../models/dsr';
import { useActivityTable } from '../hooks/useActivityTable';

// Common Components
import { DataTable, DataTableActions } from '../../../common/table';
import type { ColumnDefinition } from '../../../common/table';
import { ConfirmationDialog } from '../../../common/dialogbox';

interface ActivityTableProps {
	projectId: string;
	onEdit: (activity: DSRActivity) => void;
	onDelete: (activity: DSRActivity) => void;
	refreshKey: number;
	canEdit?: boolean;
}

/**
 * ActivityTable - Refactored to use common DataTable
 * Standardizes the table view across the CRM while maintaining specialized activity logic.
 */
const ActivityTable: React.FC<ActivityTableProps> = ({
	projectId,
	onEdit,
	onDelete,
	refreshKey,
	canEdit = false
}) => {
	const theme = useTheme();
	const [confirmOpen, setConfirmOpen] = useState(false);
	
	const {
		activities,
		loading,
		totalCount,
		searchTerm,
		page,
		rowsPerPage,
		statusFilter,
		filterAnchorEl,
		filterOpen,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearch,
		handleFilterClick,
		handleFilterClose,
		handleStatusSelect,
		handleRefresh,
		handleSelectAll,
		handleToggleSelect,
		handleBulkDelete,
		selectedIds
	} = useActivityTable(projectId, refreshKey);

	// --- Column Definitions ---
	const columns = useMemo((): ColumnDefinition<DSRActivity>[] => [
		{ id: 'name', label: 'Activity Name', width: '25%' },
		{ id: 'assigned_users' as any, label: 'Assignees', width: '20%' },
		{ id: 'start_date' as any, label: 'Start Timeline', width: '15%' },
		{ id: 'end_date' as any, label: 'End Timeline', width: '15%' },
		{ id: 'status', label: 'Status', width: '10%' },
		{ id: 'others' as any, label: 'Effort/Health', width: '15%' },
		...(canEdit ? [{ id: 'actions' as any, label: '', align: 'right' as const }] : [])
	], [canEdit]);

	// --- Row Rendering Helpers ---
	const getStatusColorCode = (status: string) => {
		switch (status) {
			case DSRActivityStatusValues.COMPLETED: return '#037f0c';
			case DSRActivityStatusValues.IN_PROGRESS: return '#0073bb';
			case DSRActivityStatusValues.ON_HOLD: return '#ec7211';
			case DSRActivityStatusValues.CANCELLED: return '#d13212';
			default: return '#545b64';
		}
	};

	const getTimelineInfo = (activity: DSRActivity) => {
		if (!activity.end_date) {
			return { label: 'No timeline set', color: '#545b64', bgcolor: 'transparent' };
		}
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const end = new Date(activity.end_date);
		end.setHours(0, 0, 0, 0);
		const actual = activity.actual_end_date ? new Date(activity.actual_end_date) : null;
		if (actual) actual.setHours(0, 0, 0, 0);

		const isCompleted = activity.status === DSRActivityStatusValues.COMPLETED;

		if (isCompleted && actual) {
			const diff = Math.floor((actual.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
			if (diff > 0) return { label: `Delayed by ${diff}d`, color: '#d13212', bgcolor: 'rgba(209, 50, 18, 0.08)' };
			if (diff < 0) return { label: `Early by ${Math.abs(diff)}d`, color: '#037f0c', bgcolor: 'rgba(3, 127, 12, 0.08)' };
			return { label: 'Finished on time', color: '#037f0c', bgcolor: 'rgba(3, 127, 12, 0.08)' };
		}

		if (!isCompleted) {
			const diff = Math.floor((today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
			if (diff > 0) return { label: `Overdue by ${diff}d`, color: '#d13212', bgcolor: 'rgba(209, 50, 18, 0.08)', fontWeight: 700 };
			if (diff === 0) return { label: 'Due today', color: '#ec7211', bgcolor: 'rgba(236, 114, 17, 0.08)', fontWeight: 700 };
			if (Math.abs(diff) <= 3) return { label: `Due in ${Math.abs(diff)}d`, color: '#ec7211', bgcolor: 'rgba(236, 114, 17, 0.08)' };
		}

		return { label: 'On track', color: '#545b64', bgcolor: 'transparent' };
	};

	const renderRow = (activity: DSRActivity) => {
		const timeline = getTimelineInfo(activity);
		const isSelected = selectedIds.has(activity.public_id);

		// Action definitions for this specific row
		const rowActions = [
			{ label: 'Edit Activity', onClick: (item: DSRActivity) => onEdit(item) },
			{ label: 'Delete Activity', onClick: (item: DSRActivity) => onDelete(item), color: 'error.main' as const },
		];

		return (
			<TableRow 
				key={activity.public_id} 
				hover 
				selected={isSelected}
				sx={{ 
					'&:last-child td, &:last-child th': { border: 0 },
					'&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
					'&.Mui-selected:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
				}}
			>
				<TableCell padding="checkbox">
					<Checkbox
						checked={isSelected}
						onChange={() => handleToggleSelect(activity.public_id)}
						size="small"
					/>
				</TableCell>

				{/* Identity Column */}
				<TableCell sx={{ py: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
						<ActivityIcon sx={{ color: theme.palette.primary.main, fontSize: 18, opacity: 0.8 }} />
						<Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
							{activity.name}
						</Typography>
					</Box>
					{activity.description && (
						<Typography variant="caption" sx={{ 
							color: 'text.secondary',
							display: '-webkit-box',
							WebkitLineClamp: 1,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
							maxWidth: 250
						}}>
							{activity.description}
						</Typography>
					)}
				</TableCell>

				{/* Assignees */}
				<TableCell sx={{ py: 2 }}>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
						{activity.assigned_users && activity.assigned_users.length > 0 ? (
							activity.assigned_users.map((u) => (
								<Chip
									key={u.id}
									label={u.full_name || u.username}
									size="small"
									sx={{ 
										height: 20, 
										fontSize: '0.7rem',
										bgcolor: alpha(theme.palette.primary.main, 0.08),
										color: theme.palette.primary.main,
										fontWeight: 600
									}}
								/>
							))
						) : (
							<Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
								Unassigned
							</Typography>
						)}
					</Box>
				</TableCell>

				{/* Start Date */}
				<TableCell sx={{ py: 2 }}>
					<Stack spacing={0.25}>
						<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>ESTIMATE</Typography>
						<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
							{activity.start_date ? dayjs(activity.start_date).format('DD MMM YYYY') : '-'}
						</Typography>
						{activity.actual_start_date && (
							<Typography variant="body2" sx={{ fontSize: '0.8rem', color: theme.palette.primary.main, fontWeight: 700 }}>
								Act: {dayjs(activity.actual_start_date).format('DD MMM YYYY')}
							</Typography>
						)}
					</Stack>
				</TableCell>

				{/* End Date */}
				<TableCell sx={{ py: 2 }}>
					<Stack spacing={0.25}>
						<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>DEADLINE</Typography>
						<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
							{activity.end_date ? dayjs(activity.end_date).format('DD MMM YYYY') : '-'}
						</Typography>
						{activity.actual_end_date && (
							<Typography variant="body2" sx={{ fontSize: '0.8rem', color: theme.palette.success.main, fontWeight: 700 }}>
								Act: {dayjs(activity.actual_end_date).format('DD MMM YYYY')}
							</Typography>
						)}
					</Stack>
				</TableCell>

				{/* Status Icon */}
				<TableCell sx={{ py: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Box sx={{
							width: 8,
							height: 8,
							borderRadius: '50%',
							bgcolor: getStatusColorCode(activity.status),
							flexShrink: 0
						}} />
						<Typography sx={{ 
							fontSize: '0.75rem', 
							fontWeight: 600,
							textTransform: 'capitalize'
						}}>
							{activity.status.replace('_', ' ')}
						</Typography>
					</Box>
				</TableCell>

				{/* Effort & Timeline Health */}
				<TableCell sx={{ py: 2 }}>
					<Stack spacing={1}>
						<Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
							{activity.total_actual_hours || 0}h / {activity.estimated_hours || 0}h
						</Typography>
						<Box sx={{
							px: 1,
							py: 0.35,
							borderRadius: '12px',
							display: 'inline-flex',
							bgcolor: timeline.bgcolor === 'transparent' ? alpha(theme.palette.divider, 0.4) : timeline.bgcolor,
							color: timeline.color,
							fontSize: '0.65rem',
							fontWeight: 800,
							width: 'fit-content',
							border: timeline.bgcolor !== 'transparent' ? `1px solid ${timeline.color}30` : 'none'
						}}>
							{timeline.label.toUpperCase()}
						</Box>
					</Stack>
				</TableCell>

				{/* Actions */}
				{canEdit && (
					<TableCell align="right" sx={{ py: 2 }}>
						<DataTableActions 
							item={activity} 
							actions={rowActions} 
						/>
					</TableCell>
				)}
			</TableRow>
		);
	};

	// --- Header Actions (Filters & Bulk Actions) ---
	const headerActions = (
		<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
			{selectedIds.size > 0 && (
				<Button
					variant="contained"
					color="error"
					size="small"
					startIcon={<DeleteIcon />}
					onClick={() => setConfirmOpen(true)}
					sx={{ 
						boxShadow: 'none', 
						textTransform: 'none',
						fontWeight: 600,
						'&:hover': { boxShadow: 'none' }
					}}
				>
					Delete ({selectedIds.size})
				</Button>
			)}
			<Button
				variant="outlined"
				startIcon={<FilterIcon sx={{ fontSize: 18, opacity: filterOpen ? 1 : 0.7 }} />}
				onClick={handleFilterClick}
				sx={{ 
					textTransform: 'none', 
					fontWeight: 600, 
					color: filterOpen ? theme.palette.primary.main : theme.palette.text.primary,
					borderColor: filterOpen ? theme.palette.primary.main : theme.palette.divider,
					'&:hover': { borderColor: theme.palette.primary.main }
				}}
			>
				{statusFilter === 'all' ? 'Status: All' : `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
			</Button>
			<Menu
				anchorEl={filterAnchorEl}
				open={filterOpen}
				onClose={handleFilterClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			>
				<MenuItem onClick={() => handleStatusSelect('all')} selected={statusFilter === 'all'}>All Statuses</MenuItem>
				{Object.values(DSRActivityStatusValues).map(status => (
					<MenuItem key={status} onClick={() => handleStatusSelect(status)} selected={statusFilter === status}>
						{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
					</MenuItem>
				))}
			</Menu>
		</Box>
	);

	return (
		<Box>
			<DataTable<DSRActivity>
				columns={columns}
				data={activities}
				loading={loading}
				totalCount={totalCount}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={handlePageChange}
				onRowsPerPageChange={(val) => handleRowsPerPageChange({ target: { value: val.toString() } } as any)}
				searchTerm={searchTerm}
				onSearchChange={(val) => handleSearch({ target: { value: val } } as any)}
				searchPlaceholder="Search by activity name..."
				onRefresh={handleRefresh}
				headerActions={headerActions}
				renderRow={renderRow}
				numSelected={selectedIds.size}
				onSelectAllClick={(e) => handleSelectAll(e.target.checked)}
				emptyMessage={statusFilter === 'all' ? 'No activities found for this project.' : `No ${statusFilter.replace('_', ' ')} activities found.`}
			/>

			<ConfirmationDialog
				open={confirmOpen}
				title="Delete Activities"
				message={`Are you sure you want to delete ${selectedIds.size} selected activit${selectedIds.size === 1 ? 'y' : 'ies'}? This will permanently remove them if they are not referenced in any DSR entries.`}
				loading={loading}
				onClose={() => setConfirmOpen(false)}
				onConfirm={async () => {
					await handleBulkDelete();
					setConfirmOpen(false);
				}}
				confirmLabel="Delete"
				severity="error"
			/>
		</Box>
	);
};

// Internal Filter Icon for Header
const FilterIcon = (props: any) => (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
		<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
	</svg>
);

export default ActivityTable;
