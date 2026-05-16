import React, { memo, useMemo, useState, useEffect } from 'react';
import {
	Box,
	FormControl,
	Select,
	MenuItem,
	useTheme
} from '@mui/material';
import type { CandidateAllocation } from '../../../models/training';
import CandidateAllocationTableRow from './CandidateAllocationTableRow';
import { DropoutReasonDialog } from '../../common/dialogbox';
import DataTable from '../../common/table/DataTable';
import type { ColumnDefinition } from '../../common/table/DataTable';

const ALLOCATION_STATUSES = [
	'in_training',
	'completed',
	'dropped_out',
	'moved_to_placement'
];

const getAllocationStatusColor = (theme: any, status: string) => {
	switch (status?.toLowerCase()) {
		case 'completed': return theme.palette.success.main;
		case 'dropped_out': return theme.palette.error.main;
		case 'moved_to_placement': return theme.palette.secondary.main;
		case 'in_training': return theme.palette.primary.main;
		default: return theme.palette.warning.main;
	}
};

interface CandidateAllocationTableProps {
	allocations: CandidateAllocation[];
	loading: boolean;
	searchQuery: string;
	onSearchChange: (value: string) => void;
	filterDropout: boolean | 'all';
	onFilterChange: (value: boolean | 'all') => void;
	updatingStatusId: string | null;
	onStatusChange: (publicId: string, status: string, reason?: string) => void;
	onMove: (allocation: CandidateAllocation) => void;
	onAddClick: () => void;
}

const CandidateAllocationTable: React.FC<CandidateAllocationTableProps> = memo(({
	allocations,
	loading,
	searchQuery,
	onSearchChange,
	filterDropout,
	onFilterChange,
	updatingStatusId,
	onStatusChange,
	onMove,
	onAddClick
}) => {
	const theme = useTheme();
	const [dropoutDialog, setDropoutDialog] = useState<{ open: boolean, publicId: string, name: string } | null>(null);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	const handleStatusChangeInternal = (publicId: string, status: string) => {
		if (status === 'dropped_out') {
			const candidate = allocations.find(a => a.public_id === publicId);
			setDropoutDialog({
				open: true,
				publicId,
				name: candidate?.candidate?.name || 'Candidate'
			});
		} else {
			onStatusChange(publicId, status);
		}
	};

	const handleDropoutConfirm = (reason: string) => {
		if (dropoutDialog) {
			onStatusChange(dropoutDialog.publicId, 'dropped_out', reason);
			setDropoutDialog(null);
		}
	};

	const columns: ColumnDefinition<CandidateAllocation>[] = useMemo(() => [
		{ id: 'name' as any, label: 'Candidate Name' },
		{ id: 'gender' as any, label: 'Gender' },
		{ id: 'disability' as any, label: 'Disability' },
		{ id: 'qualification' as any, label: 'Qualification' },
		{ id: 'contact' as any, label: 'Contact Info' },
		{ id: 'status' as any, label: 'Status' },
		{ id: 'actions' as any, label: 'Actions', align: 'right' }
	], []);

	// Local pagination slicing
	const paginatedAllocations = useMemo(() => {
		return allocations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
	}, [allocations, page, rowsPerPage]);

	// Reset page when allocations change (due to search/filter)
	useEffect(() => {
		setPage(0);
	}, [allocations.length]);

	return (
		<Box>
			<DataTable
				columns={columns}
				data={paginatedAllocations}
				loading={loading}
				totalCount={allocations.length}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, newPage) => setPage(newPage)}
				onRowsPerPageChange={(newRows) => {
					setRowsPerPage(newRows);
					setPage(0);
				}}
				searchTerm={searchQuery}
				onSearchChange={onSearchChange}
				searchPlaceholder="Search candidates..."
				canCreate={true}
				onCreateClick={onAddClick}
				createButtonText="Enroll Candidate"
				headerActions={
					<Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
						<FormControl size="small" sx={{ minWidth: 200 }}>
							<Select
								value={filterDropout}
								onChange={(e) => onFilterChange(e.target.value as any)}
								sx={{
									bgcolor: 'background.default',
									borderRadius: 1.5,
									height: 40,
									fontSize: '0.875rem',
									fontWeight: 600,
									'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
									'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: '2px' }
								}}
							>
								<MenuItem value="all" sx={{ fontWeight: 600 }}>All Candidates</MenuItem>
								<MenuItem value={false as any} sx={{ fontWeight: 600 }}>Active Only</MenuItem>
								<MenuItem value={true as any} sx={{ fontWeight: 600 }}>Dropouts Only</MenuItem>
							</Select>
						</FormControl>
					</Box>
				}
				renderRow={(allocation) => (
					<CandidateAllocationTableRow
						key={allocation.public_id}
						allocation={allocation}
						updatingStatusId={updatingStatusId}
						onStatusChange={handleStatusChangeInternal}
						onMove={onMove}
						getAllocationStatusColor={(status) => getAllocationStatusColor(theme, status)}
						ALLOCATION_STATUSES={ALLOCATION_STATUSES}
					/>
				)}
				emptyMessage="No candidates found in this batch matching your criteria."
			/>

			{dropoutDialog && (
				<DropoutReasonDialog
					open={dropoutDialog.open}
					onClose={() => setDropoutDialog(null)}
					onConfirm={handleDropoutConfirm}
					candidateName={dropoutDialog.name}
				/>
			)}
		</Box>
	);
});

CandidateAllocationTable.displayName = 'CandidateAllocationTable';

export default CandidateAllocationTable;
