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
	Stepper,
	Step,
	StepLabel,
	useTheme,
	alpha,
	InputAdornment
} from '@mui/material';
import {
	Close,
	WorkOutline,
	ArrowBack,
	ArrowForward,
	CheckCircleOutline,
	ReceiptLong
} from '@mui/icons-material';
import { DatePicker, RichTextEditor } from '../../common/form';
import useToast from '../../../hooks/useToast';
import type { ProjectCreate, ProjectStatus } from '../../../models/projects/project';
import type { CRMOwnerOption } from '../../../models/crm/owner';
import { getWorldCurrencies, getCurrencySymbol } from '../../../utils/currency';
import { NumericFormat } from 'react-number-format';
import { TEMPLATE_CATEGORIES } from '../../../data/projectTemplates';
import type { ProjectTemplate } from '../../../data/projectTemplates';

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
					bgcolor: 'background.default',
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
						<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
							Create New Project
						</Typography>
						<Typography variant="caption" color="text.secondary">
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

				{/* Stepper */}
				<Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
					<Step key="Select Template">
						<StepLabel>Choose Template</StepLabel>
					</Step>
					<Step key="Preview Template">
						<StepLabel>Preview Template</StepLabel>
					</Step>
					<Step key="Project Details">
						<StepLabel>Configure Project</StepLabel>
					</Step>
				</Stepper>

				{/* Step Content */}
				<Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', mb: 3 }}>
					{activeStep === 0 ? (
						<Grid container spacing={3} sx={{ height: '100%' }}>
							{/* Left Sidebar - Categories */}
							<Grid size={{ xs: 3 }} sx={{ borderRight: '1px solid', borderColor: 'divider', pr: 2 }}>
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
											onClick={() => handleCategoryClick(cat.name)}
											sx={{ borderRadius: '10px', mb: 0.5 }}
										>
											<ListItemIcon sx={{ minWidth: 36 }}>{cat.icon}</ListItemIcon>
											<ListItemText primary={<Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{cat.name}</Typography>} />
										</ListItemButton>
									))}
								</List>
							</Grid>

							{/* Right - Templates list */}
							<Grid size={{ xs: 9 }} sx={{ pr: 2 }}>
								{selectedCategory === 'Blank' ? (
									<Box sx={{ p: 2, textAlign: 'center', mt: 4 }}>
										<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
											Starting fresh?
										</Typography>
										<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
											Create a project without any pre-defined tasks. You can add columns and tasks manually as needed.
										</Typography>
										<Button variant="contained" endIcon={<ArrowForward />} onClick={handleNext}>
											Next: Preview & Customize
										</Button>
									</Box>
								) : (
									<Box>
										<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
											{selectedCategory} Templates
										</Typography>
										<Grid container spacing={2} sx={{ mt: 1 }}>
											{templatesList.map((tpl) => (
												<Grid size={{ xs: 12, md: 6 }} key={tpl.key}>
													<Card
														variant="outlined"
														onClick={() => handleTemplateSelect(tpl)}
														sx={{
															cursor: 'pointer',
															borderRadius: '12px',
															height: '100%',
															transition: 'all 0.2s',
															borderColor: selectedTemplate?.key === tpl.key ? 'primary.main' : 'divider',
															bgcolor: selectedTemplate?.key === tpl.key ? alpha(theme.palette.primary.main, isDark ? 0.1 : 0.04) : 'background.paper',
															'&:hover': {
																borderColor: 'primary.main',
																boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`
															}
														}}
													>
														<CardContent sx={{ p: '16px !important' }}>
															<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
																{tpl.name}
															</Typography>
															<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', minHeight: 36 }}>
																{tpl.description}
															</Typography>
															<Typography variant="caption" sx={{ mt: 1.5, display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'primary.main', fontWeight: 600 }}>
																<ReceiptLong sx={{ fontSize: 14 }} /> {tpl.tasks.length} tasks
															</Typography>
														</CardContent>
													</Card>
												</Grid>
											))}
										</Grid>
									</Box>
								)}
							</Grid>
						</Grid>
					) : activeStep === 1 ? (
						<Box sx={{ maxWidth: 600, mx: 'auto', mt: 1 }}>
							<Box sx={{ mb: 3 }}>
								<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
									Template: {selectedTemplate ? selectedTemplate.name : 'Blank Project'}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
									{selectedTemplate ? selectedTemplate.description : 'A fresh project container with no default tasks.'}
								</Typography>
							</Box>

							{selectedTemplate ? (
								<Stack spacing={2.5} sx={{ position: 'relative', pl: 3, '&::before': { content: '""', position: 'absolute', left: 4, top: 10, bottom: 10, width: 1.5, bgcolor: 'divider' } }}>
									{selectedTemplate.tasks.map((task) => (
										<Box key={task.title} sx={{ position: 'relative' }}>
											<CheckCircleOutline
												sx={{
													position: 'absolute',
													left: -32,
													top: 2,
													fontSize: 16,
													color: 'primary.main',
													bgcolor: 'background.default'
												}}
											/>
											<Typography variant="body2" sx={{ fontWeight: 700 }}>
												{task.title}
											</Typography>
											<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
												{task.description}
											</Typography>
										</Box>
									))}
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
					) : (
						<Stack spacing={3.5} sx={{ maxDrawWidth: 600, mx: 'auto', mt: 1 }}>
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
