import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCandidates, fetchFilterOptions } from '../../../store/slices/candidateSlice';
import { fetchAllAllocations, fetchTrainingBatches } from '../../../store/slices/trainingSlice';
import { settingsService } from '../../../services/settingsService';
import candidateService from '../../../services/candidateService';
import trainingService from '../../../services/trainingService';
import useToast from '../../../hooks/useToast';
import { ALL_COLUMNS, TRAINING_COLUMNS } from '../constants';
import { formatReportData } from '../utils/exportUtils';

export const useReports = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	
	const { list: candidates, total, loading, filterOptions } = useAppSelector((state) => state.candidates);
	const { allocations, total: trainingTotal, loading: trainingLoading, batches } = useAppSelector((state) => state.training);

	const [dynamicFieldDefs, setDynamicFieldDefs] = useState<any[]>([]);
	const [columns, setColumns] = useState<any[]>([]);
	const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

	const [search, setSearch] = useState('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(25);
	const [filters, setFilters] = useState<Record<string, any>>({});
	const [reportType, setReportType] = useState('candidate');
	const [exportDialogOpen, setExportDialogOpen] = useState(false);
	const [exportLoading, setExportLoading] = useState(false);

	const isTraining = reportType === 'training';
	const reportData = isTraining ? allocations : candidates;
	const reportTotal = isTraining ? trainingTotal : total;
	const reportLoading = isTraining ? trainingLoading : loading;

	// Setup Columns
	useEffect(() => {
		const setupColumns = async () => {
			try {
				let currentCols: any[] = [];
				if (reportType === 'candidate') {
					const [screeningFields, counselingFields] = await Promise.all([
						settingsService.getFields('screening'),
						settingsService.getFields('counseling')
					]);

					const dynamicCols: any[] = [];
					if (screeningFields) {
						screeningFields.forEach(field => {
							dynamicCols.push({
								id: `screening_others.${field.name}`,
								label: field.label,
								default: false,
								group: 'screening'
							});
						});
					}
					if (counselingFields) {
						counselingFields.forEach(field => {
							dynamicCols.push({
								id: `counseling_others.${field.name}`,
								label: field.label,
								default: false,
								group: 'counseling'
							});
						});
					}
					setDynamicFieldDefs([...(screeningFields || []), ...(counselingFields || [])]);
					currentCols = [...ALL_COLUMNS, ...dynamicCols];
				} else {
					currentCols = TRAINING_COLUMNS;
				}

				setColumns(currentCols);
				setVisibleColumns(currentCols.filter(c => c.default).map(c => c.id));
			} catch (error) {
				toast.error("Failed to setup columns. Some data might be missing.");
			}
		};

		setupColumns();
	}, [reportType, toast]);

	// Data Fetching
	const fetchData = useCallback(() => {
		dispatch(fetchCandidates({
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			search,
			gender: filters.gender,
			disability_types: filters.disability_type?.join(','),
			education_levels: filters.education_level?.join(','),
			cities: filters.city?.join(','),
			counseling_status: filters.counseling_status,
			screening_status: filters.screening_status,
			disability_percentages: filters.disability_percentage ? `${filters.disability_percentage.min || 0}-${filters.disability_percentage.max || 100}` : undefined,
			screening_reasons: filters.screening_reason?.join(','),
			year_of_passing: filters.year_of_passing?.join(','),
			year_of_experience: filters.year_of_experience ? `${filters.year_of_experience.min || 0}-${filters.year_of_experience.max || 50}` : undefined,
			is_experienced: filters.is_experienced === 'true' ? true : filters.is_experienced === 'false' ? false : undefined,
			currently_employed: filters.currently_employed === 'true' ? true : filters.currently_employed === 'false' ? false : undefined,
			registration_type: filters.registration_type,
			is_global: true,
			extraFilters: Object.keys(filters)
				.filter(key => key.startsWith('screening_others.') || key.startsWith('counseling_others.'))
				.reduce((acc, key) => {
					const val = filters[key];
					if (val && (!Array.isArray(val) || val.length > 0)) {
						acc[key] = Array.isArray(val) ? val.join(',') : val;
					}
					return acc;
				}, {} as Record<string, string>)
		}));
	}, [dispatch, page, rowsPerPage, search, filters]);

	const fetchTrainingData = useCallback(() => {
		dispatch(fetchAllAllocations({
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			search,
			batch_id: filters.batch_id,
			status: filters.status,
			is_dropout: filters.is_dropout,
			gender: filters.gender,
			disability_types: filters.disability_type?.join(','),
			sortBy: 'created_at',
			sortOrder: 'desc'
		}));
	}, [dispatch, page, rowsPerPage, search, filters]);

	useEffect(() => {
		dispatch(fetchFilterOptions());
		dispatch(fetchTrainingBatches({}));
	}, [dispatch]);

	useEffect(() => {
		if (isTraining) {
			fetchTrainingData();
		} else {
			fetchData();
		}
	}, [isTraining, fetchData, fetchTrainingData]);

	// Handlers
	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(0);
	};

	const handleFilterChange = (key: string, value: any) => {
		setFilters(prev => ({ ...prev, [key]: value }));
	};

	const handleApplyFilters = () => {
		setPage(0);
		setFilterDrawerOpen(false);
	};

	const handleClearFilters = () => {
		setFilters({});
		setPage(0);
	};

	const toggleColumn = (colId: string) => {
		setVisibleColumns(prev =>
			prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
		);
	};

	const handleExportCurrentPage = () => {
		const exportData = formatReportData(reportData, visibleColumns, columns, isTraining);

		const ws = XLSX.utils.json_to_sheet(exportData);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Report');
		XLSX.writeFile(wb, `${isTraining ? 'Training' : 'Candidates'}_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
	};

	const handleExportAll = async () => {
		setExportLoading(true);
		try {
			let response;
			const visibleColData = visibleColumns.map(id => {
				const col = columns.find(c => c.id === id);
				return { id, label: col?.label || id };
			});

			if (isTraining) {
				response = await trainingService.exportAllocations({
					search,
					batch_id: filters.batch_id,
					status: filters.status,
					is_dropout: filters.is_dropout,
					gender: filters.gender,
					disability_types: filters.disability_type?.join(','),
					sortBy: 'created_at',
					sortOrder: 'desc',
					columns: JSON.stringify(visibleColData)
				});
			} else {
				response = await candidateService.export(
					search,
					undefined,
					'desc',
					filters.disability_type?.join(','),
					filters.education_level?.join(','),
					filters.city?.join(','),
					filters.counseling_status,
					filters.screening_status,
					filters.is_experienced === 'true' ? true : filters.is_experienced === 'false' ? false : undefined,
					filters.disability_percentage ? `${filters.disability_percentage.min || 0}-${filters.disability_percentage.max || 100}` : undefined,
					filters.screening_reason?.join(','),
					filters.gender,
					filters.year_of_passing?.join(','),
					filters.year_of_experience ? `${filters.year_of_experience.min || 0}-${filters.year_of_experience.max || 50}` : undefined,
					filters.currently_employed === 'true' ? true : filters.currently_employed === 'false' ? false : undefined,
					filters.registration_type,
					Object.keys(filters)
						.filter(key => key.startsWith('screening_others.') || key.startsWith('counseling_others.'))
						.reduce((acc, key) => {
							const val = filters[key];
							if (val && (!Array.isArray(val) || val.length > 0)) {
								acc[key] = Array.isArray(val) ? val.join(',') : val;
							}
							return acc;
						}, {} as Record<string, string>),
					true,
					JSON.stringify(visibleColData)
				);
			}
			toast.success(response.message);
		} catch (error) {
			toast.error("Failed to start export. Please try again later.");
		} finally {
			setExportLoading(false);
		}
	};

	const handleExport = (type: 'page' | 'all') => {
		if (type === 'all') {
			handleExportAll();
		} else {
			handleExportCurrentPage();
		}
		setExportDialogOpen(false);
	};

	return {
		reportType,
		setReportType,
		search,
		handleSearchChange,
		page,
		setPage,
		rowsPerPage,
		setRowsPerPage,
		filters,
		handleFilterChange,
		handleApplyFilters,
		handleClearFilters,
		columns,
		visibleColumns,
		toggleColumn,
		anchorEl,
		setAnchorEl,
		filterDrawerOpen,
		setFilterDrawerOpen,
		exportDialogOpen,
		setExportDialogOpen,
		exportLoading,
		handleExport,
		reportData,
		reportTotal,
		reportLoading,
		filterOptions,
		batches,
		dynamicFieldDefs,
		isTraining,
		onRefresh: isTraining ? fetchTrainingData : fetchData
	};
};
