import React, { useState, useEffect, useMemo } from 'react';
import {
	Button,
	Checkbox,
	CircularProgress,
	useTheme,
	alpha,
	TableRow,
	TableCell,
	Typography
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchEligibleCandidates, allocateCandidate } from '../../../store/slices/trainingSlice';
import useToast from '../../../hooks/useToast';
import BaseDialog from '../../common/dialogbox/BaseDialog';
import DataTable from '../../common/table/DataTable';
import type { ColumnDefinition } from '../../common/table/DataTable';

interface EligibleCandidate {
	public_id: string;
	name: string;
	email: string;
	phone: string;
	disability_type?: string;
}

interface AllocateCandidateDialogProps {
	open: boolean;
	onClose: () => void;
	batchId: number;
	batchPublicId: string;
	batchName: string;
}

const AllocateCandidateDialog: React.FC<AllocateCandidateDialogProps> = ({
	open,
	onClose,
	batchId,
	batchPublicId,
	batchName
}) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { eligibleCandidates, loading } = useAppSelector((state) => state.training);

	const [searchTerm, setSearchTerm] = useState('');
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [submitting, setSubmitting] = useState(false);
	
	// Local pagination state
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	useEffect(() => {
		if (open) {
			dispatch(fetchEligibleCandidates(batchPublicId));
			setSelectedIds([]);
			setPage(0);
		}
	}, [open, batchPublicId, dispatch]);

	const columns: ColumnDefinition<EligibleCandidate>[] = useMemo(() => [
		{ id: 'name' as any, label: 'Candidate Name' },
		{ id: 'email' as any, label: 'Email' },
		{ id: 'phone' as any, label: 'Phone' },
		{ id: 'disability' as any, label: 'Disability' }
	], []);

	const filteredCandidates = eligibleCandidates.filter(c =>
		c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
		c.phone.includes(searchTerm)
	);

	const paginatedCandidates = useMemo(() => {
		return filteredCandidates.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
	}, [filteredCandidates, page, rowsPerPage]);

	const handleToggleSelect = (id: string) => {
		setSelectedIds(prev =>
			prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
		);
	};

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelectedIds(filteredCandidates.map(c => c.public_id));
		} else {
			setSelectedIds([]);
		}
	};

	const handleSubmit = async () => {
		if (selectedIds.length === 0) return;

		setSubmitting(true);
		try {
			for (const candidatePublicId of selectedIds) {
				const candidate = eligibleCandidates.find(c => c.public_id === candidatePublicId);
				if (candidate) {
					await dispatch(allocateCandidate({
						batchId,
						candidateId: 0,
						batchPublicId,
						candidatePublicId: candidate.public_id
					})).unwrap();
				}
			}

			toast.success(`Successfully enrolled ${selectedIds.length} candidate(s)`);
			onClose();
		} catch (error: any) {
			toast.error(error || 'Failed to enroll candidates');
		} finally {
			setSubmitting(false);
		}
	};

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
				disabled={selectedIds.length === 0 || submitting}
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
				{submitting ? <CircularProgress size={20} color="inherit" /> : `Enroll ${selectedIds.length} Candidate(s)`}
			</Button>
		</>
	);

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Enroll Candidates"
			subtitle={`Select eligible candidates to add to the batch: ${batchName}`}
			maxWidth="md"
			actions={dialogActions}
			loading={submitting}
		>
			<DataTable
				columns={columns}
				data={paginatedCandidates}
				loading={loading}
				totalCount={filteredCandidates.length}
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
				searchPlaceholder="Search candidates by name, email or phone..."
				numSelected={selectedIds.length}
				onSelectAllClick={handleSelectAll}
				renderRow={(candidate) => (
					<TableRow
						key={candidate.public_id}
						hover
						selected={selectedIds.includes(candidate.public_id)}
						onClick={() => handleToggleSelect(candidate.public_id)}
						sx={{ 
							cursor: 'pointer',
							'&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
							'&.Mui-selected:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
						}}
					>
						<TableCell padding="checkbox">
							<Checkbox
								checked={selectedIds.includes(candidate.public_id)}
								size="small"
								sx={{ color: 'primary.main' }}
							/>
						</TableCell>
						<TableCell sx={{ fontWeight: 600 }}>{candidate.name}</TableCell>
						<TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{candidate.email}</TableCell>
						<TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{candidate.phone}</TableCell>
						<TableCell>
							<Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05), px: 1, py: 0.2, borderRadius: 0.5 }}>
								{candidate.disability_type || 'General'}
							</Typography>
						</TableCell>
					</TableRow>
				)}
				emptyMessage="No eligible candidates found."
			/>
		</BaseDialog>
	);
};

export default AllocateCandidateDialog;
