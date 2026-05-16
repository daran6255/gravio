import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from '@mui/material';
import EnterpriseForm, { type FormStep } from '../../../common/form/EnterpriseForm';
import BasicInfoTab from './tabs/BasicInfoTab';
import ContactDetailsTab from './tabs/ContactDetailsTab';
import AddressTab from './tabs/AddressTab';
import type { Company, CompanyCreate, CompanyUpdate } from '../../../../models/company';

interface CompanyFormDialogProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: CompanyCreate | CompanyUpdate) => void;
	company?: Company | null;
	loading?: boolean;
}

const EMPTY_FORM: Partial<Company> = {
	name: '',
	industry: '',
	company_size: 'micro',
	website: '',
	phone: '',
	email: '',
	status: 'prospect',
	address: {
		street: '',
		city: '',
		state: '',
		country: 'India',
		pincode: '',
	},
};

const CompanyFormDialog: React.FC<CompanyFormDialogProps> = ({
	open,
	onClose,
	onSubmit,
	company,
	loading = false,
}) => {
	const [formData, setFormData] = useState<Partial<Company>>(EMPTY_FORM);

	// Reset / populate form when dialog opens
	useEffect(() => {
		const timer = setTimeout(() => {
			if (company) {
				setFormData({
					...company,
					address: company.address || { street: '', city: '', state: '', country: 'India', pincode: '' },
				});
			} else {
				setFormData(EMPTY_FORM);
			}
		}, 0);
		return () => clearTimeout(timer);
	}, [company, open]);

	const handleChange = (field: string, value: unknown) => {
		if (field.includes('.')) {
			const [parent, child] = field.split('.');
			setFormData((prev) => ({
				...prev,
				[parent]: {
					...(prev[parent as keyof typeof prev] as Record<string, unknown>),
					[child]: value,
				},
			}));
		} else {
			setFormData((prev) => ({ ...prev, [field]: value }));
		}
	};

	const handleSave = () => {
		if (!formData.name) return;
		onSubmit(formData as CompanyCreate);
	};

	const steps: FormStep[] = useMemo(
		() => [
			{
				label: 'Basic Info',
				content: <BasicInfoTab formData={formData} onChange={handleChange} />,
			},
			{
				label: 'Contact Details',
				content: <ContactDetailsTab formData={formData} onChange={handleChange} />,
			},
			{
				label: 'Address',
				content: <AddressTab formData={formData} onChange={handleChange} />,
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[formData]
	);

	return (
		<Dialog
			open={open}
			onClose={(_, reason) => {
				if (reason === 'backdropClick') return;
				onClose();
			}}
			disableEscapeKeyDown
			maxWidth="md"
			fullWidth
			PaperProps={{ sx: { borderRadius: 1, bgcolor: 'transparent', boxShadow: 'none' } }}
		>
			<EnterpriseForm
				title={company ? 'Edit Company' : 'Create Company'}
				subtitle={company ? `ID: ${company.public_id ?? company.id}` : 'Fill in the details to add a new company'}
				mode={company ? 'edit' : 'create'}
				steps={steps}
				onSave={handleSave}
				onCancel={onClose}
				isSubmitting={loading}
				saveButtonText={loading ? 'Saving...' : company ? 'Save Changes' : 'Create Company'}
			/>
		</Dialog>
	);
};

export default CompanyFormDialog;
