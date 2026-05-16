import React, { useState, useEffect, useMemo } from 'react';
import {
	Button,
	Box,
	Typography,
	Radio,
	CircularProgress,
	Chip,
	FormControlLabel,
	Checkbox,
	useTheme,
	alpha,
	TableRow,
	TableCell
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchTrainingBatches, reallocateCandidate } from '../../../store/slices/trainingSlice';
import useToast from '../../../hooks/useToast';
import BaseDialog from '../../common/dialogbox/BaseDialog';
import DataTable from '../../common/table/DataTable';
import type { ColumnDefinition } from '../../common/table/DataTable';
import type { CandidateAllocation, TrainingBatch } from '../../../models/training';

interface MoveCandidateDialogProps {
	open: boolean;
	onClose: () => void;
	allocation: CandidateAllocation | null;
}

const MoveCandidateDialog: React.FC<MoveCandidateDialogProps> = ({
	open,
	onClose,
	allocation
}) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { batches, loading } = useAppSelector((state) => state.training);

	const [searchTerm, setSearchTerm] = useState('');
	const [selectedBatchId, setSelectedBatchId] = useState<string>('');
	const [transferData, setTransferData] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	// Local pagination state
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	useEffect(() => {
		if (open) {
			dispatch(fetchTrainingBatches({ status: 'running,planned', limit: 500 }));
			setSelectedBatchId('');
			setPage(0);
		}
	}, [open, dispatch]);

	const columns: ColumnDefinition<TrainingBatch>[] = useMemo(() => [
		{ id: 'select' as any, label: 'Select', width: 50 },
		{ id: 'batch_name' as any, label: 'Batch Name' },
		{ id: 'training_mode' as any, label: 'Course' },
		{ id: 'status' as any, label: 'Status' }
	], []);

	const filteredBatches = batches.filter(b =>
		(b.batch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			b.training_mode?.toLowerCase().includes(searchTerm.toLowerCase())) &&
		b.id !== allocation?.batch_id
	);

	const paginatedBatches = useMemo(() => {
		return filteredBatches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
	}, [filteredBatches, page, rowsPerPage]);

	const handleSubmit = async () => {
		if (!selectedBatchId || !allocation) return;

		setSubmitting(true);
		try {
			await dispatch(reallocateCandidate({
				publicId: allocation.public_id,
				newBatchPublicId: selectedBatchId,
				transferData: transferData
			})).unwrap();

			toast.success(`Successfully moved candidate to new batch`);
			onClose();
		} catch (error: any) {
			toast.error(error || 'Failed to move candidate');
		} finally {
			setSubmitting(false);
		}
	};

	if (!allocation) return null;

	const dialogActions = (
		<>
			<Button 
				onClick={onClose} 
				disabled={submitting}
				sx={{ textTransform: 'none', fontWeight: 600 }}
			>
				Cancel
			</Button>
			<Button
				variant="contained"
				onClick={handleSubmit}
				disabled={!selectedBatchId || submitting}
				sx={{
					bgcolor: 'primary.main',
					'&:hover': { bgcolor: 'primary.dark' },
					textTransform: 'none',
					fontWeight: 700,
					px: 4,
					borderRadius: 1.5,
					boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
				}}
			>
				{submitting ? <CircularProgress size={20} color="inherit" /> : 'Move Candidate'}
			</Button>
		</>
	);

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Move Candidate"
			subtitle={`Relocate ${allocation.candidate?.name} from ${allocation.batch?.batch_name} to a new batch.`}
			maxWidth="md"
			actions={dialogActions}
			loading={submitting}
		>
			<DataTable
				columns={columns}
				data={paginatedBatches}
				loading={loading}
				totalCount={filteredBatches.length}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, newPage) => setPage(newPage)}
				onRowsPerPageChange={(newRows) => {
					setRowsPerPage(newRows);
					setPage(0);
				}}
				searchTerm={searchTerm}
				onSearchChange={(val) => {
					setSearchTerm(val);
					setPage(0);
				}}
				searchPlaceholder="Search target batch by name or course..."
				renderRow={(batch) => (
					<TableRow
						key={batch.public_id}
						hover
						selected={selectedBatchId === batch.public_id}
						onClick={() => setSelectedBatchId(batch.public_id)}
						sx={{ 
							cursor: 'pointer',
							'&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
							'&.Mui-selected:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
						}}
					>
						<TableCell padding="checkbox">
							<Radio
								checked={selectedBatchId === batch.public_id}
								size="small"
								sx={{ color: 'primary.main' }}
							/>
						</TableCell>
						<TableCell sx={{ fontWeight: 600 }}>{batch.batch_name}</TableCell>
						<TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{batch.training_mode || '-'}</TableCell>
						<TableCell>
							<Chip
								label={batch.status}
								size="small"
								color={batch.status === 'running' ? 'success' : 'primary'}
								variant="outlined"
								sx={{ 
									borderRadius: 1, 
									fontWeight: 700, 
									textTransform: 'uppercase',
									fontSize: '0.65rem',
									letterSpacing: '0.05em'
								}}
							/>
						</TableCell>
					</TableRow>
				)}
				emptyMessage="No available batches found to move the candidate to."
			/>

			{allocation.status !== 'allocated' && (
				<Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
					<FormControlLabel
						control={
							<Checkbox
								checked={transferData}
								onChange={(e) => setTransferData(e.target.checked)}
								sx={{ color: 'primary.main' }}
							/>
						}
						label={
							<Box>
								<Typography variant="body2" sx={{ fontWeight: 700 }}>
									Transfer existing progress (attendance, scores, etc.)
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
									If checked, current training records will be moved to the new batch automatically.
								</Typography>
							</Box>
						}
					/>
				</Box>
			)}
		</BaseDialog>
	);
};

export default MoveCandidateDialog;
