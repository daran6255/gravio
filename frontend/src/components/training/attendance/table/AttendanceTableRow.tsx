import React, { memo, useState, useMemo } from 'react';
import {
	TableRow,
	TableCell,
	Box,
	Avatar,
	Typography,
	ToggleButton,
	ToggleButtonGroup,
	TextField,
	IconButton,
	Tooltip,
	Badge,
	Chip,
	useTheme,
	alpha
} from '@mui/material';
import { Notes as NotesIcon, EditNote as EditNoteIcon } from '@mui/icons-material';
import type { CandidateAllocation, TrainingAttendance, TrainingBatchPlan } from '../../../../models/training';
import TrainerNotesDialog from '../dialogs/TrainerNotesDialog';
import { format } from 'date-fns';

interface AttendanceTableRowProps {
	allocation: CandidateAllocation;
	isActive: boolean;

	// Period-based props (optional)
	dailyPlan?: TrainingBatchPlan[];
	getPeriodAttendance?: (periodId: number) => TrainingAttendance | undefined;
	onPeriodStatusChange?: (candidateId: number, periodId: number, status: string) => void;
	onTrainerNotesChange?: (candidateId: number, periodId: number, notes: string) => void;

	// Legacy full-day props (optional)
	status?: string;
	remark?: string;
	onStatusChange?: (candidateId: number, status: string) => void;
	onRemarkChange?: (candidateId: number, remark: string) => void;
	canEditPeriod?: (period: TrainingBatchPlan) => boolean;
}

