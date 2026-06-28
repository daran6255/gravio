import React from 'react';
import { Box, Stack, ToggleButtonGroup, ToggleButton, TextField, MenuItem } from '@mui/material';
import RichTextEditor from '../../../common/form/RichTextEditor';

interface CallTabProps {
	subject: string;
	setSubject: (val: string) => void;
	description: string;
	setDescription: (val: string) => void;
	direction: string;
	setDirection: (val: string) => void;
	outcome: string;
	setOutcome: (val: string) => void;
	compact: boolean;
}

export const CallTab: React.FC<CallTabProps> = ({
	subject,
	setSubject,
	description,
	setDescription,
	direction,
	setDirection,
	outcome,
	setOutcome,
	compact,
}) => {
	return (
		<Box sx={{ mb: 1.5 }}>
			<Stack direction="row" spacing={compact ? 1 : 1.5} sx={{ mb: 1.5 }}>
				<ToggleButtonGroup
					value={direction}
					exclusive
					onChange={(_e, val) => val && setDirection(val)}
					size="small"
					sx={{
						flexShrink: 0,
						height: compact ? 36 : 40,
						gap: 1,
						'& .MuiToggleButtonGroup-grouped': {
							border: '1px solid !important',
							borderColor: 'divider',
							borderRadius: '8px !important',
							marginLeft: '0px !important',
							textTransform: 'none',
							px: compact ? 1.5 : 2,
							fontSize: compact ? '0.78rem' : '0.875rem',
							fontWeight: 600,
							color: 'text.secondary',
							backgroundColor: 'background.paper',
							transition: 'all 0.2s ease',
							'&.Mui-selected': {
								backgroundColor: 'primary.main',
								color: '#ffffff',
								borderColor: 'primary.main',
								'&:hover': {
									backgroundColor: 'primary.dark',
								}
							},
							'&:hover': {
								backgroundColor: 'action.hover',
							}
						}
					}}
				>
					<ToggleButton value="Outbound">Outbound</ToggleButton>
					<ToggleButton value="Inbound">Inbound</ToggleButton>
				</ToggleButtonGroup>

				<TextField
					select
					label={compact ? undefined : "Call Outcome"}
					value={outcome}
					onChange={(e) => setOutcome(e.target.value)}
					size="small"
					sx={{
						flexGrow: 1,
						'& .MuiOutlinedInput-root': {
							borderRadius: '8px',
							height: compact ? 36 : 40,
							fontSize: compact ? '0.78rem' : '0.875rem',
						}
					}}
				>
					<MenuItem value="Connected" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>Connected</MenuItem>
					<MenuItem value="Busy" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>Busy</MenuItem>
					<MenuItem value="No Answer" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>No Answer</MenuItem>
					<MenuItem value="Left Voicemail" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>Left Voicemail</MenuItem>
					<MenuItem value="Wrong Number" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>Wrong Number</MenuItem>
				</TextField>
			</Stack>

			<TextField
				variant={compact ? "standard" : "outlined"}
				placeholder={compact ? "Subject/Purpose (optional, e.g. Discuss onboarding)" : "Subject/Purpose (optional)"}
				value={subject}
				onChange={(e) => setSubject(e.target.value)}
				fullWidth
				size="small"
				InputProps={compact ? { disableUnderline: true, style: { fontSize: '0.82rem' } } : undefined}
				sx={{ mb: 1.5 }}
			/>

			{compact ? (
				<TextField
					variant="outlined"
					placeholder="Write call notes or record a summary..."
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					fullWidth
					multiline
					minRows={3}
					sx={{
						mb: 0.5,
						'& .MuiOutlinedInput-root': {
							borderRadius: '8px',
							fontSize: '0.82rem',
							p: 1.25,
						}
					}}
				/>
			) : (
				<RichTextEditor
					value={description}
					onChange={setDescription}
					placeholder="Write call notes or record a summary..."
					minHeight={100}
					variant="simple"
				/>
			)}
		</Box>
	);
};

export default CallTab;
