import React from 'react';
import { TableRow, TableCell, Typography, Stack, Avatar, TextField, MenuItem, alpha, LinearProgress } from '@mui/material';
import { Visibility, Edit, DeleteOutline } from '@mui/icons-material';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../common/table';
import StatusBadge from '../../common/badge/StatusBadge';
import type { Project, ProjectStatus } from '../../../models/projects/project';
import type { CRMOwnerOption } from '../../../models/crm/owner';
import dayjs from 'dayjs';

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
	{ value: 'planning', label: 'Planning' },
	{ value: 'active', label: 'Active' },
	{ value: 'on_hold', label: 'On Hold' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'archived', label: 'Archived' },
];

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
	onRowClick: (project: Project) => void;
	onEdit: (project: Project) => void;
	onDelete: (project: Project) => void;
}

const formatBudget = (project: Project): string => {
	if (project.budget == null) return '—';
	return new Intl.NumberFormat(undefined, { style: 'currency', currency: project.currency }).format(project.budget);
};

const formatDate = (dateStr?: string): string => {
	if (!dateStr) return '—';
	return dayjs(dateStr).format('DD-MMM-YYYY');
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
	onRowClick,
	onEdit,
	onDelete,
}) => {
	const columns: ColumnDefinition<Project>[] = [
		{ id: 'name', label: 'Project' },
		{ id: 'status', label: 'Status' },
		{ id: 'owner', label: 'Owner', hideOnMobile: true },
		{ id: 'task_count', label: 'Tasks', hideOnMobile: true },
		{ id: 'phase', label: 'Phase', hideOnMobile: true },
		{ id: 'issues', label: 'Issues', hideOnMobile: true },
		{ id: 'start_date', label: 'Start Date', hideOnMobile: true },
		{ id: 'end_date', label: 'End Date', hideOnMobile: true },
		{ id: 'budget', label: 'Budget', hideOnMobile: true },
		{ id: 'actions', label: '', align: 'right', width: 60 },
	];

	const renderRow = (project: Project) => {
		const owner = project.owner_id ? owners.find((o) => o.id === project.owner_id) : undefined;
		const ownerName = owner ? (owner.full_name || owner.email) : null;

		const actions: TableMenuAction<Project>[] = [
			{ label: 'View Details', icon: <Visibility fontSize="small" />, onClick: () => onRowClick(project) },
			{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: () => onEdit(project) },
			{
				label: 'Delete',
				icon: <DeleteOutline fontSize="small" />,
				onClick: () => onDelete(project),
				color: 'error.main',
				divider: true,
			},
		];

		return (
			<TableRow key={project.public_id} hover onClick={() => onRowClick(project)} sx={{ cursor: 'pointer' }}>
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
					<Typography variant="body2" color={project.phase ? "text.primary" : "text.secondary"}>
						{project.phase || '—'}
					</Typography>
				</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 200 }}>
					<Typography variant="body2" noWrap color={project.issues ? "error.main" : "text.secondary"} sx={{ fontWeight: project.issues ? 500 : 400 }}>
						{project.issues || '—'}
					</Typography>
				</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
					<Typography variant="body2">{formatDate(project.start_date)}</Typography>
				</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
					<Typography variant="body2">{formatDate(project.end_date)}</Typography>
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
					{PROJECT_STATUSES.map((s) => (
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
		/>
	);
};

export default ProjectsTable;
