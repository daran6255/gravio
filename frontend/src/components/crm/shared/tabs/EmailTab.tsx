import React from 'react';
import { Box, Stack, ToggleButtonGroup, ToggleButton, TextField, MenuItem } from '@mui/material';
import RichTextEditor from '../../../common/form/RichTextEditor';

interface EmailTabProps {
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

export const EmailTab: React.FC<EmailTabProps> = ({
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
	const handleDirectionChange = (_e: any, val: string) => {
		if (val) {
			setDirection(val);
			setOutcome(val === 'Sent' ? 'Sent' : 'Received');
		}
	};

	return (
		<Box sx={{ mb: 1.5 }}>
			<Stack direction="row" spacing={compact ? 1 : 1.5} sx={{ mb: 1.5 }}>
				<ToggleButtonGroup
					value={direction}
					exclusive
					onChange={handleDirectionChange}
					size="small"
					sx={{
						flexShrink: 0,
						height: compact ? 36 : 40,
						'& .MuiToggleButtonGroup-grouped': {
							border: '1px solid',
							borderColor: 'divider',
							borderRadius: '8px !important',
							textTransform: 'none',
							px: compact ? 1.25 : 2,
							fontSize: compact ? '0.78rem' : '0.875rem',
							fontWeight: 600,
						}
					}}
				>
					<ToggleButton value="Sent">Sent</ToggleButton>
					<ToggleButton value="Received">Received</ToggleButton>
				</ToggleButtonGroup>

				<TextField
					select
					label={compact ? undefined : "Email Status"}
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
					{direction === 'Sent' ? [
						<MenuItem key="Sent" value="Sent" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>Sent</MenuItem>,
						<MenuItem key="Opened" value="Opened" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>Opened</MenuItem>,
						<MenuItem key="Replied" value="Replied" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>Replied</MenuItem>
					] : [
						<MenuItem key="Received" value="Received" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>Received</MenuItem>,
						<MenuItem key="Read" value="Read" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>Read</MenuItem>,
						<MenuItem key="Replied" value="Replied" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>Replied</MenuItem>
					]}
				</TextField>
			</Stack>

			<TextField
				variant={compact ? "standard" : "outlined"}
				placeholder={compact ? "Subject/Purpose (optional, e.g. Contract review)" : "Subject/Purpose (optional, e.g. Contract review)"}
				value={subject}
				onChange={(e) => setSubject(e.target.value)}
				fullWidth
				size="small"
				InputProps={compact ? { disableUnderline: true, style: { fontSize: '0.82rem' } } : undefined}
				sx={{ mb: 1.5 }}
			/>

			<Box sx={{ mb: 0.5 }}>
				<RichTextEditor
					value={description}
					onChange={setDescription}
					placeholder="Write email body here..."
					minHeight={compact ? 90 : 100}
					variant="simple"
				/>
			</Box>
		</Box>
	);
};

export default EmailTab;
