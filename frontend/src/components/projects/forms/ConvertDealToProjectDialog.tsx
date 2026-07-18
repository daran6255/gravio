import React, { useState, useEffect } from 'react';
import { Dialog, TextField, Stack, InputAdornment, Typography, Grid, Card, CardContent, List, ListItemButton, ListItemIcon, ListItemText, Box, useTheme, alpha, Avatar, Chip } from '@mui/material';
import { WorkOutline, ReceiptLong, Flag, CalendarToday, Check } from '@mui/icons-material';
import { EnterpriseForm, type FormStep, DatePicker } from '../../common/form';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { convertDealToProject } from '../../../store/slices/projectsSlice';
import type { Deal } from '../../../models/crm/deal';
import type { Project, DealProjectConversionPreview } from '../../../models/projects/project';
import useToast from '../../../hooks/useToast';
import crmService from '../../../services/crmService';
import { getCurrencySymbol, formatMoney } from '../../../utils/currency';
import { TEMPLATE_CATEGORIES } from '../../../data/projectTemplates';
import type { ProjectTemplate } from '../../../data/projectTemplates';
import dayjs from 'dayjs';

interface ConvertDealToProjectDialogProps {
	open: boolean;
	onClose: () => void;
	deal: Deal | null;
	onConverted: (project: Project) => void;
}

