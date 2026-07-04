import React, { useState, useEffect } from 'react';
import { Dialog, TextField, Stack, InputAdornment, Typography, Grid, Card, CardContent, List, ListItemButton, ListItemIcon, ListItemText, Box, useTheme, alpha } from '@mui/material';
import { WorkOutline, CheckCircleOutline, ReceiptLong } from '@mui/icons-material';
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
									{templatesList.map((tpl) => (
										<Grid size={{ xs: 12, sm: 6 }} key={tpl.key}>
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
			)
		},
		{
			label: 'Preview Template',
			description: 'Preview standard tasks/phases included in this template.',
			content: (
				<Box sx={{ maxWidth: 600, mx: 'auto', mt: 1, overflowY: 'auto', maxHeight: 340 }}>
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
