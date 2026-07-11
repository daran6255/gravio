import React, { useState, useEffect, useMemo } from 'react';
import {
	Button, TextField, Stack, FormControl, InputLabel, Select, MenuItem,
	CircularProgress, Autocomplete,
} from '@mui/material';
import { BaseDialog } from '../../../common/dialogbox';
import { DatePicker } from '../../../common/form';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createEmployee } from '../../../../store/slices/hrSlice';
import { fetchTeamUsers } from '../../../../store/slices/userSlice';
import type { HREmployeeProfileCreate, EmploymentType, WorkLocation, EmployeeStatus, HRDepartmentListItem, HRDesignationListItem } from '../../../../models/hr';
import { EMPLOYMENT_TYPE_LABELS, WORK_LOCATION_LABELS, EMPLOYEE_STATUS_LABELS } from '../../../../models/hr';
import type { TeamMember } from '../../../../models/user';
import useToast from '../../../../hooks/useToast';

interface EmployeeDialogProps {
	open: boolean;
	onClose: () => void;
	onCreated: () => void;
	departments: HRDepartmentListItem[];
	designations: HRDesignationListItem[];
	existingUserIds: number[];
}

const EMPLOYMENT_TYPES: EmploymentType[] = ['full_time', 'part_time', 'contract', 'intern', 'consultant'];
const WORK_LOCATIONS: WorkLocation[] = ['onsite', 'remote', 'hybrid'];
const EMPLOYEE_STATUSES: EmployeeStatus[] = ['active', 'probation', 'on_notice', 'on_leave', 'resigned', 'terminated'];

export const EmployeeDialog: React.FC<EmployeeDialogProps> = ({ open, onClose, onCreated, departments, designations, existingUserIds }) => {
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const { users, loading: usersLoading } = useAppSelector((state) => state.users);

	const [saving, setSaving] = useState(false);
	const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
	const [form, setForm] = useState<Omit<HREmployeeProfileCreate, 'user_id'>>({
		employee_id: '',
		department_id: null,
		designation_id: null,
		employment_type: 'full_time',
		work_location: 'onsite',
		employee_status: 'active',
		date_of_joining: null,
	});

	useEffect(() => {
		if (open) {
			dispatch(fetchTeamUsers({ page: 1, pageSize: 200 }));
			setSelectedUser(null);
			setForm({
				employee_id: '', department_id: null, designation_id: null,
				employment_type: 'full_time', work_location: 'onsite',
				employee_status: 'active', date_of_joining: null,
			});
		}
	}, [open, dispatch]);

	const availableUsers = useMemo(
		() => users.filter((u) => u.is_active && !existingUserIds.includes(u.id)),
		[users, existingUserIds]
	);

	const filteredDesignations = useMemo(
		() => (form.department_id ? designations.filter((d) => d.department_id === form.department_id) : designations),
		[designations, form.department_id]
	);

	const handleSave = async () => {
		if (!selectedUser) return;
		setSaving(true);
		try {
			await dispatch(createEmployee({
				...form,
				user_id: selectedUser.id,
				employee_id: form.employee_id || undefined,
			})).unwrap();
			success('Employee profile created');
			onCreated();
			onClose();
		} catch (e: any) {
			error(e || 'Failed to create employee profile');
		} finally {
			setSaving(false);
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Add Employee"
			subtitle="Create an HR profile for an existing team member"
			maxWidth="sm"
			loading={saving}
			actions={
				<>
					<Button onClick={onClose} disabled={saving} sx={{ borderRadius: 3 }}>Cancel</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={saving || !selectedUser}
						sx={{ borderRadius: 3, fontWeight: 700 }}
					>
						{saving ? <CircularProgress size={20} color="inherit" /> : 'Create'}
					</Button>
				</>
			}
		>
			<Stack spacing={2.5}>
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
				<TextField
					label="Employee ID (optional — auto-generated if blank)"
					fullWidth
					value={form.employee_id}
					onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
				/>
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
