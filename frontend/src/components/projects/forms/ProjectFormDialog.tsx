import React, { useState } from 'react';
import { Stack, TextField, MenuItem, Autocomplete, Button, CircularProgress, useTheme, InputAdornment, Box, Divider } from '@mui/material';
import { DetailDrawer } from '../../common/drawer/DetailDrawer';
import { DatePicker, RichTextEditor } from '../../common/form';
import useToast from '../../../hooks/useToast';
import { getWorldCurrencies, getCurrencySymbol } from '../../../utils/currency';
import { NumericFormat } from 'react-number-format';
import type { Project, ProjectStatus, ProjectCreate, ProjectUpdate } from '../../../models/projects/project';
import { PROJECT_STATUS_OPTIONS } from '../../../models/projects/project';
import type { CRMOwnerOption } from '../../../models/crm/owner';

interface ProjectFormDialogProps {
	open: boolean;
	onClose: () => void;
	project?: Project | null;
	owners: CRMOwnerOption[];
	submitting: boolean;
	onSubmit: (payload: ProjectCreate | ProjectUpdate) => Promise<void>;
}

export const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({ open, onClose, project, owners, submitting, onSubmit }) => {
	const theme = useTheme();
	const toast = useToast();
	const isEdit = !!project;
	const currencyOptions = React.useMemo(() => getWorldCurrencies(), []);

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [status, setStatus] = useState<ProjectStatus>('planning');
	const [ownerId, setOwnerId] = useState<number | null>(null);
	const [startDate, setStartDate] = useState<string | null>(null);
	const [endDate, setEndDate] = useState<string | null>(null);
	const [budget, setBudget] = useState('');
	const [currency, setCurrency] = useState('USD');
	const [touched, setTouched] = useState(false);

	// Reset the form whenever the dialog transitions from closed to open, same
	// idiom used elsewhere (e.g. CompanyDetailDrawer's prevCompanyId tracking)
	// instead of resetting state inside a useEffect.
	const [prevOpen, setPrevOpen] = useState(open);
	if (open !== prevOpen) {
		setPrevOpen(open);
		if (open) {
			setName(project?.name || '');
			setDescription(project?.description || '');
			setStatus(project?.status || 'planning');
			setOwnerId(project?.owner_id ?? null);
			setStartDate(project?.start_date || null);
			setEndDate(project?.end_date || null);
			setBudget(project?.budget != null ? String(project.budget) : '');
			setCurrency(project?.currency || 'USD');
			setTouched(false);
		}
	}

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
			});
		} catch (err: any) {
			toast.error(err || 'Failed to save project');
		}
	};

	const selectedOwner = owners.find((o) => o.id === ownerId) || null;

	return (
		<DetailDrawer
			open={open}
			onClose={onClose}
			title={isEdit ? 'Edit Project' : 'New Project'}
			subtitle={isEdit ? project?.name : 'Track a delivery project and its tasks'}
			width={550}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
				{/* Scrollable Form Body */}
				<Box sx={{ flex: 1, overflow: 'auto', mb: 3, pr: 0.5 }}>
					<Stack spacing={2.5} sx={{ mt: 1 }}>
						<TextField
							label="Project Name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
							fullWidth
							error={!!nameError}
							helperText={nameError}
							placeholder="e.g. Acme Corp Website Revamp"
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
								{PROJECT_STATUS_OPTIONS.map((s) => (
									<MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
								))}
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
				</Box>

				<Divider sx={{ mb: 2, mx: { xs: -2.5, sm: -3.5 } }} />

				{/* Footer Actions */}
				<Box display="flex" justifyContent="flex-end" alignItems="center" gap={1.5}>
					<Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={submitting || !isValid}
						sx={{
							color: 'white',
							textTransform: 'none',
							fontWeight: 700,
							px: 4,
							minWidth: 140,
							borderRadius: '10px',
							boxShadow: 'none',
							background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
							'&:hover': { boxShadow: '0 4px 12px rgba(139,124,246,0.3)' },
							'&.Mui-disabled': { background: theme.palette.action.disabledBackground },
						}}
					>
						{submitting ? <CircularProgress size={18} color="inherit" /> : 'Save Changes'}
					</Button>
				</Box>
			</Box>
		</DetailDrawer>
	);
};

export default ProjectFormDialog;
