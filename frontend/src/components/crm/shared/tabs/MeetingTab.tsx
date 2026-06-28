import React from 'react';
import { Box, Stack, ToggleButtonGroup, ToggleButton, TextField, MenuItem } from '@mui/material';
import RichTextEditor from '../../../common/form/RichTextEditor';

interface MeetingTabProps {
	subject: string;
	setSubject: (val: string) => void;
	description: string;
	setDescription: (val: string) => void;
	direction: string;
	setDirection: (val: string) => void;
	outcome: string;
	setOutcome: (val: string) => void;
	setIsCompleted: (val: boolean) => void;
	compact: boolean;
}

export const MeetingTab: React.FC<MeetingTabProps> = ({
	subject,
	setSubject,
	description,
	setDescription,
	direction,
	setDirection,
	outcome,
	setOutcome,
	setIsCompleted,
	compact,
}) => {
	const handleOutcomeChange = (val: string) => {
		setOutcome(val);
		setIsCompleted(val !== 'Scheduled');
	};

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
							fontSize: compact ? '0.76rem' : '0.875rem',
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
					<ToggleButton value="Online">Online</ToggleButton>
					<ToggleButton value="In-Person">In-Person</ToggleButton>
					<ToggleButton value="Phone">Phone</ToggleButton>
				</ToggleButtonGroup>

				<TextField
					select
					label={compact ? undefined : "Meeting Status"}
					value={outcome}
					onChange={(e) => handleOutcomeChange(e.target.value)}
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
					<MenuItem value="Scheduled" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>Scheduled</MenuItem>
					<MenuItem value="Completed" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>Completed</MenuItem>
					<MenuItem value="No Show" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>No Show</MenuItem>
					<MenuItem value="Canceled" sx={{ fontSize: compact ? '0.78rem' : '0.875rem' }}>Canceled</MenuItem>
				</TextField>
			</Stack>

			<TextField
				variant={compact ? "standard" : "outlined"}
				placeholder={compact ? "Meeting Subject (optional, e.g. Project onboarding)" : "Subject/Purpose (optional, e.g. Project onboarding)"}
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
					placeholder="Write meeting agenda or notes..."
					minHeight={compact ? 90 : 100}
					variant="simple"
				/>
			</Box>
		</Box>
	);
};

export default MeetingTab;
