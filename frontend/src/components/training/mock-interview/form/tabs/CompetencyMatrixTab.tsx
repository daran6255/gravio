import React, { memo } from 'react';
import {
	Box,
	Stack,
	Paper,
	Typography,
	Button,
	IconButton,
	TextField,
	Grid,
	MenuItem,
	Rating,
	Autocomplete,
	useTheme,
	alpha
} from '@mui/material';
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	Psychology as SkillIcon,
	InfoOutlined as InfoIcon
} from '@mui/icons-material';
import { type Skill } from '../../../../../models/MockInterview';

interface CompetencyMatrixTabProps {
	skills: Skill[];
	masterSkills: string[];
	viewMode: boolean;
	onSkillChange: (index: number, field: keyof Skill, value: any) => void;
	onAddSkill: () => void;
	onRemoveSkill: (index: number) => void;
}

const CompetencyMatrixTab: React.FC<CompetencyMatrixTabProps> = memo(({
	skills,
	masterSkills,
	viewMode,
	onSkillChange,
	onAddSkill,
	onRemoveSkill
}) => {
	const theme = useTheme();

	return (
		<Box sx={{ maxWidth: 1000, mx: 'auto' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Stack direction="row" alignItems="center" spacing={2}>
					<Box 
						sx={{ 
							p: 1.25, 
							bgcolor: alpha(theme.palette.success.main, 0.08), 
							borderRadius: 2, 
							display: 'flex',
							color: 'success.main'
						}}
					>
						<SkillIcon />
					</Box>
					<Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary' }}>
						Competency Proficiency Matrix
					</Typography>
				</Stack>
				{!viewMode && (
					<Button
						variant="outlined"
						color="success"
						startIcon={<AddIcon />}
						onClick={onAddSkill}
						sx={{ 
							textTransform: 'none', 
							fontWeight: 700, 
							borderRadius: 1.5,
							px: 2
						}}
					>
						Add Competency
					</Button>
				)}
			</Box>
			{!viewMode && (
				<Box 
					sx={{ 
						mb: 4, 
						p: 2, 
						borderRadius: 2, 
						bgcolor: alpha(theme.palette.info.main, 0.04),
						border: '1px solid',
						borderColor: alpha(theme.palette.info.main, 0.1),
						display: 'flex',
						alignItems: 'flex-start',
						gap: 2
					}}
				>
					<InfoIcon sx={{ color: 'info.main', fontSize: 20, mt: 0.25 }} />
					<Box>
						<Typography variant="caption" sx={{ color: 'info.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.5 }}>
							Quick Guide: Skill Assessment
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.5, display: 'block' }}>
							Select a competency from the dropdown or <strong>type and press Enter</strong> to create a new one. 
							Each entry supports only <strong>one unique skill</strong> (commas are automatically removed). 
							Use the 'Add Competency' button for multiple skill evaluations.
						</Typography>
					</Box>
				</Box>
			)}

			<Grid container spacing={3}>
				{skills.map((s, idx) => (
					<Grid size={{ xs: 12, sm: 6 }} key={idx}>
						<Paper 
							elevation={0}
							sx={{ 
								p: 3, 
								borderRadius: 2, 
								bgcolor: 'background.paper', 
								position: 'relative',
								border: '1px solid',
								borderColor: 'divider',
								transition: 'all 0.2s ease-in-out',
								'&:hover': {
									borderColor: alpha(theme.palette.success.main, 0.2),
									boxShadow: theme.shadows[2]
								}
							}}
						>
							{!viewMode && (
								<IconButton
									size="small"
									onClick={() => onRemoveSkill(idx)}
									sx={{ 
										position: 'absolute', 
										right: 12, 
										top: 12, 
										opacity: 0.4,
										'&:hover': { opacity: 1, color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.05) } 
									}}
								>
									<DeleteIcon fontSize="small" />
								</IconButton>
							)}
							<Stack spacing={2.5}>
								<Autocomplete
									freeSolo
									options={masterSkills}
									value={s.skill}
									onChange={(_, newValue) => {
										const cleaned = (newValue || '').replace(/,/g, '');
										onSkillChange(idx, 'skill', cleaned);
									}}
									onInputChange={(_, newInputValue) => {
										const cleaned = (newInputValue || '').replace(/,/g, '');
										onSkillChange(idx, 'skill', cleaned);
									}}
									disabled={viewMode}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Competency / Skill Area"
											placeholder="Search or enter skill..."
											fullWidth
											size="small"
											onKeyDown={(e) => {
												if (e.key === ',') {
													e.preventDefault();
												}
											}}
											InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
										/>
									)}
								/>
								<Stack direction="row" spacing={2} alignItems="center">
									<TextField
										select
										label="Proficiency Level"
										value={s.level}
										onChange={(e) => onSkillChange(idx, 'level', e.target.value)}
										fullWidth
										size="small"
										disabled={viewMode}
										InputLabelProps={{ shrink: true, sx: { fontWeight: 600 } }}
										sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
									>
										<MenuItem value="Beginner">Beginner</MenuItem>
										<MenuItem value="Intermediate">Intermediate</MenuItem>
										<MenuItem value="Expert">Expert</MenuItem>
									</TextField>
									<Box sx={{ minWidth: 70, textAlign: 'right' }}>
										<Typography variant="h5" sx={{ fontWeight: 900, color: 'success.main', lineHeight: 1 }}>
											{s.rating}
											<Typography component="span" variant="caption" sx={{ ml: 0.5, fontWeight: 700, opacity: 0.5 }}>/10</Typography>
										</Typography>
									</Box>
								</Stack>
								<Box sx={{ mt: 1 }}>
									<Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: 'text.secondary' }}>
										Proficiency Score
									</Typography>
									<Rating
										value={s.rating}
										max={10}
										onChange={(_, v) => onSkillChange(idx, 'rating', v || 0)}
										disabled={viewMode}
										size="medium"
										sx={{
											color: 'success.main',
											'& .MuiRating-iconFilled': {
												color: 'success.main',
											},
											'& .MuiRating-iconHover': {
												color: 'success.dark',
											},
										}}
									/>
								</Box>
							</Stack>
						</Paper>
					</Grid>
				))}
				{skills.length === 0 && (
					<Grid size={{ xs: 12 }}>
						<Box 
							sx={{ 
								py: 6, 
								textAlign: 'center', 
								borderRadius: 2, 
								border: '2px dashed',
								borderColor: 'divider',
								bgcolor: alpha(theme.palette.action.disabledBackground, 0.02)
							}}
						>
							<Typography variant="body2" color="text.disabled" sx={{ fontWeight: 600 }}>
								No competencies have been assessed for this session yet.
							</Typography>
							{!viewMode && (
								<Button 
									variant="text" 
									color="success"
									startIcon={<AddIcon />} 
									onClick={onAddSkill}
									sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}
								>
									Add First Competency
								</Button>
							)}
						</Box>
					</Grid>
				)}
			</Grid>
		</Box>
	);
});

CompetencyMatrixTab.displayName = 'CompetencyMatrixTab';

export default CompetencyMatrixTab;
