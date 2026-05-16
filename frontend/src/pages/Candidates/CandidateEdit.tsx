import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	Box,
	Alert,
	Button,
	Container,
	CircularProgress
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import CandidateRegistrationForm from '../../components/candidates/forms/CandidateRegistrationForm';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCandidateById, updateCandidate, clearSelectedCandidate } from '../../store/slices/candidateSlice';
import type { CandidateUpdate } from '../../models/candidate';
import PageHeader from '../../components/common/page-header';

const CandidateEdit: React.FC = () => {
	const { publicId } = useParams<{ publicId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { selectedCandidate: candidate, loading, error } = useAppSelector((state) => state.candidates);

	useEffect(() => {
		if (publicId) {
			dispatch(fetchCandidateById({ publicId, withDetails: true }));
		}
		return () => {
			dispatch(clearSelectedCandidate());
		};
	}, [publicId, dispatch]);

	const handleSubmit = async (data: any) => {
		if (!publicId) return;

		try {
			await dispatch(updateCandidate({ publicId, data: data as CandidateUpdate })).unwrap();
			navigate('/candidates/list');
		} catch (error: any) {
			console.error('Error updating candidate:', error);
			throw error;
		}
	};

	const handleCancel = () => {
		navigate(-1);
	};

	if (error) {
		return (
			<Box sx={{ p: 4 }}>
				<Alert severity="error" variant="outlined" sx={{ borderRadius: 0, borderLeft: '4px solid #d91d11' }}>
					{error}
				</Alert>
				<Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/candidates/list')} sx={{ mt: 2 }}>
					Back to Candidates
				</Button>
			</Box>
		);
	}

	return (
		<Box>
			<Box sx={{ px: { xs: 2, sm: 4, md: 5 }, py: 1.5, bgcolor: 'background.default' }}>
				<Button
					variant="text"
					startIcon={<ArrowBackIcon />}
					onClick={() => navigate('/candidates/list')}
					sx={{
						textTransform: 'none',
						fontWeight: 700,
						color: 'text.secondary',
						'&:hover': { color: 'primary.main', bgcolor: 'transparent' }
					}}
				>
					Back to Candidates
				</Button>
			</Box>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				<PageHeader
					title={candidate ? `Edit Candidate: ${candidate.name}` : 'Edit Candidate'}
					subtitle="Update candidate profile information across all sections."
				/>

				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
						<CircularProgress />
					</Box>
				) : !candidate ? (
					<Alert severity="warning">Candidate not found.</Alert>
				) : (
					<Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
						<CandidateRegistrationForm
							initialData={candidate}
							onSubmit={handleSubmit}
							onCancel={handleCancel}
						/>
					</Box>
				)}
			</Container>
		</Box>
	);
};

export default CandidateEdit;
