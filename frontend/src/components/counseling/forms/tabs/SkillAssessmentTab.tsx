import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Button,
	Divider,
	Stack,
	Grid,
	Autocomplete,
	TextField,
	FormControl,
	Select,
	MenuItem,
	IconButton,
	Paper,
	useTheme,
	alpha,
	Chip,
	LinearProgress
} from '@mui/material';
import { 
	Add as AddIcon, 
	DeleteOutline as DeleteIcon, 
	Psychology as SkillIcon,
	EmojiEvents as ProficiencyIcon,
	CheckCircleOutline as VerifiedIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchAggregatedSkills, createSkill } from '../../../../store/slices/skillSlice';
import type { CandidateCounselingCreate, CounselingSkill } from '../../../../models/candidate';
import { ConfirmationDialog } from '../../../common/dialogbox';
import useToast from '../../../../hooks/useToast';

interface SkillAssessmentTabProps {
	formData: CandidateCounselingCreate;
	onAddSkill: () => void;
	onRemoveSkill: (index: number) => void;
	onSkillChange: (index: number, field: string, value: string) => void;
}

const SkillAssessmentTab: React.FC<SkillAssessmentTabProps> = ({
	formData,
	onAddSkill,
	onRemoveSkill,
	onSkillChange
}) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const toast = useToast();
	
	const { aggregatedSkills, loading: storeLoading } = useAppSelector((state) => state.skills);

	// New skill addition state
	const [confirmAddSkillDialogOpen, setConfirmAddSkillDialogOpen] = useState(false);
	const [newSkillName, setNewSkillName] = useState('');
	const [pendingIndex, setPendingIndex] = useState<number | null>(null);

	useEffect(() => {
		if (aggregatedSkills.length === 0) {
			dispatch(fetchAggregatedSkills());
		}
	}, [dispatch, aggregatedSkills.length]);

	const handleNameChange = (index: number, val: string | null) => {
		const skillName = (val || '').trim();
		
		if (skillName !== '') {
			const skillExists = aggregatedSkills.some(s => s.toLowerCase() === skillName.toLowerCase());
			
			if (!skillExists) {
				setNewSkillName(skillName);
				setPendingIndex(index);
				setConfirmAddSkillDialogOpen(true);
				return;
			}
		}
		
		onSkillChange(index, 'name', skillName);
	};

	const handleConfirmAddSkill = async () => {
		if (!newSkillName || pendingIndex === null) return;
		
		try {
			await dispatch(createSkill({ name: newSkillName, is_verified: false })).unwrap();
			onSkillChange(pendingIndex, 'name', newSkillName);
			toast.success(`Skill "${newSkillName}" added to master database`);
			setConfirmAddSkillDialogOpen(false);
		} catch (error) {
			toast.error('Failed to add skill to database');
		} finally {
			setNewSkillName('');
			setPendingIndex(null);
		}
	};

	const getProficiencyColor = (level: CounselingSkill['level']) => {
		switch (level) {
			case 'Advanced': return 'success.main';
			case 'Intermediate': return 'info.main';
			default: return 'warning.main';
		}
	};

	const getProficiencyValue = (level: CounselingSkill['level']) => {
		switch (level) {
			case 'Advanced': return 100;
			case 'Intermediate': return 65;
			default: return 35;
		}
	};

	const inputSx = {
		'& .MuiOutlinedInput-root': {
			borderRadius: 0.5,
			bgcolor: 'background.paper',
			'& fieldset': { borderColor: 'divider' },
			'&:hover fieldset': { borderColor: 'text.secondary' },
			'&.Mui-focused fieldset': { borderColor: 'primary.main' }
		}
	};

	return (
		<Stack spacing={4}>
			{/* Outcome Header & Summary Card */}
			<Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 0.5 }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
					<Stack direction="row" alignItems="center" spacing={1.5}>
						<Box sx={{ bgcolor: 'primary.main', p: 0.5, borderRadius: 0.5, display: 'flex' }}>
							<SkillIcon sx={{ color: 'common.white', fontSize: 20 }} />
						</Box>
						<Typography variant="awsSectionTitle">Competency Outcome Matrix</Typography>
					</Stack>
					<Button
						variant="contained"
						size="small"
						startIcon={<AddIcon />}
						onClick={onAddSkill}
						sx={{
							borderRadius: 0.5,
							textTransform: 'none',
							boxShadow: 'none',
							'&:hover': { boxShadow: 'none', bgcolor: 'primary.dark' }
						}}
					>
						Record Competency
					</Button>
				</Box>

				<Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04), p: 2, borderRadius: 0.5, mb: 3 }}>
					<Stack direction="row" spacing={2} alignItems="center">
						<VerifiedIcon sx={{ color: 'primary.main' }} />
						<Box>
							<Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700 }}>Outcome Goal</Typography>
							<Typography variant="caption" color="text.secondary">
								Assess at least 3 core competencies to determine placement readiness and training gaps.
							</Typography>
						</Box>
					</Stack>
				</Box>

				<Divider sx={{ mb: 4 }} />

				{formData.skills && formData.skills.length > 0 ? (
					<Stack spacing={4}>
						{formData.skills.map((skill, index: number) => (
							<Paper 
								key={index} 
								elevation={0} 
								variant="outlined"
								sx={{ 
									p: 3, 
									borderRadius: 0.5, 
									position: 'relative',
									'&:hover': { borderColor: 'primary.main' }
								}}
							>
								<IconButton 
									size="small"
									onClick={() => onRemoveSkill(index)}
									sx={{ 
										position: 'absolute', 
										top: 8, 
										right: 8,
										color: 'error.main',
										'&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) }
									}}
								>
									<DeleteIcon fontSize="small" />
								</IconButton>

								<Grid container spacing={4}>
									<Grid size={{ xs: 12, md: 6 }}>
										<Box>
											<Typography variant="awsFieldLabel">Competency / Skill</Typography>
											<Autocomplete
												freeSolo
												options={aggregatedSkills}
												value={skill.name}
												onChange={(_e, val) => handleNameChange(index, val)}
												renderInput={(params) => (
													<TextField
														{...params}
														placeholder="e.g. Technical Support, Data Entry"
														size="small"
														fullWidth
														required
														sx={inputSx}
													/>
												)}
											/>
										</Box>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<Box>
											<Typography variant="awsFieldLabel">Proficiency Outcome</Typography>
											<FormControl fullWidth size="small">
												<Select
													value={skill.level}
													onChange={(e) => onSkillChange(index, 'level', e.target.value as any)}
													sx={{
														borderRadius: 0.5,
														bgcolor: 'background.paper',
														'& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
														'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'text.secondary' },
														'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
													}}
													renderValue={(selected) => (
														<Stack direction="row" spacing={1} alignItems="center">
															<Chip 
																label={selected} 
																size="small" 
																sx={{ 
																	bgcolor: alpha(theme.palette[getProficiencyColor(selected) === 'success.main' ? 'success' : getProficiencyColor(selected) === 'info.main' ? 'info' : 'warning'].main, 0.1),
																	color: getProficiencyColor(selected),
																	fontWeight: 700,
																	borderRadius: 0.5
																}} 
															/>
														</Stack>
													)}
												>
													<MenuItem value="Beginner">
														<Stack sx={{ py: 0.5 }}>
															<Typography variant="body2" sx={{ fontWeight: 600 }}>Beginner</Typography>
															<Typography variant="caption" color="text.secondary">Fundamental understanding; needs guidance.</Typography>
														</Stack>
													</MenuItem>
													<MenuItem value="Intermediate">
														<Stack sx={{ py: 0.5 }}>
															<Typography variant="body2" sx={{ fontWeight: 600 }}>Intermediate</Typography>
															<Typography variant="caption" color="text.secondary">Practical application; independent for common tasks.</Typography>
														</Stack>
													</MenuItem>
													<MenuItem value="Advanced">
														<Stack sx={{ py: 0.5 }}>
															<Typography variant="body2" sx={{ fontWeight: 600 }}>Advanced</Typography>
															<Typography variant="caption" color="text.secondary">In-depth expertise; can mentor others.</Typography>
														</Stack>
													</MenuItem>
												</Select>
											</FormControl>
										</Box>
										
										{/* Proficiency Indicator */}
										<Box sx={{ mt: 2 }}>
											<Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
												<Typography variant="caption" color="text.secondary">Outcome Rating</Typography>
												<Typography variant="caption" sx={{ fontWeight: 700, color: getProficiencyColor(skill.level) }}>
													{getProficiencyValue(skill.level)}%
												</Typography>
											</Stack>
											<LinearProgress 
												variant="determinate" 
												value={getProficiencyValue(skill.level)} 
												sx={{ 
													height: 4, 
													borderRadius: 2,
													bgcolor: alpha(theme.palette.divider, 0.5),
													'& .MuiLinearProgress-bar': {
														bgcolor: getProficiencyColor(skill.level),
														borderRadius: 2
													}
												}}
											/>
										</Box>
									</Grid>
								</Grid>
							</Paper>
						))}
					</Stack>
				) : (
					<Box sx={{ 
						py: 8, 
						textAlign: 'center', 
						border: '1px dashed', 
						borderColor: 'divider', 
						borderRadius: 0.5, 
						bgcolor: 'background.default' 
					}}>
						<ProficiencyIcon sx={{ fontSize: 48, color: 'divider', mb: 2 }} />
						<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
							No competencies recorded.
						</Typography>
						<Typography variant="caption" color="text.disabled">
							Outcome based assessments require documenting core skills and proficiency levels.
						</Typography>
					</Box>
				)}
			</Paper>

			<ConfirmationDialog
				open={confirmAddSkillDialogOpen}
				title="Standardize Competency?"
				message={`"${newSkillName}" is not in our master data registry. Adding it will standardize this competency across the enterprise.`}
				confirmLabel="Yes, Standardize"
				cancelLabel="Cancel"
				onClose={() => {
					setConfirmAddSkillDialogOpen(false);
					if (pendingIndex !== null) onSkillChange(pendingIndex, 'name', newSkillName);
				}}
				onConfirm={handleConfirmAddSkill}
				loading={storeLoading}
				severity="info"
			/>
		</Stack>
	);
};

export default SkillAssessmentTab;
