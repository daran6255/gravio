import React from 'react';
import {
	Box,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableRow,
	CircularProgress,
	Typography,
	Chip,
	useTheme,
	useMediaQuery,
	Stack,
	alpha
} from '@mui/material';
import { format } from 'date-fns';
import { 
	DataTableHead, 
	DataTableEmpty, 
	CustomTablePagination,
	type ColumnDefinition
} from '../../common/table';

interface Column {
	id: string;
	label: string;
	group?: string;
}

interface ReportTableProps {
	loading: boolean;
	columns: Column[];
	visibleColumns: string[];
	data: any[];
	total: number;
	page: number;
	rowsPerPage: number;
	onPageChange: (newPage: number) => void;
	onRowsPerPageChange: (newRowsPerPage: number) => void;
}

// Removed local StyledHeaderCell in favor of common DataTableHead

const ReportTable: React.FC<ReportTableProps> = ({
	loading,
	columns,
	visibleColumns,
	data,
	total,
	page,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const activeColumns = columns.filter(c => visibleColumns.includes(c.id));

	// Map to common ColumnDefinition
	const tableColumns: ColumnDefinition<any>[] = activeColumns.map(col => ({
		id: col.id,
		label: col.label,
		sortable: false // Default for reports for now
	}));

	// Helper for Card View Rendering
	const renderMobileCard = (item: any) => (
		<Paper
			elevation={0}
			key={item.public_id}
			sx={{
				p: 2,
				mb: 2,
				border: `1px solid ${theme.palette.divider}`,
				borderRadius: `${theme.shape.borderRadius}px`,
				backgroundColor: theme.palette.background.paper
			}}
		>
			<Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1.5 }}>
				{item.candidate?.name || item.name}
			</Typography>
			<Stack spacing={1.5}>
				{activeColumns.filter(c => c.id !== 'name').map(col => (
					<Box key={col.id}>
						<Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, display: 'block', mb: 0.25, textTransform: 'uppercase' }}>
							{col.label}
						</Typography>
						<Box sx={{ fontSize: theme.typography.body2.fontSize, color: theme.palette.text.primary }}>
							{renderCell(item, col.id)}
						</Box>
					</Box>
				))}
			</Stack>
		</Paper>
	);

	const renderCell = (item: any, colId: string) => {
		let val: any;

		// 1. Precise Data Extraction (Handle both Candidate and Allocation)
		if (item.candidate && item.batch) {
			// It's an allocation
			if (colId === 'name') val = item.candidate.name;
			else if (colId === 'gender') val = item.candidate.gender;
			else if (colId === 'disability_type') val = item.candidate.disability_details?.disability_type || item.candidate.disability_details?.type;
			else if (colId === 'email') val = item.candidate.email;
			else if (colId === 'phone') val = item.candidate.phone;
			else if (colId === 'batch_name') val = item.batch.batch_name;
			else if (colId === 'batch_status') val = item.batch.status;
			else if (colId === 'domain') val = item.batch.domain;
			else if (colId === 'training_mode') val = item.batch.training_mode;
			else if (colId === 'courses') {
				if (Array.isArray(item.batch.courses)) {
					return item.batch.courses.map((c: any) => typeof c === 'string' ? c : c.name).join(', ');
				}
				return '-';
			}
			else if (colId === 'duration') {
				const dur = item.batch.duration;
				let dateStr = '';
				if (item.batch.start_date) {
					dateStr = format(new Date(item.batch.start_date), 'dd MMM yyyy');
					if (item.batch.approx_close_date) {
						dateStr += ` to ${format(new Date(item.batch.approx_close_date), 'dd MMM yyyy')}`;
					}
				}

				if (dur && (dur.weeks || dur.days)) {
					return (
						<Box>
							<Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
								{dur.weeks || 0}w, {dur.days || 0}d
							</Typography>
							{dateStr && (
								<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
									{dateStr}
								</Typography>
							)}
						</Box>
					);
				}
				return dateStr || '-';
			}
			else if (colId === 'attendance_percentage') {
				val = item.attendance_percentage;
				if (val === null || val === undefined) return '-';
				const color = val >= 90 ? theme.palette.success.main : val >= 75 ? theme.palette.warning.main : theme.palette.error.main;
				return <Box sx={{ color, fontWeight: 700 }}>{val}%</Box>;
			}
			else if (colId === 'assessment_score') {
				val = item.assessment_score;
				if (val === null || val === undefined) return '-';
				return <Box sx={{ fontWeight: 700, color: theme.palette.text.primary }}>{val}</Box>;
			}
			else val = item[colId];
		} else {
			// It's a candidate
			if (colId.startsWith('screening_others.')) {
				const fieldName = colId.substring('screening_others.'.length);
				val = (item.screening?.others as any)?.[fieldName] ?? (item as any)[fieldName];
			} else if (colId.startsWith('counseling_others.')) {
				const fieldName = colId.substring('counseling_others.'.length);
				val = (item.counseling?.others as any)?.[fieldName] ?? (item as any)[fieldName];
			} else {
				val = (item as any)[colId];
			}

			// Relationship fallback for standard fields
			if (val === undefined || val === null) {
				if (colId.includes('counseling') && item.counseling) {
					val = (item.counseling as any)[colId];
				}
			}
		}

		// Array Handling for dynamic fields (Multi-select)
		if (Array.isArray(val) && (colId.startsWith('screening_others.') || colId.startsWith('counseling_others.'))) {
			if (val.length === 0) return '-';
			return (
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
					{val.map((item: any, i: number) => (
						<Chip
							key={i}
							label={String(item)}
							size="small"
							variant="outlined"
							sx={{ fontSize: '0.65rem', height: 18 }}
						/>
					))}
				</Box>
			);
		}

		if ((colId === 'created_at' || colId === 'dob' || colId === 'counseling_date' || colId === 'screening_date' || colId === 'screening_updated_at') && val) {
			try {
				val = format(new Date(val), 'dd MMM yyyy');
			} catch (e) {
				val = '-';
			}
		}

		if (colId === 'family_details' && Array.isArray(val)) {
			if (val.length === 0) return '-';
			return (
				<Box sx={{ fontSize: '0.75rem' }}>
					{val.map((f: any, i: number) => {
						const details = [];
						if (f.occupation) details.push(f.occupation);
						if (f.company_name) details.push(f.company_name);
						if (f.position) details.push(f.position);
						const detailsStr = details.length > 0 ? ` - ${details.join(', ')}` : '';
						return (
							<div key={i} style={{ marginBottom: i < val.length - 1 ? '4px' : 0 }}>
								<strong>{f.relation}:</strong> {f.name} {detailsStr}
							</div>
						);
					})}
				</Box>
			);
		}

		if (colId === 'documents_uploaded' && Array.isArray(val)) {
			return (
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
					{val.length > 0 ? val.map((doc: string, i: number) => (
						<Chip
							key={i}
							label={doc}
							size="small"
							variant="outlined"
							sx={{ fontSize: '0.65rem', height: 18, backgroundColor: theme.palette.action.hover }}
						/>
					)) : '-'}
				</Box>
			);
		}

		if (colId === 'skills' && Array.isArray(val)) {
			return (
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
					{val.length > 0 ? val.map((s: any, i: number) => (
						<Chip key={i} label={`${s.name} (${s.level})`} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
					)) : '-'}
				</Box>
			);
		}

		if (colId === 'suitable_job_roles' && Array.isArray(val)) {
			return (
				<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
					{val.length > 0 ? val.map((role: string, i: number) => (
						<Chip
							key={i}
							label={role}
							size="small"
							variant="outlined"
							sx={{
								fontSize: '0.65rem',
								height: 18,
								backgroundColor: alpha(theme.palette.secondary.main, 0.05),
								color: theme.palette.secondary.main,
								borderColor: alpha(theme.palette.secondary.main, 0.2)
							}}
						/>
					)) : '-'}
				</Box>
			);
		}

		if ((colId === 'disability_type' || colId === 'screening_status' || colId === 'counseling_status' || colId === 'status' || colId === 'batch_status') && val) {
			const getStatusColor = (v: string) => {
				const lowerV = v.toLowerCase();
				if (lowerV === 'completed' || lowerV === 'selected' || lowerV === 'ongoing') {
					return { bg: alpha(theme.palette.success.main, 0.1), text: theme.palette.success.main, border: alpha(theme.palette.success.main, 0.2) };
				}
				if (lowerV === 'allocated' || lowerV === 'pending') {
					return { bg: alpha(theme.palette.warning.main, 0.1), text: theme.palette.warning.main, border: alpha(theme.palette.warning.main, 0.2) };
				}
				if (lowerV === 'rejected' || lowerV === 'dropped_out') {
					return { bg: alpha(theme.palette.error.main, 0.1), text: theme.palette.error.main, border: alpha(theme.palette.error.main, 0.2) };
				}
				return { bg: theme.palette.action.hover, text: theme.palette.text.secondary, border: theme.palette.divider };
			};
			const colors = getStatusColor(val);
			return <Chip label={val} size="small" sx={{ borderRadius: '4px', backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, fontWeight: 600, fontSize: '0.7rem', height: 20 }} />;
		}

		if (colId === 'disability_percentage' && val) {
			return `${val}%`;
		}

		if (colId === 'questions' && Array.isArray(val)) {
			if (val.length === 0) return '-';
			return (
				<Box sx={{ fontSize: '0.75rem' }}>
					{val.map((q: any, i: number) => (
						<div key={i} style={{ marginBottom: i < val.length - 1 ? '4px' : 0 }}>
							<Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main, display: 'block' }}>Q: {q.question}</Typography>
							<Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>A: {q.answer}</Typography>
						</div>
					))}
				</Box>
			);
		}

		if (colId === 'workexperience' && Array.isArray(val)) {
			if (val.length === 0) return '-';
			return (
				<Box sx={{ fontSize: '0.75rem' }}>
					{val.map((w: any, i: number) => (
						<div key={i} style={{ marginBottom: i < val.length - 1 ? '4px' : 0 }}>
							<strong>{w.job_title}</strong> at {w.company}
						</div>
					))}
				</Box>
			);
		}

		if (colId === 'screening_comments' && val) {
			return (
				<Box sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={val}>
					{val}
				</Box>
			);
		}

		if (typeof val === 'boolean') return val ? 'Yes' : 'No';

		const finalVal = (val !== undefined && val !== null) ? String(val).trim() : '';
		return finalVal !== '' ? finalVal : '-';
	};

	return (
		<TableContainer
			component={Paper}
			elevation={0}
			sx={{
				flex: 1,
				width: '100%',
				border: `1px solid ${theme.palette.divider}`,
				borderRadius: `0 0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px`,
				position: 'relative',
				overflow: 'hidden',
				display: 'flex',
				flexDirection: 'column',
				'&::-webkit-scrollbar': { height: 8, width: 8 },
				'&::-webkit-scrollbar-track': { backgroundColor: theme.palette.background.default },
				'&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.divider, borderRadius: 4 },
			}}
		>
			{loading && (
				<Box sx={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: alpha(theme.palette.background.paper, 0.6),
					zIndex: 2
				}}>
					<CircularProgress size={32} thickness={4} />
				</Box>
			)}
			<Box sx={{
				flex: 1,
				overflow: 'auto',
				width: '100%',
				'WebkitOverflowScrolling': 'touch',
				p: isMobile ? 2 : 0,
				backgroundColor: isMobile ? theme.palette.background.default : 'transparent'
			}}>
				{isMobile ? (
					<Box role="list" aria-label="Candidates report list">
						{data.length > 0 ? data.map(candidate => renderMobileCard(candidate)) : (
							<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
								No candidate data available.
							</Typography>
						)}
					</Box>
				) : (
					<Table size="small" stickyHeader aria-label="Candidates report table" role="table">
						<DataTableHead 
							columns={tableColumns}
						/>
						<TableBody>
							{data.length > 0 ? (
								data.map((candidate, idx) => (
									<TableRow
										key={candidate.public_id}
										role="row"
										sx={{
											backgroundColor: idx % 2 === 0 ? theme.palette.background.paper : theme.palette.action.hover,
											'&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) },
											'& td': { borderBottom: `1px solid ${theme.palette.divider}` }
										}}
									>
										{activeColumns.map(col => (
											<TableCell
												key={col.id}
												role="cell"
												sx={{
													py: 1,
													px: 2,
													fontSize: '0.8125rem',
													color: theme.palette.text.primary,
													borderRight: `1px solid ${theme.palette.divider}`,
													'&:last-child': { borderRight: 'none' }
												}}
											>
												{renderCell(candidate, col.id)}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<DataTableEmpty 
									colSpan={activeColumns.length} 
									message="No candidate data available for the current selection."
								/>
							)}
						</TableBody>
					</Table>
				)}
			</Box>
			<CustomTablePagination
				count={total}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_: unknown, p: number) => onPageChange(p)}
				onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => onRowsPerPageChange(parseInt(e.target.value, 10))}
				onRowsPerPageSelectChange={(rows: number) => onRowsPerPageChange(rows)}
			/>
		</TableContainer>
	);
};

export default ReportTable;
