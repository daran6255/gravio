import React, { useState, useEffect, useMemo } from 'react';
import {
	Button, TextField, Stack, FormControl, InputLabel, Select, MenuItem,
	CircularProgress, Autocomplete, ButtonGroup, Typography, Box, alpha, useTheme,
} from '@mui/material';
import { PersonSearch as ExistingIcon, PersonAdd as NewHireIcon, Badge as BadgeIcon } from '@mui/icons-material';
import { BaseDialog } from '../../../common/dialogbox';
import { DatePicker } from '../../../common/form';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createEmployee, updateEmployee } from '../../../../store/slices/hrSlice';
import { fetchTeamUsers } from '../../../../store/slices/userSlice';
import type { HREmployeeProfileCreate, HREmployeeProfileUpdate, HREmployeeListItem, EmploymentType, WorkLocation, EmployeeStatus, HRDepartmentListItem, HRDesignationListItem } from '../../../../models/hr';
import { EMPLOYMENT_TYPE_LABELS, WORK_LOCATION_LABELS, EMPLOYEE_STATUS_LABELS } from '../../../../models/hr';
import type { TeamMember } from '../../../../models/user';
import useToast from '../../../../hooks/useToast';

interface EmployeeDialogProps {
	open: boolean;
	onClose: () => void;
	onSaved: () => void;
	departments: HRDepartmentListItem[];
	designations: HRDesignationListItem[];
	existingUserIds: number[];
	existing?: HREmployeeListItem | null;
}

type EmployeeMode = 'existing' | 'new';

const EMPLOYMENT_TYPES: EmploymentType[] = ['full_time', 'part_time', 'contract', 'intern', 'consultant'];
const WORK_LOCATIONS: WorkLocation[] = ['onsite', 'remote', 'hybrid'];
const EMPLOYEE_STATUSES: EmployeeStatus[] = ['active', 'probation', 'on_notice', 'on_leave', 'resigned', 'terminated'];

const initialSharedForm: Omit<HREmployeeProfileCreate, 'user_id' | 'full_name' | 'email' | 'phone' | 'employee_id'> = {
	department_id: null,
	designation_id: null,
	employment_type: 'full_time',
	work_location: 'onsite',
	employee_status: 'active',
	date_of_joining: null,
};

