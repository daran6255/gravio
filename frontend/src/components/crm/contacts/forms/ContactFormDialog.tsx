import React, { useEffect, useState } from 'react';
import {
	Dialog,
	TextField,
	Stack,
	Autocomplete,
	CircularProgress,
	FormControlLabel,
	Checkbox,
} from '@mui/material';
import { EnterpriseForm, type FormStep } from '../../../common/form';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createContact, updateContact, searchCompanyOptions } from '../../../../store/slices/crmSlice';
import type { Contact } from '../../../../models/crm/contact';
import type { Company } from '../../../../models/crm/company';
import useToast from '../../../../hooks/useToast';
import { MuiTelInput, type MuiTelInputCountry, type MuiTelInputInfo } from 'mui-tel-input';
import usePhoneValidation from '../../../../hooks/usePhoneValidation';

interface ContactFormDialogProps {
	open: boolean;
	onClose: () => void;
	contact?: Contact | null;
	defaultCompany?: Company | null;
	onSuccess: (contact: Contact) => void;
}

export const ContactFormDialog: React.FC<ContactFormDialogProps> = ({
	open,
	onClose,
	contact,
	defaultCompany,
	onSuccess,
}) => {
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
	const [touched, setTouched] = useState<{ firstName?: boolean }>({});
	const phoneValidation = usePhoneValidation();
	const mobileValidation = usePhoneValidation();

	const handlePhoneChange = (value: string, info: MuiTelInputInfo) => {
		if (!phoneValidation.validatePhoneChange(info)) return;
		if (info.countryCode) phoneValidation.setCountryCode(info.countryCode);
		setPhone(value);
	};

	const handleMobileChange = (value: string, info: MuiTelInputInfo) => {
		if (!mobileValidation.validatePhoneChange(info)) return;
		if (info.countryCode) mobileValidation.setCountryCode(info.countryCode);
		setMobile(value);
	};

	const fieldErrors = {
		firstName: firstName.trim() ? '' : 'First name is required',
	};
	const isValid = !fieldErrors.firstName;

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
		setTouched({});
		dispatch(searchCompanyOptions(undefined));
	}, [open, contact, dispatch]);

	useEffect(() => {
		if (open) {
			if (contact?.company_id) {
				const match = companyOptions.find((c) => c.id === contact.company_id);
				if (match) setCompany(match);
			} else if (defaultCompany) {
				setCompany(defaultCompany);
			}
		}
	}, [open, contact, companyOptions, defaultCompany]);

	const handleSave = async () => {
		setTouched({ firstName: true });
		if (!isValid) return;

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

	const steps: FormStep[] = [
		{
			label: 'Personal Details',
			description: 'Basic identity, job title, and organization link',
			content: (
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						<TextField
							label="First Name"
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							required
							fullWidth
							error={touched.firstName && !!fieldErrors.firstName}
							helperText={touched.firstName && fieldErrors.firstName}
						/>
						<TextField
							label="Last Name"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							fullWidth
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

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						<TextField
							label="Job Title"
							value={jobTitle}
							onChange={(e) => setJobTitle(e.target.value)}
							fullWidth
						/>
						<TextField
							label="Department"
							value={department}
							onChange={(e) => setDepartment(e.target.value)}
							fullWidth
						/>
					</Stack>
				</Stack>
			)
		},
		{
			label: 'Communications',
			description: 'Emails, phone numbers, and messaging links',
			content: (
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<TextField
						label="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						fullWidth
						placeholder="email@address.com"
					/>

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						<MuiTelInput
							label="Phone"
							value={phone}
							onChange={handlePhoneChange}
							defaultCountry={phoneValidation.countryCode as MuiTelInputCountry}
							forceCallingCode
							fullWidth
							helperText={`Max ${phoneValidation.getMaxLength(phoneValidation.countryCode)} digits for the selected country`}
						/>
						<MuiTelInput
							label="Mobile"
							value={mobile}
							onChange={handleMobileChange}
							defaultCountry={mobileValidation.countryCode as MuiTelInputCountry}
							forceCallingCode
							fullWidth
							helperText={`Max ${mobileValidation.getMaxLength(mobileValidation.countryCode)} digits for the selected country`}
						/>
					</Stack>

					<FormControlLabel
						control={<Checkbox checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />}
						label="Primary contact for this company"
					/>
				</Stack>
			)
		}
	];

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { borderRadius: 0, boxShadow: 'none', bgcolor: 'transparent' } }}
		>
			<EnterpriseForm
				title={isEdit ? 'Edit Contact' : 'New Contact'}
				subtitle={isEdit ? `${contact?.first_name} ${contact?.last_name || ''}`.trim() : 'Add a new person record'}
				mode={isEdit ? 'edit' : 'create'}
				steps={steps}
				onSave={handleSave}
				onCancel={onClose}
				isSubmitting={submitting}
				saveButtonText={isEdit ? 'Save Changes' : 'Create Contact'}
				error={error}
			/>
		</Dialog>
	);
};

export default ContactFormDialog;
