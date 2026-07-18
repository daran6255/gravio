import React, { useState } from 'react';
import {
	Drawer,
	Box,
	Typography,
	IconButton,
	Divider,
	Stack,
	TextField,
	MenuItem,
	Button,
	Autocomplete,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Grid,
	Card,
	CardContent,
	useTheme,
	alpha,
	InputAdornment,
	Chip,
	Avatar
} from '@mui/material';
import {
	Close,
	WorkOutline,
	ArrowBack,
	ArrowForward,
	ReceiptLong,
	Flag,
	CalendarToday,
	Check
} from '@mui/icons-material';
import { DatePicker, RichTextEditor } from '../../../common/form';
import useToast from '../../../../hooks/useToast';
import type { ProjectCreate, ProjectStatus } from '../../../../models/projects/project';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import { getWorldCurrencies, getCurrencySymbol } from '../../../../utils/currency';
import { NumericFormat } from 'react-number-format';
import { TEMPLATE_CATEGORIES } from '../../../../data/projectTemplates';
import type { ProjectTemplate } from '../../../../data/projectTemplates';

interface ProjectCreateDrawerProps {
	open: boolean;
	onClose: () => void;
	owners: CRMOwnerOption[];
	submitting: boolean;
	onSubmit: (payload: ProjectCreate) => Promise<void>;
}

