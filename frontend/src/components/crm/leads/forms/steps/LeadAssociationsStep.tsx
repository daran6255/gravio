import React from 'react';
import { Box, TextField, Autocomplete, CircularProgress, Stack } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import PremiumTooltip from '../../../../common/PremiumTooltip';
import { searchCompanyOptions, searchContactOptions } from '../../../../../store/slices/crmSlice';
import { useAppDispatch } from '../../../../../store/hooks';
import type { Company } from '../../../../../models/crm/company';
import type { Contact } from '../../../../../models/crm/contact';

interface LeadAssociationsStepProps {
	company: Company | null;
	setCompany: (val: Company | null) => void;
	companyOptions: Company[];
	companyOptionsLoading: boolean;
	contact: Contact | null;
	setContact: (val: Contact | null) => void;
	contactOptions: Contact[];
	contactOptionsLoading: boolean;
}

export const LeadAssociationsStep: React.FC<LeadAssociationsStepProps> = ({
	company,
	setCompany,
	companyOptions,
	companyOptionsLoading,
	contact,
	setContact,
	contactOptions,
	contactOptionsLoading,
}) => {
	const dispatch = useAppDispatch();
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
						label={
							<Stack direction="row" alignItems="center" spacing={0.5}>
								<span>Company</span>
								<PremiumTooltip title="The organization linked to this opportunity." arrow placement="top">
									<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
								</PremiumTooltip>
							</Stack>
						}
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

			<Autocomplete
				options={contactOptions}
				getOptionLabel={(o) => `${o.first_name} ${o.last_name || ''}`.trim()}
				loading={contactOptionsLoading}
				value={contact}
				onChange={(_e, value) => setContact(value)}
				onInputChange={(_e, value) => dispatch(searchContactOptions({ search: value || undefined, companyId: company?.id }))}
				isOptionEqualToValue={(o, v) => o.id === v.id}
				renderInput={(params) => (
					<TextField
						{...params}
						label={
							<Stack direction="row" alignItems="center" spacing={0.5}>
								<span>Contact Person</span>
								<PremiumTooltip title="The primary person/candidate linked to this lead." arrow placement="top">
									<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
								</PremiumTooltip>
							</Stack>
						}
						size="small"
						InputProps={{
							...params.InputProps,
							endAdornment: (
								<>
									{contactOptionsLoading && <CircularProgress color="inherit" size={16} />}
									{params.InputProps.endAdornment}
								</>
							),
						}}
					/>
				)}
			/>
		</Box>
	);
};

export default LeadAssociationsStep;
