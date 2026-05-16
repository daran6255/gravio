import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';

import {
	ReportHeader,
	ReportToolbar,
	ReportTable,
	ColumnSelector,
	ExportDialog,
	useReports
} from '../../components/reports';
import FilterDrawer, { type FilterField } from '../../components/common/drawer/FilterDrawer';

const Reports: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const {
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
		onRefresh
	} = useReports();

	// Filter Field Configuration
	const filterFields: FilterField[] = isTraining ? [
		{
			key: 'batch_id',
			label: 'Batch Name',
			type: 'single-select',
			options: batches.map(b => ({ label: b.batch_name, value: String(b.id) }))
		},
		{
			key: 'status',
			label: 'Training Status',
			type: 'single-select',
			options: [
				{ label: 'Allocated', value: 'allocated' },
				{ label: 'In Training', value: 'in_training' },
				{ label: 'Completed', value: 'completed' },
				{ label: 'Dropped Out', value: 'dropped_out' },
				{ label: 'Moved to Placement', value: 'moved_to_placement' }
			]
		},
		{ key: 'is_dropout', label: 'Is Dropout', type: 'boolean' },
		{
			key: 'gender',
			label: 'Gender',
			type: 'single-select',
			options: [
				{ value: 'male', label: 'Male' },
				{ value: 'female', label: 'Female' },
				{ value: 'other', label: 'Other' }
			]
		},
		{
			key: 'disability_type',
			label: 'Disability Type',
			type: 'multi-select',
			options: filterOptions.disability_types?.map(v => ({ label: v, value: v })) || []
		},
	] : [
		{
			key: 'disability_type',
			label: 'Disability Type',
			type: 'multi-select',
			options: filterOptions.disability_types.map(v => ({ value: v, label: v }))
		},
		{
			key: 'education_level',
			label: 'Education Level',
			type: 'multi-select',
			options: filterOptions.education_levels.map(v => ({ value: v, label: v }))
		},
		{
			key: 'city',
			label: 'City',
			type: 'multi-select',
			options: filterOptions.cities.map(v => ({ value: v, label: v }))
		},
		{
			key: 'counseling_status',
			label: 'Counseling Status',
			type: 'single-select',
			options: filterOptions.counseling_statuses.map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))
		},
		{
			key: 'screening_status',
			label: 'Screening Status',
			type: 'single-select',
			options: filterOptions.screening_statuses.map(v => ({ value: v, label: v }))
		},
		{
			key: 'disability_percentage',
			label: 'Disability Percentage (Min-Max)',
			type: 'range'
		},
		{
			key: 'screening_reason',
			label: 'Screening Reason',
			type: 'multi-select',
			options: (filterOptions.screening_reasons || []).map(v => ({ value: v, label: v }))
		},
		{
			key: 'gender',
			label: 'Gender',
			type: 'single-select',
			options: [
				{ value: 'male', label: 'Male' },
				{ value: 'female', label: 'Female' },
				{ value: 'other', label: 'Other' }
			]
		},
		{
			key: 'year_of_passing',
			label: 'Year of Passing',
			type: 'multi-select',
			options: (filterOptions.years_of_passing || []).map(v => ({ value: v, label: v }))
		},
		{
			key: 'is_experienced',
			label: 'Is Experienced?',
			type: 'single-select',
			options: [
				{ value: 'true', label: 'Yes' },
				{ value: 'false', label: 'No' }
			]
		},
		{
			key: 'year_of_experience',
			label: 'Years of Experience (Min-Max)',
			type: 'range'
		},
		{
			key: 'currently_employed',
			label: 'Currently Employed?',
			type: 'single-select',
			options: [
				{ value: 'true', label: 'Yes' },
				{ value: 'false', label: 'No' }
			]
		}
	];

	// Add dynamic filters
	if (!isTraining) {
		columns.forEach(col => {
			if (col.id.startsWith('screening_others.') || col.id.startsWith('counseling_others.')) {
				const fieldName = col.id.split('.')[1];
				const fieldDef = dynamicFieldDefs.find(fd => fd.name === fieldName);

				if (fieldDef) {
					const isOptionField = fieldDef.field_type === 'single_choice' || fieldDef.field_type === 'multiple_choice';

					filterFields.push({
						key: col.id,
						label: col.label,
						type: isOptionField ? 'multi-select' : 'text',
						options: isOptionField ? (fieldDef.options || []).map((o: any) => ({
							value: typeof o === 'string' ? o : o.value,
							label: typeof o === 'string' ? o : o.label
						})) : []
					});
				}
			}
		});
	}

	return (
		<Box sx={{
			height: 'calc(100vh - 48px)', // Adjust based on Sidebar.tsx (Dense AppBar is 48px)
			display: 'flex',
			flexDirection: 'column',
			overflow: 'hidden',
			backgroundColor: theme.palette.background.default
		}}>
			{/* Persistent Header & Toolbar */}
			<Box sx={{
				p: isMobile ? 1.5 : 3,
				pb: 1,
				zIndex: 10,
				backgroundColor: theme.palette.background.default,
				borderBottom: `1px solid ${theme.palette.divider}`
			}}>
				<ReportHeader
					onRefresh={onRefresh}
					onExport={() => setExportDialogOpen(true)}
					loading={reportLoading}
					reportType={reportType}
					onReportTypeChange={setReportType}
				/>

				<ReportToolbar
					search={search}
					onSearchChange={handleSearchChange}
					total={reportTotal}
					filterCount={Object.values(filters).flat().filter(v => v && (!Array.isArray(v) || v.length > 0)).length}
					onFilterClick={() => setFilterDrawerOpen(true)}
				>
					<ColumnSelector
						anchorEl={anchorEl}
						onOpen={(e) => setAnchorEl(e.currentTarget)}
						onClose={() => setAnchorEl(null)}
						columns={columns}
						visibleColumns={visibleColumns}
						onToggleColumn={toggleColumn}
					/>
				</ReportToolbar>
			</Box>

			{/* Scrollable Table Area */}
			<Box sx={{
				flex: 1,
				overflow: 'hidden',
				p: isMobile ? 1.5 : 3,
				pt: 0,
				display: 'flex',
				flexDirection: 'column'
			}}>
				<ReportTable
					loading={reportLoading}
					columns={columns}
					visibleColumns={visibleColumns}
					data={reportData as any}
					total={reportTotal}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={setPage}
					onRowsPerPageChange={(v) => {
						setRowsPerPage(v);
						setPage(0);
					}}
				/>
			</Box>

			<FilterDrawer
				open={filterDrawerOpen}
				onClose={() => setFilterDrawerOpen(false)}
				fields={filterFields}
				activeFilters={filters}
				onFilterChange={handleFilterChange}
				onClearFilters={handleClearFilters}
				onApplyFilters={handleApplyFilters}
			/>

			<ExportDialog 
				open={exportDialogOpen}
				onClose={() => setExportDialogOpen(false)}
				onExport={handleExport}
				loading={exportLoading}
			/>
		</Box>
	);
};

export default Reports;
