import React from 'react';
import { TableRow, TableCell, Typography, Stack, Avatar, TextField, MenuItem, alpha, LinearProgress, Box, Checkbox } from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';
import dayjs from 'dayjs';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../../common/table';
import StatusBadge from '../../../common/badge/StatusBadge';
import type { Project, ProjectStatus } from '../../../../models/projects/project';
import { PROJECT_STATUS_OPTIONS } from '../../../../models/projects/project';
import type { CRMOwnerOption } from '../../../../models/crm/owner';

interface ProjectsTableProps {
	projects: Project[];
	owners: CRMOwnerOption[];
	loading: boolean;
	totalCount: number;
	page: number;
	rowsPerPage: number;
	onPageChange: (event: unknown, newPage: number) => void;
	onRowsPerPageChange: (newRowsPerPage: number) => void;
	searchTerm: string;
	onSearchChange: (value: string) => void;
	statusFilter: ProjectStatus | '';
	onStatusFilterChange: (value: ProjectStatus | '') => void;
	onRefresh: () => void;
	onCreateClick: () => void;
	onDelete: (project: Project) => void;
	selectable?: boolean;
	selectedIds?: Set<string>;
	onToggleSelect?: (publicId: string) => void;
	onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const formatBudget = (project: Project): string => {
	if (project.budget == null) return '—';
	return new Intl.NumberFormat(undefined, { style: 'currency', currency: project.currency }).format(project.budget);
};

const CLOSED_STATUSES: ProjectStatus[] = ['completed', 'approved', 'invoiced', 'canceled'];

const getTrackInfo = (project: Project): { label: string; color: string } => {
	if (project.status === 'canceled') return { label: 'Canceled', color: 'text.disabled' };
	if (CLOSED_STATUSES.includes(project.status)) return { label: 'Completed', color: 'success.main' };
	if (project.status === 'delayed') return { label: 'Delayed', color: 'error.main' };
	if (project.end_date && dayjs(project.end_date).isBefore(dayjs(), 'day')) {
		return { label: 'Delayed', color: 'error.main' };
	}
	return { label: 'On Track', color: 'success.main' };
};

export const ProjectsTable: React.FC<ProjectsTableProps> = ({
	projects,
	owners,
	loading,
	totalCount,
	page,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
	searchTerm,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	onRefresh,
	onCreateClick,
	onDelete,
	selectable,
	selectedIds,
	onToggleSelect,
	onSelectAll,
}) => {
	const columns: ColumnDefinition<Project>[] = [
		{ id: 'name', label: 'Project' },
		{ id: 'status', label: 'Status' },
		{ id: 'owner_id', label: 'Owner', hideOnMobile: true },
		{ id: 'task_count', label: 'Tasks', hideOnMobile: true },
		{ id: 'on_track' as any, label: 'On Track', hideOnMobile: true },
		{ id: 'budget', label: 'Budget', hideOnMobile: true },
		{ id: 'actions', label: '', align: 'right', width: 60 },
	];

	const renderRow = (project: Project) => {
		const owner = project.owner_id ? owners.find((o) => o.id === project.owner_id) : undefined;
		const ownerName = owner ? (owner.full_name || owner.email) : null;

		const actions: TableMenuAction<Project>[] = [
			{
				label: 'Delete',
				icon: <DeleteOutline fontSize="small" />,
				onClick: () => onDelete(project),
				color: 'error.main',
			},
		];

		return (
			<TableRow key={project.public_id} hover>
				{selectable && (
					<TableCell padding="checkbox">
						<Checkbox
							size="small"
							checked={selectedIds?.has(project.public_id) ?? false}
							onChange={() => onToggleSelect?.(project.public_id)}
						/>
					</TableCell>
				)}
				<TableCell>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>{project.name}</Typography>
				</TableCell>
				<TableCell><StatusBadge label={project.status.replace('_', ' ')} status={project.status} type="project" /></TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
					{ownerName ? (
						<Stack direction="row" spacing={1} alignItems="center">
							<Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', fontWeight: 700 }}>
								{ownerName[0]?.toUpperCase()}
							</Avatar>
							<Typography variant="body2" noWrap>{ownerName}</Typography>
						</Stack>
					) : (
						<Typography variant="body2" color="text.secondary">Unassigned</Typography>
					)}
				</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, minWidth: 120 }}>
					<Stack spacing={0.5} sx={{ minWidth: 100 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Typography variant="caption" sx={{ fontWeight: 700 }}>
								{project.completed_task_count ?? 0} / {project.task_count ?? 0}
							</Typography>
							<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
								{project.task_count ? Math.round(((project.completed_task_count ?? 0) / project.task_count) * 100) : 0}%
							</Typography>
						</Stack>
						<LinearProgress
							variant="determinate"
							value={project.task_count ? ((project.completed_task_count ?? 0) / project.task_count) * 100 : 0}
							sx={{
								height: 6,
								borderRadius: 3,
								bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
								'& .MuiLinearProgress-bar': {
									borderRadius: 3,
									background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
								}
							}}
						/>
					</Stack>
				</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
					{(() => {
						const track = getTrackInfo(project);
						return (
							<Stack direction="row" spacing={0.75} alignItems="center">
								<Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: track.color, flexShrink: 0 }} />
								<Typography variant="body2" sx={{ color: track.color, fontWeight: 600 }}>{track.label}</Typography>
							</Stack>
						);
					})()}
				</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatBudget(project)}</TableCell>
				<TableCell align="right" onClick={(e) => e.stopPropagation()}>
					<Stack direction="row" justifyContent="flex-end">
						<DataTableActions item={project} actions={actions} tooltipTitle="Project Actions" />
					</Stack>
				</TableCell>
			</TableRow>
		);
	};

	return (
		<DataTable<Project>
			columns={columns}
			data={projects}
			loading={loading}
			totalCount={totalCount}
			page={page}
			rowsPerPage={rowsPerPage}
			onPageChange={onPageChange}
			onRowsPerPageChange={onRowsPerPageChange}
			searchTerm={searchTerm}
			onSearchChange={onSearchChange}
			searchPlaceholder="Search projects..."
			headerActions={
				<TextField
					select
					size="small"
					value={statusFilter}
					onChange={(e) => onStatusFilterChange(e.target.value as ProjectStatus | '')}
					SelectProps={{
						displayEmpty: true
					}}
					sx={{
						minWidth: 160,
						'& .MuiOutlinedInput-root': {
							borderRadius: '12px',
							bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
							transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
							'& fieldset': { borderColor: 'transparent' },
							'&:hover fieldset': { borderColor: (theme) => alpha(theme.palette.primary.main, 0.3) },
							'&.Mui-focused': {
								boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`
							},
							'&.Mui-focused fieldset': { borderColor: (theme) => theme.palette.primary.main },
						}
					}}
				>
					<MenuItem value="">All Status</MenuItem>
					{PROJECT_STATUS_OPTIONS.map((s) => (
						<MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
					))}
				</TextField>
			}
			onRefresh={onRefresh}
			onCreateClick={onCreateClick}
			createButtonText="New Project"
			canCreate
			renderRow={renderRow}
			emptyMessage="No projects yet. Convert a Won deal or create one directly to get started."
			numSelected={selectable ? selectedIds?.size : undefined}
			onSelectAllClick={selectable ? onSelectAll : undefined}
		/>
	);
};

export default ProjectsTable;
