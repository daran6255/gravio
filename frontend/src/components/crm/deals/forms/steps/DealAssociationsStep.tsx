import React from 'react';
import { Stack, TextField, Autocomplete } from '@mui/material';
import { searchCompanyOptions, searchContactOptions } from '../../../../../store/slices/crmSlice';
import { useAppDispatch } from '../../../../../store/hooks';
import type { Company } from '../../../../../models/crm/company';
import type { Contact } from '../../../../../models/crm/contact';

interface DealAssociationsStepProps {
	company: Company | null;
	setCompany: (val: Company | null) => void;
	companyOptions: Company[];
	contact: Contact | null;
	setContact: (val: Contact | null) => void;
	contactOptions: Contact[];
}

export const DealAssociationsStep: React.FC<DealAssociationsStepProps> = ({
	company,
	setCompany,
	companyOptions,
	contact,
	setContact,
	contactOptions,
}) => {
	const dispatch = useAppDispatch();
	return (
		<Stack spacing={2.5} sx={{ mt: 1 }}>
			<Autocomplete
				options={companyOptions}
				getOptionLabel={(option) => option.name}
				value={company}
				onChange={(_e, val) => setCompany(val)}
				loading={companyOptions.length === 0}
				onInputChange={(_e, val) => dispatch(searchCompanyOptions(val || undefined))}
				fullWidth
				renderInput={(params) => (
					<TextField {...params} label="Linked Company" placeholder="Type to search companies..." />
				)}
			/>

			<Autocomplete
				options={contactOptions}
				getOptionLabel={(option) => `${option.first_name} ${option.last_name || ''}`}
				value={contact}
				onChange={(_e, val) => setContact(val)}
				loading={contactOptions.length === 0}
				onInputChange={(_e, val) => dispatch(searchContactOptions(val ? { search: val } : undefined))}
				fullWidth
				renderInput={(params) => (
					<TextField {...params} label="Linked Contact" placeholder="Type to search contacts..." />
				)}
			/>
		</Stack>
	);
};

export default DealAssociationsStep;
