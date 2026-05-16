import React, { useMemo } from 'react';
import {
	Box,
	Button,
	Typography,
	useTheme,
	Tooltip,
	Chip,
	alpha,
	TableRow,
	TableCell
} from '@mui/material';
import { CloudUpload as UploadIcon, Accessible, VerifiedUser } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { CandidateListItem } from '../../../models/candidate';
import { useDocumentPage } from '../hooks/useDocumentPage';
import DataTable, { type ColumnDefinition } from '../../common/table/DataTable';

interface DocumentCollectionTableProps {
	type: 'not_collected' | 'pending' | 'collected';
}

/**
 * DocumentCollectionTable - Specialized data table for document collection workflows.
 * Built on the standardized DataTable component for consistency and performance.
 */
const DocumentCollectionTable: React.FC<DocumentCollectionTableProps> = ({ type }) => {
	const theme = useTheme();
	const navigate = useNavigate();

	const {
		candidates,
		loading,
		totalCount,
		searchTerm,
		page,
		rowsPerPage,
		order,
		orderBy,
		handleSearch,
		handleChangePage,
		handleRequestSort,
		setRowsPerPage,
		refresh
	} = useDocumentPage(type);

	// Column Definitions
	const columns = useMemo<ColumnDefinition<CandidateListItem>[]>(() => [
		{ id: 'name', label: 'Candidate Identity', sortable: true },
		{ id: 'phone', label: 'Contact Details', hidden: false }, // Using hidden: false to ensure it shows but I'll handle layout in renderRow
		{ id: 'city', label: 'Location', hidden: false },
		{ id: 'documents_uploaded' as any, label: 'Document Status', sortable: false },
		{ id: 'actions' as any, label: 'Workflow Action', align: 'right' }
	], []);

	// Helper to render document status chips
	const renderStatusChips = (candidate: CandidateListItem) => {
		const docs = candidate.documents_uploaded || [];
		const collected: string[] = [];
		const pending: string[] = [];

		const checkDoc = (key: string, label: string) => {
			if (docs.includes(key)) collected.push(label); else pending.push(label);
		};

		checkDoc('resume', 'Resume');
		if (candidate.is_disabled) checkDoc('disability_certificate', 'Disability');
		checkDoc('10th_certificate', '10th');
		checkDoc('12th_certificate', '12th');
		checkDoc('degree_certificate', 'Degree');
		checkDoc('pan_card', 'PAN');
		checkDoc('aadhar_card', 'Aadhar');

		return (
			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
				{collected.map(d => (
					<Chip
						key={d}
						label={d}
						size="small"
						color="success"
						variant="outlined"
						sx={{ height: 18, fontSize: '0.6rem', borderRadius: 0.5, fontWeight: 700 }}
					/>
				))}
				{pending.map(d => (
					<Chip
						key={d}
						label={d}
						size="small"
						variant="outlined"
						sx={{
							height: 18,
							fontSize: '0.6rem',
							borderRadius: 0.5,
							color: 'text.secondary',
							borderColor: 'divider',
							bgcolor: alpha(theme.palette.text.secondary, 0.04)
						}}
					/>
				))}
			</Box>
		);
	};

	const renderRow = (candidate: CandidateListItem) => (
		<TableRow key={candidate.public_id} hover>
			<TableCell>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Box>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{candidate.name}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							{candidate.email}
						</Typography>
					</Box>
					{candidate.is_disabled && (
						<Tooltip title="Person with Disability">
							<Accessible color="primary" sx={{ fontSize: 16 }} />
						</Tooltip>
					)}
					<Tooltip title="Verified Profile">
						<VerifiedUser sx={{ color: 'success.main', fontSize: 16 }} />
					</Tooltip>
				</Box>
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" color="text.secondary">{candidate.phone}</Typography>
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" color="text.secondary">
					{candidate.city}, {candidate.state}
				</Typography>
			</TableCell>
			<TableCell>
				{renderStatusChips(candidate)}
			</TableCell>
			<TableCell align="right">
				<Button
					variant="contained"
					size="small"
					startIcon={<UploadIcon />}
					onClick={() => navigate(`/candidates/documents/${candidate.public_id}`)}
					sx={{
						textTransform: 'none',
						fontWeight: 700,
						boxShadow: 'none',
						'&:hover': { boxShadow: 'none' }
					}}
				>
					Collect
				</Button>
			</TableCell>
		</TableRow>
	);

	return (
		<DataTable
			columns={columns}
			data={candidates}
			loading={loading}
			totalCount={totalCount}
			page={page}
			rowsPerPage={rowsPerPage}
			onPageChange={handleChangePage}
			onRowsPerPageChange={setRowsPerPage}
			searchTerm={searchTerm}
			onSearchChange={(value) => handleSearch({ target: { value } } as any)}
			searchPlaceholder="Search candidates by name or email..."
			orderBy={orderBy}
			order={order}
			onSortRequest={handleRequestSort as any}
			onRefresh={refresh}
			emptyMessage={`No candidates found in the "${type.replace('_', ' ')}" collection.`}
			renderRow={renderRow}
		/>
	);
};

export default DocumentCollectionTable;
