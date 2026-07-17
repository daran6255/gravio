import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, TextField, Button, InputAdornment } from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import type { Organization } from '../../../../models/auth';

interface ExtendTrialDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	targetOrg: Organization | null;
	extendDays: string;
	setExtendDays: (days: string) => void;
	extendLoading: boolean;
}

export const ExtendTrialDialog: React.FC<ExtendTrialDialogProps> = ({
	open,
	onClose,
	onConfirm,
	targetOrg,
	extendDays,
	setExtendDays,
	extendLoading
}) => {
	return (
		<Dialog open={open} onClose={onClose}>
			<DialogTitle>Extend Trial / Free Period</DialogTitle>
			<DialogContent sx={{ minWidth: 320, pt: 1 }}>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
					Extend the trial or free period for <strong>{targetOrg?.name}</strong>. This resets the status to active/trial.
				</Typography>
				<TextField
					autoFocus margin="dense" id="days" label="Number of Days" placeholder="e.g. 30" type="number" fullWidth variant="outlined"
					value={extendDays} onChange={(e) => setExtendDays(e.target.value)} inputProps={{ min: 1 }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<CalendarToday sx={{ color: 'text.secondary', fontSize: 18, mr: 0.5 }} />
							</InputAdornment>
						)
					}}
				/>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<Button onClick={onClose} color="inherit">Cancel</Button>
				<Button onClick={onConfirm} variant="contained" disabled={extendLoading}>
					{extendLoading ? 'Extending...' : 'Extend'}
				</Button>
			</DialogActions>
		</Dialog>
	);
};
