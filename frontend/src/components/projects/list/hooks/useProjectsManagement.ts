import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchProjects, fetchProjectStats, createProject, deleteProject, bulkUpdateProjects } from '../../../../store/slices/projectsSlice';
import { fetchOwners } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import type { Project, ProjectStatus, ProjectCreate } from '../../../../models/projects/project';

export const useProjectsManagement = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const toast = useToast();
	const {
		projects, projectsTotal, projectsLoading, projectMutating, projectStats, projectStatsLoading,
		projectsBulkUpdateLoading,
	} = useAppSelector((state) => state.projects);
	const { owners } = useAppSelector((state) => state.crm);
	const { user } = useAppSelector((state) => state.auth);
	const [searchParams] = useSearchParams();
	const canBulkActions = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'project_coordinator';

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(20);
	const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
	const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
	const [refreshKey, setRefreshKey] = useState(0);

	const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

	const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		dispatch(fetchProjects({
			page: page + 1,
			pageSize: rowsPerPage,
			search: searchTerm || undefined,
			status: statusFilter || undefined,
		}));
	}, [dispatch, page, rowsPerPage, searchTerm, statusFilter, refreshKey]);

	useEffect(() => {
		dispatch(fetchOwners());
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchProjectStats());
	}, [dispatch, refreshKey]);

	const refreshData = useCallback(() => setRefreshKey((k) => k + 1), []);

	const handlePageChange = (_event: unknown, newPage: number) => setPage(newPage);

	const handleRowsPerPageChange = (rows: number) => {
		setRowsPerPage(rows);
		setPage(0);
	};

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
		setPage(0);
	};

	const handleStatusFilterChange = (value: ProjectStatus | '') => {
		setStatusFilter(value);
		setPage(0);
	};

	const handleClearFilters = () => {
		setStatusFilter('');
		setPage(0);
	};

	const handleCreateClick = () => {
		setCreateDrawerOpen(true);
	};

	// Relative navigation (no leading slash) so it resolves under whichever base
	// is currently active (/projects or /org/:orgId/projects), matching how the
	// route pairs are defined in AppRouter.
	const handleRowClick = (project: Project) => navigate(project.public_id);

	const handleDeleteRequest = (project: Project) => setDeleteTarget(project);

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		try {
			await dispatch(deleteProject(deleteTarget.public_id)).unwrap();
			toast.success('Project deleted');
			setDeleteTarget(null);
		} catch (err: any) {
			toast.error(err || 'Failed to delete project');
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleSubmit = async (payload: ProjectCreate) => {
		await dispatch(createProject(payload)).unwrap();
		toast.success('Project created');
		setCreateDrawerOpen(false);
	};

	const handleToggleSelect = (publicId: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(publicId)) next.delete(publicId);
			else next.add(publicId);
			return next;
		});
	};

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedIds(event.target.checked ? new Set(projects.map((p) => p.public_id)) : new Set());
	};

	const handleClearSelection = () => setSelectedIds(new Set());

	const handleBulkReassign = async (ownerId: number) => {
		try {
			await dispatch(bulkUpdateProjects({ publicIds: Array.from(selectedIds), ownerId })).unwrap();
			toast.success(`Reassigned ${selectedIds.size} project(s)`);
			handleClearSelection();
		} catch (err: any) {
			toast.error(err || 'Failed to reassign projects');
		}
	};

	const handleBulkStatusChange = async (status: ProjectStatus) => {
		try {
			await dispatch(bulkUpdateProjects({ publicIds: Array.from(selectedIds), status })).unwrap();
			toast.success(`Updated status for ${selectedIds.size} project(s)`);
			handleClearSelection();
			dispatch(fetchProjectStats());
		} catch (err: any) {
			toast.error(err || 'Failed to update project status');
		}
	};

	return {
		projects,
		projectsTotal,
		projectsLoading,
		owners,

		projectStats,
		projectStatsLoading,

		page,
		rowsPerPage,
		searchTerm,
		refreshData,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearchChange,

		statusFilter,
		handleStatusFilterChange,
		handleClearFilters,

		createDrawerOpen,
		setCreateDrawerOpen,
		projectMutating,
		handleSubmit,

		deleteTarget,
		setDeleteTarget,
		deleteLoading,

		canBulkActions,
		selectedIds,
		bulkUpdateLoading: projectsBulkUpdateLoading,
		handleToggleSelect,
		handleSelectAll,
		handleClearSelection,
		handleBulkReassign,
		handleBulkStatusChange,

		handleCreateClick,
		handleRowClick,
		handleDeleteRequest,
		handleConfirmDelete,
	};
};

export default useProjectsManagement;
