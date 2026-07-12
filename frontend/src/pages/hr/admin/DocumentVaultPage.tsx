import React, { useState, useEffect } from 'react';
import {
	Box, Container, Typography, Button, Card, CardContent, Grid, Chip,
	IconButton, Tooltip, TextField, Dialog, DialogTitle,
	DialogContent, DialogActions, Stack, Skeleton, Table, TableBody,
	TableCell, TableContainer, TableHead, TableRow, Paper, alpha,
	useTheme, FormControl, InputLabel, Select, MenuItem, Alert, AlertTitle
} from '@mui/material';
import {
	CloudUpload as UploadIcon, GetApp as DownloadIcon,
	CheckCircle as VerifiedIcon,
	Delete as DeleteIcon, VerifiedUserOutlined as VerifyActionIcon,
	FolderSharedOutlined as VaultIcon
} from '@mui/icons-material';
import PageHeader from '../../../components/common/page-header';
import { responsiveStyles } from '../../../theme';
import { hrEmployeeDocumentApi } from '../../../services/hrService';
import { fetchDocuments, uploadDocument, verifyDocument, deleteDocument, fetchEmployees } from '../../../store/slices/hrSlice';
import useToast from '../../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';

const DocumentVaultPage: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const currentUser = useAppSelector((state) => state.auth.user);
	const isHRManager = currentUser?.role === 'admin' || currentUser?.role === 'hr_admin' || currentUser?.role === 'hr_manager';
	const isHRViewer = isHRManager || currentUser?.role === 'leadership';

	const { documents, documentsLoading: loading, employees } = useAppSelector((state) => state.hr);

	// Upload Dialog State
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
	const [documentType, setDocumentType] = useState('Aadhaar Card');
	const [expiryDate, setExpiryDate] = useState('');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);

	const loadDocuments = () => {
		dispatch(fetchDocuments(undefined)).unwrap().catch(() => error('Failed to load documents'));
		if (isHRViewer) {
			dispatch(fetchEmployees({ limit: 100 }));
		}
	};

	useEffect(() => {
		loadDocuments();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setSelectedFile(e.target.files[0]);
		}
	};

	const handleUpload = async () => {
		if (!selectedFile) return;
		// Determine target user
		const targetUserId = isHRManager && selectedEmployeeId ? Number(selectedEmployeeId) : currentUser?.id;
		if (!targetUserId) return;

		setUploading(true);
		const formData = new FormData();
		formData.append('file', selectedFile);
		formData.append('user_id', String(targetUserId));
		formData.append('document_type', documentType);
		if (expiryDate) {
			formData.append('expiry_date', expiryDate);
		}

		try {
			await dispatch(uploadDocument(formData)).unwrap();
			success('Document uploaded successfully');
			setUploadDialogOpen(false);
			setSelectedFile(null);
			setExpiryDate('');
			setSelectedEmployeeId('');
		} catch (e: any) {
			error(e || 'Failed to upload document');
		} finally {
			setUploading(false);
		}
	};

	const handleVerify = async (id: number, currentVerified: boolean) => {
		try {
			await dispatch(verifyDocument({ id, isVerified: !currentVerified })).unwrap();
			success(!currentVerified ? 'Document verified' : 'Document marked unverified');
		} catch (e: any) {
			error('Failed to update verification status');
		}
	};

	const handleDelete = async (id: number) => {
		if (!window.confirm('Are you sure you want to delete this document?')) return;
		try {
			await dispatch(deleteDocument(id)).unwrap();
			success('Document deleted');
		} catch (e: any) {
			error('Failed to delete document');
		}
	};

	// Expiration calculations
	const getExpiringDocuments = () => {
		const today = new Date();
		const thirtyDaysLater = new Date();
		thirtyDaysLater.setDate(today.getDate() + 30);

		return documents.filter(doc => {
			if (!doc.expiry_date) return false;
			const expDate = new Date(doc.expiry_date);
			return expDate >= today && expDate <= thirtyDaysLater;
		});
	};

	const expiringDocs = getExpiringDocuments();

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<PageHeader
					title="Document Vault"
					subtitle="Secure digital repository for verified employee identities, NDAs, and certifications."
					action={
						<Button
							variant="contained"
							color="primary"
							startIcon={<UploadIcon />}
							onClick={() => setUploadDialogOpen(true)}
							sx={{
								borderRadius: 2.5, px: 3, fontWeight: 700,
								boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`
							}}
						>
							Upload Document
						</Button>
					}
				/>
			<Box sx={{ pb: 5 }}>
				{/* Warning Banner for Expiry */}
				{expiringDocs.length > 0 && (
					<Alert severity="warning" sx={{ mb: 4, borderRadius: 3 }}>
						<AlertTitle sx={{ fontWeight: 700 }}>Documents Expiring Soon</AlertTitle>
						<Stack spacing={0.5}>
							{expiringDocs.map((doc) => (
								<Typography key={doc.id} variant="caption">
									• Document <strong>{doc.document_type}</strong> for <strong>{doc.employee_name || 'you'}</strong> expires on {doc.expiry_date}
								</Typography>
							))}
						</Stack>
					</Alert>
				)}

				{/* Stats Row */}
				<Grid container spacing={3} sx={{ mb: 4 }}>
					<Grid size={{ xs: 12, sm: 4 }}>
						<Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
							<CardContent sx={{ py: 2.5 }}>
								<Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Total Uploads</Typography>
								<Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>{documents.length}</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid size={{ xs: 12, sm: 4 }}>
						<Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
							<CardContent sx={{ py: 2.5 }}>
								<Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Pending Verification</Typography>
								<Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: 'warning.main' }}>
									{documents.filter(d => !d.is_verified).length}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid size={{ xs: 12, sm: 4 }}>
						<Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
							<CardContent sx={{ py: 2.5 }}>
								<Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Verified Vault</Typography>
								<Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, color: 'success.main' }}>
									{documents.filter(d => d.is_verified).length}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
				</Grid>

				{/* Documents List */}
				{loading ? (
					<Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} />
				) : documents.length === 0 ? (
					<Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: `1px dashed ${theme.palette.divider}` }}>
						<VaultIcon sx={{ fontSize: '3.5rem', color: 'text.disabled', mb: 2 }} />
						<Typography variant="h6" fontWeight={700}>Document Vault is Empty</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
							Upload PAN, Aadhaar, offer letters, or certificates.
						</Typography>
						<Button variant="contained" onClick={() => setUploadDialogOpen(true)}>Upload First File</Button>
					</Paper>
				) : (
					<TableContainer component={Paper} sx={{ borderRadius: 4, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
						<Table>
							<TableHead sx={{ bgcolor: alpha(theme.palette.divider, 0.25) }}>
								<TableRow>
									{isHRViewer && <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>}
									<TableCell sx={{ fontWeight: 700 }}>Document Type</TableCell>
									<TableCell sx={{ fontWeight: 700 }}>Expiry Date</TableCell>
									<TableCell sx={{ fontWeight: 700 }}>Verification Status</TableCell>
									<TableCell sx={{ fontWeight: 700 }}>Uploaded At</TableCell>
									<TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{documents.map((doc) => (
									<TableRow key={doc.id} hover>
										{isHRViewer && (
											<TableCell sx={{ fontWeight: 600 }}>{doc.employee_name}</TableCell>
										)}
										<TableCell>
											<Typography variant="body2" fontWeight={700}>{doc.document_type}</Typography>
										</TableCell>
										<TableCell>
											{doc.expiry_date ? (
												<Typography variant="body2" color={new Date(doc.expiry_date) < new Date() ? 'error.main' : 'text.primary'}>
													{doc.expiry_date}
												</Typography>
											) : (
												<Typography variant="body2" color="text.disabled">—</Typography>
											)}
										</TableCell>
										<TableCell>
											<Chip
												label={doc.is_verified ? 'Verified' : 'Pending Verification'}
												size="small"
												color={doc.is_verified ? 'success' : 'warning'}
												icon={doc.is_verified ? <VerifiedIcon /> : undefined}
												sx={{ fontWeight: 700, fontSize: '0.75rem' }}
											/>
										</TableCell>
										<TableCell>
											{new Date(doc.created_at).toLocaleDateString()}
										</TableCell>
										<TableCell sx={{ textAlign: 'right' }}>
											<Stack direction="row" spacing={0.5} justifyContent="flex-end">
												<Tooltip title="Download File">
													<IconButton
														component="a"
														href={hrEmployeeDocumentApi.getDownloadUrl(doc.id)}
														target="_blank"
														rel="noopener noreferrer"
														size="small"
														color="primary"
													>
														<DownloadIcon sx={{ fontSize: '1.1rem' }} />
													</IconButton>
												</Tooltip>

												{isHRManager && (
													<Tooltip title={doc.is_verified ? 'Unverify Document' : 'Verify Document'}>
														<IconButton
															size="small"
															color={doc.is_verified ? 'success' : 'default'}
															onClick={() => handleVerify(doc.id, doc.is_verified)}
														>
															<VerifyActionIcon sx={{ fontSize: '1.1rem' }} />
														</IconButton>
													</Tooltip>
												)}

												<Tooltip title="Delete Document">
													<IconButton
														size="small"
														color="error"
														onClick={() => handleDelete(doc.id)}
													>
														<DeleteIcon sx={{ fontSize: '1.1rem' }} />
													</IconButton>
												</Tooltip>
											</Stack>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}

				{/* UPLOAD DIALOG */}
				<Dialog
					open={uploadDialogOpen}
					onClose={() => setUploadDialogOpen(false)}
					maxWidth="sm"
					fullWidth
					PaperProps={{ sx: { borderRadius: 4 } }}
				>
					<DialogTitle sx={{ fontWeight: 800 }}>Upload Employee Document</DialogTitle>
					<DialogContent sx={{ pt: 1 }}>
						<Stack spacing={3} sx={{ mt: 1.5 }}>
							{isHRManager && (
								<FormControl fullWidth>
									<InputLabel>Target Employee</InputLabel>
									<Select
										value={selectedEmployeeId}
										label="Target Employee"
										onChange={(e) => setSelectedEmployeeId(e.target.value as number)}
									>
										{employees.filter((emp) => emp.is_invited).map((emp) => (
											<MenuItem key={emp.user_id as number} value={emp.user_id as number}>
												{emp.full_name} ({emp.employee_id})
											</MenuItem>
										))}
									</Select>
								</FormControl>
							)}

							<FormControl fullWidth>
								<InputLabel>Document Type</InputLabel>
								<Select
									value={documentType}
									label="Document Type"
									onChange={(e) => setDocumentType(e.target.value)}
								>
									<MenuItem value="PAN Card">PAN Card</MenuItem>
									<MenuItem value="Aadhaar Card">Aadhaar Card</MenuItem>
									<MenuItem value="NDA Signoff">NDA Signoff</MenuItem>
									<MenuItem value="Offer Letter">Offer Letter</MenuItem>
									<MenuItem value="Degree Certificate">Degree Certificate</MenuItem>
									<MenuItem value="Passport/Visa">Passport/Visa</MenuItem>
									<MenuItem value="Other Identity Proof">Other Identity Proof</MenuItem>
								</Select>
							</FormControl>

							<TextField
								label="Expiry Date (If applicable)"
								type="date"
								fullWidth
								value={expiryDate}
								onChange={(e) => setExpiryDate(e.target.value)}
								InputLabelProps={{ shrink: true }}
							/>

							<Button
								variant="outlined"
								component="label"
								startIcon={<UploadIcon />}
								sx={{ py: 1.5, borderRadius: 2.5, borderStyle: 'dashed' }}
							>
								{selectedFile ? selectedFile.name : 'Choose File'}
								<input type="file" hidden onChange={handleFileChange} />
							</Button>
						</Stack>
					</DialogContent>
					<DialogActions sx={{ p: 3 }}>
						<Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>Cancel</Button>
						<Button
							variant="contained"
							onClick={handleUpload}
							disabled={uploading || !selectedFile || (isHRManager && !selectedEmployeeId)}
						>
							{uploading ? 'Uploading…' : 'Upload File'}
						</Button>
					</DialogActions>
				</Dialog>
			</Box>
			</Container>
		</Box>
	);
};

export default DocumentVaultPage;
