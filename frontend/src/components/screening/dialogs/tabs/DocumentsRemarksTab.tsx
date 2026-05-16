import React from 'react';
import {
	Box,
	Typography,
	Stack,
	Button,
	CircularProgress,
	TextField,
	FormControl,
	Paper,
	Divider,
	Chip,
	Select,
	MenuItem,
	Grid,
	IconButton,
	useTheme,
} from '@mui/material';
import {
	CloudUpload as CloudUploadIcon,
	CheckCircle as CheckCircleIcon,
	Visibility as ViewIcon,
	DeleteOutline as DeleteIcon,
	Gavel as GavelIcon,
	MailOutline as MailIcon,
	Refresh as RefreshIcon
} from '@mui/icons-material';
import { awsStyles } from '../../../../theme/theme';
import DynamicFieldRenderer from '../../../common/DynamicFieldRenderer';
import type { DynamicField } from '../../../../services/settingsService';

interface DocumentsRemarksTabProps {
	formData: any;
	onUpdateOtherField: (name: string, value: any) => void;
	onUpdateStatus: (value: string) => void;
	onFileUpload: (type: string, file: File) => void;
	onViewFile: (type: string) => void;
	onRemoveFile: (type: string) => void;
	onSendConsent: () => void;
	onRefresh?: () => void;
	uploading: Record<string, boolean>;
	viewing: Record<string, boolean>;
	sendingConsent: boolean;
	refreshing?: boolean;
	dynamicFields: DynamicField[];
	candidateIsDisabled: boolean;
}

