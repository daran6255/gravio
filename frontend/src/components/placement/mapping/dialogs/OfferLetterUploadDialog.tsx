import React, { useState } from 'react';
import {
	Button,
	TextField,
	Box,
	Typography,
	Grid,
	CircularProgress,
	alpha,
	useTheme
} from '@mui/material';
import {
	CloudUpload as UploadIcon,
	Description as FileIcon
} from '@mui/icons-material';
import BaseDialog from '../../../common/dialogbox/BaseDialog';

interface OfferLetterUploadDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (data: { file: File; offered_ctc?: number; joining_date?: string; offered_designation?: string; remarks?: string }) => void;
	candidateName: string;
	loading?: boolean;
}

const OfferLetterUploadDialog: React.FC<OfferLetterUploadDialogProps> = ({
	open,
	onClose,
	onConfirm,
	candidateName,
	loading = false
}) => {
	const theme = useTheme();
	const [file, setFile] = useState<File | null>(null);
	const [ctc, setCtc] = useState<string>('');
	const [joiningDate, setJoiningDate] = useState<string>('');
	const [designation, setDesignation] = useState<string>('');
	const [remarks, setRemarks] = useState<string>('');
	const [error, setError] = useState<string | null>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const selectedFile = e.target.files[0];
			if (selectedFile.size > 10 * 1024 * 1024) {
				setError('File size must be less than 10MB');
				return;
			}
			setFile(selectedFile);
			setError(null);
		}
	};

	const handleSubmit = () => {
		if (!file) {
			setError('Please select an offer letter to upload');
			return;
		}
		onConfirm({
			file,
			offered_ctc: ctc ? parseFloat(ctc) : undefined,
			joining_date: joiningDate || undefined,
			offered_designation: designation || undefined,
			remarks: remarks || undefined
		});
	};

	const actions = (
		<>
			<Button
				onClick={onClose}
				disabled={loading}
				sx={{ textTransform: 'none', fontWeight: 600 }}
			>
				Cancel
			</Button>
			<Button
				variant="contained"
				onClick={handleSubmit}
				disabled={loading}
				sx={{
					bgcolor: theme.palette.primary.main,
					'&:hover': { bgcolor: theme.palette.primary.dark },
					textTransform: 'none',
					fontWeight: theme.typography.fontWeightBold,
					minWidth: 120
				}}
			>
				{loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Complete Offer'}
			</Button>
		</>
	);

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title={`Upload Offer Letter: ${candidateName}`}
			loading={loading}
			actions={actions}
			maxWidth="sm"
		>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
				Please upload the formal offer letter and enter the key offer details. This will automatically move the candidate to the <strong>Offer Made</strong> stage.
			</Typography>

			<Grid container spacing={3}>
				{/* File Upload Area */}
				<Grid size={{ xs: 12 }}>
					<Box
						sx={{
							border: `2px dashed ${error ? theme.palette.error.main : theme.palette.divider}`,
							borderRadius: theme.shape.borderRadius,
							p: 3,
							textAlign: 'center',
							bgcolor: alpha(theme.palette.primary.main, 0.02),
							cursor: 'pointer',
							transition: 'all 0.2s',
							'&:hover': {
								bgcolor: alpha(theme.palette.primary.main, 0.05),
								borderColor: theme.palette.primary.main
							}
						}}
						onClick={() => document.getElementById('offer-letter-input')?.click()}
					>
						<input
							type="file"
							id="offer-letter-input"
							hidden
							onChange={handleFileChange}
							accept=".pdf,.doc,.docx,image/*"
						/>
						{file ? (
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
								<FileIcon color="primary" />
								<Typography variant="body2" sx={{ fontWeight: theme.typography.fontWeightBold }}>
									{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
								</Typography>
							</Box>
						) : (
							<>
								<UploadIcon sx={{ fontSize: 40, color: theme.palette.text.disabled, mb: 1 }} />
								<Typography variant="body2" sx={{ fontWeight: theme.typography.fontWeightBold }}>
									Click to upload or drag and drop
								</Typography>
								<Typography variant="caption" color="text.secondary">
									PDF, DOCX or Images (Max 10MB)
								</Typography>
							</>
						)}
					</Box>
					{error && (
						<Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
							{error}
						</Typography>
					)}
				</Grid>

				{/* Offer Details */}
				<Grid size={{ xs: 12, sm: 6 }}>
					<TextField
						label="Offered CTC (LPA)"
						type="number"
						fullWidth
						value={ctc}
						onChange={(e) => setCtc(e.target.value)}
						placeholder="e.g. 6.5"
						size="small"
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6 }}>
					<TextField
						label="Designation"
						fullWidth
						value={designation}
						onChange={(e) => setDesignation(e.target.value)}
						placeholder="e.g. Software Engineer"
						size="small"
					/>
				</Grid>
				<Grid size={{ xs: 12 }}>
					<TextField
						label="Expected Joining Date"
						type="date"
						fullWidth
						value={joiningDate}
						onChange={(e) => setJoiningDate(e.target.value)}
						InputLabelProps={{ shrink: true }}
						size="small"
					/>
				</Grid>
				<Grid size={{ xs: 12 }}>
					<TextField
						label="Remarks / Notes"
						fullWidth
						multiline
						rows={3}
						value={remarks}
						onChange={(e) => setRemarks(e.target.value)}
						placeholder="Add any additional notes about this offer..."
						size="small"
					/>
				</Grid>
			</Grid>
		</BaseDialog>
	);
};

export default OfferLetterUploadDialog;
