import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Stack,
	Autocomplete,
	TextField,
	Chip,
	Paper,
	useTheme
} from '@mui/material';
import {
	Build as BuildIcon,
	EmojiEvents as SoftSkillIcon
} from '@mui/icons-material';
import { awsStyles } from '../../../../theme/theme';
import { ConfirmationDialog } from '../../../common/dialogbox';
import useToast from '../../../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchAggregatedSkills, createSkill } from '../../../../store/slices/skillSlice';

interface SkillsTabProps {
	formData: any;
	onUpdateField: (section: string, field: string, value: any) => void;
}

const SkillsTab: React.FC<SkillsTabProps> = ({
	formData,
	onUpdateField
}) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { awsPanel } = awsStyles;
	const toast = useToast();
	
	const { aggregatedSkills, loading } = useAppSelector((state) => state.skills);
	
	// New skill addition state
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const [newSkillName, setNewSkillName] = useState('');
	const [activeField, setActiveField] = useState<'technical_skills' | 'soft_skills' | null>(null);
	const [pendingNewValues, setPendingNewValues] = useState<string[]>([]);

	useEffect(() => {
		dispatch(fetchAggregatedSkills());
	}, [dispatch]);

	const handleSkillChange = (field: 'technical_skills' | 'soft_skills', newValue: string[]) => {
		const lastValue = newValue[newValue.length - 1];
		
		if (typeof lastValue === 'string' && lastValue.trim() !== '') {
			const skillExists = aggregatedSkills.some(s => s.toLowerCase() === lastValue.toLowerCase());
			
			if (!skillExists) {
				setNewSkillName(lastValue);
				setActiveField(field);
				setPendingNewValues(newValue);
				setConfirmDialogOpen(true);
				return;
			}
		}
		
		onUpdateField('skills', field, newValue);
	};

	const handleConfirmAddSkill = async () => {
		if (!newSkillName || !activeField) return;
		
		try {
			await dispatch(createSkill({ name: newSkillName, is_verified: false })).unwrap();
			onUpdateField('skills', activeField, pendingNewValues);
			toast.success(`Skill "${newSkillName}" added to master database`);
			setConfirmDialogOpen(false);
		} catch (error) {
			toast.error('Failed to add skill to database');
		} finally {
			setNewSkillName('');
			setActiveField(null);
		}
	};

	const textFieldSx = {
		'& .MuiOutlinedInput-root': {
			borderRadius: '2px',
			bgcolor: 'background.paper',
			'& fieldset': { borderColor: 'divider' },
			'&:hover fieldset': { borderColor: theme.palette.text.secondary },
			'&.Mui-focused fieldset': { borderColor: 'primary.main' }
		}
	};

	return (
		<Stack spacing={4}>
			{/* Technical Skills Section */}
			<Paper elevation={0} sx={awsPanel}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
					<Box sx={{ bgcolor: 'primary.main', p: 0.5, borderRadius: '2px', display: 'flex' }}>
						<BuildIcon sx={{ color: 'common.white', fontSize: 20 }} />
					</Box>
					<Typography variant="awsSectionTitle">Technical Skills</Typography>
				</Stack>
				
				<Box>
					<Typography variant="awsFieldLabel">Core Proficiencies</Typography>
					<Autocomplete
						multiple
						freeSolo
						options={aggregatedSkills}
						value={formData.skills?.technical_skills || []}
						onChange={(_e, newValue) => handleSkillChange('technical_skills', newValue)}
						renderTags={(value, getTagProps) =>
							value.map((option, index) => (
								<Chip
									label={option}
									{...getTagProps({ index })}
									size="small"
									sx={{ 
										borderRadius: '2px',
										bgcolor: 'rgba(0, 126, 185, 0.06)',
										border: '1px solid',
										borderColor: 'info.main',
										color: 'info.main',
										fontWeight: 600,
										px: 0.5
									}}
								/>
							))
						}
						renderInput={(params) => (
							<TextField
								{...params}
								placeholder="Select or type technical skills..."
								size="small"
								sx={textFieldSx}
							/>
						)}
					/>
					<Typography variant="caption" sx={{ color: 'text.disabled', mt: 1, display: 'block' }}>
						Add primary technical capabilities relevant for role mapping.
					</Typography>
				</Box>
			</Paper>

			{/* Soft Skills Section */}
			<Paper elevation={0} sx={awsPanel}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
					<Box sx={{ bgcolor: 'primary.main', p: 0.5, borderRadius: '2px', display: 'flex' }}>
						<SoftSkillIcon sx={{ color: 'common.white', fontSize: 20 }} />
					</Box>
					<Typography variant="awsSectionTitle">Additional & Soft Skills</Typography>
				</Stack>

				<Box>
					<Typography variant="awsFieldLabel">Professional Attributes</Typography>
					<Autocomplete
						multiple
						freeSolo
						options={['Communication', 'Teamwork', 'Punctuality', 'Problem Solving', 'Leadership', 'Critical Thinking', 'Adaptability']}
						value={formData.skills?.soft_skills || []}
						onChange={(_e, newValue) => handleSkillChange('soft_skills', newValue)}
						renderTags={(value, getTagProps) =>
							value.map((option, index) => (
								<Chip
									label={option}
									{...getTagProps({ index })}
									size="small"
									sx={{ 
										borderRadius: '2px',
										bgcolor: 'rgba(16, 185, 129, 0.06)',
										border: '1px solid',
										borderColor: 'success.main',
										color: 'success.main',
										fontWeight: 600,
										px: 0.5
									}}
								/>
							))
						}
						renderInput={(params) => (
							<TextField
								{...params}
								placeholder="Select or type professional attributes..."
								size="small"
								sx={textFieldSx}
							/>
						)}
					/>
					<Typography variant="caption" sx={{ color: 'text.disabled', mt: 1, display: 'block' }}>
						Document behavioral strengths and workplace-ready attributes.
					</Typography>
				</Box>
			</Paper>

			{/* Confirmation Dialog */}
			<ConfirmationDialog
				open={confirmDialogOpen}
				title="Standardize New Skill?"
				message={`"${newSkillName}" is not in our master database. Adding it will standardize this skill across all candidate profiles in the system.`}
				confirmLabel="Add to Database"
				cancelLabel="Discard"
				onClose={() => {
					setConfirmDialogOpen(false);
					if (activeField) onUpdateField('skills', activeField, pendingNewValues);
				}}
				onConfirm={handleConfirmAddSkill}
				loading={loading}
				severity="info"
			/>
		</Stack>
	);
};

export default SkillsTab;
