import React from 'react';
import { Box, TextField, MenuItem, Stack } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import PremiumTooltip from '../../../../common/PremiumTooltip';
import type { LeadSource, LeadPriority } from '../../../../../models/crm/lead';
import { LEAD_SOURCES, LEAD_PRIORITIES } from '../../constants';

interface LeadDetailsStepProps {
	title: string;
	setTitle: (val: string) => void;
	source: LeadSource | '';
	setSource: (val: LeadSource) => void;
	priority: LeadPriority;
	setPriority: (val: LeadPriority) => void;
	touched: { title?: boolean };
	setTouched: React.Dispatch<React.SetStateAction<{ title?: boolean; currency?: boolean }>>;
	fieldErrors: { title: string };
}

export const LeadDetailsStep: React.FC<LeadDetailsStepProps> = ({
	title,
	setTitle,
	source,
	setSource,
	priority,
	setPriority,
	touched,
	setTouched,
	fieldErrors,
}) => {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
			<TextField
				label={
					<Stack direction="row" alignItems="center" spacing={0.5}>
						<span>Title</span>
						<PremiumTooltip title="A descriptive name for this opportunity (e.g., website redesign or recruitment placement)." arrow placement="top">
							<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
						</PremiumTooltip>
					</Stack>
				}
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				onBlur={() => setTouched((t) => ({ ...t, title: true }))}
				error={!!touched.title && !!fieldErrors.title}
				helperText={touched.title && fieldErrors.title}
				required
				fullWidth
				size="small"
				placeholder="e.g. Website redesign for Acme"
			/>

			<Stack direction="row" spacing={2}>
				<TextField
					select
					label={
						<Stack direction="row" alignItems="center" spacing={0.5}>
							<span>Source</span>
							<PremiumTooltip title="Where this lead originated from (e.g., website, campaign, partner referral)." arrow placement="top">
								<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
							</PremiumTooltip>
						</Stack>
					}
					value={source}
					onChange={(e) => setSource(e.target.value as LeadSource)}
					fullWidth
					size="small"
				>
					<MenuItem value="">—</MenuItem>
					{LEAD_SOURCES.map((s) => (
						<MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>
					))}
				</TextField>

				<TextField
					select
					label={
						<Stack direction="row" alignItems="center" spacing={0.5}>
							<span>Priority</span>
							<PremiumTooltip title="The urgency or interest tier for lead outbound follow-up (high, medium, low)." arrow placement="top">
								<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
							</PremiumTooltip>
						</Stack>
					}
					value={priority}
					onChange={(e) => setPriority(e.target.value as LeadPriority)}
					fullWidth
					size="small"
				>
					{LEAD_PRIORITIES.map((p) => (
						<MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>
					))}
				</TextField>
			</Stack>
		</Box>
	);
};

export default LeadDetailsStep;
