import React, { useEffect, useState } from 'react';
import {
	Dialog,
	TextField,
	MenuItem,
	Stack,
} from '@mui/material';
import { EnterpriseForm, type FormStep } from '../../../common/form';
import { useAppDispatch } from '../../../../store/hooks';
import { createCompany, updateCompany } from '../../../../store/slices/crmSlice';
import type { Company, CompanySize, CompanyStatus } from '../../../../models/crm/company';
import useToast from '../../../../hooks/useToast';

const COMPANY_SIZES: CompanySize[] = ['startup', 'small', 'medium', 'enterprise'];
const COMPANY_STATUSES: CompanyStatus[] = ['prospect', 'customer', 'churned', 'partner'];

interface CompanyFormDialogProps {
	open: boolean;
	onClose: () => void;
	company?: Company | null;
	onSuccess: (company: Company) => void;
}

export const CompanyFormDialog: React.FC<CompanyFormDialogProps> = ({ open, onClose, company, onSuccess }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const isEdit = !!company;

	const [name, setName] = useState('');
	const [industry, setIndustry] = useState('');
	const [website, setWebsite] = useState('');
	const [phone, setPhone] = useState('');
	const [email, setEmail] = useState('');
	const [size, setSize] = useState<CompanySize | ''>('');
	const [status, setStatus] = useState<CompanyStatus>('prospect');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [touched, setTouched] = useState<{ name?: boolean }>({});

	const fieldErrors = {
		name: name.trim() ? '' : 'Name is required',
	};
	const isValid = !fieldErrors.name;

	useEffect(() => {
		if (!open) return;
		setName(company?.name || '');
		setIndustry(company?.industry || '');
		setWebsite(company?.website || '');
		setPhone(company?.phone || '');
		setEmail(company?.email || '');
		setSize(company?.size || '');
		setStatus(company?.status || 'prospect');
		setError(null);
		setTouched({});
	}, [open, company]);

	const handleSave = async () => {
		setTouched({ name: true });
		if (!isValid) return;

		setSubmitting(true);
		setError(null);
		try {
			const payload = {
				name: name.trim(),
				industry: industry || undefined,
				website: website || undefined,
				phone: phone || undefined,
				email: email || undefined,
				size: size || undefined,
				status,
			};

			const result = isEdit
				? await dispatch(updateCompany({ publicId: company!.public_id, payload })).unwrap()
				: await dispatch(createCompany(payload)).unwrap();

			toast.success(isEdit ? 'Company updated' : 'Company created');
			onSuccess(result);
			onClose();
		} catch (err: any) {
			setError(err || 'Failed to save company');
		} finally {
			setSubmitting(false);
		}
	};

	const steps: FormStep[] = [
		{
			label: 'Company Details',
			description: 'Basic profile information and size metrics',
			content: (
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<TextField
						label="Company Name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						fullWidth
						error={touched.name && !!fieldErrors.name}
						helperText={touched.name && fieldErrors.name}
						placeholder="e.g. Acme Corp"
					/>

					<TextField
						label="Industry"
						value={industry}
						onChange={(e) => setIndustry(e.target.value)}
						fullWidth
						placeholder="e.g. Technology, Healthcare"
					/>

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						<TextField
							select
							label="Status"
							value={status}
							onChange={(e) => setStatus(e.target.value as CompanyStatus)}
							fullWidth
						>
							{COMPANY_STATUSES.map((s) => (
								<MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
									{s}
								</MenuItem>
							))}
						</TextField>

						<TextField
							select
							label="Size"
							value={size}
							onChange={(e) => setSize(e.target.value as CompanySize)}
							fullWidth
						>
							<MenuItem value="">Unspecified</MenuItem>
							{COMPANY_SIZES.map((s) => (
								<MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
									{s}
								</MenuItem>
							))}
						</TextField>
					</Stack>
				</Stack>
			)
		},
		{
			label: 'Contact Info',
			description: 'Web addresses and communication channels',
			content: (
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<TextField
						label="Website"
						value={website}
						onChange={(e) => setWebsite(e.target.value)}
						fullWidth
						placeholder="https://"
					/>

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						<TextField
							label="Phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							fullWidth
							placeholder="+1 (555) 000-0000"
						/>
						<TextField
							label="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							fullWidth
							placeholder="info@company.com"
						/>
					</Stack>
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
				title={isEdit ? 'Edit Company' : 'New Company'}
				subtitle={isEdit ? company?.name : 'Add a new company record'}
				mode={isEdit ? 'edit' : 'create'}
				steps={steps}
				onSave={handleSave}
				onCancel={onClose}
				isSubmitting={submitting}
				saveButtonText={isEdit ? 'Save Changes' : 'Create Company'}
				error={error}
			/>
		</Dialog>
	);
};

export default CompanyFormDialog;
