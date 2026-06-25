import React, { useEffect, useState } from 'react';
import {
	Box,
	TextField,
	MenuItem,
	Button,
	Stack,
	CircularProgress,
	Alert,
} from '@mui/material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';
import { useAppDispatch } from '../../../../store/hooks';
import { createCompany, updateCompany } from '../../../../store/slices/crmSlice';
import type { Company, CompanySize, CompanyStatus } from '../../../../models/crm/company';
import useToast from '../../../../hooks/useToast';

const COMPANY_SIZES: CompanySize[] = ['startup', 'small', 'medium', 'enterprise'];
const COMPANY_STATUSES: CompanyStatus[] = ['prospect', 'customer', 'churned', 'partner'];

interface CompanyFormDrawerProps {
	open: boolean;
	onClose: () => void;
	company?: Company | null;
	onSuccess: (company: Company) => void;
}

export const CompanyFormDrawer: React.FC<CompanyFormDrawerProps> = ({ open, onClose, company, onSuccess }) => {
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
	}, [open, company]);

	const handleSave = async () => {
		if (!name.trim()) {
			setError('Name is required');
			return;
		}
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

	return (
		<DetailDrawer
			open={open}
			onClose={onClose}
			title={isEdit ? 'Edit Company' : 'New Company'}
			subtitle={isEdit ? company?.name : 'Add a new company record'}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto', flex: 1 }}>
				{error && <Alert severity="error">{error}</Alert>}

				<TextField
					label="Name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
					fullWidth
					size="small"
					placeholder="e.g. Acme Corp"
				/>

				<Stack direction="row" spacing={2}>
					<TextField
						label="Industry"
						value={industry}
						onChange={(e) => setIndustry(e.target.value)}
						fullWidth
						size="small"
					/>
					<TextField
						select
						label="Status"
						value={status}
						onChange={(e) => setStatus(e.target.value as CompanyStatus)}
						fullWidth
						size="small"
					>
						{COMPANY_STATUSES.map((s) => (
							<MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
						))}
					</TextField>
				</Stack>

				<TextField
					select
					label="Size"
					value={size}
					onChange={(e) => setSize(e.target.value as CompanySize)}
					fullWidth
					size="small"
				>
					<MenuItem value="">—</MenuItem>
					{COMPANY_SIZES.map((s) => (
						<MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
					))}
				</TextField>

				<TextField
					label="Website"
					value={website}
					onChange={(e) => setWebsite(e.target.value)}
					fullWidth
					size="small"
					placeholder="https://"
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
						label="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						fullWidth
						size="small"
					/>
				</Stack>

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
						{submitting ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Create Company'}
					</Button>
				</Stack>
			</Box>
		</DetailDrawer>
	);
};

export default CompanyFormDrawer;