const AttendanceTableRow: React.FC<AttendanceTableRowProps> = memo(({
	allocation,
	isActive,
	dailyPlan,
	getPeriodAttendance,
	onPeriodStatusChange,
	onTrainerNotesChange,
	status,
	remark,
	onStatusChange,
	onRemarkChange,
	canEditPeriod,
}) => {
	const theme = useTheme();
	const hasPeriods = dailyPlan && dailyPlan.length > 0;

	// Status config — now inside to access theme
	const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = useMemo(() => ({
		present: { label: 'P', color: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.08) },
		absent: { label: 'A', color: theme.palette.error.main, bg: alpha(theme.palette.error.main, 0.08) },
		late: { label: 'L', color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.08) },
		half_day: { label: 'H', color: theme.palette.info.main, bg: alpha(theme.palette.info.main, 0.08) },
	}), [theme]);

	const StatusToggle = ({ value, onChange, disabled, isSaved }: {
		value: string;
		onChange: (v: string) => void;
		disabled: boolean;
		isSaved: boolean;
	}) => {
		const statuses = ['present', 'absent', 'late', 'half_day'];

		return (
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
				<ToggleButtonGroup
					value={value}
					exclusive
					onChange={(_, v) => { onChange(v || ''); }}
					disabled={disabled}
					size="small"
					sx={{ 
						'& .MuiToggleButton-root': { 
							py: 0.5, 
							px: 1, 
							fontSize: '0.75rem', 
							fontWeight: 800, 
							lineHeight: 1.2, 
							border: '1px solid',
							borderColor: 'divider',
							minWidth: 32,
							height: 32
						} 
					}}
				>
					{statuses.map(s => {
						const cfg = STATUS_CONFIG[s];
						const active = value === s;
						return (
							<ToggleButton
								key={s}
								value={s}
								sx={{
									color: active ? cfg.color : 'text.disabled',
									bgcolor: active ? cfg.bg : 'transparent',
									borderColor: active ? `${cfg.color} !important` : 'divider',
									zIndex: active ? 1 : 0,
									'&.Mui-selected': {
										color: cfg.color,
										bgcolor: cfg.bg,
										'&:hover': { bgcolor: cfg.bg },
									},
									'&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.1) },
									transition: 'all 0.2s',
								}}
							>
								{cfg.label}
							</ToggleButton>
						);
					})}
				</ToggleButtonGroup>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
					<Box sx={{
						width: 6, height: 6, borderRadius: '50%',
						bgcolor: isSaved ? 'success.main' : 'warning.main',
						boxShadow: isSaved ? `0 0 4px ${alpha(theme.palette.success.main, 0.5)}` : `0 0 4px ${alpha(theme.palette.warning.main, 0.5)}`
					}} />
					<Typography variant="caption" sx={{ fontSize: '0.65rem', color: isSaved ? 'success.main' : 'warning.main', fontWeight: 800, letterSpacing: '0.05em' }}>
						{isSaved ? 'SAVED' : 'UNSAVED'}
					</Typography>
				</Box>
			</Box>
		);
	};

	// Dialog state for trainer notes
	const [notesDialogOpen, setNotesDialogOpen] = useState(false);
	const [selectedPeriod, setSelectedPeriod] = useState<TrainingBatchPlan | null>(null);
	const [currentNotes, setCurrentNotes] = useState('');

	const handleOpenNotesDialog = (period: TrainingBatchPlan, notes: string) => {
		setSelectedPeriod(period);
		setCurrentNotes(notes);
		setNotesDialogOpen(true);
	};

	const handleSaveNotes = (notes: string) => {
		if (selectedPeriod && onTrainerNotesChange) {
			onTrainerNotesChange(allocation.candidate_id, selectedPeriod.id!, notes);
		}
	};

	return (
		<>
			<TableRow 
				hover 
				sx={{ 
					opacity: isActive ? 1 : 0.7, 
					'&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
					transition: 'background-color 0.2s'
				}}
			>
				<TableCell
					sx={{
						borderRight: '1px solid',
						borderColor: 'divider',
						position: 'sticky',
						left: 0,
						bgcolor: 'background.paper',
						zIndex: 10,
						boxShadow: '2px 0 5px -2px rgba(0,0,0,0.05)',
						'.MuiTableRow-root:hover &': {
							bgcolor: alpha(theme.palette.primary.main, 0.02),
						}
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
						<Avatar sx={{
							width: 36, height: 36,
							bgcolor: allocation.candidate?.name ? alpha(theme.palette.primary.main, 0.1) : 'action.hover',
							color: 'primary.main', fontSize: '0.85rem', fontWeight: 700,
							border: '1.5px solid',
							borderColor: alpha(theme.palette.primary.main, 0.2)
						}}>
							{allocation.candidate?.name?.[0]?.toUpperCase()}
						</Avatar>
						<Box>
							<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
								{allocation.candidate?.name}
							</Typography>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
								{allocation.candidate?.email}
							</Typography>
						</Box>
					</Box>
				</TableCell>

				{hasPeriods ? (
					dailyPlan!.map((period) => {
						const periodAttendance = getPeriodAttendance!(period.id!);
						const periodStatus = periodAttendance?.status || '';
						const trainerNotes = periodAttendance?.trainer_notes || '';
						const hasNotes = trainerNotes.trim().length > 0;
						const isSaved = !!periodAttendance?.id;
						const editable = canEditPeriod!(period);

						return (
							<TableCell key={period.id} align="center" sx={{ p: 2 }}>
								{period.activity_type === 'break' ? (
									<Chip
										label="BREAK"
										size="small"
										variant="outlined"
										sx={{ 
											fontWeight: 800, 
											fontSize: '0.65rem', 
											height: 20, 
											color: 'text.disabled', 
											borderColor: 'divider',
											borderRadius: 1,
											bgcolor: alpha(theme.palette.action.disabledBackground, 0.05)
										}}
									/>
								) : (
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
										<StatusToggle
											value={periodStatus}
											onChange={(v) => onPeriodStatusChange!(allocation.candidate_id, period.id!, v)}
											disabled={!editable}
											isSaved={isSaved}
										/>
										{editable && (
											<Tooltip title={hasNotes ? 'View / Edit Trainer Notes' : 'Add Trainer Notes'}>
												<IconButton
													size="small"
													onClick={() => handleOpenNotesDialog(period, trainerNotes)}
													sx={{
														p: 0.5,
														color: hasNotes ? 'primary.main' : 'text.disabled',
														bgcolor: hasNotes ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
														border: '1px solid',
														borderColor: hasNotes ? alpha(theme.palette.primary.main, 0.2) : 'transparent',
														'&:hover': { 
															bgcolor: hasNotes ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.action.hover, 0.05),
															color: 'primary.main',
															borderColor: alpha(theme.palette.primary.main, 0.3)
														},
													}}
												>
													<Badge 
														variant="dot" 
														color="primary" 
														invisible={!hasNotes}
														sx={{ '& .MuiBadge-badge': { border: `2px solid ${theme.palette.background.paper}` } }}
													>
														{hasNotes ? <EditNoteIcon sx={{ fontSize: 18 }} /> : <NotesIcon sx={{ fontSize: 18 }} />}
													</Badge>
												</IconButton>
											</Tooltip>
										)}
									</Box>
								)}
							</TableCell>
						);
					})
				) : (
					<>
						<TableCell align="center" sx={{ p: 2 }}>
							<StatusToggle
								value={status || ''}
								onChange={(v) => onStatusChange!(allocation.candidate_id, v)}
								disabled={!isActive}
								isSaved={false}
							/>
						</TableCell>
						<TableCell>
							<TextField
								fullWidth
								size="small"
								placeholder="Add remark..."
								value={remark}
								onChange={(e) => onRemarkChange!(allocation.candidate_id, e.target.value)}
								disabled={!isActive}
								variant="outlined"
								sx={{ 
									'& .MuiOutlinedInput-root': { 
										borderRadius: 2, 
										bgcolor: alpha(theme.palette.background.default, 0.5),
										fontSize: '0.8125rem'
									} 
								}}
							/>
						</TableCell>
					</>
				)}
			</TableRow>

			{selectedPeriod && (
				<TrainerNotesDialog
					open={notesDialogOpen}
					onClose={() => setNotesDialogOpen(false)}
					onSave={handleSaveNotes}
					candidateName={allocation.candidate?.name || 'Unknown'}
					periodName={selectedPeriod.activity_name || 'Unknown Period'}
					periodTime={`${format(new Date(`2000-01-01T${selectedPeriod.start_time}`), 'h:mm a')} - ${format(new Date(`2000-01-01T${selectedPeriod.end_time}`), 'h:mm a')}`}
					currentNotes={currentNotes}
				/>
			)}
		</>
	);
});

AttendanceTableRow.displayName = 'AttendanceTableRow';

export default AttendanceTableRow;