export const ProjectCreateDrawer: React.FC<ProjectCreateDrawerProps> = ({
	open,
	onClose,
	owners,
	submitting,
	onSubmit
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();
	const currencyOptions = React.useMemo(() => getWorldCurrencies(), []);

	const [activeStep, setActiveStep] = useState(0);

	// Template Selection State
	const [selectedCategory, setSelectedCategory] = useState<string>('Software');
	const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);

	// Project Details Form State
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [status, setStatus] = useState<ProjectStatus>('planning');
	const [ownerId, setOwnerId] = useState<number | null>(null);
	const [startDate, setStartDate] = useState<string | null>(null);
	const [endDate, setEndDate] = useState<string | null>(null);
	const [budget, setBudget] = useState('');
	const [currency, setCurrency] = useState('USD');
	const [touched, setTouched] = useState(false);

	// Reset form state when drawer transitions from closed to open
	const [prevOpen, setPrevOpen] = useState(open);
	if (open !== prevOpen) {
		setPrevOpen(open);
		if (open) {
			setActiveStep(0);
			setSelectedCategory('Software');
			setSelectedTemplate(null);
			setName('');
			setDescription('');
			setStatus('planning');
			setOwnerId(null);
			setStartDate(null);
			setEndDate(null);
			setBudget('');
			setCurrency('USD');
			setTouched(false);
		}
	}

	const handleCategoryClick = (categoryName: string) => {
		setSelectedCategory(categoryName);
		setSelectedTemplate(null);
	};

	const handleTemplateSelect = (template: ProjectTemplate | null) => {
		setSelectedTemplate(template);
		if (template) {
			setName(`${template.name} - `);
		} else {
			setName('');
		}
	};

	const handleNext = () => {
		setActiveStep((prev) => prev + 1);
	};

	const handleBack = () => {
		setActiveStep((prev) => prev - 1);
	};

	const nameError = touched && !name.trim() ? 'Project name is required' : '';
	const isValid = !!name.trim();

	const handleSave = async () => {
		setTouched(true);
		if (!isValid) return;
		try {
			await onSubmit({
				name: name.trim(),
				description: description.trim() || undefined,
				status,
				owner_id: ownerId ?? undefined,
				start_date: startDate || undefined,
				end_date: endDate || undefined,
				budget: budget ? Number(budget) : undefined,
				currency,
				phase: undefined,
				issues: undefined,
				template_key: selectedTemplate?.key || undefined
			});
			onClose();
		} catch (err: any) {
			toast.error(err || 'Failed to create project');
		}
	};

	const selectedOwner = owners.find((o) => o.id === ownerId) || null;
	const currentCategory = TEMPLATE_CATEGORIES.find((c) => c.name === selectedCategory);
	const templatesList = currentCategory?.templates || [];

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			sx={{
				'& .MuiDrawer-paper': {
					width: { xs: '100%', sm: 800 },
					boxSizing: 'border-box',
					overscrollBehavior: 'contain',
					borderLeft: '1px solid',
					borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
					background: theme.gradients.card,
					backdropFilter: 'blur(20px)',
					color: 'text.primary',
					boxShadow: isDark
						? '-16px 0px 48px rgba(0, 0, 0, 0.65)'
						: '-16px 0px 48px rgba(139, 124, 246, 0.08)'
				}
			}}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 2.5, sm: 3.5 } }}>
				{/* Header */}
				<Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
					<Box>
						<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
							Create New Project
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{activeStep === 0
								? 'Choose a template category and select a template, or start blank.'
								: activeStep === 1
								? 'Preview standard tasks/phases included in this template.'
								: 'Fill in the details for your new project.'}
						</Typography>
					</Box>
					<IconButton
						onClick={onClose}
						size="small"
						sx={{
							bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
							'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }
						}}
					>
						<Close sx={{ fontSize: 20 }} />
					</IconButton>
				</Box>

				<Divider sx={{ mb: 3 }} />

				{/* Custom Stepper */}
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 4 }}>
					{[
						{ label: 'Choose Template', step: 0 },
						{ label: 'Preview Template', step: 1 },
						{ label: 'Configure Project', step: 2 }
					].map((item, index) => {
						const isActive = activeStep === item.step;
						const isCompleted = activeStep > item.step;
						return (
							<React.Fragment key={item.label}>
								{index > 0 && (
									<Box sx={{ flex: 1, height: 2, bgcolor: isCompleted ? 'primary.main' : 'divider', transition: 'all 0.3s' }} />
								)}
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 1.25,
										py: 1,
										px: 2,
										borderRadius: '20px',
										border: '1px solid',
										borderColor: isActive ? 'primary.main' : isCompleted ? 'success.main' : 'divider',
										background: isActive
											? theme.gradients.brandDiagonal
											: isCompleted
											? alpha(theme.palette.success.main, 0.08)
											: 'transparent',
										color: isActive
											? '#ffffff'
											: isCompleted
											? 'success.main'
											: 'text.secondary',
										fontWeight: 700,
										fontSize: '0.8rem',
										transition: 'all 0.3s',
										boxShadow: isActive ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}` : 'none'
									}}
								>
									<Avatar
										sx={{
											width: 20,
											height: 20,
											fontSize: '0.75rem',
											fontWeight: 800,
											bgcolor: isActive ? '#ffffff' : isCompleted ? 'success.main' : 'text.secondary',
											color: isActive ? 'primary.main' : '#ffffff',
											transition: 'all 0.3s'
										}}
									>
										{isCompleted ? '✓' : index + 1}
									</Avatar>
									<Typography sx={{ fontSize: '0.8rem', fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
										{item.label}
									</Typography>
								</Box>
							</React.Fragment>
						);
					})}
				</Box>

				{/* Step Content */}
				<Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', mb: 3 }}>
					{activeStep === 0 ? (
						<Grid container spacing={3} sx={{ height: '100%', m: 0, width: '100%' }}>
							{/* Left Sidebar - Split Pane Categories */}
							<Grid 
								size={{ xs: 12, md: 4 }} 
								sx={{ 
									bgcolor: isDark ? 'rgba(255, 255, 255, 0.015)' : '#f8fafc',
									p: 2.5,
									borderRadius: '20px',
									borderRight: { xs: 'none', md: '1px solid' },
									borderColor: 'divider',
									height: 'fit-content'
								}}
							>
								<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', pl: 1, display: { xs: 'none', md: 'block' }, mb: 1.5, letterSpacing: '0.05em' }}>
									Categories
								</Typography>

								{/* Mobile Horizontal scroll categories */}
								<Stack 
									direction="row" 
									spacing={1} 
									sx={{ 
										display: { xs: 'flex', md: 'none' }, 
										overflowX: 'auto', 
										pb: 1,
										'&::-webkit-scrollbar': { display: 'none' } 
									}}
								>
									<Chip
										icon={<WorkOutline fontSize="small" />}
										label="Blank Project"
										clickable
										variant={selectedTemplate === null && selectedCategory === 'Blank' ? 'filled' : 'outlined'}
										color={selectedTemplate === null && selectedCategory === 'Blank' ? 'primary' : 'default'}
										onClick={() => {
											setSelectedCategory('Blank');
											handleTemplateSelect(null);
										}}
									/>
									{TEMPLATE_CATEGORIES.map((cat) => (
										<Chip
											key={cat.name}
											icon={React.cloneElement(cat.icon as React.ReactElement<any>, { fontSize: 'small' })}
											label={cat.name}
											clickable
											variant={selectedCategory === cat.name ? 'filled' : 'outlined'}
											color={selectedCategory === cat.name ? 'primary' : 'default'}
											onClick={() => handleCategoryClick(cat.name)}
										/>
									))}
								</Stack>

								{/* Desktop Sidebar categories list */}
								<List component="nav" sx={{ mt: 1, display: { xs: 'none', md: 'block' }, p: 0 }}>
									<ListItemButton
										selected={selectedTemplate === null && selectedCategory === 'Blank'}
										onClick={() => {
											setSelectedCategory('Blank');
											handleTemplateSelect(null);
										}}
										sx={{ 
											borderRadius: '12px', 
											mb: 1,
											p: 1.5,
											'&.Mui-selected': {
												background: theme.gradients.brandDiagonal,
												color: '#ffffff',
												boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
												'& .MuiListItemIcon-root': { color: '#ffffff' },
												'&:hover': { background: theme.gradients.brandDiagonal }
											},
											'&:hover': {
												bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9'
											}
										}}
									>
										<ListItemIcon sx={{ minWidth: 32 }}><WorkOutline fontSize="small" /></ListItemIcon>
										<ListItemText primary={<Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Blank Project</Typography>} />
									</ListItemButton>
									{TEMPLATE_CATEGORIES.map((cat) => (
										<ListItemButton
											key={cat.name}
											selected={selectedCategory === cat.name}
											onClick={() => handleCategoryClick(cat.name)}
											sx={{ 
												borderRadius: '12px', 
												mb: 1,
												p: 1.5,
												'&.Mui-selected': {
													background: theme.gradients.brandDiagonal,
													color: '#ffffff',
													boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
													'& .MuiListItemIcon-root': { color: '#ffffff' },
													'&:hover': { background: theme.gradients.brandDiagonal }
												},
												'&:hover': {
													bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9'
												}
											}}
										>
											<ListItemIcon sx={{ minWidth: 32 }}>{cat.icon}</ListItemIcon>
											<ListItemText primary={<Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{cat.name}</Typography>} />
										</ListItemButton>
									))}
								</List>
							</Grid>

							{/* Right - Templates list */}
							<Grid size={{ xs: 12, md: 8 }} sx={{ pl: { xs: 0, md: 3.5 }, pr: 1, mt: { xs: 2, md: 0 } }}>
								{selectedCategory === 'Blank' ? (
									<Box sx={{ p: 4, textAlign: 'center', mt: 4, border: '2px dashed', borderColor: 'divider', borderRadius: '20px', bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)' }}>
										<WorkOutline sx={{ fontSize: 56, color: 'primary.main', mb: 2, opacity: 0.9 }} />
										<Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
											Starting fresh?
										</Typography>
										<Typography variant="body2" color="text.secondary" sx={{ mb: 3.5, maxWidth: 380, mx: 'auto' }}>
											Create a project without any pre-defined tasks. You can add columns, milestones, and tasks manually as needed.
										</Typography>
										<Button variant="contained" endIcon={<ArrowForward />} onClick={handleNext} sx={{ borderRadius: '12px', px: 3 }}>
											Next: Configure Project
										</Button>
									</Box>
								) : (
									<Box>
										<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: '0.05em' }}>
											{selectedCategory} Templates
										</Typography>
										<Grid container spacing={2}>
											{templatesList.map((tpl) => {
												const subtasksCount = tpl.tasks.reduce((sum, t) => sum + (t.subtasks?.length || 0), 0);
												const isSelected = selectedTemplate?.key === tpl.key;
												return (
													<Grid size={{ xs: 12, sm: 6 }} key={tpl.key}>
														<Card
															variant="outlined"
															onClick={() => handleTemplateSelect(tpl)}
															sx={{
																cursor: 'pointer',
																borderRadius: '18px',
																height: '100%',
																position: 'relative',
																transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
																border: isSelected ? '2px solid' : '1.5px solid',
																borderColor: isSelected ? 'primary.main' : 'divider',
																bgcolor: 'background.paper',
																boxShadow: isSelected 
																	? `0 12px 28px ${alpha(theme.palette.primary.main, 0.12)}` 
																	: (isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.015)'),
																'&:hover': {
																	borderColor: 'primary.main',
																	transform: 'translateY(-3px)',
																	boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, isDark ? 0.2 : 0.12)}`
																}
															}}
														>
															<CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
																{isSelected && (
																	<Box 
																		sx={{ 
																			position: 'absolute', 
																			top: 16, 
																			right: 16, 
																			display: 'flex', 
																			alignItems: 'center', 
																			justifyContent: 'center', 
																			width: 22, 
																			height: 22, 
																			borderRadius: '50%', 
																			bgcolor: 'primary.main', 
																			color: '#ffffff',
																			boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.4)}`
																		}}
																	>
																		<Check sx={{ fontSize: 14 }} />
																	</Box>
																)}
																<Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary', pr: isSelected ? 3.5 : 0 }}>
																	{tpl.name}
																</Typography>
																<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5, flex: 1, minHeight: 36, lineHeight: 1.4 }}>
																	{tpl.description}
																</Typography>
																<Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
																	<Chip
																		icon={<ReceiptLong sx={{ fontSize: '0.8rem !important' }} />}
																		label={`${tpl.tasks.length} Phases • ${subtasksCount} Tasks`}
																		size="small"
																		sx={{
																			bgcolor: isSelected 
																				? alpha(theme.palette.primary.main, 0.12)
																				: (isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'),
																			color: isSelected ? 'primary.main' : 'text.primary',
																			fontWeight: 700,
																			fontSize: '0.7rem',
																			height: 24,
																			borderRadius: '8px'
																		}}
																	/>
																</Stack>
															</CardContent>
														</Card>
													</Grid>
												);
											})}
										</Grid>
									</Box>
								)}
							</Grid>
						</Grid>
					) : activeStep === 1 ? (
						<Box sx={{ maxWidth: 650, mx: 'auto', mt: 1, pr: 1 }}>
							<Box sx={{ mb: 4, p: 2.5, borderRadius: '20px', border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(20,24,34,0.4)' : '#ffffff', boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.02)' }}>
								<Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
									Template Outline: {selectedTemplate ? selectedTemplate.name : 'Blank Project'}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
									{selectedTemplate ? selectedTemplate.description : 'A fresh project container with no default tasks.'}
								</Typography>
							</Box>

							{selectedTemplate ? (
								<Box sx={{ position: 'relative', pl: 4, ml: 1.5, '&::before': { content: '""', position: 'absolute', left: 14, top: 20, bottom: 20, width: '2px', background: `linear-gradient(to bottom, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)` } }}>
									{selectedTemplate.tasks.map((task, idx) => {
										return (
											<Box
												key={task.title}
												sx={{
													mb: 3.5,
													position: 'relative',
													p: 2.5,
													borderRadius: '18px',
													border: '1px solid',
													borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0',
													background: isDark ? 'rgba(20, 24, 34, 0.6)' : '#ffffff',
													boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 16px rgba(139, 124, 246, 0.03)',
													transition: 'all 0.3s',
													'&:hover': {
														borderColor: 'primary.main',
														boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(139, 124, 246, 0.06)',
														transform: 'translateY(-2px)'
													}
												}}
											>
												{/* Pipeline Node Indicator */}
												<Avatar
													sx={{
														position: 'absolute',
														left: -44,
														top: 18,
														width: 28,
														height: 28,
														fontSize: '0.8rem',
														fontWeight: 800,
														bgcolor: 'background.paper',
														color: 'primary.main',
														border: '2px solid',
														borderColor: 'primary.main',
														boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.25)}`
													}}
												>
													{idx + 1}
												</Avatar>

												{/* Task Header Info */}
												<Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, mb: 1.5 }}>
													<Box sx={{ minWidth: 0, flex: 1 }}>
														<Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary' }}>
															{task.title}
														</Typography>
														<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
															{task.description}
														</Typography>
													</Box>

													{/* Metadata Chips */}
													<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
														<Chip
															icon={<CalendarToday sx={{ fontSize: '0.65rem !important' }} />}
															label={`Day ${task.start_offset_days ?? 0} - ${task.due_offset_days ?? 5}`}
															size="small"
															variant="outlined"
															sx={{ fontSize: '0.65rem', fontWeight: 700, height: 22, borderRadius: '6px' }}
														/>
														{task.priority && (
															<Chip
																label={task.priority.toUpperCase()}
																size="small"
																sx={{
																	fontSize: '0.65rem',
																	fontWeight: 700,
																	height: 22,
																	borderRadius: '6px',
																	bgcolor:
																		task.priority === 'high'
																			? alpha(theme.palette.error.main, 0.1)
																			: task.priority === 'medium'
																			? alpha(theme.palette.warning.main, 0.1)
																			: alpha(theme.palette.success.main, 0.1),
																	color:
																		task.priority === 'high'
																			? 'error.main'
																			: task.priority === 'medium'
																			? 'warning.main'
																			: 'success.main'
																}}
															/>
														)}
														{task.milestone && (
															<Chip
																icon={<Flag sx={{ fontSize: '0.65rem !important' }} />}
																label={task.milestone.name}
																size="small"
																sx={{
																	fontSize: '0.65rem',
																	fontWeight: 700,
																	height: 22,
																	borderRadius: '6px',
																	bgcolor: alpha(task.milestone.color || '#9C27B0', 0.1),
																	color: task.milestone.color || '#9C27B0',
																	border: `1px solid ${alpha(task.milestone.color || '#9C27B0', 0.25)}`
																}}
															/>
														)}
													</Stack>
												</Box>

												{/* Tags */}
												{task.tags && task.tags.length > 0 && (
													<Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
														{task.tags.map((tg) => (
															<Chip
																key={tg.name}
																label={tg.name}
																size="small"
																sx={{
																	height: 18,
																	fontSize: '0.62rem',
																	fontWeight: 700,
																	bgcolor: alpha(tg.color, 0.12),
																	color: tg.color,
																	border: `1px solid ${alpha(tg.color, 0.2)}`,
																	borderRadius: '4px'
																}}
															/>
														))}
													</Box>
												)}

												{/* Nested Subtasks */}
												{task.subtasks && task.subtasks.length > 0 && (
													<Box sx={{ mt: 2, pl: 2, borderLeft: `2.5px solid ${theme.palette.divider}` }}>
														<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 1.25, display: 'block', letterSpacing: '0.05em' }}>
															Subtasks ({task.subtasks.length})
														</Typography>
														<Stack spacing={1}>
															{task.subtasks.map((sub) => (
																<Box
																	key={sub.title}
																	sx={{
																		p: 1.75,
																		borderRadius: '12px',
																		bgcolor: isDark ? 'rgba(255,255,255,0.015)' : '#f8fafc',
																		border: '1px solid',
																		borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
																		display: 'flex',
																		flexDirection: { xs: 'column', sm: 'row' },
																		alignItems: { xs: 'flex-start', sm: 'center' },
																		justifyContent: 'space-between',
																		gap: 1.5
																	}}
																>
																	<Box sx={{ minWidth: 0, flex: 1 }}>
																		<Typography variant="body2" sx={{ fontWeight: 700 }}>
																			{sub.title}
																		</Typography>
																		<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
																			{sub.description}
																		</Typography>
																	</Box>
																	<Stack direction="row" spacing={0.75} sx={{ mt: { xs: 0.5, sm: 0 }, flexShrink: 0 }}>
																		<Chip
																			label={`Day ${sub.start_offset_days ?? 0} - ${sub.due_offset_days ?? 5}`}
																			size="small"
																			variant="outlined"
																			sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, borderRadius: '4px' }}
																		/>
																		{sub.tags && sub.tags.map((stg) => (
																			<Chip
																				key={stg.name}
																				label={stg.name}
																				size="small"
																				sx={{
																					height: 20,
																					fontSize: '0.62rem',
																					fontWeight: 700,
																					bgcolor: alpha(stg.color, 0.1),
																					color: stg.color,
																					border: `1px solid ${alpha(stg.color, 0.18)}`,
																					borderRadius: '4px'
																				}}
																			/>
																		))}
																	</Stack>
																</Box>
															))}
														</Stack>
													</Box>
												)}
											</Box>
										);
									})}
								</Box>
							) : (
								<Box sx={{ textAlign: 'center', py: 4 }}>
									<WorkOutline sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1.5 }} />
									<Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
										No Default Tasks
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 350, mx: 'auto' }}>
										You will start with an empty project board. You can manually create tasks and set up workflow stages on the task board.
									</Typography>
								</Box>
							)}
						</Box>
					) : (
						<Stack spacing={3.5} sx={{ maxWidth: 600, mx: 'auto', mt: 1 }}>
							<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
								Configure Project Settings
							</Typography>

							<TextField
								label="Project Name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								fullWidth
								required
								error={!!nameError}
								helperText={nameError}
								placeholder="e.g. Software Development Project"
								autoFocus
							/>

							<RichTextEditor
								label="Description"
								value={description}
								onChange={(html) => setDescription(html)}
								placeholder="What is this project about?"
								minHeight={120}
							/>

							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
								<TextField
									select
									label="Status"
									value={status}
									onChange={(e) => setStatus(e.target.value as ProjectStatus)}
									fullWidth
								>
									<MenuItem value="planning">Planning</MenuItem>
									<MenuItem value="active">Active</MenuItem>
									<MenuItem value="on_hold">On Hold</MenuItem>
								</TextField>

								<Autocomplete
									fullWidth
									options={owners}
									getOptionLabel={(o) => o.full_name || o.email}
									isOptionEqualToValue={(o, v) => o.id === v.id}
									value={selectedOwner}
									onChange={(_, newValue) => setOwnerId(newValue?.id ?? null)}
									renderInput={(params) => <TextField {...params} label="Owner" placeholder="Unassigned" />}
								/>
							</Stack>

							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
								<DatePicker label="Start Date" value={startDate} onChange={(v) => setStartDate(v || null)} format="DD-MMM-YYYY" />
								<DatePicker label="End Date" value={endDate} onChange={(v) => setEndDate(v || null)} format="DD-MMM-YYYY" minDate={startDate || undefined} />
							</Stack>

							<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
								<NumericFormat
									customInput={TextField}
									label="Budget"
									value={budget}
									onValueChange={(values) => setBudget(values.value)}
									thousandSeparator
									decimalScale={2}
									allowNegative={false}
									fullWidth
									InputProps={{
										startAdornment: <InputAdornment position="start">{getCurrencySymbol(currency)}</InputAdornment>,
									}}
								/>
								<TextField
									select
									label="Currency"
									value={currency}
									onChange={(e) => setCurrency(e.target.value)}
									fullWidth
								>
									{currencyOptions.map((c) => (
										<MenuItem key={c.code} value={c.code}>{c.code} — {c.name}</MenuItem>
									))}
								</TextField>
							</Stack>
						</Stack>
					)}
				</Box>

				<Divider sx={{ mb: 2 }} />

				{/* Bottom Bar Actions */}
				<Box display="flex" justifyContent="space-between" alignItems="center">
					{activeStep === 0 ? (
						<>
							<Button variant="outlined" onClick={onClose}>
								Cancel
							</Button>
							<Button
								variant="contained"
								endIcon={<ArrowForward />}
								disabled={selectedCategory !== 'Blank' && !selectedTemplate}
								onClick={handleNext}
							>
								Next: Preview Template
							</Button>
						</>
					) : activeStep === 1 ? (
						<>
							<Button variant="outlined" startIcon={<ArrowBack />} onClick={handleBack}>
								Back
							</Button>
							<Button variant="contained" endIcon={<ArrowForward />} onClick={handleNext}>
								Next: Project Details
							</Button>
						</>
					) : (
						<>
							<Button variant="outlined" startIcon={<ArrowBack />} onClick={handleBack}>
								Back
							</Button>
							<Stack direction="row" spacing={1.5}>
								<Button variant="text" onClick={onClose} sx={{ color: 'text.secondary' }}>
									Cancel
								</Button>
								<Button
									variant="contained"
									disabled={submitting || !isValid}
									onClick={handleSave}
								>
									{submitting ? 'Creating...' : 'Create Project'}
								</Button>
							</Stack>
						</>
					)}
				</Box>
			</Box>
		</Drawer>
	);
};

export default ProjectCreateDrawer;
