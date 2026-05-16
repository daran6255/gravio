import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchProjects } from '../../../../store/slices/dsrSlice';
import type { DSRProject } from '../../../../models/dsr';

export const useProjectTable = (refreshKey: number) => {
	const dispatch = useAppDispatch();
	const { projects, loading, totalProjects: totalCount } = useAppSelector((state) => state.dsr);

	const [searchTerm, setSearchTerm] = useState('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
	const [manualRefresh, setManualRefresh] = useState(0);

	const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
	const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);
	const [activeProject, setActiveProject] = useState<DSRProject | null>(null);

	const fetchProjectsData = useCallback(() => {
		dispatch(fetchProjects({
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			active_only: statusFilter === 'active' ? true : (statusFilter === 'inactive' ? false : undefined),
			search: searchTerm
		}));
	}, [dispatch, page, rowsPerPage, searchTerm, statusFilter]);

	useEffect(() => {
		fetchProjectsData();
	}, [fetchProjectsData, refreshKey, manualRefresh]);

	const handlePageChange = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
		setPage(0);
	};

	const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setFilterAnchorEl(event.currentTarget);
	};

	const handleFilterClose = () => {
		setFilterAnchorEl(null);
	};

	const handleStatusSelect = (status: 'all' | 'active' | 'inactive') => {
		setStatusFilter(status);
		setPage(0);
		handleFilterClose();
	};

	const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>, project: DSRProject) => {
		setActionAnchorEl(event.currentTarget);
		setActiveProject(project);
	};

	const handleActionClose = () => {
		setActionAnchorEl(null);
		setActiveProject(null);
	};

	const handleRefresh = () => {
		setManualRefresh(prev => prev + 1);
	};

	return {
		projects,
		loading,
		totalCount,
		searchTerm,
		page,
		rowsPerPage,
		statusFilter,
		filterAnchorEl,
		actionAnchorEl,
		activeProject,
		filterOpen: Boolean(filterAnchorEl),
		actionOpen: Boolean(actionAnchorEl),
		fetchProjectsData,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearch,
		handleFilterClick,
		handleFilterClose,
		handleStatusSelect,
		handleActionClick,
		handleActionClose,
		handleRefresh,
		setRowsPerPage,
		setPage
	};
};
