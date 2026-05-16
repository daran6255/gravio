import React from 'react';
import {
	useTheme,
	useMediaQuery,
	Box,
	Typography,
	Stack
} from '@mui/material';
import MySubmissionsRow, { MySubmissionsMobileCard } from './MySubmissionsRow';
import type { DSREntry } from '../../../../models/dsr';
import DataTable from '../../../common/table/DataTable';
import type { ColumnDefinition } from '../../../common/table/DataTable';

interface MySubmissionsTableProps {
	entries: DSREntry[];
	total: number;
	loading: boolean;
	page: number;
	rowsPerPage: number;
	onPageChange: (newPage: number) => void;
	onRowsPerPageChange: (newRowsPerPage: number) => void;
	onDelete: (id: string) => void;
	onEdit?: (id: string) => void;
	onView?: (id: string) => void;
	// Header props
	searchTerm: string;
	onSearchChange: (value: string) => void;
	onRefresh: () => void;
	onFilterOpen: (event: React.MouseEvent<HTMLButtonElement>) => void;
	activeFilterCount: number;
}

const MySubmissionsTable: React.FC<MySubmissionsTableProps> = ({
	entries,
	total,
	loading,
	page,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
	onDelete,
	onEdit,
	onView,
	searchTerm,
	onSearchChange,
	onRefresh,
	onFilterOpen,
	activeFilterCount
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	const columns: ColumnDefinition<DSREntry>[] = [
		{ id: 'report_date', label: 'Report Date', width: 120 },
		{ id: 'status' as any, label: 'Status', width: 150 },
		{ id: 'items' as any, label: 'Total Hours', width: 100 },
		{ id: 'submitted_at' as any, label: 'Submitted At', width: 150, hidden: isMobile },
		{ id: 'actions' as any, label: 'Actions', width: 80, align: 'right' }
	];

	if (isMobile) {
		return (
			<Box sx={{ width: '100%' }}>
				<Box sx={{ px: 0.5 }}>
					{entries.length === 0 && !loading ? (
						<Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
							<Typography variant="body2" color="text.secondary">No submissions found.</Typography>
						</Box>
					) : (
						<Stack spacing={1}>
							{entries.map((entry) => (
								<MySubmissionsMobileCard
									key={entry.public_id}
									entry={entry}
									onDelete={onDelete}
									onEdit={onEdit}
									onView={onView}
								/>
							))}
						</Stack>
					)}
				</Box>
			</Box>
		);
	}

	return (
		<DataTable<DSREntry>
			columns={columns}
			data={entries}
			loading={loading}
			totalCount={total}
			page={page}
			rowsPerPage={rowsPerPage}
			onPageChange={(_e, p) => onPageChange(p)}
			onRowsPerPageChange={onRowsPerPageChange}
			searchTerm={searchTerm}
			onSearchChange={onSearchChange}
			onRefresh={onRefresh}
			onFilterOpen={onFilterOpen}
			activeFilterCount={activeFilterCount}
			emptyMessage="No timesheet records found for the selected period."
			renderRow={(entry) => (
				<MySubmissionsRow
					key={entry.public_id}
					entry={entry}
					onDelete={onDelete}
					onEdit={onEdit}
					onView={onView}
				/>
			)}
		/>
	);
};

export default MySubmissionsTable;
