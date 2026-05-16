import React, { useMemo, useState } from 'react';
import {
	Box,
	Typography,
	Button,
	useTheme,
	alpha
} from '@mui/material';
import type { CandidateAllocation } from '../../../models/training';
import type { MockInterview } from '../../../models/MockInterview';
import { useMockInterviewList } from './hooks/useMockInterviewList';
import MockInterviewTableRow from './table/MockInterviewTableRow';
import MockInterviewForm from './form/MockInterviewForm';
import MockInterviewStats from './stats/MockInterviewStats';
import DataTable, { type ColumnDefinition } from '../../common/table/DataTable';
import FilterDrawer, { type FilterField } from '../../common/drawer/FilterDrawer';
import ConfirmationDialog from '../../common/dialogbox/ConfirmationDialog';

interface MockInterviewListProps {
	batchId: number;
	allocations: CandidateAllocation[];
}

const MockInterviewList: React.FC<MockInterviewListProps> = ({ batchId, allocations }) => {
	const theme = useTheme();
	const {
		mockInterviews,
		loading,
		page,
		rowsPerPage,
		searchTerm,
		filterCandidateId,
		isFormOpen,
		viewMode,
		stats,
		setSearchTerm,
		setFilterCandidateId,
		setIsFormOpen,
		handleRefresh,
		handleChangePage,
		handleCreate,
		handleEdit,
		handleView,
		handleDelete,
		setRowsPerPage
	} = useMockInterviewList(batchId);

	const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
	const [activeFilters, setActiveFilters] = useState<Record<string, any>>({
		candidate: filterCandidateId ? String(filterCandidateId) : '',
		status: []
	});

	const filterFields: FilterField[] = useMemo(() => [
		{
			key: 'candidate',
			label: 'Candidate',
			type: 'single-select',
			options: [
				...allocations.map(a => ({
					value: String(a.candidate_id),
					label: a.candidate?.name || 'Unknown'
				}))
			]
		},
		{
			key: 'status',
			label: 'Status',
			type: 'multi-select',
			options: [
				{ value: 'cleared', label: 'Cleared' },
				{ value: 'rejected', label: 'Rejected' },
				{ value: 're-test', label: 'Re-test' },
				{ value: 'pending', label: 'Pending' },
				{ value: 'absent', label: 'Absent' }
			]
		}
	], [allocations]);

	const handleFilterChange = (key: string, value: any) => {
		setActiveFilters(prev => ({ ...prev, [key]: value }));
	};

	const handleApplyFilters = () => {
		const candidateId = activeFilters.candidate ? parseInt(activeFilters.candidate, 10) : null;
		setFilterCandidateId(candidateId);
		setIsFilterDrawerOpen(false);
		// Note: Status filtering could be added to the hook if needed
	};

	const handleClearFilters = () => {
		setActiveFilters({ candidate: '', status: [] });
		setFilterCandidateId(null);
		setIsFilterDrawerOpen(false);
	};

	const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

	const handleConfirmDelete = async () => {
		if (deleteConfirmId) {
			await handleDelete(deleteConfirmId);
			setDeleteConfirmId(null);
		}
	};

	const columns: ColumnDefinition<MockInterview>[] = useMemo(() => [
		{ id: 'interview_date', label: 'DATE', width: '12%' },
		{ id: 'candidate_id', label: 'CANDIDATE', width: '18%' },
		{ id: 'interviewer_name', label: 'INTERVIEWER', width: '15%' },
		{ id: 'interview_type', label: 'TYPE', width: '8%' },
		{ id: 'interview_category', label: 'CAT.', width: '8%' },
		{ id: 'status', label: 'STATUS', width: '12%' },
		{ id: 'duration_minutes', label: 'DUR.', width: '10%' },
		{ id: 'overall_rating', label: 'RATING', width: '15%' },
		{ id: 'actions', label: 'ACTIONS', align: 'right', width: '8%' }
	], []);

	const filteredCandidateName = allocations.find(a => a.candidate_id === filterCandidateId)?.candidate?.name;

	// Apply status filters locally since the hook doesn't support it yet
	const displayData = useMemo(() => {
		let data = mockInterviews;
		if (activeFilters.status.length > 0) {
			data = data.filter(i => activeFilters.status.includes(i.status.toLowerCase()));
		}
		return data;
	}, [mockInterviews, activeFilters.status]);

	return (
		<Box sx={{ width: '100%' }}>
			<MockInterviewStats stats={stats} />

			{filterCandidateId && (
				<Box 
					sx={{ 
						mb: 3, 
						display: 'flex', 
						alignItems: 'center', 
						gap: 2, 
						bgcolor: alpha(theme.palette.info.main, 0.05), 
						p: 2, 
						borderRadius: 2, 
						border: '1px solid',
						borderColor: alpha(theme.palette.info.main, 0.1)
					}}
				>
					<Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
						Showing sessions for: <Box component="span" sx={{ fontWeight: 700, color: 'info.main' }}>{filteredCandidateName}</Box>
					</Typography>
					<Button
						size="small"
						variant="outlined"
						color="info"
						onClick={() => handleClearFilters()}
						sx={{ 
							textTransform: 'none', 
							borderRadius: 1.5,
							fontWeight: 700,
							px: 2
						}}
					>
						Clear Filter
					</Button>
				</Box>
			)}

			<DataTable
				columns={columns}
				data={displayData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
				totalCount={displayData.length}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={handleChangePage}
				onRowsPerPageChange={(newRows) => {
					setRowsPerPage(newRows);
					handleChangePage(null, 0);
				}}
				loading={loading}
				searchTerm={searchTerm}
				onSearchChange={setSearchTerm}
				searchPlaceholder="Search candidates or interviewers..."
				onRefresh={handleRefresh}
				onFilterOpen={() => setIsFilterDrawerOpen(true)}
				activeFilterCount={(filterCandidateId ? 1 : 0) + activeFilters.status.length}
				canCreate={true}
				onCreateClick={handleCreate}
				createButtonText="Create Session"
				renderRow={(interview) => (
					<MockInterviewTableRow
						key={interview.id}
						interview={interview}
						allocations={allocations}
						onView={handleView}
						onEdit={handleEdit}
						onDelete={(id) => setDeleteConfirmId(id)}
						onFilterCandidate={(id) => {
							setFilterCandidateId(id);
							setActiveFilters(prev => ({ ...prev, candidate: String(id) }));
						}}
					/>
				)}
			/>

			<FilterDrawer
				open={isFilterDrawerOpen}
				onClose={() => setIsFilterDrawerOpen(false)}
				fields={filterFields}
				activeFilters={activeFilters}
				onFilterChange={handleFilterChange}
				onClearFilters={handleClearFilters}
				onApplyFilters={handleApplyFilters}
			/>

			{isFormOpen && (
				<MockInterviewForm
					open={isFormOpen}
					onClose={() => setIsFormOpen(false)}
					batchId={batchId}
					viewMode={viewMode}
				/>
			)}

			<ConfirmationDialog
				open={!!deleteConfirmId}
				onClose={() => setDeleteConfirmId(null)}
				onConfirm={handleConfirmDelete}
				title="Delete Interview Record"
				message="Are you sure you want to delete this mock interview record? This action will permanently remove all associated technical discussion points and ratings. This action cannot be undone."
				confirmLabel="Delete Record"
				severity="error"
			/>
		</Box>
	);
};

export default MockInterviewList;