const DocumentsRemarksTab: React.FC<DocumentsRemarksTabProps> = ({
	formData,
	onUpdateOtherField,
	onUpdateStatus,
	onFileUpload,
	onViewFile,
	onRemoveFile,
	onSendConsent,
	onRefresh,
	uploading,
	viewing,
	sendingConsent,
	refreshing,
	dynamicFields,
	candidateIsDisabled
}) => {
	const theme = useTheme();
	const { awsPanel } = awsStyles;

	const textFieldSx = {
		'& .MuiOutlinedInput-root': {
			borderRadius: '2px',
			bgcolor: 'background.paper',
			'& fieldset': { borderColor: 'divider' },
			'&:hover fieldset': { borderColor: theme.palette.text.secondary },
			'&.Mui-focused fieldset': { borderColor: 'primary.main' }
		}
	};

	const renderDocumentItem = (label: string, key: string) => {
		const isUploaded = formData.documents_upload?.[key];
		const fileName = (formData.documents_upload as any)?.[`${key}_filename`];
		const isUploading = uploading[key];
		const isViewing = viewing[key];

		return (
			<Paper
				elevation={0}
				sx={{
					...awsPanel,
					borderColor: isUploaded ? 'success.main' : 'divider',
					bgcolor: isUploaded ? 'rgba(16, 185, 129, 0.03)' : 'background.paper',
					display: 'flex',
					flexDirection: 'column',
					gap: 2,
					transition: 'all 0.2s ease',
					position: 'relative',
					'&:hover': {
						borderColor: isUploaded ? 'success.main' : 'primary.main',
						boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
					}
				}}
			>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
					<Stack direction="row" spacing={2} alignItems="center">
						<Box sx={{
							bgcolor: isUploaded ? 'success.main' : 'rgba(0,0,0,0.04)',
							p: 1,
							borderRadius: '4px',
							display: 'flex'
						}}>
							{isUploaded ? <CheckCircleIcon sx={{ color: 'white', fontSize: 20 }} /> : <CloudUploadIcon sx={{ color: 'text.secondary', fontSize: 20 }} />}
						</Box>
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
								{label}
							</Typography>
							<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
								{isUploaded ? fileName : 'Supported format: PDF (Max 10MB)'}
							</Typography>
						</Box>
					</Stack>
					<Box>
						{isUploaded ? (
							<Chip
								label="Uploaded"
								size="small"
								color="success"
								sx={{ borderRadius: '2px', fontWeight: 700, fontSize: '0.7rem' }}
							/>
						) : (
							<Chip
								label="Pending"
								size="small"
								sx={{ borderRadius: '2px', fontWeight: 700, fontSize: '0.7rem', bgcolor: 'rgba(0,0,0,0.06)' }}
							/>
						)}
					</Box>
				</Box>

				<Divider sx={{ borderStyle: 'dashed' }} />

				<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
					<Button
						component="label"
						variant="contained"
						size="small"
						disabled={isUploading}
						startIcon={isUploading ? <CircularProgress size={14} color="inherit" /> : <CloudUploadIcon />}
						sx={{
							textTransform: 'none',
							fontWeight: 700,
							borderRadius: '2px',
							boxShadow: 'none',
							'&:hover': { boxShadow: 'none' }
						}}
					>
						{isUploading ? 'Uploading...' : (isUploaded ? 'Update' : 'Upload')}
						<input
							type="file"
							hidden
							accept="application/pdf"
							onChange={(e) => {
								if (e.target.files?.[0]) onFileUpload(key, e.target.files[0]);
							}}
						/>
					</Button>

					{isUploaded && (
						<>
							<Button
								variant="outlined"
								size="small"
								startIcon={isViewing ? <CircularProgress size={14} /> : <ViewIcon />}
								onClick={() => onViewFile(key)}
								disabled={isViewing}
								sx={{
									textTransform: 'none',
									fontWeight: 700,
									borderRadius: '2px',
									borderColor: 'divider',
									color: 'text.primary'
								}}
							>
								View
							</Button>
							<Button
								variant="outlined"
								size="small"
								startIcon={<DeleteIcon />}
								onClick={() => onRemoveFile(key)}
								sx={{
									textTransform: 'none',
									fontWeight: 700,
									borderRadius: '2px',
									borderColor: 'divider',
									color: 'error.main',
									ml: 'auto',
									'&:hover': { borderColor: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.04)' }
								}}
							>
								Remove
							</Button>
						</>
					)}
				</Box>
			</Paper>
		);
	};

	return (
		<Stack spacing={4}>
			{/* Document Verification Section */}
			<Box>
				<Typography variant="awsSectionTitle" sx={{ mb: 2 }}>
					Document Verification
				</Typography>
				<Stack spacing={2}>
					{renderDocumentItem('Candidate Resume', 'resume')}
					{candidateIsDisabled && renderDocumentItem('Disability Certificate', 'disability_certificate')}
					{renderDocumentItem('Education Certificate', 'degree_qualification')}
				</Stack>
			</Box>

			{/* Additional Fields Section */}
			{dynamicFields.length > 0 && (
				<Box>
					<Typography variant="awsSectionTitle" sx={{ mb: 2 }}>
						Additional Information
					</Typography>
					<Paper elevation={0} sx={awsPanel}>
						<DynamicFieldRenderer
							fields={dynamicFields}
							formData={formData.others}
							onUpdateField={onUpdateOtherField}
						/>
					</Paper>
				</Box>
			)}

			{/* Consent Management Section - Appears only when Completed */}
			{formData.status === 'Completed' && (
				<Box>
					<Typography variant="awsSectionTitle" sx={{ mb: 2 }}>
						Consent Management
					</Typography>
					<Paper
						elevation={0}
						sx={{
							...awsPanel,
							p: 3,
							borderLeft: '4px solid',
							borderLeftColor: formData.consent_status === 'Accepted' ? 'success.main' : 'primary.main',
							bgcolor: formData.consent_status === 'Accepted' ? 'rgba(16, 185, 129, 0.03)' : 'rgba(0, 126, 185, 0.02)'
						}}
					>
						<Grid container spacing={3} alignItems="center">
							<Grid size={{ xs: 12, md: 8 }}>
								<Stack direction="row" spacing={2} alignItems="center">
									<Box sx={{
										bgcolor: formData.consent_status === 'Accepted' ? 'success.main' : 'primary.main',
										p: 1.5,
										borderRadius: '50%',
										display: 'flex',
										color: 'white'
									}}>
										<GavelIcon />
									</Box>
									<Box>
										<Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
											Candidate Consent Status
										</Typography>
										<Typography variant="body2" sx={{ color: 'text.secondary' }}>
											{formData.consent_status === 'Accepted'
												? 'Consent has been received and verified digitally.'
												: formData.consent_status === 'Pending'
													? 'Consent request email has been sent. Awaiting candidate action.'
													: 'Send the digital consent form to the candidate for review and acceptance.'
											}
										</Typography>
									</Box>
								</Stack>
							</Grid>
							<Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
								<Stack direction="column" spacing={1} alignItems="flex-end">
									<Stack direction="row" spacing={1} alignItems="center">
										<Chip
											label={formData.consent_status || 'Not Sent'}
											color={formData.consent_status === 'Accepted' ? 'success' : formData.consent_status === 'Pending' ? 'info' : 'default'}
											size="small"
											sx={{ fontWeight: 700, borderRadius: '2px' }}
										/>
										<IconButton 
											size="small" 
											onClick={onRefresh}
											disabled={refreshing}
											sx={{ 
												color: 'primary.main',
												bgcolor: 'rgba(0, 126, 185, 0.05)',
												'&:hover': { bgcolor: 'rgba(0, 126, 185, 0.1)' }
											}}
											title="Refresh Status"
										>
											{refreshing ? (
												<CircularProgress size={16} color="inherit" />
											) : (
												<RefreshIcon sx={{ fontSize: 16 }} />
											)}
										</IconButton>
									</Stack>
									<Button
										variant="contained"
										size="small"
										startIcon={sendingConsent ? <CircularProgress size={14} color="inherit" /> : <MailIcon />}
										onClick={onSendConsent}
										disabled={sendingConsent || formData.consent_status === 'Accepted'}
										sx={{
											textTransform: 'none',
											fontWeight: 700,
											borderRadius: '2px',
											boxShadow: 'none',
											'&:hover': { boxShadow: 'none' }
										}}
									>
										{sendingConsent ? 'Sending...' : (formData.consent_status === 'Pending' ? 'Resend Consent' : 'Send Consent Email')}
									</Button>
								</Stack>
							</Grid>
						</Grid>
					</Paper>
				</Box>
			)}

			{/* Final Verdict Section */}
			<Box>
				<Typography variant="awsSectionTitle" sx={{ mb: 2 }}>
					Final Verdict & Comments
				</Typography>
				<Paper elevation={0} sx={{ ...awsPanel, p: 3 }}>
					<Grid container spacing={3}>
						<Grid size={{ xs: 12, md: 6 }}>
							<Typography variant="awsFieldLabel">Screening Status</Typography>
							<FormControl fullWidth size="small">
								<Select
									id="screening-status"
									value={formData.status || 'In Progress'}
									onChange={(e) => onUpdateStatus(e.target.value)}
									sx={{
										borderRadius: '2px',
										bgcolor: 'background.paper',
										'& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
										'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
										'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
									}}
								>
									<MenuItem value="Completed">Completed</MenuItem>
									<MenuItem value="In Progress">In Progress</MenuItem>
									<MenuItem value="Rejected">Rejected</MenuItem>
								</Select>
							</FormControl>
						</Grid>

						<Grid size={{ xs: 12, md: 6 }}>
							{(formData.status === 'In Progress' || formData.status === 'Rejected') && (
								<Box>
									<Typography variant="awsFieldLabel">Reason / Classification</Typography>
									<FormControl fullWidth size="small">
										<Select
											value={formData.others?.reason || ''}
											onChange={(e) => onUpdateOtherField('reason', e.target.value)}
											displayEmpty
											sx={{
												borderRadius: '2px',
												'& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
												'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
												'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
											}}
										>
											<MenuItem value="" disabled><em>Select Reason</em></MenuItem>
											{formData.status === 'In Progress' ? [
												<MenuItem key="follow-up" value="Follow-up Required">Follow-up Required</MenuItem>,
												<MenuItem key="assess-sent" value="Assessment Sent">Assessment Sent</MenuItem>,
												<MenuItem key="assess-comp" value="Assessment Completed">Assessment Completed</MenuItem>
											] : [
												<MenuItem key="no-resp" value="No Response">No Response</MenuItem>,
												<MenuItem key="not-int" value="Not Interested">Not Interested</MenuItem>,
												<MenuItem key="domain" value="Domain Specific">Domain Specific</MenuItem>,
												<MenuItem key="studying" value="Studying">Studying</MenuItem>,
												<MenuItem key="working" value="Working">Working</MenuItem>
											]}
										</Select>
									</FormControl>
								</Box>
							)}
						</Grid>

						<Grid size={{ xs: 12 }}>
							<Typography variant="awsFieldLabel">Detailed Screening Comments</Typography>
							<TextField
								placeholder="Enter observations, specific feedback, and next steps..."
								fullWidth
								multiline
								minRows={4}
								size="small"
								value={formData.others?.comments}
								onChange={(e) => onUpdateOtherField('comments', e.target.value)}
								sx={textFieldSx}
							/>
						</Grid>
					</Grid>
				</Paper>
			</Box>
		</Stack>
	);
};

export default DocumentsRemarksTab;
