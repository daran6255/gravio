import React, { useState } from 'react';
import {
	Typography,
	Stack,
	FormControl,
	RadioGroup,
	FormControlLabel,
	Radio,
	TextField,
	Button,
	Alert,
	Box,
} from '@mui/material';
import { format } from 'date-fns';
import { BaseDialog } from '../../../common/dialogbox';

interface BatchEventDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (event: { title: string; event_type: 'holiday' | 'event'; description: string }) => void;
	selectedDate: Date;
}

const BatchEventDialog: React.FC<BatchEventDialogProps> = ({
	open,
	onClose,
	onConfirm,
	selectedDate
}) => {
	const [newEvent, setNewEvent] = useState({
		title: '',
		event_type: 'holiday' as 'holiday' | 'event',
		description: ''
	});

	const handleConfirm = () => {
		onConfirm(newEvent);
		setNewEvent({ title: '', event_type: 'holiday', description: '' });
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			title="Mark Date as Holiday/Event"
			actions={
				<>
					<Button 
						onClick={onClose} 
						color="inherit"
						sx={{ fontWeight: 600 }}
					>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleConfirm}
						disabled={!newEvent.title}
						color="primary"
						sx={{ px: 3 }}
					>
						Save Event
					</Button>
				</>
			}
		>
			<Box sx={{ mb: 3, bgcolor: 'action.hover', p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
				<Typography variant="awsSectionTitle" sx={{ mb: 0.5 }}>
					Target Date
				</Typography>
				<Typography variant="body1" color="primary" sx={{ fontWeight: 700 }}>
					{format(selectedDate, 'EEEE, MMM dd, yyyy')}
				</Typography>
			</Box>

			<Stack spacing={3}>
				<FormControl component="fieldset">
					<RadioGroup
						row
						value={newEvent.event_type}
						onChange={(e) => setNewEvent(prev => ({ ...prev, event_type: e.target.value as any }))}
					>
						<FormControlLabel 
							value="holiday" 
							control={<Radio size="small" />} 
							label={<Typography variant="body2" fontWeight="bold">Holiday</Typography>} 
						/>
						<FormControlLabel 
							value="event" 
							control={<Radio size="small" />} 
							label={<Typography variant="body2" fontWeight="bold">Special Event</Typography>} 
						/>
					</RadioGroup>
				</FormControl>

				{newEvent.event_type === 'holiday' && (
					<Alert severity="warning" variant="outlined" sx={{ borderRadius: 1 }}>
						<Typography variant="caption" sx={{ fontWeight: 600 }}>
							Marking this day as a holiday will <strong>permanently delete</strong> all existing training plans and attendance for this date.
						</Typography>
					</Alert>
				)}

				<TextField
					fullWidth
					label="Event Title"
					placeholder="e.g., Independence Day, Pongal, Workshop"
					value={newEvent.title}
					onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
					size="small"
					InputLabelProps={{ shrink: true }}
				/>
				
				<TextField
					fullWidth
					multiline
					rows={3}
					label="Description (Optional)"
					value={newEvent.description}
					onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
					size="small"
					InputLabelProps={{ shrink: true }}
				/>
			</Stack>
		</BaseDialog>
	);
};

export default BatchEventDialog;
