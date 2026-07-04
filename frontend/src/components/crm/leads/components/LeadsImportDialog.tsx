import React, { useRef, useState } from 'react';
import { Box, Button, Stack, Typography, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import { CloudUploadOutlined, CheckCircle, ErrorOutline, DownloadOutlined } from '@mui/icons-material';
import BaseDialog from '../../../common/dialogbox/BaseDialog';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { importLeadsCsv, clearImportResult } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';

interface LeadsImportDialogProps {
	open: boolean;
	onClose: () => void;
	onImported: () => void;
}

// Matches the columns CRMService.import_leads_csv reads on the backend, in the
// same order, with one filled-in example row so the shape is unambiguous.
const TEMPLATE_HEADERS = ['title', 'source', 'priority', 'estimated_value', 'currency', 'description', 'contact_email', 'company_name'];
const TEMPLATE_SAMPLE_ROW = [
	'Enterprise CRM Upgrade',
	'website',
	'high',
	'50000',
	'USD',
	'Interested in upgrading to the enterprise tier',
	'jane.doe@example.com',
	'Acme Corp',
];

const downloadLeadsTemplate = () => {
	const csv = [TEMPLATE_HEADERS, TEMPLATE_SAMPLE_ROW]
		.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
		.join('\r\n');
	const blob = new Blob([csv], { type: 'text/csv' });
	const downloadUrl = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = downloadUrl;
	link.download = 'leads_import_template.csv';
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.URL.revokeObjectURL(downloadUrl);
};

export const LeadsImportDialog: React.FC<LeadsImportDialogProps> = ({ open, onClose, onImported }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { importLoading, importResult } = useAppSelector((state) => state.crm);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleClose = () => {
		setSelectedFile(null);
		dispatch(clearImportResult());
		onClose();
	};

	const handleImport = async () => {
		if (!selectedFile) return;
		try {
			await dispatch(importLeadsCsv(selectedFile)).unwrap();
			toast.success('Import completed');
			onImported();
		} catch (err: any) {
			toast.error(err || 'Failed to import leads');
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={handleClose}
			title="Import Leads"
			subtitle="Upload a CSV file to bulk-create leads"
			maxWidth="md"
			loading={importLoading}
			actions={
				<>
					<Button onClick={handleClose} disabled={importLoading} sx={{ textTransform: 'none', fontWeight: 600 }}>
						Close
					</Button>
					<Button
						variant="contained"
						onClick={handleImport}
						disabled={!selectedFile || importLoading}
						sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3 }}
					>
						{importLoading ? <CircularProgress size={20} color="inherit" /> : 'Import'}
					</Button>
				</>
			}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 2,
						p: 2,
						borderRadius: '12px',
						border: '1px solid',
						borderColor: 'divider',
						bgcolor: 'action.hover',
					}}
				>
					<Box>
						<Typography variant="body2" sx={{ fontWeight: 700 }}>
							Not sure of the format?
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Download the template, fill it in, then upload it below.
						</Typography>
					</Box>
					<Button
						variant="outlined"
						size="small"
						startIcon={<DownloadOutlined />}
						onClick={downloadLeadsTemplate}
						sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', flexShrink: 0 }}
					>
						Download Template
					</Button>
				</Box>

				<Typography variant="body2" color="text.secondary">
					Expected columns: <code>title</code> (required), <code>source</code>, <code>priority</code>,
					<code>estimated_value</code>, <code>currency</code>, <code>description</code>,
					<code>contact_email</code>, <code>company_name</code>.
				</Typography>

				<Box
					sx={{
						border: '2px dashed',
						borderColor: 'divider',
						borderRadius: '12px',
						p: 2.5,
						textAlign: 'center',
						cursor: 'pointer',
					}}
					component="label"
				>
					<input
						ref={fileInputRef}
						type="file"
						accept=".csv"
						hidden
						onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
					/>
					<Stack spacing={1} alignItems="center">
						<CloudUploadOutlined sx={{ fontSize: 28, color: 'text.secondary' }} />
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{selectedFile ? selectedFile.name : 'Click to choose a CSV file'}
						</Typography>
					</Stack>
				</Box>

				{importResult && (
					<Box>
						<Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
							<Chip label={`${importResult.total_rows} rows`} size="small" />
							<Chip label={`${importResult.success_count} succeeded`} color="success" size="small" />
							<Chip label={`${importResult.failure_count} failed`} color={importResult.failure_count ? 'error' : 'default'} size="small" />
						</Stack>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Row</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Details</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{importResult.results.map((r) => (
									<TableRow key={r.row_number}>
										<TableCell>{r.row_number}</TableCell>
										<TableCell>
											{r.success ? (
												<CheckCircle fontSize="small" color="success" />
											) : (
												<ErrorOutline fontSize="small" color="error" />
											)}
										</TableCell>
										<TableCell>
											<Typography variant="caption" color={r.error ? 'error' : 'text.secondary'}>
												{r.error || r.duplicate_warning || '—'}
											</Typography>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Box>
				)}
			</Box>
		</BaseDialog>
	);
};

export default LeadsImportDialog;
