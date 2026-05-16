import React, { useState, useEffect } from 'react';
import {
	Button,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	CircularProgress,
	Typography,
	Box,
	Alert
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { assignCandidate } from '../../store/slices/candidateSlice';
import { fetchAssignmentUsers } from '../../store/slices/userSlice';
import type { CandidateListItem } from '../../models/candidate';
import { BaseDialog } from '../common/dialogbox';

interface AssignCandidateDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
	candidates: CandidateListItem[];
}

const AssignCandidateDialog: React.FC<AssignCandidateDialogProps> = ({ open, onClose, onSuccess, candidates }) => {
	const dispatch = useAppDispatch();
	const { assignmentUsers: users, loading } = useAppSelector((state) => state.users);
	const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			dispatch(fetchAssignmentUsers());
			// For bulk, we don't pre-select an assigned user unless it's a single candidate
			if (candidates.length === 1 && candidates[0]?.assigned_to_id) {
				setSelectedUserId(candidates[0].assigned_to_id);
			} else {
				setSelectedUserId('');
			}
			setError(null);
		}
	}, [open, candidates, dispatch]);

	const handleSubmit = async () => {
		if (candidates.length === 0 || !selectedUserId) return;

		setSubmitting(true);
		setError(null);
		try {
			// Perform bulk assignment
			await Promise.all(candidates.map(candidate => 
				dispatch(assignCandidate({ 
					publicId: candidate.public_id, 
					userId: Number(selectedUserId) 
				})).unwrap()
			));
			
			onSuccess?.();
			onClose();
		} catch (err: any) {
			setError(err || 'Failed to assign candidates');
		} finally {
			setSubmitting(false);
		}
	};

	const dialogActions = (
		<>
			<Button onClick={onClose} disabled={submitting}>
				Cancel
			</Button>
			<Button 
				onClick={handleSubmit} 
				variant="contained" 
				color="primary"
				disabled={!selectedUserId || submitting}
			>
				{submitting ? <CircularProgress size={24} color="inherit" /> : 'Assign'}
			</Button>
		</>
	);

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title={`Assign ${candidates.length > 1 ? 'Candidates' : 'Candidate'}`}
			subtitle={candidates.length > 1 ? `${candidates.length} candidates selected` : candidates[0]?.name}
			actions={dialogActions}
			loading={submitting}
		>
			<Box>
				{candidates.length > 0 && (
					<Typography variant="body2" color="text.secondary" gutterBottom>
						{candidates.length === 1 ? (
							<>Assign this candidate to a team member for screening.</>
						) : (
							<>Assign the selected candidates to a team member for screening.</>
						)}
					</Typography>
				)}

				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
						<CircularProgress size={24} />
					</Box>
				) : (
					<FormControl fullWidth sx={{ mt: 2 }}>
						<InputLabel id="assign-user-label">Select Team Member</InputLabel>
						<Select
							labelId="assign-user-label"
							value={selectedUserId}
							label="Select Team Member"
							onChange={(e) => setSelectedUserId(e.target.value as number)}
							disabled={submitting}
						>
							<MenuItem value="">
								<em>None</em>
							</MenuItem>
							{users.map((user) => (
								<MenuItem key={user.id} value={user.id}>
									{user.full_name} ({user.email})
								</MenuItem>
							))}
						</Select>
					</FormControl>
				)}
			</Box>
		</BaseDialog>
	);
};

export default AssignCandidateDialog;