export const EmployeeDialog: React.FC<EmployeeDialogProps> = ({ open, onClose, onSaved, departments, designations, existingUserIds, existing }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const { users, loading: usersLoading } = useAppSelector((state) => state.users);

	const isEditing = !!existing;

	const [mode, setMode] = useState<EmployeeMode>('existing');
	const [saving, setSaving] = useState(false);
	const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
	const [newHireName, setNewHireName] = useState('');
	const [newHireEmail, setNewHireEmail] = useState('');
	const [form, setForm] = useState(initialSharedForm);

	useEffect(() => {
		if (!open) return;
		dispatch(fetchTeamUsers({ page: 1, pageSize: 200 }));
		setMode('existing');
		setSelectedUser(null);
		if (existing) {
			setNewHireName(existing.full_name || '');
			setNewHireEmail(existing.email || '');
			setForm({
				department_id: existing.department_id,
				designation_id: existing.designation_id,
				employment_type: existing.employment_type,
				work_location: existing.work_location,
				employee_status: existing.employee_status,
				date_of_joining: existing.date_of_joining,
			});
		} else {
			setNewHireName('');
			setNewHireEmail('');
			setForm(initialSharedForm);
		}
	}, [open, existing, dispatch]);

	const availableUsers = useMemo(
		() => users.filter((u) => u.is_active && !existingUserIds.includes(u.id)),
		[users, existingUserIds]
	);

	const filteredDesignations = useMemo(
		() => (form.department_id ? designations.filter((d) => d.department_id === form.department_id) : designations),
		[designations, form.department_id]
	);

	const canSave = isEditing
		? (existing!.is_invited || !!(newHireName.trim() && newHireEmail.trim()))
		: (mode === 'existing' ? !!selectedUser : !!(newHireName.trim() && newHireEmail.trim()));

	const handleSave = async () => {
		if (!canSave) return;
		setSaving(true);
		try {
			if (isEditing) {
				const payload: HREmployeeProfileUpdate = existing!.is_invited
					? { ...form }
					: { ...form, full_name: newHireName.trim(), email: newHireEmail.trim() };
				await dispatch(updateEmployee({ publicId: existing!.public_id, payload })).unwrap();
				success('Employee updated');
			} else {
				const payload: HREmployeeProfileCreate = mode === 'existing'
					? { ...form, user_id: selectedUser!.id }
					: { ...form, full_name: newHireName.trim(), email: newHireEmail.trim() };
				const result = await dispatch(createEmployee(payload)).unwrap();
				success(
					mode === 'existing'
						? `Employee profile created — Emp ID: ${result.employee_id}`
						: `Employee added — Emp ID: ${result.employee_id}. Invite them to Gravit whenever they join.`
				);
			}
			onSaved();
			onClose();
		} catch (e: any) {
			error(e || 'Failed to save employee profile');
		} finally {
			setSaving(false);
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title={isEditing ? 'Edit Employee' : 'Add Employee'}
			subtitle={isEditing ? 'Update this employee\'s details' : 'Link an existing team member, or add a new hire\'s details before they have a login'}
			maxWidth="sm"
			loading={saving}
			actions={
				<>
					<Button onClick={onClose} disabled={saving} sx={{ borderRadius: 3 }}>Cancel</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={saving || !canSave}
						sx={{ borderRadius: 3, fontWeight: 700 }}
					>
						{saving ? <CircularProgress size={20} color="inherit" /> : isEditing ? 'Save Changes' : 'Create'}
					</Button>
				</>
			}
		>
			<Stack spacing={2.5}>
				{isEditing && existing!.employee_id && (
					<Stack
						direction="row" spacing={1} alignItems="center"
						sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.08) }}
					>
						<BadgeIcon fontSize="small" color="primary" />
						<Typography variant="body2" fontWeight={700} color="primary.main">
							Employee ID: {existing!.employee_id}
						</Typography>
					</Stack>
				)}

				{!isEditing && (
					<ButtonGroup fullWidth variant="outlined">
						<Button
							variant={mode === 'existing' ? 'contained' : 'outlined'}
							startIcon={<ExistingIcon fontSize="small" />}
							onClick={() => setMode('existing')}
							disabled={saving}
						>
							Existing Team Member
						</Button>
						<Button
							variant={mode === 'new' ? 'contained' : 'outlined'}
							startIcon={<NewHireIcon fontSize="small" />}
							onClick={() => setMode('new')}
							disabled={saving}
						>
							New Hire (no login yet)
						</Button>
					</ButtonGroup>
				)}

				{isEditing ? (
					existing!.is_invited ? (
						<Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha(theme.palette.text.primary, 0.03) }}>
							<Typography variant="body2" fontWeight={700}>{existing!.full_name}</Typography>
							<Typography variant="caption" color="text.secondary">{existing!.email}</Typography>
						</Box>
					) : (
						<Stack spacing={2.5}>
							<TextField
								label="Full Name"
								required fullWidth
								value={newHireName}
								onChange={(e) => setNewHireName(e.target.value)}
							/>
							<TextField
								label="Email"
								required fullWidth type="email"
								value={newHireEmail}
								onChange={(e) => setNewHireEmail(e.target.value)}
							/>
						</Stack>
					)
				) : mode === 'existing' ? (
					<Autocomplete
						options={availableUsers}
						value={selectedUser}
						loading={usersLoading}
						getOptionLabel={(u) => `${u.full_name || u.username} (${u.email})`}
						isOptionEqualToValue={(a, b) => a.id === b.id}
						onChange={(_, val) => setSelectedUser(val)}
						noOptionsText="No eligible users — invite a teammate from Team first"
						renderInput={(params) => (
							<TextField {...params} label="Team Member" required placeholder="Search by name or email…" />
						)}
					/>
				) : (
					<Stack spacing={2.5}>
						<Typography variant="caption" color="text.secondary">
							They won't have a Gravit login yet — you can send them an invite later from the employee list.
						</Typography>
						<TextField
							label="Full Name"
							required fullWidth
							value={newHireName}
							onChange={(e) => setNewHireName(e.target.value)}
						/>
						<TextField
							label="Email"
							required fullWidth type="email"
							value={newHireEmail}
							onChange={(e) => setNewHireEmail(e.target.value)}
						/>
					</Stack>
				)}

				<FormControl fullWidth>
					<InputLabel>Department</InputLabel>
					<Select
						value={form.department_id || ''}
						label="Department"
						onChange={(e) => setForm({ ...form, department_id: (e.target.value as number) || null, designation_id: null })}
					>
						<MenuItem value="">None</MenuItem>
						{departments.map((d) => (
							<MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl fullWidth>
					<InputLabel>Designation</InputLabel>
					<Select
						value={form.designation_id || ''}
						label="Designation"
						onChange={(e) => setForm({ ...form, designation_id: (e.target.value as number) || null })}
					>
						<MenuItem value="">None</MenuItem>
						{filteredDesignations.map((d) => (
							<MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
						))}
					</Select>
				</FormControl>
				<Stack direction="row" spacing={2}>
					<FormControl fullWidth>
						<InputLabel>Employment Type</InputLabel>
						<Select
							value={form.employment_type}
							label="Employment Type"
							onChange={(e) => setForm({ ...form, employment_type: e.target.value as EmploymentType })}
						>
							{EMPLOYMENT_TYPES.map((t) => (
								<MenuItem key={t} value={t}>{EMPLOYMENT_TYPE_LABELS[t]}</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControl fullWidth>
						<InputLabel>Work Location</InputLabel>
						<Select
							value={form.work_location}
							label="Work Location"
							onChange={(e) => setForm({ ...form, work_location: e.target.value as WorkLocation })}
						>
							{WORK_LOCATIONS.map((w) => (
								<MenuItem key={w} value={w}>{WORK_LOCATION_LABELS[w]}</MenuItem>
							))}
						</Select>
					</FormControl>
				</Stack>
				<Stack direction="row" spacing={2}>
					<FormControl fullWidth>
						<InputLabel>Status</InputLabel>
						<Select
							value={form.employee_status}
							label="Status"
							onChange={(e) => setForm({ ...form, employee_status: e.target.value as EmployeeStatus })}
						>
							{EMPLOYEE_STATUSES.map((s) => (
								<MenuItem key={s} value={s}>{EMPLOYEE_STATUS_LABELS[s]}</MenuItem>
							))}
						</Select>
					</FormControl>
					<DatePicker
						label="Date of Joining"
						value={form.date_of_joining ?? null}
						onChange={(v) => setForm({ ...form, date_of_joining: v || null })}
					/>
				</Stack>
			</Stack>
		</BaseDialog>
	);
};

export default EmployeeDialog;
