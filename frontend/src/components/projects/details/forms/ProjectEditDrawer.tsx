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
	Autocomplete,
	useTheme,
	alpha,
	InputAdornment,
} from '@mui/material';
import {
	Close,
	InfoOutlined,
	GroupsOutlined,
	EventOutlined,
	NotesOutlined,
} from '@mui/icons-material';
import { NumericFormat } from 'react-number-format';
import { DatePicker, RichTextEditor } from '../../../common/form';
import { CancelButton, SubmitButton } from '../../../common/button';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { searchCompanyOptions } from '../../../../store/slices/crmSlice';
import { getWorldCurrencies, getCurrencySymbol } from '../../../../utils/currency';
import { PROJECT_STATUS_OPTIONS } from '../../../../models/projects/project';
import type { Project, ProjectStatus, ProjectUpdate } from '../../../../models/projects/project';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import type { Company } from '../../../../models/crm/company';

interface ProjectEditDrawerProps {
	open: boolean;
	onClose: () => void;
	project: Project | null;
	owners: CRMOwnerOption[];
	submitting: boolean;
	onSubmit: (payload: ProjectUpdate) => Promise<void>;
}

/** A grouped section card, giving the form visual structure instead of one long flat stack. */
const Section: React.FC<{ icon: React.ReactNode; title: string; color: string; children: React.ReactNode }> = ({
	icon,
	title,
	color,
	children,
}) => {
	const theme = useTheme();

	return (
		<Box
			sx={{
				p: 2.5,
				borderRadius: '16px',
				border: '1px solid',
				borderColor: theme.palette.divider,
				bgcolor: theme.palette.action.hover,
			}}
		>
			<Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.25 }}>
				<Box
					sx={{
						width: 30,
						height: 30,
						borderRadius: '9px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexShrink: 0,
						bgcolor: alpha(color, 0.12),
						color,
					}}
				>
					{icon}
				</Box>
				<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
					{title}
				</Typography>
			</Stack>
			<Stack spacing={2.5}>{children}</Stack>
		</Box>
	);
};

export const ProjectEditDrawer: React.FC<ProjectEditDrawerProps> = ({
	open,
	onClose,
	project,
	owners,
	submitting,
	onSubmit,
}) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { companyOptions } = useAppSelector((state) => state.crm);
	const currencyOptions = React.useMemo(() => getWorldCurrencies(), []);

	const [name, setName] = useState('');
	const [status, setStatus] = useState<ProjectStatus>('planning');
	const [ownerId, setOwnerId] = useState<number | null>(null);
	const [company, setCompany] = useState<Company | null>(null);
	const [startDate, setStartDate] = useState<string | null>(null);
	const [endDate, setEndDate] = useState<string | null>(null);
	const [budget, setBudget] = useState('');
	const [currency, setCurrency] = useState('USD');
	const [description, setDescription] = useState('');
	const [touched, setTouched] = useState(false);

	React.useEffect(() => {
		if (open && project) {
			setName(project.name);
			setStatus(project.status);
			setOwnerId(project.owner_id ?? null);
			setCompany(project.company_id ? { id: project.company_id, name: project.company_name || '' } as Company : null);
			setStartDate(project.start_date || null);
			setEndDate(project.end_date || null);
			setBudget(project.budget != null ? String(project.budget) : '');
			setCurrency(project.currency || 'USD');
			setDescription(project.description || '');
			setTouched(false);
		}
	}, [open, project]);

	const nameError = touched && !name.trim() ? 'Project name is required' : '';
	const isValid = !!name.trim();
	const selectedOwner = owners.find((o) => o.id === ownerId) || null;

	const handleSave = async () => {
		setTouched(true);
		if (!isValid) return;

		const payload: ProjectUpdate = {
			name: name.trim(),
			status,
			owner_id: ownerId ?? undefined,
			company_id: company?.id ?? undefined,
			start_date: startDate || undefined,
			end_date: endDate || undefined,
			budget: budget.trim() ? Number(budget) : undefined,
			currency,
			description: description.trim() || undefined,
		};

		await onSubmit(payload);
	};

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: {
					width: { xs: '100%', sm: 460 },
					p: 3,
					bgcolor: theme.palette.background.paper,
				},
			}}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
				<Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
					<Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
						Edit Project Details
					</Typography>
					<IconButton
						onClick={onClose}
						size="small"
						sx={{
							color: 'text.secondary',
							'&:hover': { bgcolor: theme.palette.action.hover },
						}}
					>
						<Close sx={{ fontSize: 20 }} />
					</IconButton>
				</Box>

				<Divider sx={{ mb: 3 }} />

				<Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', pt: 0.5 }}>
					<Stack spacing={2.5}>
						<Section icon={<InfoOutlined sx={{ fontSize: 17 }} />} title="Basic Details" color={theme.palette.primary.main}>
							<TextField
								label="Project Name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								fullWidth
								required
								error={!!nameError}
								helperText={nameError}
							/>

							<TextField
								select
								label="Status"
								value={status}
								onChange={(e) => setStatus(e.target.value as ProjectStatus)}
								fullWidth
							>
								{PROJECT_STATUS_OPTIONS.map((s) => (
									<MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
								))}
							</TextField>
						</Section>

						<Section icon={<GroupsOutlined sx={{ fontSize: 17 }} />} title="Ownership & Client" color={theme.palette.secondary.main}>
							<Autocomplete
								fullWidth
								options={owners}
								getOptionLabel={(o) => o.full_name || o.email}
								isOptionEqualToValue={(o, v) => o.id === v.id}
								value={selectedOwner}
								onChange={(_, newValue) => setOwnerId(newValue?.id ?? null)}
								renderInput={(params) => <TextField {...params} label="Owner" placeholder="Unassigned" />}
							/>

							<Autocomplete
								fullWidth
								options={companyOptions}
								getOptionLabel={(o) => o.name}
								isOptionEqualToValue={(o, v) => o.id === v.id}
								value={company}
								onChange={(_, newValue) => setCompany(newValue)}
								onInputChange={(_, val) => dispatch(searchCompanyOptions(val || undefined))}
								renderInput={(params) => (
									<TextField {...params} label="Client / Company" placeholder="Type to search companies..." />
								)}
							/>
						</Section>

						<Section icon={<EventOutlined sx={{ fontSize: 17 }} />} title="Schedule & Budget" color={theme.palette.success.main}>
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
						</Section>

						<Section icon={<NotesOutlined sx={{ fontSize: 17 }} />} title="Description" color={theme.palette.warning.main}>
							<RichTextEditor
								value={description}
								onChange={(html) => setDescription(html)}
								placeholder="What is this project about?"
								minHeight={120}
							/>
						</Section>
					</Stack>
				</Box>

				<Divider sx={{ mt: 3, mb: 2 }} />

				<Box display="flex" justifyContent="flex-end">
					<Stack direction="row" spacing={1.5}>
						<CancelButton onClick={onClose} sx={{ color: 'text.secondary' }} />
						<SubmitButton
							loading={submitting}
							disabled={!isValid}
							onClick={handleSave}
							sx={{
								color: theme.palette.primary.contrastText,
								background: theme.gradients.brand,
								'&:hover': { boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` },
							}}
						>
							Save Changes
						</SubmitButton>
					</Stack>
				</Box>
			</Box>
		</Drawer>
	);
};

export default ProjectEditDrawer;
