import React, { useEffect, useState } from 'react';
import {
	Box,
	TextField,
	Button,
	Stack,
	Autocomplete,
	CircularProgress,
	Alert,
	FormControlLabel,
	Checkbox,
} from '@mui/material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createContact, updateContact, searchCompanyOptions } from '../../../../store/slices/crmSlice';
import type { Contact } from '../../../../models/crm/contact';
import type { Company } from '../../../../models/crm/company';
import useToast from '../../../../hooks/useToast';

interface ContactFormDrawerProps {
	open: boolean;
	onClose: () => void;
	contact?: Contact | null;
	onSuccess: (contact: Contact) => void;
}

export const ContactFormDrawer: React.FC<ContactFormDrawerProps> = ({ open, onClose, contact, onSuccess }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const isEdit = !!contact;

	const { companyOptions, companyOptionsLoading } = useAppSelector((state) => state.crm);

	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [mobile, setMobile] = useState('');
	const [jobTitle, setJobTitle] = useState('');
	const [department, setDepartment] = useState('');
	const [company, setCompany] = useState<Company | null>(null);
	const [isPrimary, setIsPrimary] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		setFirstName(contact?.first_name || '');
		setLastName(contact?.last_name || '');
		setEmail(contact?.email || '');
		setPhone(contact?.phone || '');
		setMobile(contact?.mobile || '');
		setJobTitle(contact?.job_title || '');
		setDepartment(contact?.department || '');
		setIsPrimary(contact?.is_primary || false);
		setCompany(null);
		setError(null);
		dispatch(searchCompanyOptions(undefined));
	}, [open, contact, dispatch]);

	useEffect(() => {
		if (open && contact?.company_id) {
			const match = companyOptions.find((c) => c.id === contact.company_id);
			if (match) setCompany(match);
		}
	}, [open, contact, companyOptions]);

	const handleSave = async () => {
		if (!firstName.trim()) {
			setError('First name is required');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const payload = {
				first_name: firstName.trim(),
				last_name: lastName || undefined,
				email: email || undefined,
				phone: phone || undefined,
				mobile: mobile || undefined,
				job_title: jobTitle || undefined,
				department: department || undefined,
				company_id: company?.id,
				is_primary: isPrimary,
			};

			const result = isEdit
				? await dispatch(updateContact({ publicId: contact!.public_id, payload })).unwrap()
				: await dispatch(createContact(payload)).unwrap();

			toast.success(isEdit ? 'Contact updated' : 'Contact created');
			onSuccess(result);
			onClose();
		} catch (err: any) {
			setError(err || 'Failed to save contact');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<DetailDrawer
			open={open}
			onClose={onClose}
			title={isEdit ? 'Edit Contact' : 'New Contact'}
			subtitle={isEdit ? `${contact?.first_name} ${contact?.last_name || ''}`.trim() : 'Add a new person record'}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto', flex: 1 }}>
				{error && <Alert severity="error">{error}</Alert>}

				<Stack direction="row" spacing={2}>
					<TextField
						label="First Name"
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
						required
						fullWidth
						size="small"
					/>
					<TextField
						label="Last Name"
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
						fullWidth
						size="small"
					/>
				</Stack>

				<Autocomplete
					options={companyOptions}
					getOptionLabel={(o) => o.name}
					loading={companyOptionsLoading}
					value={company}
					onChange={(_e, value) => setCompany(value)}
					onInputChange={(_e, value) => dispatch(searchCompanyOptions(value || undefined))}
					isOptionEqualToValue={(o, v) => o.id === v.id}
					renderInput={(params) => (
						<TextField
							{...params}
							label="Company"
							size="small"
							InputProps={{
								...params.InputProps,
								endAdornment: (
									<>
										{companyOptionsLoading && <CircularProgress color="inherit" size={16} />}
										{params.InputProps.endAdornment}
									</>
								),
							}}
						/>
					)}
				/>

				<Stack direction="row" spacing={2}>
					<TextField
						label="Job Title"
						value={jobTitle}
						onChange={(e) => setJobTitle(e.target.value)}
						fullWidth
						size="small"
					/>
					<TextField
						label="Department"
						value={department}
						onChange={(e) => setDepartment(e.target.value)}
						fullWidth
						size="small"
					/>
				</Stack>

				<TextField
					label="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					fullWidth
					size="small"
				/>

				<Stack direction="row" spacing={2}>
					<TextField
						label="Phone"
						value={phone}
						onChange={(e) => setPhone(e.target.value)}
						fullWidth
						size="small"
					/>
					<TextField
						label="Mobile"
						value={mobile}
						onChange={(e) => setMobile(e.target.value)}
						fullWidth
						size="small"
					/>
				</Stack>

				<FormControlLabel
					control={<Checkbox checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />}
					label="Primary contact for this company"
				/>

				<Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
					<Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600 }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={submitting}
						sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3 }}
					>
						{submitting ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Create Contact'}
					</Button>
				</Stack>
			</Box>
		</DetailDrawer>
	);
};

export default ContactFormDrawer;
