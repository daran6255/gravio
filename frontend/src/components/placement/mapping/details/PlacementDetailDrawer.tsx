import { useState, useEffect, useCallback } from 'react';
import {
	Box,
	Drawer,
	Tab,
	Tabs,
	CircularProgress,
	useTheme,
	alpha
} from '@mui/material';
import {
	History as HistoryIcon,
	LocalOffer as OfferIcon,
	Notes as NotesIcon,
} from '@mui/icons-material';

// Redux
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { 
	fetchPipelineHistory, 
	fetchOffer, 
	fetchNotes, 
	fetchCandidateDocuments,
	addPlacementNote,
	recordOfferResponse, 
	recordJoiningStatus,
	clearDetail
} from '../../../../store/slices/placementDetailSlice';

// Hooks & Utils
import useToast from '../../../../hooks/useToast';

// Sub-components
import DrawerHeader from './DrawerHeader';
import TimelineTab from './tabs/TimelineTab';
import OfferTab from './tabs/OfferTab';
import NotesTab from './tabs/NotesTab';

interface Props {
	open: boolean;
	onClose: () => void;
	mappingId: number;
	candidatePublicId?: string;
	candidateName: string;
	jobTitle: string;
	onStatusChange?: () => void;
}

const PlacementDetailDrawer = ({ 
	open, 
	onClose, 
	mappingId, 
	candidatePublicId, 
	candidateName, 
	jobTitle, 
	onStatusChange 
}: Props) => {
	const toast = useToast();
	const theme = useTheme();
	const dispatch = useAppDispatch();
	
	// Redux state
	const { history, offer, notes, candidateDocuments, loading } = useAppSelector(state => state.placementDetail);
	
	// Local state
	const [tabValue, setTabValue] = useState(0);
	const [newNote, setNewNote] = useState('');
	const [isAddingNote, setIsAddingNote] = useState(false);

	const fetchData = useCallback(async () => {
		if (!mappingId) return;

		try {
			if (tabValue === 0) {
				dispatch(fetchPipelineHistory(mappingId));
				// Also fetch offer to show in timeline if needed
				dispatch(fetchOffer(mappingId));
			} else if (tabValue === 1) {
				dispatch(fetchOffer(mappingId));
			} else if (tabValue === 2) {
				dispatch(fetchNotes(mappingId));
			}

			// Fetch candidate docs for resume via slice
			if (candidatePublicId) {
				dispatch(fetchCandidateDocuments(candidatePublicId));
			}
		} catch (error) {
			console.error("Error fetching drawer data:", error);
		}
	}, [mappingId, tabValue, candidatePublicId, dispatch]);

	useEffect(() => {
		if (open) {
			fetchData();
		} else {
			dispatch(clearDetail());
		}
	}, [open, fetchData, dispatch]);

	const handleTabChange = (_: any, newValue: number) => {
		setTabValue(newValue);
	};

	const handleViewDocument = async (docId?: number, fallbackUrl?: string) => {
		if (docId) {
			try {
				const { documentService } = await import('../../../../services/candidateService');
				const blob = await documentService.download(docId);
				const url = window.URL.createObjectURL(blob);
				window.open(url, '_blank');
				setTimeout(() => window.URL.revokeObjectURL(url), 1000);
			} catch (error) {
				console.error('Failed to view document:', error);
				toast.error('Failed to load document');
				if (fallbackUrl) {
					const finalUrl = fallbackUrl.startsWith('http') ? fallbackUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${fallbackUrl}`;
					window.open(finalUrl, '_blank');
				}
			}
		} else if (fallbackUrl) {
			const finalUrl = fallbackUrl.startsWith('http') ? fallbackUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${fallbackUrl}`;
			window.open(finalUrl, '_blank');
		}
	};

	const handleRecordOfferResponse = async (response: 'accepted' | 'rejected' | 'pending', remarks?: string) => {
		if (!offer) return;
		try {
			await dispatch(recordOfferResponse({ offerId: offer.id, response, remarks: remarks || undefined })).unwrap();
			toast.success(`Offer ${response} successfully`);
			if (onStatusChange) onStatusChange();
			dispatch(fetchPipelineHistory(mappingId)); // Refresh timeline
		} catch (error: any) {
			toast.error(error.message || 'Failed to record response');
		}
	};

	const handleRecordJoining = async (status: 'joined' | 'not_joined' | 'pending') => {
		if (!offer) return;
		try {
			const joiningDate = status === 'joined' ? new Date().toISOString().split('T')[0] : undefined;
			await dispatch(recordJoiningStatus({ offerId: offer.id, status, joiningDate })).unwrap();
			toast.success(`Candidate marked as ${status.replace('_', ' ')}`);
			
			if (onStatusChange) onStatusChange();
			dispatch(fetchPipelineHistory(mappingId)); // Refresh timeline
		} catch (error: any) {
			toast.error(error.message || 'Failed to record joining status');
		}
	};

	const handleAddNote = async () => {
		if (!newNote.trim()) return;
		setIsAddingNote(true);
		try {
			await dispatch(addPlacementNote({
				mapping_id: mappingId,
				content: newNote.trim()
			})).unwrap();
			setNewNote('');
			toast.success('Note added successfully');
		} catch (error: any) {
			toast.error(error.message || 'Failed to add note');
		} finally {
			setIsAddingNote(false);
		}
	};

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			sx={{ zIndex: (theme) => theme.zIndex.drawer + 100 }}
			PaperProps={{
				sx: { width: { xs: '100%', sm: 550 }, border: 'none' }
			}}
		>
			<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: theme.palette.background.default }}>
				<DrawerHeader 
					candidateName={candidateName}
					jobTitle={jobTitle}
					documents={candidateDocuments}
					onClose={onClose}
					onViewResume={handleViewDocument}
				/>

				<Box sx={{ borderBottom: 1, borderColor: theme.palette.divider, bgcolor: theme.palette.background.paper }}>
					<Tabs
						value={tabValue}
						onChange={handleTabChange}
						variant="fullWidth"
						sx={{
							minHeight: 48,
							'& .MuiTab-root': {
								textTransform: 'none',
								fontWeight: 700,
								fontSize: '0.8125rem',
								color: theme.palette.text.secondary,
								'&.Mui-selected': { color: theme.palette.primary.main }
							},
							'& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
						}}
					>
						<Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} label="Timeline" iconPosition="start" />
						<Tab icon={<OfferIcon sx={{ fontSize: 18 }} />} label="Offer" iconPosition="start" />
						<Tab icon={<NotesIcon sx={{ fontSize: 18 }} />} label="Notes" iconPosition="start" />
					</Tabs>
				</Box>

				<Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, position: 'relative' }}>
					{loading && (
						<Box sx={{ 
							position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
							display: 'flex', alignItems: 'center', justifyContent: 'center',
							bgcolor: alpha(theme.palette.background.default, 0.5), zIndex: 1 
						}}>
							<CircularProgress size={32} thickness={5} sx={{ color: theme.palette.accent.main }} />
						</Box>
					)}

					<Box sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
						{tabValue === 0 && (
							<TimelineTab 
								history={history} 
								onViewDocument={handleViewDocument} 
								offerId={offer?.offer_letter_id}
							/>
						)}

						{tabValue === 1 && (
							<OfferTab 
								offer={offer}
								onRecordOfferResponse={handleRecordOfferResponse}
								onRecordJoining={handleRecordJoining}
								onViewDocument={handleViewDocument}
							/>
						)}

						{tabValue === 2 && (
							<NotesTab 
								notes={notes}
								newNote={newNote}
								onNewNoteChange={setNewNote}
								onAddNote={handleAddNote}
								isAdding={isAddingNote}
							/>
						)}
					</Box>
				</Box>
			</Box>
		</Drawer>
	);
};

export default PlacementDetailDrawer;
