import React, { useState } from 'react';
import {
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	InputAdornment,
	IconButton,
	Tooltip,
	Snackbar,
	Alert,
	Box,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ShareIcon from '@mui/icons-material/Share';

const RegistrationLinkModal: React.FC = () => {
	const [open, setOpen] = useState(false);
	const [snackbarOpen, setSnackbarOpen] = useState(false);

	const registrationUrl = `${window.location.origin}/candidate-registration`;

	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(registrationUrl);
		setSnackbarOpen(true);
	};

	const handleOpenLink = () => {
		window.open(registrationUrl, '_blank', 'noopener,noreferrer');
	};

	const handleSnackbarClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
		if (reason === 'clickaway') {
			return;
		}
		setSnackbarOpen(false);
	};

	return (
		<>
			<Button
				variant="outlined"
				startIcon={<ShareIcon />}
				onClick={handleOpen}
				sx={{
					borderRadius: 2,
					textTransform: 'none',
					fontWeight: 600,
					borderColor: '#1976d2',
					color: '#1976d2',
					'&:hover': {
						backgroundColor: 'rgba(25, 118, 210, 0.04)',
						borderColor: '#115293',
					},
				}}
			>
				Share Registration Link
			</Button>

			<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ fontWeight: 700 }}>Candidate Registration Link</DialogTitle>
				<DialogContent dividers>
					<Box sx={{ mt: 1 }}>
						<TextField
							fullWidth
							label="Full Registration URL"
							value={registrationUrl}
							slotProps={{
								input: {
									readOnly: true,
									endAdornment: (
										<InputAdornment position="end">
											<Tooltip title="Copy to clipboard">
												<IconButton onClick={handleCopy} edge="end">
													<ContentCopyIcon />
												</IconButton>
											</Tooltip>
										</InputAdornment>
									),
								},
							}}
							variant="outlined"
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 2, gap: 1 }}>
					<Button onClick={handleClose} sx={{ color: 'text.secondary' }}>
						Close
					</Button>
					<Button
						variant="contained"
						startIcon={<OpenInNewIcon />}
						onClick={handleOpenLink}
						disableElevation
					>
						Open Link
					</Button>
				</DialogActions>
			</Dialog>

			<Snackbar
				open={snackbarOpen}
				autoHideDuration={3000}
				onClose={handleSnackbarClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
			>
				<Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
					Link copied to clipboard!
				</Alert>
			</Snackbar>
		</>
	);
};

export default RegistrationLinkModal;
