import React from 'react';
import { Stack, TextField, InputAdornment, Box, MenuItem } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { NumericFormat } from 'react-number-format';
import PremiumTooltip from '../../../../common/PremiumTooltip';
import RichTextEditor from '../../../../common/form/RichTextEditor';
import TagInput from '../../../shared/TagInput';
import { getCurrencySymbol } from '../../../../../utils/currency';

interface DealValueDescriptionStepProps {
	value: string;
	setValue: (val: string) => void;
	currency: string;
	setCurrency: (val: string) => void;
	currencies: any[];
	description: string;
	setDescription: (val: string) => void;
	tags: string[];
	setTags: (val: string[]) => void;
}

export const DealValueDescriptionStep: React.FC<DealValueDescriptionStepProps> = ({
	value,
	setValue,
	currency,
	setCurrency,
	currencies,
	description,
	setDescription,
	tags,
	setTags,
}) => {
	return (
		<Stack spacing={2.5} sx={{ mt: 1 }}>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
				<NumericFormat
					customInput={TextField}
					label="Deal Value"
					fullWidth
					value={value}
					onValueChange={(values) => setValue(values.value)}
					thousandSeparator
					decimalScale={2}
					allowNegative={false}
					slotProps={{
						input: {
							startAdornment: (
								<InputAdornment position="start">
									{getCurrencySymbol(currency)}
								</InputAdornment>
							),
						},
					}}
				/>

				<TextField
					select
					label="Currency"
					value={currency}
					onChange={(e) => setCurrency(e.target.value)}
					sx={{ minWidth: 120 }}
				>
					{currencies.map((c) => (
						<MenuItem key={c.code} value={c.code}>
							{c.code} ({c.symbol})
						</MenuItem>
					))}
				</TextField>
			</Stack>

			<Box>
				<Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
					<Box component="span" sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.secondary' }}>
						Description
					</Box>
					<PremiumTooltip title="Detailed details regarding deal qualifications, custom requirements, or sales logs." arrow placement="right">
						<HelpOutline sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.7, cursor: 'pointer' }} />
					</PremiumTooltip>
				</Stack>
				<RichTextEditor value={description} onChange={setDescription} minHeight={140} />
			</Box>

			<Box>
				<Box sx={{ mb: 1, fontSize: '0.85rem', fontWeight: 600, color: 'text.secondary' }}>Tags</Box>
				<TagInput value={tags} onChange={setTags} placeholder="Add tag and press Enter..." />
			</Box>
		</Stack>
	);
};

export default DealValueDescriptionStep;
