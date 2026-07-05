import React, { useEffect, useRef, useState } from 'react';
import {
	Box,
	Stack,
	Typography,
	IconButton,
	CircularProgress,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Divider,
	Tooltip,
	useTheme,
	alpha,
} from '@mui/material';
import {
	AttachFileOutlined,
	VisibilityOutlined,
	GetAppOutlined,
	DeleteOutline,
	AddOutlined,
	MoreHorizOutlined,
	InsertDriveFileOutlined,
	ImageOutlined,
	PictureAsPdfOutlined,
	TableChartOutlined,
} from '@mui/icons-material';
import projectService from '../../../../../services/projectService';
import useToast from '../../../../../hooks/useToast';
import useDateTime from '../../../../../hooks/useDateTime';
import { MAX_FILE_SIZE_BYTES, ALLOWED_UPLOAD_MIME_TYPES } from '../../../../../constants/fileUpload';
import type { ProjectTask, ProjectTaskFile } from '../../../../../models/projects/projectTask';

interface TaskAttachmentsCardProps {
	task: ProjectTask;
}

const fileIconFor = (mimeType: string) => {
	if (mimeType.startsWith('image/')) return ImageOutlined;
	if (mimeType === 'application/pdf') return PictureAsPdfOutlined;
	if (mimeType.includes('spreadsheet') || mimeType === 'text/csv') return TableChartOutlined;
	return InsertDriveFileOutlined;
};

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const TaskAttachmentsCard: React.FC<TaskAttachmentsCardProps> = ({ task }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();
	const { formatDate, formatDateTime } = useDateTime();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [files, setFiles] = useState<ProjectTaskFile[]>([]);
	const [filesLoading, setFilesLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [menuState, setMenuState] = useState<{ anchorEl: HTMLElement; file: ProjectTaskFile } | null>(null);

	const openFileMenu = (file: ProjectTaskFile) => (e: React.MouseEvent<HTMLElement>) => {
		e.stopPropagation();
		setMenuState({ anchorEl: e.currentTarget, file });
	};
	const closeFileMenu = () => setMenuState(null);

	const borderColor = isDark ? '#30363d' : '#d0d7de';
	const cardBg = isDark ? '#161b22' : '#ffffff';
	const hoverBg = isDark ? '#21262d' : '#f3f4f6';

	const loadFiles = async () => {
		setFilesLoading(true);
		try {
			const res = await projectService.listTaskFiles(task.public_id);
			setFiles(res);
		} catch {
			toast.error('Failed to load attachments');
		} finally {
			setFilesLoading(false);
		}
	};

	useEffect(() => {
		loadFiles();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [task.public_id]);

	const uploadFile = async (file: File) => {
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
			const uploaded = await projectService.uploadTaskFile(task.public_id, file);
			setFiles((prev) => [uploaded, ...prev]);
			toast.success('File uploaded successfully');
		} catch (err: any) {
			toast.error(err.response?.data?.error?.message || 'Failed to upload file');
		} finally {
			setUploading(false);
		}
	};

	const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

	const handleDelete = async (filePublicId: string) => {
		try {
			await projectService.deleteTaskFile(task.public_id, filePublicId);
			setFiles((prev) => prev.filter((f) => f.public_id !== filePublicId));
			toast.success('File deleted');
		} catch {
			toast.error('Failed to delete file');
		}
	};

	return (
		<Box
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			sx={{
				border: '1px solid',
				borderColor: isDragging ? 'primary.main' : borderColor,
				borderRadius: '12px',
				bgcolor: cardBg,
				overflow: 'hidden',
				boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.15)' : '0 4px 20px rgba(0,0,0,0.02)',
				transition: 'border-color 0.15s ease',
			}}
		>
			{/* Card header */}
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				sx={{
					px: 2,
					py: 1.1,
					borderBottom: '1px solid',
					borderColor,
					bgcolor: isDark ? '#161b22' : '#f6f8fa',
				}}
			>
				<Stack direction="row" alignItems="center" spacing={1}>
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
						Attachments
					</Typography>
					{files.length > 0 && (
						<Box sx={{ px: 0.9, py: 0.1, borderRadius: '100px', bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', fontSize: '0.7rem', fontWeight: 800 }}>
							{files.length}
						</Box>
					)}
				</Stack>
				<IconButton
					size="small"
					onClick={() => fileInputRef.current?.click()}
					disabled={uploading}
					sx={{ color: 'text.secondary', '&:hover': { bgcolor: hoverBg } }}
					title="Upload a file"
				>
					{uploading ? <CircularProgress size={16} /> : <AddOutlined fontSize="small" />}
				</IconButton>
				<input ref={fileInputRef} type="file" hidden onChange={handleFileInputChange} />
			</Stack>

			{/* Card body */}
			<Box sx={{ p: filesLoading || files.length === 0 ? 0 : 1 }}>
				{filesLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
						<CircularProgress size={22} />
					</Box>
				) : files.length === 0 ? (
					// Meaningful empty state: explains what this section is for and doubles
					// as the drop target, instead of a bare "no files" line.
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							textAlign: 'center',
							px: 3,
							py: 4,
							gap: 1,
							cursor: uploading ? 'default' : 'pointer',
						}}
						onClick={() => !uploading && fileInputRef.current?.click()}
					>
						<Box
							sx={{
								width: 44,
								height: 44,
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bgcolor: isDragging ? alpha(theme.palette.primary.main, 0.12) : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
								color: isDragging ? 'primary.main' : 'text.secondary',
								transition: 'background-color 0.15s ease',
							}}
						>
							<AttachFileOutlined sx={{ fontSize: 20 }} />
						</Box>
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
							{isDragging ? 'Drop file to upload' : 'No files attached yet'}
						</Typography>
						<Typography variant="caption" sx={{ color: 'text.secondary', maxWidth: 240 }}>
							Drag & drop a file here, or click to browse. Up to {MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.
						</Typography>
					</Box>
				) : (
					<Stack spacing={0.25}>
						{files.map((file) => {
							const FileIcon = fileIconFor(file.mime_type);
							return (
								<Tooltip
									key={file.public_id}
									placement="left"
									title={
										<>
											Uploaded {formatDateTime(file.created_at)}
											{file.owner_name ? ` by ${file.owner_name}` : ''}
										</>
									}
								>
									<Stack
										direction="row"
										alignItems="center"
										spacing={1.25}
										sx={{
											p: 1,
											borderRadius: '8px',
											'&:hover': { bgcolor: hoverBg },
										}}
									>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												width: 32,
												height: 32,
												borderRadius: '8px',
												bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
												color: 'text.secondary',
												flexShrink: 0,
											}}
										>
											<FileIcon sx={{ fontSize: 17 }} />
										</Box>
										<Box
											sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
											onClick={() => projectService.viewTaskFile(task.public_id, file.public_id)}
										>
											<Typography noWrap sx={{ fontWeight: 600, fontSize: '0.8rem', '&:hover': { color: 'primary.main' } }}>
												{file.file_name}
											</Typography>
											<Typography noWrap sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
												{formatFileSize(file.file_size)} · {formatDate(file.created_at)}
											</Typography>
										</Box>
										<IconButton size="small" onClick={openFileMenu(file)} sx={{ color: 'text.secondary', flexShrink: 0 }}>
											<MoreHorizOutlined fontSize="small" />
										</IconButton>
									</Stack>
								</Tooltip>
							);
						})}
					</Stack>
				)}
			</Box>

			{/* Per-file actions menu */}
			<Menu
				anchorEl={menuState?.anchorEl}
				open={Boolean(menuState)}
				onClose={closeFileMenu}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				MenuListProps={{ dense: true, sx: { py: 0.5 } }}
				PaperProps={{ sx: { borderRadius: '10px', mt: 0.5, minWidth: 150, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
			>
				<MenuItem
					onClick={() => {
						if (menuState) projectService.viewTaskFile(task.public_id, menuState.file.public_id);
						closeFileMenu();
					}}
					sx={{ py: 0.6, minHeight: 'auto' }}
				>
					<ListItemIcon sx={{ minWidth: 30 }}><VisibilityOutlined fontSize="small" /></ListItemIcon>
					<ListItemText primary="View" primaryTypographyProps={{ fontSize: '0.85rem' }} />
				</MenuItem>
				<MenuItem
					onClick={() => {
						if (menuState) projectService.downloadTaskFile(task.public_id, menuState.file.public_id, menuState.file.file_name);
						closeFileMenu();
					}}
					sx={{ py: 0.6, minHeight: 'auto' }}
				>
					<ListItemIcon sx={{ minWidth: 30 }}><GetAppOutlined fontSize="small" /></ListItemIcon>
					<ListItemText primary="Download" primaryTypographyProps={{ fontSize: '0.85rem' }} />
				</MenuItem>
				<Divider sx={{ my: 0.5 }} />
				<MenuItem
					onClick={() => {
						if (menuState) handleDelete(menuState.file.public_id);
						closeFileMenu();
					}}
					sx={{ py: 0.6, minHeight: 'auto' }}
				>
					<ListItemIcon sx={{ minWidth: 30 }}><DeleteOutline fontSize="small" color="error" /></ListItemIcon>
					<ListItemText primary="Delete" primaryTypographyProps={{ fontSize: '0.85rem', color: 'error' }} />
				</MenuItem>
			</Menu>
		</Box>
	);
};

export default TaskAttachmentsCard;
