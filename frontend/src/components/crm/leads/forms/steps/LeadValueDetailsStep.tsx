import React from 'react';
import { Box, TextField, Autocomplete, Stack, InputAdornment } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { NumericFormat } from 'react-number-format';
import PremiumTooltip from '../../../../common/PremiumTooltip';
import RichTextEditor from '../../../../common/form/RichTextEditor';
import TagInput from '../../../shared/TagInput';
import { getCurrencySymbol } from '../../../../../utils/currency';

interface LeadValueDetailsStepProps {
	estimatedValue: string;
	setEstimatedValue: (val: string) => void;
	currency: string;
	setCurrency: (val: string) => void;
	currencies: any[];
	description: string;
	setDescription: (val: string) => void;
	tags: string[];
	setTags: (val: string[]) => void;
	touched: { currency?: boolean };
	setTouched: React.Dispatch<React.SetStateAction<{ title?: boolean; currency?: boolean }>>;
	fieldErrors: { currency: string };
}

export const LeadValueDetailsStep: React.FC<LeadValueDetailsStepProps> = ({
	estimatedValue,
	setEstimatedValue,
	currency,
	setCurrency,
	currencies,
	description,
	setDescription,
	tags,
	setTags,
	touched,
	setTouched,
	fieldErrors,
}) => {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
			<Stack direction="row" spacing={2}>
				<NumericFormat
					customInput={TextField}
					label={
						<Stack direction="row" alignItems="center" spacing={0.5}>
							<span>Estimated Value</span>
							<PremiumTooltip title="The expected budget size or deal value associated with this candidate." arrow placement="top">
								<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
							</PremiumTooltip>
						</Stack>
					}
					value={estimatedValue}
					onValueChange={(values) => setEstimatedValue(values.value)}
					thousandSeparator
					decimalScale={2}
					allowNegative={false}
					fullWidth
					size="small"
					InputProps={{
						startAdornment: <InputAdornment position="start">{getCurrencySymbol(currency)}</InputAdornment>,
					}}
				/>
				<Autocomplete
					options={currencies}
					getOptionLabel={(o) => `${o.code} — ${o.name}`}
					value={currencies.find((c) => c.code === currency) || null}
					onChange={(_e, value) => setCurrency(value?.code || '')}
					onBlur={() => setTouched((t) => ({ ...t, currency: true }))}
					isOptionEqualToValue={(o, v) => o.code === v.code}
					fullWidth
					renderOption={(props, option) => (
						<Box component="li" {...props} key={option.code}>
							{option.symbol} {option.code} — {option.name}
						</Box>
					)}
					renderInput={(params) => (
						<TextField
							{...params}
							label={
								<Stack direction="row" alignItems="center" spacing={0.5}>
									<span>Currency</span>
									<PremiumTooltip title="The monetary currency unit for value calculations." arrow placement="top">
										<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
									</PremiumTooltip>
								</Stack>
							}
							size="small"
							error={!!touched.currency && !!fieldErrors.currency}
							helperText={touched.currency && fieldErrors.currency}
						/>
					)}
				/>
			</Stack>

			<RichTextEditor
				label={
					<Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.75 }}>
						<span>Description</span>
						<PremiumTooltip title="Optional summary details and notes about this candidate." arrow placement="top">
							<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
						</PremiumTooltip>
					</Stack>
				}
				value={description}
				onChange={setDescription}
				placeholder="Add notes about this opportunity..."
			/>

			<TagInput
				value={tags}
				onChange={setTags}
				label="Tags"
				placeholder="e.g. q3-campaign, hot-lead — press Enter to add"
			/>
		</Box>
	);
};

export default LeadValueDetailsStep;
