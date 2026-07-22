import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, TextField, InputAdornment } from '@mui/material';
import { BoltOutlined } from '@mui/icons-material';
import type { TeamMember } from '../../../../models/user';
import { SubmitButton, CancelButton } from '../../../common/button';

interface GrantCreditsDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	targetUser: TeamMember | null;
	amount: string;
	setAmount: (amount: string) => void;
	loading: boolean;
}

export const GrantCreditsDialog: React.FC<GrantCreditsDialogProps> = ({
	open,
	onClose,
	onConfirm,
	targetUser,
	amount,
	setAmount,
	loading,
}) => {
	return (
		<Dialog open={open} onClose={onClose}>
			<DialogTitle>Grant AI Credits</DialogTitle>
			<DialogContent sx={{ minWidth: 320, pt: 1 }}>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
					Add credits directly to <strong>{targetUser?.full_name || targetUser?.username}</strong>'s own wallet.
					Credits are per-user, not shared across their organization — this only affects them.
				</Typography>
				<TextField
					autoFocus margin="dense" id="credits" label="Number of Credits" placeholder="e.g. 500" type="number" fullWidth variant="outlined"
					value={amount} onChange={(e) => setAmount(e.target.value)} inputProps={{ min: 1 }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<BoltOutlined sx={{ color: 'text.secondary', fontSize: 18, mr: 0.5 }} />
							</InputAdornment>
						)
					}}
				/>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3 }}>
				<CancelButton onClick={onClose} color="inherit" />
				<SubmitButton onClick={onConfirm} loading={loading}>Grant Credits</SubmitButton>
			</DialogActions>
		</Dialog>
	);
};

export default GrantCreditsDialog;
