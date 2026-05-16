import React, { useMemo, useState } from 'react';
import {
	Box,
	Typography,
	Button,
	CircularProgress,
	useTheme,
} from '@mui/material';
import {
	Settings as SettingsIcon,
} from '@mui/icons-material';
import {
	DndContext,
	DragOverlay,
	closestCorners,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	defaultDropAnimationSideEffects,
	type DragStartEvent,
	type DragEndEvent
} from '@dnd-kit/core';
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy
} from '@dnd-kit/sortable';

import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { fetchMatchesForJobRole, updatePlacementStatus, uploadOfferLetter, type CandidateMatchResult } from '../../../../../store/slices/placementMappingSlice';
import StatusChangeDialog from '../../../mapping/dialogs/StatusChangeDialog';
import OfferLetterUploadDialog from '../../../mapping/dialogs/OfferLetterUploadDialog';
import PlacementDetailDrawer from '../../../mapping/details/PlacementDetailDrawer';

// Modular Components
import SortableCard from './SortableCard';
import KanbanColumn from './KanbanColumn';
import PipelineSettingsDialog from './PipelineSettingsDialog';

interface PipelineKanbanTabProps {
	jobRolePublicId: string;
}

const PipelineKanbanTab: React.FC<PipelineKanbanTabProps> = ({ jobRolePublicId }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { matches, loading } = useAppSelector((state) => state.placementMapping);
	const mappedCandidates = useMemo(() => matches.filter(m => m.is_already_mapped), [matches]);

	// Dialog/Drawer State
	const [activeCandidate, setActiveCandidate] = useState<CandidateMatchResult | null>(null);
	const [draggedCandidate, setDraggedCandidate] = useState<CandidateMatchResult | null>(null);
	const [statusDialog, setStatusDialog] = useState<{ open: boolean, from: string, to: string } | null>(null);
	const [offerUploadDialogOpen, setOfferUploadDialogOpen] = useState(false);
	const [historyDrawer, setHistoryDrawer] = useState<{ open: boolean, id: number, name: string, candidatePublicId: string } | null>(null);
	const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

	const { currentJobRole: jobRole } = useAppSelector(state => state.jobRoles);

	const dynamicColumns = useMemo(() => {
		if (!jobRole?.pipeline_stages) return [];

		const columns: { id: string, title: string, stages: string[], category: string }[] = [];

		jobRole.pipeline_stages.forEach(stage => {
			const stages = [stage.id];
			
			// Handle status aliases (offered and offer_made are equivalent)
			if (stage.id === 'offer_made') stages.push('offered');
			if (stage.id === 'offered') stages.push('offer_made');

			columns.push({
				id: stage.id,
				title: stage.label,
				stages: stages,
				category: stage.category
			});
		});

		return columns;
	}, [jobRole?.pipeline_stages]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	React.useEffect(() => {
		if (jobRolePublicId) {
			dispatch(fetchMatchesForJobRole(jobRolePublicId));
		}
	}, [jobRolePublicId, dispatch]);

	const getColumnData = (stages: string[]) => {
		return mappedCandidates.filter(c => {
			const status = (c.status || 'mapped').toLowerCase();
			return stages.includes(status);
		});
	};

	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;
		const candidate = mappedCandidates.find(c => c.candidate_id.toString() === active.id);
		if (candidate) setDraggedCandidate(candidate);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setDraggedCandidate(null);

		if (!over) return;

		const candidateId = active.id;
		const overId = over.id.toString();

		const candidate = mappedCandidates.find(c => c.candidate_id.toString() === candidateId);
		if (!candidate) return;

		// Find which column it was dropped into
		const targetCol = dynamicColumns.find(col =>
			col.id === overId ||
			getColumnData(col.stages).some(c => c.candidate_id.toString() === overId)
		);

		if (targetCol) {
			const currentStatus = (candidate.status || 'mapped').toLowerCase();
			const isTargetStatusSame = targetCol.stages.includes(currentStatus);

			if (!isTargetStatusSame) {
				const toStatus = targetCol.stages[0]; // Take the primary stage of the column
				setActiveCandidate(candidate);
				
				if (toStatus === 'offer_made' || toStatus === 'offered') {
					setOfferUploadDialogOpen(true);
				} else {
					setStatusDialog({
						open: true,
						from: candidate.status || 'Mapped',
						to: toStatus
					});
				}
			}
		}
	};

	const handleOfferLetterUpload = async (data: { 
		file: File; 
		offered_ctc?: number; 
		joining_date?: string; 
		offered_designation?: string; 
		remarks?: string 
	}) => {
		if (activeCandidate && jobRole) {
			try {
				await dispatch(uploadOfferLetter({
					mappingId: activeCandidate.mapping_id!,
					file: data.file,
					metadata: {
						offered_ctc: data.offered_ctc,
						joining_date: data.joining_date,
						offered_designation: data.offered_designation,
						remarks: data.remarks
					}
				})).unwrap();
				
				// Refresh data to show changes
				dispatch(fetchMatchesForJobRole(jobRolePublicId));
				setOfferUploadDialogOpen(false);
				setActiveCandidate(null);
			} catch (error) {
				console.error("Failed to upload offer letter", error);
			}
		}
	};

	const handleConfirmStatusChange = async (remarks: string) => {
		if (activeCandidate && statusDialog) {
			try {
				await dispatch(updatePlacementStatus({
					mappingId: activeCandidate.mapping_id!,
					status: statusDialog.to,
					remarks
				})).unwrap();
				// Refresh data to show changes
				dispatch(fetchMatchesForJobRole(jobRolePublicId));
				setStatusDialog(null);
				setActiveCandidate(null);
			} catch (error) {
				console.error("Failed to update status", error);
			}
		}
	};

	if (loading && matches.length === 0) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress sx={{ color: '#ec7211' }} />
			</Box>
		);
	}

	return (
		<Box sx={{
			height: 'calc(100vh - 280px)',
			mt: 2,
			p: 2,
			bgcolor: theme.palette.background.paper,
			overflow: 'hidden',
			display: 'flex',
			flexDirection: 'column',
			borderRadius: theme.shape.borderRadius,
			border: `1px solid ${theme.palette.divider}`
		}}>
			<Box sx={{
				mb: 2,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				borderBottom: `1px solid ${theme.palette.divider}`,
				pb: 1
			}}>
				<Typography variant="awsSectionTitle">Recruitment Pipeline</Typography>
				<Button
					startIcon={<SettingsIcon />}
					size="small"
					onClick={() => setSettingsDialogOpen(true)}
					sx={{ color: theme.palette.text.secondary, fontWeight: 600, fontSize: '0.75rem' }}
				>
					Configure Pipeline
				</Button>
			</Box>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCorners}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				<Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', px: 1, py: 1, height: '100%', alignItems: 'flex-start' }}>
					{dynamicColumns.map((col) => {
						const columnCandidates = getColumnData(col.stages);

						return (
							<Box key={col.id} sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
								<KanbanColumn
									id={col.id}
									title={col.title}
									category={col.category}
									count={columnCandidates.length}
								>
									<SortableContext
										id={col.id}
										items={columnCandidates.map(c => c.candidate_id.toString())}
										strategy={verticalListSortingStrategy}
									>
										{columnCandidates.map((candidate) => (
											<SortableCard
												key={candidate.public_id}
												candidate={candidate}
												onViewHistory={(id, name, publicId) => setHistoryDrawer({ open: true, id, name, candidatePublicId: publicId })}
											/>
										))}
									</SortableContext>
								</KanbanColumn>
							</Box>
						);
					})}
				</Box>

				<DragOverlay dropAnimation={{
					sideEffects: defaultDropAnimationSideEffects({
						styles: {
							active: {
								opacity: '0.5',
							},
						},
					}),
				}}>
					{draggedCandidate ? (
						<SortableCard
							candidate={draggedCandidate}
							onViewHistory={() => { }}
						/>
					) : null}
				</DragOverlay>
			</DndContext>

			{/* Status Change Dialog */}
			{statusDialog && activeCandidate && (
				<StatusChangeDialog
					open={statusDialog.open}
					onClose={() => { setStatusDialog(null); setActiveCandidate(null); }}
					onConfirm={handleConfirmStatusChange}
					candidateName={activeCandidate.name}
					fromStatus={statusDialog.from}
					toStatus={statusDialog.to}
					fromStatusLabel={jobRole?.pipeline_stages?.find(s => s.id === statusDialog.from)?.label}
					toStatusLabel={jobRole?.pipeline_stages?.find(s => s.id === statusDialog.to)?.label}
					loading={loading}
				/>
			)}

			{/* Offer Letter Upload Dialog */}
			{offerUploadDialogOpen && activeCandidate && (
				<OfferLetterUploadDialog
					open={offerUploadDialogOpen}
					onClose={() => { setOfferUploadDialogOpen(false); setActiveCandidate(null); }}
					onConfirm={handleOfferLetterUpload}
					candidateName={activeCandidate.name}
					loading={loading}
				/>
			)}

			{/* History Drawer */}
			{historyDrawer && (
				<PlacementDetailDrawer
					open={historyDrawer.open}
					onClose={() => setHistoryDrawer(null)}
					mappingId={historyDrawer.id}
					candidatePublicId={historyDrawer.candidatePublicId}
					candidateName={historyDrawer.name}
					jobTitle="Candidate Lifecycle"
					onStatusChange={() => dispatch(fetchMatchesForJobRole(jobRolePublicId))}
				/>
			)}

			<PipelineSettingsDialog
				open={settingsDialogOpen}
				onClose={() => setSettingsDialogOpen(false)}
				jobRole={jobRole!}
			/>
		</Box>
	);
};

export default PipelineKanbanTab;
