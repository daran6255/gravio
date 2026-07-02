import React, { useEffect, useState } from 'react';
import { Box, Typography, Stack, Button, CircularProgress, IconButton, useTheme, alpha } from '@mui/material';
import { GetApp, DeleteOutline, CloudUploadOutlined } from '@mui/icons-material';
import crmService from '../../../../../services/crmService';
import useToast from '../../../../../hooks/useToast';
import useDateTime from '../../../../../hooks/useDateTime';
import { MAX_FILE_SIZE_BYTES, ALLOWED_UPLOAD_MIME_TYPES } from '../../../../../constants/fileUpload';
import type { Lead } from '../../../../../models/crm/lead';
import type { CRMFile } from '../../../../../models/crm/crmFile';

interface LeadFilesTabProps {
	lead: Lead;
}

export const LeadFilesTab: React.FC<LeadFilesTabProps> = ({ lead }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();
	const { formatDateTime } = useDateTime();

	const [files, setFiles] = useState<CRMFile[]>([]);
	const [filesLoading, setFilesLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	const loadFiles = async () => {
		if (!lead.id) return;
		setFilesLoading(true);
		try {
			const res = await crmService.listFiles('lead', lead.id);
			setFiles(res.items);
		} catch (err: any) {
			toast.error('Failed to load files');
		} finally {
			setFilesLoading(false);
		}
	};

	const uploadFile = async (file: File) => {
		if (!lead.id) return;

		if (file.size > MAX_FILE_SIZE_BYTES) {
			toast.error(`File size exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit`);
			return;
		}
		if (file.type && !ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
			toast.error(`File type "${file.type}" is not allowed`);
			return;
		}

		setUploading(true);
		try {
			await crmService.uploadFile('lead', lead.id, file);
			toast.success('File uploaded successfully');
			loadFiles();
		} catch (err: any) {
			toast.error(err.response?.data?.error?.message || 'Failed to upload file');
		} finally {
			setUploading(false);
		}
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return;
		await uploadFile(e.target.files[0]);
		e.target.value = '';
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (!uploading) setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
		if (uploading || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
		await uploadFile(e.dataTransfer.files[0]);
	};

	const handleFileDelete = async (publicId: string) => {
		try {
			await crmService.deleteFile(publicId);
			toast.success('File deleted successfully');
			setFiles((prev) => prev.filter((f) => f.public_id !== publicId));
		} catch (err: any) {
			toast.error('Failed to delete file');
		}
	};

	useEffect(() => {
		loadFiles();
	}, [lead.id]);

	const fieldCardSx = {
		borderRadius: '12px',
		border: '1px solid',
		borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
		bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
		p: 1.75,
		boxShadow: isDark ? '0px 4px 20px rgba(0,0,0,0.15)' : '0px 4px 20px rgba(0,0,0,0.02)',
	};

	const sectionTitleSx = {
		fontWeight: 800,
		fontSize: '0.7rem',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.08em',
		color: 'text.primary',
	};

	return (
		<Stack spacing={2.5}>
			<Box
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				sx={{
					borderRadius: '12px',
					border: '2px dashed',
					borderColor: isDragging ? 'primary.main' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'),
					bgcolor: isDragging ? alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04) : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					py: 3,
					gap: 1,
					transition: 'all 0.2s',
				}}
			>
				<CloudUploadOutlined sx={{ fontSize: 28, color: isDragging ? 'primary.main' : 'text.secondary' }} />
				<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>
					{isDragging ? 'Drop file to upload' : 'Drag & drop a file here'}
				</Typography>
				<Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mb: 1 }}>
					Accepts PDF, Word, Excel, CSV, Images (up to 10MB)
				</Typography>
				<Button
					variant="outlined"
					component="label"
					disabled={uploading}
					sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
				>
					{uploading ? 'Uploading...' : 'Choose File'}
					<input type="file" hidden onChange={handleFileUpload} />
				</Button>
			</Box>

			<Typography variant="caption" sx={sectionTitleSx}>Files ({files.length})</Typography>

			{filesLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
			) : files.length === 0 ? (
				<Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 3 }}>
					No attachments uploaded.
				</Typography>
			) : (
				<Stack spacing={1}>
					{files.map((file) => (
						<Box key={file.public_id} sx={{ ...fieldCardSx, p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							<Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
								<IconButton size="small" onClick={() => crmService.downloadFile(file.public_id, file.file_name)}>
									<GetApp fontSize="small" color="primary" />
								</IconButton>
								<Box sx={{ minWidth: 0 }}>
									<Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{file.file_name}</Typography>
									<Typography variant="caption" color="text.secondary">
										{(file.file_size / 1024).toFixed(1)} KB • {formatDateTime(file.created_at)}
									</Typography>
								</Box>
							</Stack>
							<IconButton size="small" onClick={() => handleFileDelete(file.public_id)} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
								<DeleteOutline fontSize="small" />
							</IconButton>
						</Box>
					))}
				</Stack>
			)}
		</Stack>
	);
};

export default LeadFilesTab;
