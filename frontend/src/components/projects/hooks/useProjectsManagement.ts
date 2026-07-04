import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchProjects, createProject, updateProject, deleteProject } from '../../../store/slices/projectsSlice';
import { fetchOwners } from '../../../store/slices/crmSlice';
import useToast from '../../../hooks/useToast';
import type { Project, ProjectStatus, ProjectCreate, ProjectUpdate } from '../../../models/projects/project';

export const useProjectsManagement = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const toast = useToast();
	const { projects, projectsTotal, projectsLoading, projectMutating } = useAppSelector((state) => state.projects);
	const { owners } = useAppSelector((state) => state.crm);
	const [searchParams] = useSearchParams();

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(20);
	const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
	const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
	const [refreshKey, setRefreshKey] = useState(0);

	const [formOpen, setFormOpen] = useState(false);
	const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
	const [editingProject, setEditingProject] = useState<Project | null>(null);

	const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

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
		setEditingProject(null);
		setCreateDrawerOpen(true);
	};

	const handleEdit = (project: Project) => {
		setEditingProject(project);
		setFormOpen(true);
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

	const handleSubmit = async (payload: ProjectCreate | ProjectUpdate) => {
		if (editingProject) {
			await dispatch(updateProject({ publicId: editingProject.public_id, payload })).unwrap();
			toast.success('Project updated');
			setFormOpen(false);
		} else {
			await dispatch(createProject(payload as ProjectCreate)).unwrap();
			toast.success('Project created');
			setCreateDrawerOpen(false);
		}
	};

	return {
		projects,
		projectsTotal,
		projectsLoading,
		owners,

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

		formOpen,
		setFormOpen,
		createDrawerOpen,
		setCreateDrawerOpen,
		editingProject,
		projectMutating,
		handleSubmit,

		deleteTarget,
		setDeleteTarget,
		deleteLoading,

		handleCreateClick,
		handleEdit,
		handleRowClick,
		handleDeleteRequest,
		handleConfirmDelete,
	};
};

export default useProjectsManagement;
