import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Stack,
	CircularProgress,
	TextField,
	Button,
	Paper,
	useTheme,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	InputAdornment,
	Tooltip,
	IconButton
} from '@mui/material';
import {
	Search as SearchIcon,
	Add as AddIcon,
	CheckCircle as VerifiedIcon,
	Cancel as UnverifiedIcon
} from '@mui/icons-material';
import { skillService, type Skill } from '../../services/skillService';
import { useSnackbar } from 'notistack';

const SkillsSection: React.FC = () => {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();
	const [skills, setSkills] = useState<Skill[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [newSkillName, setNewSkillName] = useState('');
	const [adding, setAdding] = useState(false);
	const [verifyingId, setVerifyingId] = useState<number | null>(null);

	useEffect(() => {
		loadSkills();
	}, [searchQuery]);

	const loadSkills = async () => {
		setLoading(true);
		try {
			const data = await skillService.getSkills(searchQuery);
			setSkills(data);
		} catch (error) {
			enqueueSnackbar('Failed to load skills', { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const handleAddSkill = async () => {
		if (!newSkillName.trim()) return;

		setAdding(true);
		try {
			await skillService.createSkill({ name: newSkillName.trim() });
			enqueueSnackbar('Skill added successfully', { variant: 'success' });
			setNewSkillName('');
			loadSkills();
		} catch (error) {
			enqueueSnackbar('Failed to add skill', { variant: 'error' });
		} finally {
			setAdding(false);
		}
	};

	const handleVerifySkill = async (id: number) => {
		setVerifyingId(id);
		try {
			await skillService.verifySkill(id);
			enqueueSnackbar('Skill verified successfully', { variant: 'success' });
			loadSkills();
		} catch (error) {
			enqueueSnackbar('Failed to verify skill', { variant: 'error' });
		} finally {
			setVerifyingId(null);
		}
	};

	return (
		<Box>
			{/* Header */}
			<Box sx={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'flex-start',
				mb: 4,
				pb: 3,
				borderBottom: `1px solid ${theme.palette.divider}`
			}}>
				<Box>
					<Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
						Skills Master Data
					</Typography>
					<Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
						Manage the standardized list of skills available across the CRM.
					</Typography>
				</Box>
			</Box>

			<Stack spacing={4}>
				{/* Search and Add Bar */}
				<Paper
					elevation={0}
					sx={{
						p: 2,
						borderRadius: '8px',
						border: `1px solid ${theme.palette.divider}`,
						bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#f8fafc'
					}}
				>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
						<TextField
							fullWidth
							size="small"
							placeholder="Search skills..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
									</InputAdornment>
								),
								sx: { bgcolor: theme.palette.background.paper, borderRadius: '6px' }
							}}
						/>
						<Stack direction="row" spacing={1} sx={{ minWidth: { sm: '350px' } }}>
							<TextField
								fullWidth
								size="small"
								placeholder="New skill name..."
								value={newSkillName}
								onChange={(e) => setNewSkillName(e.target.value)}
								onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
								InputProps={{
									sx: { bgcolor: theme.palette.background.paper, borderRadius: '6px' }
								}}
							/>
							<Button
								variant="contained"
								disableElevation
								startIcon={adding ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
								onClick={handleAddSkill}
								disabled={adding || !newSkillName.trim()}
								sx={{
									bgcolor: theme.palette.primary.main,
									borderRadius: '6px',
									textTransform: 'none',
									fontWeight: 600,
									px: 3,
									'&:hover': { bgcolor: theme.palette.primary.dark }
								}}
							>
								Add
							</Button>
						</Stack>
					</Stack>
				</Paper>

				{/* Skills Table */}
				<TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}>
					{loading && skills.length === 0 ? (
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
							<CircularProgress size={32} thickness={4} />
							<Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Loading skills...</Typography>
						</Box>
					) : (
						<Table sx={{ minWidth: 650 }}>
							<TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.action.hover : '#f8fafc' }}>
								<TableRow>
									<TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Skill Name</TableCell>
									<TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Verification Status</TableCell>
									<TableCell sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>ID</TableCell>
									<TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{skills.length === 0 ? (
									<TableRow>
										<TableCell colSpan={3} align="center" sx={{ py: 6 }}>
											<Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
												{searchQuery ? `No skills found matching "${searchQuery}"` : 'No skills found in the database.'}
											</Typography>
										</TableCell>
									</TableRow>
								) : (
									skills.map((skill) => (
										<TableRow
											key={skill.id}
											sx={{ '&:hover': { bgcolor: theme.palette.action.hover } }}
										>
											<TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
												{skill.name}
											</TableCell>
											<TableCell>
												{skill.is_verified ? (
													<Chip
														icon={<VerifiedIcon sx={{ fontSize: '1rem !important' }} />}
														label="Verified"
														size="small"
														sx={{
															bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
															color: theme.palette.success.main,
															fontWeight: 600,
															border: `1px solid ${theme.palette.success.main}`
														}}
													/>
												) : (
													<Chip
														icon={<UnverifiedIcon sx={{ fontSize: '1rem !important' }} />}
														label="Pending"
														size="small"
														sx={{
															bgcolor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
															color: theme.palette.error.main,
															fontWeight: 600,
															border: `1px solid ${theme.palette.error.main}`
														}}
													/>
												)}
											</TableCell>
											<TableCell>
												<Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontFamily: 'monospace' }}>
													#{skill.id}
												</Typography>
											</TableCell>
											<TableCell align="right">
												{!skill.is_verified && (
													<Tooltip title="Verify Skill">
														<IconButton 
															size="small" 
															onClick={() => handleVerifySkill(skill.id)}
															disabled={verifyingId === skill.id}
															sx={{ 
																color: theme.palette.success.main,
																'&:hover': { bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5' }
															}}
														>
															{verifyingId === skill.id ? (
																<CircularProgress size={20} color="inherit" />
															) : (
																<VerifiedIcon fontSize="small" />
															)}
														</IconButton>
													</Tooltip>
												)}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					)}
				</TableContainer>

				<Box sx={{ p: 3, bgcolor: theme.palette.action.hover, border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}>
					<Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1 }}>
						Skill Management Policy
					</Typography>
					<Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
						Master skills are used for standardized searching and filtering in candidate profiles and job mappings. Adding verified skills here ensures high-quality data across all modules.
					</Typography>
				</Box>
			</Stack>
		</Box>
	);
};

export default SkillsSection;