export const ConvertDealToProjectDialog: React.FC<ConvertDealToProjectDialogProps> = ({ open, onClose, deal, onConverted }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const { convertLoading, convertError } = useAppSelector((state) => state.projects);

	const [name, setName] = useState('');
	const [budget, setBudget] = useState('');
	const [startDate, setStartDate] = useState<string | null>(null);
	const [endDate, setEndDate] = useState<string | null>(null);

	// Template states matching ProjectCreateDrawer
	const [selectedCategory, setSelectedCategory] = useState<string>('Software');
	const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);

	const [preview, setPreview] = useState<DealProjectConversionPreview | null>(null);
	const [loadingPreview, setLoadingPreview] = useState(false);

	useEffect(() => {
		if (open && deal) {
			setName(deal.title);
			setStartDate(null);
			setEndDate(null);
			setSelectedCategory('Software');
			setSelectedTemplate(null);
			setPreview(null);
			setLoadingPreview(true);

			crmService.getDealProjectConversionPreview(deal.public_id)
				.then((p) => {
					setPreview(p);
					if (p.converted && p.converted_value != null) {
						setBudget(String(p.converted_value));
					} else {
						setBudget(deal.value != null ? String(deal.value) : '');
					}
				})
				.catch((err) => {
					console.error('Failed to load project conversion preview', err);
					setBudget(deal.value != null ? String(deal.value) : '');
				})
				.finally(() => {
					setLoadingPreview(false);
				});
		} else {
			setPreview(null);
			setBudget('');
			setSelectedCategory('Software');
			setSelectedTemplate(null);
		}
	}, [open, deal]);

	const handleTemplateSelect = (template: ProjectTemplate | null) => {
		setSelectedTemplate(template);
		if (template && deal) {
			setName(`${template.name} - ${deal.title}`);
		} else if (deal) {
			setName(deal.title);
		}
	};

	const handleConvert = async () => {
		if (!deal) return;
		try {
			const project = await dispatch(convertDealToProject({
				dealPublicId: deal.public_id,
				payload: {
					name: name.trim() || undefined,
					budget: budget ? Number(budget) : undefined,
					start_date: startDate || undefined,
					end_date: endDate || undefined,
					template_key: selectedTemplate?.key || undefined,
				},
			})).unwrap();
			toast.success('Deal converted to a project 🎉');
			onConverted(project);
			onClose();
		} catch {
			// convertError is surfaced via the EnterpriseForm
		}
	};

	const currentCategory = TEMPLATE_CATEGORIES.find((c) => c.name === selectedCategory);
	const templatesList = currentCategory?.templates || [];

	const steps: FormStep[] = [
		{
			label: 'Configure Project',
			description: 'Setup project metadata and financial budget parameters.',
			content: (
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<TextField
						label="Project Name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						fullWidth
						size="small"
						required
					/>

					<Stack direction="row" spacing={2}>
						<DatePicker label="Start Date" value={startDate} onChange={(v) => setStartDate(v || null)} format="DD-MMM-YYYY" size="small" />
						<DatePicker label="End Date" value={endDate} onChange={(v) => setEndDate(v || null)} format="DD-MMM-YYYY" size="small" minDate={startDate || undefined} />
					</Stack>

					<TextField
						label="Budget"
						type="number"
						value={budget}
						onChange={(e) => setBudget(e.target.value)}
						fullWidth
						size="small"
						disabled={loadingPreview}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									{getCurrencySymbol(preview?.target_currency || deal?.currency)}
								</InputAdornment>
							),
							endAdornment: preview?.target_currency ? (
								<InputAdornment position="end" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
									{preview.target_currency}
								</InputAdornment>
							) : undefined,
						}}
						helperText={
							preview?.converted && preview.original_value != null && preview.rate && preview.rate_date ? (
								<Typography variant="caption" color="text.secondary" component="span" display="block" sx={{ mt: 0.5 }}>
									Converted from{' '}
									<strong>
										{formatMoney(preview.original_value, preview.original_currency)}
									</strong>{' '}
									at the rate of 1 {preview.original_currency} = {preview.rate.toFixed(4)}{' '}
									{preview.target_currency} (rate as of{' '}
									{dayjs(preview.rate_date).format('DD-MMM-YYYY')})
								</Typography>
							) : undefined
						}
					/>
				</Stack>
			)
		},
		{
			label: 'Choose Template',
			description: 'Select an industry-standard template to seed tasks.',
			content: (
				<Grid container spacing={3} sx={{ minHeight: 340, mt: 1 }}>
					{/* Left Sidebar - Categories */}
					<Grid size={{ xs: 4 }} sx={{ borderRight: '1px solid', borderColor: 'divider', pr: 2 }}>
						<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', pl: 1 }}>
							Categories
						</Typography>
						<List component="nav" sx={{ mt: 1 }}>
							<ListItemButton
								selected={selectedTemplate === null && selectedCategory === 'Blank'}
								onClick={() => {
									setSelectedCategory('Blank');
									handleTemplateSelect(null);
								}}
								sx={{ borderRadius: '10px', mb: 0.5 }}
							>
								<ListItemIcon sx={{ minWidth: 36 }}><WorkOutline fontSize="small" /></ListItemIcon>
								<ListItemText primary={<Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Blank Project</Typography>} />
							</ListItemButton>
							{TEMPLATE_CATEGORIES.map((cat) => (
								<ListItemButton
									key={cat.name}
									selected={selectedCategory === cat.name}
									onClick={() => setSelectedCategory(cat.name)}
									sx={{ borderRadius: '10px', mb: 0.5 }}
								>
									<ListItemIcon sx={{ minWidth: 36 }}>{cat.icon}</ListItemIcon>
									<ListItemText primary={<Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{cat.name}</Typography>} />
								</ListItemButton>
							))}
						</List>
					</Grid>

					{/* Right - Templates list */}
					<Grid size={{ xs: 8 }} sx={{ pr: 2, overflowY: 'auto', maxHeight: 340 }}>
						{selectedCategory === 'Blank' ? (
							<Box sx={{ p: 2, textAlign: 'center', mt: 4 }}>
								<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
									Starting fresh?
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
									Create a project without any pre-defined tasks. You can add columns and tasks manually as needed.
								</Typography>
							</Box>
						) : (
							<Box>
								<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
									{selectedCategory} Templates
								</Typography>
								<Grid container spacing={2} sx={{ mt: 1 }}>
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
			)
		},
		{
			label: 'Preview Template',
			description: 'Preview standard tasks/phases included in this template.',
			content: (
				<Box sx={{ maxWidth: 650, mx: 'auto', mt: 1, pr: 1, overflowY: 'auto', maxHeight: 340 }}>
					<Box sx={{ mb: 3, p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
							Template Outline: {selectedTemplate ? selectedTemplate.name : 'Blank Project'}
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
							{selectedTemplate ? selectedTemplate.description : 'A fresh project container with no default tasks.'}
						</Typography>
					</Box>

					{selectedTemplate ? (
						<Stack spacing={2.5}>
							{selectedTemplate.tasks.map((task, idx) => {
								return (
									<Box
										key={task.title}
										sx={{
											p: 2,
											borderRadius: '16px',
											border: '1px solid',
											borderColor: 'divider',
											background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
											position: 'relative',
											transition: 'all 0.2s',
											'&:hover': {
												borderColor: 'primary.main',
												boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.04)}`
											}
										}}
									>
										{/* Task Header: Number, Title, Offsets, Priority, Milestone */}
										<Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, mb: 1.5 }}>
											<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1, minWidth: 0 }}>
												<Avatar
													sx={{
														width: 28,
														height: 28,
														fontSize: '0.85rem',
														fontWeight: 800,
														bgcolor: alpha(theme.palette.primary.main, 0.1),
														color: 'primary.main',
														border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
													}}
												>
													{idx + 1}
												</Avatar>
												<Box sx={{ minWidth: 0 }}>
													<Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
														{task.title}
													</Typography>
													<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
														{task.description}
													</Typography>
												</Box>
											</Box>

											{/* Metadata Chips */}
											<Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
												<Chip
													icon={<CalendarToday sx={{ fontSize: '0.65rem !important' }} />}
													label={`Day ${task.start_offset_days ?? 0} - ${task.due_offset_days ?? 5}`}
													size="small"
													variant="outlined"
													sx={{ fontSize: '0.65rem', fontWeight: 700, height: 20 }}
												/>
												{task.priority && (
													<Chip
														label={task.priority.toUpperCase()}
														size="small"
														sx={{
															fontSize: '0.65rem',
															fontWeight: 700,
															height: 20,
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
														label={`Milestone: ${task.milestone.name}`}
														size="small"
														sx={{
															fontSize: '0.65rem',
															fontWeight: 700,
															height: 20,
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
											<Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5, pl: 5.5 }}>
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
															border: `1px solid ${alpha(tg.color, 0.2)}`
														}}
													/>
												))}
											</Box>
										)}

										{/* Nested Subtasks */}
										{task.subtasks && task.subtasks.length > 0 && (
											<Box sx={{ mt: 1.5, pl: 5.5, borderLeft: `2px solid ${theme.palette.divider}` }}>
												<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 1, display: 'block', letterSpacing: '0.05em' }}>
													Subtasks ({task.subtasks.length})
												</Typography>
												<Stack spacing={0.75}>
													{task.subtasks.map((sub) => (
														<Box
															key={sub.title}
															sx={{
																p: 1.25,
																borderRadius: '10px',
																bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
																border: `1px solid ${theme.palette.divider}`,
																display: 'flex',
																flexDirection: { xs: 'column', sm: 'row' },
																alignItems: { xs: 'flex-start', sm: 'center' },
																justifyContent: 'space-between',
																gap: 1
															}}
														>
															<Box sx={{ minWidth: 0 }}>
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
																	sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
																/>
																{sub.tags && sub.tags.map((stg) => (
																	<Chip
																		key={stg.name}
																		label={stg.name}
																		size="small"
																		sx={{
																			height: 18,
																			fontSize: '0.6rem',
																			fontWeight: 700,
																			bgcolor: alpha(stg.color, 0.1),
																			color: stg.color,
																			border: `1px solid ${alpha(stg.color, 0.15)}`
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
						</Stack>
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
			)
		}
	];

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{ sx: { borderRadius: 0, boxShadow: 'none', bgcolor: 'transparent' } }}
		>
			<EnterpriseForm
				title="Convert to Project"
				subtitle={deal ? `Start tracking delivery work for "${deal.title}"` : undefined}
				mode="create"
				steps={steps}
				onSave={handleConvert}
				onCancel={onClose}
				isSubmitting={convertLoading}
				saveButtonText="Convert"
				error={convertError}
			/>
		</Dialog>
	);
};

export default ConvertDealToProjectDialog;
