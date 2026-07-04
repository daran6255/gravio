import React, { useState } from 'react';
import { Stack, TextField, MenuItem, Autocomplete, Button, CircularProgress, useTheme } from '@mui/material';
import { BaseDialog } from '../../common/dialogbox';
import { DatePicker } from '../../common/form';
import useToast from '../../../hooks/useToast';
import { getWorldCurrencies } from '../../../utils/currency';
import type { Project, ProjectStatus, ProjectCreate, ProjectUpdate } from '../../../models/projects/project';
import type { CRMOwnerOption } from '../../../models/crm/owner';

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
	{ value: 'planning', label: 'Planning' },
	{ value: 'active', label: 'Active' },
	{ value: 'on_hold', label: 'On Hold' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'archived', label: 'Archived' },
];

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
	const [phase, setPhase] = useState('');
	const [issues, setIssues] = useState('');
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
			setPhase(project?.phase || '');
			setIssues(project?.issues || '');
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
				phase: phase.trim() || undefined,
				issues: issues.trim() || undefined,
			});
		} catch (err: any) {
			toast.error(err || 'Failed to save project');
		}
	};

	const selectedOwner = owners.find((o) => o.id === ownerId) || null;

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title={isEdit ? 'Edit Project' : 'New Project'}
			subtitle={isEdit ? project?.name : 'Track a delivery project and its tasks'}
			maxWidth="sm"
			loading={submitting}
			actions={
				<>
					<Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={submitting}
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
						{submitting ? <CircularProgress size={18} color="inherit" /> : isEdit ? 'Save Changes' : 'Create Project'}
					</Button>
				</>
			}
		>
			<Stack spacing={2.5}>
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

				<TextField
					label="Description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					fullWidth
					multiline
					rows={2}
				/>

				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<TextField
						select
						label="Status"
						value={status}
						onChange={(e) => setStatus(e.target.value as ProjectStatus)}
						fullWidth
					>
						{PROJECT_STATUSES.map((s) => (
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
					<TextField
						label="Phase"
						value={phase}
						onChange={(e) => setPhase(e.target.value)}
						fullWidth
						placeholder="e.g. Design, Development"
					/>
					<TextField
						label="Issues"
						value={issues}
						onChange={(e) => setIssues(e.target.value)}
						fullWidth
						placeholder="e.g. None, Pending approval"
					/>
				</Stack>

				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<TextField
						label="Budget"
						type="number"
						value={budget}
						onChange={(e) => setBudget(e.target.value)}
						fullWidth
						slotProps={{ htmlInput: { min: 0 } }}
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
		</BaseDialog>
	);
};

export default ProjectFormDialog;
