import React, { useEffect, useState } from 'react';
import { Box, Typography, Stack, CircularProgress, IconButton, useTheme, Tooltip } from '@mui/material';
import { InsertDriveFileOutlined, CloudUploadOutlined, GetApp, DeleteOutline, HelpOutline, Image, PictureAsPdf, Description, GridOn, InsertDriveFile } from '@mui/icons-material';
import crmService from '../../../../../services/crmService';
import useToast from '../../../../../hooks/useToast';
import useDateTime from '../../../../../hooks/useDateTime';
import { MAX_FILE_SIZE_BYTES, ALLOWED_UPLOAD_MIME_TYPES } from '../../../../../constants/fileUpload';
import PremiumTooltip from '../../../../common/PremiumTooltip';
import type { Lead } from '../../../../../models/crm/lead';
import type { CRMFile } from '../../../../../models/crm/crmFile';

interface LeadFilesTabProps {
	lead: Lead;
}

const formatFileSize = (bytes: number) => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIconBg = (mime: string) => {
	if (mime.startsWith('image/')) return 'rgba(76, 175, 80, 0.1)';
	if (mime.includes('pdf')) return 'rgba(244, 67, 54, 0.1)';
	if (mime.includes('word') || mime.includes('officedocument')) return 'rgba(33, 150, 243, 0.1)';
	if (mime.includes('excel') || mime.includes('sheet') || mime.includes('csv')) return 'rgba(76, 175, 80, 0.1)';
	return 'rgba(0, 0, 0, 0.05)';
};

const getFileIcon = (mime: string) => {
	if (mime.startsWith('image/')) return <Image sx={{ fontSize: 18, color: '#4CAF50' }} />;
	if (mime.includes('pdf')) return <PictureAsPdf sx={{ fontSize: 18, color: '#F44336' }} />;
	if (mime.includes('word') || mime.includes('officedocument')) return <Description sx={{ fontSize: 18, color: '#2196F3' }} />;
	if (mime.includes('excel') || mime.includes('sheet') || mime.includes('csv')) return <GridOn sx={{ fontSize: 18, color: '#4CAF50' }} />;
	return <InsertDriveFile sx={{ fontSize: 18, color: '#9E9E9E' }} />;
};

export const LeadFilesTab: React.FC<LeadFilesTabProps> = ({ lead }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const { formatDateTime } = useDateTime();
	const toast = useToast();

	const [files, setFiles] = useState<CRMFile[]>([]);
	const [filesLoading, setFilesLoading] = useState(false);
	const [uploading, setUploading] = useState(false);

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

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!lead.id || !e.target.files || e.target.files.length === 0) return;
		const file = e.target.files[0];

		if (file.size > MAX_FILE_SIZE_BYTES) {
			toast.error(`File size exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit`);
			e.target.value = '';
			return;
		}
		if (file.type && !ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
			toast.error(`File type "${file.type}" is not allowed`);
			e.target.value = '';
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
			e.target.value = '';
		}
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

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
			<Box display="flex" alignItems="center" gap={0.5} sx={{ mb: 2 }}>
				<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Candidate Attachments</Typography>
				<PremiumTooltip title="Securely upload, store, and download resumes, certificates, and profiles. Scoped strictly under your organization tenant ID and uploader user credentials." arrow placement="right">
					<HelpOutline sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.main' } }} />
				</PremiumTooltip>
			</Box>
			
			{/* Dotted Upload Card */}
			<Box
				sx={{
					border: '2px dashed',
					borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
					borderRadius: '12px',
					p: 2.5,
					textAlign: 'center',
					cursor: uploading ? 'default' : 'pointer',
					bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
					transition: 'all 0.2s',
					'&:hover': uploading ? {} : {
						borderColor: 'primary.main',
						bgcolor: isDark ? 'rgba(33, 150, 243, 0.05)' : 'rgba(33, 150, 243, 0.02)',
					},
					mb: 3,
				}}
				component="label"
			>
				<input
					type="file"
					hidden
					onChange={handleFileUpload}
					disabled={uploading}
				/>
				{uploading ? (
					<Stack spacing={1} alignItems="center">
						<CircularProgress size={24} />
						<Typography variant="body2" color="text.secondary">
							Uploading file...
						</Typography>
					</Stack>
				) : (
					<Stack spacing={1} alignItems="center">
						<CloudUploadOutlined sx={{ fontSize: 28, color: 'text.secondary' }} />
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							Click to upload a file
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Max size: 10MB
						</Typography>
					</Stack>
				)}
			</Box>

			{/* File List */}
			{filesLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
					<CircularProgress size={28} />
				</Box>
			) : files.length === 0 ? (
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						py: 4,
						gap: 1,
					}}
				>
					<Box
						sx={{
							width: 52,
							height: 52,
							borderRadius: '14px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
							mb: 0.5,
						}}
					>
						<InsertDriveFileOutlined sx={{ fontSize: 24, color: 'text.disabled' }} />
					</Box>
					<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
						No files attached
					</Typography>
					<Typography variant="caption" color="text.secondary">
						Files will appear here once attached.
					</Typography>
				</Box>
			) : (
				<Stack spacing={1.5}>
					{files.map((f) => (
						<Box
							key={f.public_id}
							sx={{
								...fieldCardSx,
								p: 1.25,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								transition: 'transform 0.15s, box-shadow 0.15s',
								'&:hover': {
									boxShadow: theme.shadows[1],
								}
							}}
						>
							<Stack direction="row" spacing={1.5} alignItems="center" sx={{ overflow: 'hidden', flex: 1 }}>
								<Box
									sx={{
										width: 36,
										height: 36,
										borderRadius: '8px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										bgcolor: getFileIconBg(f.mime_type),
										flexShrink: 0,
									}}
								>
									{getFileIcon(f.mime_type)}
								</Box>
								<Box sx={{ overflow: 'hidden', flex: 1 }}>
									<Typography
										variant="body2"
										sx={{
											fontWeight: 600,
											color: 'text.primary',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
									>
										{f.file_name}
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
										{formatFileSize(f.file_size)} • {formatDateTime(f.created_at)}
									</Typography>
								</Box>
							</Stack>
							<Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, ml: 1.5 }}>
								<Tooltip title="Download File">
									<IconButton
										size="small"
										onClick={() => crmService.downloadFile(f.public_id, f.file_name)}
										sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
									>
										<GetApp sx={{ fontSize: 18 }} />
									</IconButton>
								</Tooltip>
								<Tooltip title="Delete File">
									<IconButton
										size="small"
										onClick={() => handleFileDelete(f.public_id)}
										sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
									>
										<DeleteOutline sx={{ fontSize: 18 }} />
									</IconButton>
								</Tooltip>
							</Stack>
						</Box>
					))}
				</Stack>
			)}
		</Box>
	);
};
