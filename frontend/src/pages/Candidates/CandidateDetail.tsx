import React, { useEffect, useState } from 'react';
import {
	Box,
	Button,
	Tabs,
	Tab,
	Alert,
	Typography,
	IconButton
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon,
	Edit as EditIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCandidateById, clearSelectedCandidate } from '../../store/slices/candidateSlice';

import GeneralInfoTab from '../../components/candidates/detailedView/tabs/GeneralInfoTab';
import ScreeningTab from '../../components/candidates/detailedView/tabs/ScreeningTab';
import CounselingTab from '../../components/candidates/detailedView/tabs/CounselingTab';
import DocumentsTab from '../../components/candidates/detailedView/tabs/DocumentsTab';
import TrainingAllocationTab from '../../components/candidates/detailedView/tabs/TrainingAllocationTab';
import CandidateAttendanceTab from '../../components/candidates/detailedView/tabs/CandidateAttendanceTab';
import CandidatePlacementTab from '../../components/candidates/detailedView/tabs/CandidatePlacementTab';
// import CandidateAssignmentTab from '../../components/candidates/detailedView/tabs/CandidateAssignmentTab';
// import CandidateMockInterviewTab from '../../components/candidates/detailedView/tabs/CandidateMockInterviewTab';

import ModuleLayout from '../../components/common/layout/ModuleLayout';

const CandidateDetail: React.FC = () => {
	const { publicId } = useParams<{ publicId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { selectedCandidate: candidate, loading, error } = useAppSelector((state) => state.candidates);
	const [tabValue, setTabValue] = useState(0);

	useEffect(() => {
		if (publicId) {
			dispatch(fetchCandidateById({ publicId, withDetails: true }));
		}
		return () => {
			dispatch(clearSelectedCandidate());
		};
	}, [publicId, dispatch]);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	if (error) {
		return (
			<Box sx={{ p: 4 }}>
				<Alert severity="error" variant="outlined" sx={{ borderRadius: 0, borderLeft: '4px solid #d91d11' }}>
					{error}
				</Alert>
				<Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/candidates')} sx={{ mt: 2, textTransform: 'none' }}>
					Back to Candidates
				</Button>
			</Box>
		);
	}

	const headerChildren = (
		<Tabs
			value={tabValue}
			onChange={handleTabChange}
			variant="scrollable"
			scrollButtons="auto"
			sx={{
				'& .MuiTab-root': {
					textTransform: 'none',
					fontWeight: 600,
					minWidth: 120,
					color: 'rgba(255,255,255,0.7)',
					fontSize: '0.95rem',
					'&.Mui-selected': {
						color: 'white'
					}
				},
				'& .MuiTabs-indicator': {
					bgcolor: 'primary.main',
					height: 3,
					borderRadius: '3px 3px 0 0'
				}
			}}
		>
			<Tab label="General Information" id="tab-0" />
			<Tab label="Screening" id="tab-1" />
			<Tab label="Counseling" id="tab-2" />
			<Tab label="Documents" id="tab-3" />
			<Tab label="Allocation" id="tab-4" />
			<Tab label="Attendance" id="tab-5" />
			<Tab label="Placement" id="tab-6" />
		</Tabs>
	);

	return (
		<Box>
			<Box sx={{ px: { xs: 2, sm: 4, md: 5 }, py: 1.5, bgcolor: 'background.default' }}>
				<Button
					variant="text"
					startIcon={<ArrowBackIcon />}
					onClick={() => navigate('/candidates')}
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
			<ModuleLayout
				title={
					candidate ? (
						<Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
							<Typography variant="inherit" component="span" sx={{ fontWeight: 700 }}>
								{candidate.name}
							</Typography>
							<IconButton
								size="small"
								onClick={() => navigate(`/candidates/edit/${candidate.public_id}`)}
								sx={{
									color: 'common.white',
									bgcolor: 'rgba(255,255,255,0.1)',
									border: '1px solid rgba(255,255,255,0.2)',
									'&:hover': {
										bgcolor: 'rgba(255,255,255,0.2)',
										transform: 'scale(1.1)'
									},
									transition: 'all 0.2s'
								}}
							>
								<EditIcon fontSize="small" />
							</IconButton>
						</Box>
					) : 'Candidate Details'
				}
				subtitle={candidate ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
						<Typography variant="inherit">Candidate ID: {candidate.public_id}</Typography>
						<Typography variant="inherit">Registered on {new Date(candidate.created_at).toLocaleDateString()}</Typography>
					</Box>
				) : 'View the candidate details and manage their status'}
				headerChildren={headerChildren}
				loading={loading}
				isEmpty={!loading && !candidate}
				emptyTitle="Candidate Not Found"
				emptyMessage="We couldn't find the candidate you're looking for. It may have been deleted or the ID is incorrect."
			>
				{candidate && (
					<Box sx={{ py: 1 }}>
						{tabValue === 0 && <GeneralInfoTab candidate={candidate} />}
						{tabValue === 1 && <ScreeningTab candidate={candidate} />}
						{tabValue === 2 && <CounselingTab candidate={candidate} />}
						{tabValue === 3 && <DocumentsTab candidate={candidate} />}
						{tabValue === 4 && <TrainingAllocationTab candidate={candidate} />}
						{tabValue === 5 && <CandidateAttendanceTab candidate={candidate} />}
						{tabValue === 6 && <CandidatePlacementTab candidate={candidate} />}
					</Box>
				)}
			</ModuleLayout>
		</Box>
	);
};

export default CandidateDetail;
