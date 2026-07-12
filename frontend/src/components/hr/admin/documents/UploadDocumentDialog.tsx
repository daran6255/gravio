import React, { useEffect, useState } from 'react';
import {
	Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography, alpha, useTheme,
} from '@mui/material';
import { UploadFileOutlined as UploadIcon } from '@mui/icons-material';
import BaseDialog from '../../../common/dialogbox/BaseDialog';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { uploadDocument } from '../../../../store/slices/hrSlice';
import useToast from '../../../../hooks/useToast';
import type { HREmployeeListItem, DocumentType } from '../../../../models/hr';
import { DOCUMENT_TYPES, ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES, formatFileSize } from './documentTypes';

interface UploadDocumentDialogProps {
	open: boolean;
	onClose: () => void;
	onUploaded: () => void;
	employees: HREmployeeListItem[];
	canUploadForOthers: boolean;
}

const UploadDocumentDialog: React.FC<UploadDocumentDialogProps> = ({ open, onClose, onUploaded, employees, canUploadForOthers }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const currentUser = useAppSelector((state) => state.auth.user);

	const [employeeId, setEmployeeId] = useState<number | ''>('');
	const [documentType, setDocumentType] = useState<DocumentType>(DOCUMENT_TYPES[0]);
	const [expiryDate, setExpiryDate] = useState('');
	const [file, setFile] = useState<File | null>(null);
	const [fileError, setFileError] = useState('');
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (open) {
			setEmployeeId(canUploadForOthers ? '' : (currentUser?.id as number) || '');
			setDocumentType(DOCUMENT_TYPES[0]);
			setExpiryDate('');
			setFile(null);
			setFileError('');
		}
	}, [open, canUploadForOthers, currentUser]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const picked = e.target.files?.[0] || null;
		if (picked && picked.size > MAX_FILE_SIZE_BYTES) {
			setFileError(`File exceeds the maximum allowed size of ${formatFileSize(MAX_FILE_SIZE_BYTES)}`);
			setFile(null);
			return;
		}
		setFileError('');
		setFile(picked);
	};

	const canSave = !!employeeId && !!documentType && !!file && !fileError;

	const handleSave = async () => {
		if (!canSave || !file) return;
		setSaving(true);
		try {
			const formData = new FormData();
			formData.append('user_id', String(employeeId));
			formData.append('document_type', documentType);
			if (expiryDate) formData.append('expiry_date', expiryDate);
			formData.append('file', file);

			await dispatch(uploadDocument(formData)).unwrap();
			success('Document uploaded successfully');
			onUploaded();
			onClose();
		} catch (e: any) {
			error(e || 'Failed to upload document');
		} finally {
			setSaving(false);
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Upload Document"
			subtitle="Add a document to the employee's secure vault"
			loading={saving}
			actions={
				<>
					<Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', color: 'text.secondary' }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={saving || !canSave}
						sx={{
							textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3, color: 'white',
							boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
							background: theme.gradients.brand,
							'&:hover': { boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.35)}` },
						}}
					>
						{saving ? 'Uploading…' : 'Upload Document'}
					</Button>
				</>
			}
		>
			<Stack spacing={2.5}>
				{canUploadForOthers ? (
					<FormControl fullWidth>
						<InputLabel>Employee</InputLabel>
						<Select
							value={employeeId}
							label="Employee"
							onChange={(e) => setEmployeeId(e.target.value as number)}
							sx={{ borderRadius: '12px' }}
						>
							{employees.filter((emp) => emp.is_invited).map((emp) => (
								<MenuItem key={emp.user_id as number} value={emp.user_id as number}>
									{emp.full_name} ({emp.employee_id})
								</MenuItem>
							))}
						</Select>
					</FormControl>
				) : (
					<Box sx={{ p: 1.75, borderRadius: '14px', bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
						<Typography variant="caption" color="text.secondary">
							This document will be uploaded to your own vault.
						</Typography>
					</Box>
				)}

				<FormControl fullWidth>
					<InputLabel>Document Type</InputLabel>
					<Select
						value={documentType}
						label="Document Type"
						onChange={(e) => setDocumentType(e.target.value as DocumentType)}
						sx={{ borderRadius: '12px' }}
					>
						{DOCUMENT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
					</Select>
				</FormControl>

				<TextField
					label="Expiry Date (optional)"
					type="date"
					fullWidth
					InputLabelProps={{ shrink: true }}
					value={expiryDate}
					onChange={(e) => setExpiryDate(e.target.value)}
					sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
				/>

				<Box>
					<Button
						component="label"
						variant="outlined"
						fullWidth
						startIcon={<UploadIcon />}
						sx={{
							textTransform: 'none', fontWeight: 700, borderRadius: '12px', py: 1.5,
							borderStyle: 'dashed', borderColor: fileError ? 'error.main' : alpha(theme.palette.primary.main, 0.35),
						}}
					>
						{file ? file.name : 'Choose File'}
						<input type="file" hidden accept={ACCEPTED_FILE_TYPES} onChange={handleFileChange} />
					</Button>
					{file && !fileError && (
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
							{formatFileSize(file.size)}
						</Typography>
					)}
					{fileError && (
						<Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.75 }}>
							{fileError}
						</Typography>
					)}
					<Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.75 }}>
						PDF, images, Office documents up to {formatFileSize(MAX_FILE_SIZE_BYTES)}.
					</Typography>
				</Box>
			</Stack>
		</BaseDialog>
	);
};

export default UploadDocumentDialog;
