import React, { useState, useRef } from 'react';
import { 
	Button, 
	Typography, 
	Box, 
	alpha, 
	useTheme, 
	LinearProgress,
	Link,
	Paper,
	Alert,
	List,
	ListItem,
	ListItemIcon,
	ListItemText
} from '@mui/material';
import { 
	CloudUploadRounded, 
	DescriptionRounded,
	Close as CloseIcon,
	DownloadRounded,
	ErrorOutlineRounded as ErrorIcon,
	CheckCircleOutlineRounded as SuccessIcon
} from '@mui/icons-material';
import BaseDialog from './BaseDialog';
import type { ImportDialogProps } from './types';

const ImportDialog: React.FC<ImportDialogProps> = ({
	open,
	onClose,
	onImport,
	title = 'Import Records',
	subtitle = 'Upload your structured data file to synchronize with the core database',
	acceptedFiles = '.csv,.xlsx,.xls',
	templateUrl,
	onDownloadTemplate,
	loading = false,
	maxWidth = 'sm',
	result,
	onResetResult
}) => {
	const theme = useTheme();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [dragActive, setDragActive] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			setSelectedFile(e.dataTransfer.files[0]);
			if (onResetResult) onResetResult();
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setSelectedFile(e.target.files[0]);
			if (onResetResult) onResetResult();
		}
	};

	const handleConfirmImport = async () => {
		if (selectedFile) {
			const res = await onImport(selectedFile);
			if (!res) {
				setSelectedFile(null);
			}
		}
	};

	const handleClose = () => {
		if (loading) return;
		setSelectedFile(null);
		if (onResetResult) onResetResult();
		onClose();
	};

	const renderResult = () => {
		if (!result) return null;

		const hasErrors = result.errors && result.errors.length > 0;
		
		return (
			<Box sx={{ mt: 1 }}>
				<Alert 
					severity={hasErrors ? 'warning' : 'success'} 
					icon={hasErrors ? <ErrorIcon /> : <SuccessIcon />}
					sx={{ 
						mb: 2, 
						borderRadius: '4px',
						'& .MuiAlert-message': { width: '100%' }
					}}
				>
					<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
						{hasErrors ? 'Import Processed with Warnings' : 'Import Successful'}
					</Typography>
					<Typography variant="body2">
						Successfully created {result.created} records. {result.skipped} records were skipped as duplicates.
					</Typography>
				</Alert>

				{hasErrors && (
					<Box>
						<Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, mb: 1, display: 'block', textTransform: 'uppercase' }}>
							Data Validation Errors ({result.errors.length})
						</Typography>
						<Paper 
							variant="outlined" 
							sx={{ 
								maxHeight: 200, 
								overflow: 'auto', 
								bgcolor: alpha(theme.palette.error.main, 0.02),
								borderColor: alpha(theme.palette.error.main, 0.1),
								borderRadius: '4px'
							}}
						>
							<List dense disablePadding>
								{result.errors.map((err, idx) => (
									<ListItem 
										key={idx} 
										divider={idx < result.errors.length - 1}
										sx={{ py: 1 }}
									>
										<ListItemIcon sx={{ minWidth: 32 }}>
											<ErrorIcon color="error" sx={{ fontSize: 16 }} />
										</ListItemIcon>
										<ListItemText
											primary={`Row ${err.row}`}
											secondary={err.error}
											primaryTypographyProps={{ variant: 'caption', fontWeight: 800, color: 'error.main' }}
											secondaryTypographyProps={{ variant: 'caption', color: 'text.primary', sx: { display: 'block', mt: 0.25 } }}
										/>
									</ListItem>
								))}
							</List>
						</Paper>
					</Box>
				)}
			</Box>
		);
	};

	const actions = (
		<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
			{onDownloadTemplate ? (
				<Link 
					component="button"
					variant="body2"
					onClick={(e) => { e.preventDefault(); onDownloadTemplate(); }}
					sx={{ 
						display: 'flex', 
						alignItems: 'center', 
						gap: 1, 
						fontSize: '0.8125rem',
						color: 'primary.main',
						textDecoration: 'none',
						fontWeight: 600,
						border: 'none',
						bgcolor: 'transparent',
						cursor: 'pointer',
						p: 0,
						'&:hover': { textDecoration: 'underline' }
					}}
				>
					<DownloadRounded sx={{ fontSize: 18 }} />
					Download Template
				</Link>
			) : templateUrl ? (
				<Link 
					href={templateUrl} 
					download
					sx={{ 
						display: 'flex', 
						alignItems: 'center', 
						gap: 1, 
						fontSize: '0.8125rem',
						color: 'primary.main',
						textDecoration: 'none',
						fontWeight: 600,
						'&:hover': { textDecoration: 'underline' }
					}}
				>
					<DownloadRounded sx={{ fontSize: 18 }} />
					Download Template
				</Link>
			) : <Box />}
			<Box sx={{ display: 'flex', gap: 1.5 }}>
				<Button 
					onClick={handleClose} 
					disabled={loading}
					sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
				>
					{result ? 'Dismiss' : 'Cancel'}
				</Button>
				{!result && (
					<Button
						variant="contained"
						disabled={!selectedFile || loading}
						onClick={handleConfirmImport}
						sx={{
							bgcolor: 'accent.main',
							color: 'white',
							textTransform: 'none',
							fontWeight: 700,
							px: 4,
							'&:hover': { bgcolor: 'accent.dark' }
						}}
					>
						{loading ? 'Processing...' : 'Begin Ingestion'}
					</Button>
				)}
			</Box>
		</Box>
	);

	return (
		<BaseDialog
			open={open}
			onClose={handleClose}
			title={title}
			subtitle={subtitle}
			maxWidth={maxWidth}
			loading={loading}
			actions={actions}
		>
			<Box sx={{ position: 'relative' }}>
				{!result ? (
					<Paper
						variant="outlined"
						onDragEnter={handleDrag}
						onDragLeave={handleDrag}
						onDragOver={handleDrag}
						onDrop={handleDrop}
						onClick={() => fileInputRef.current?.click()}
						sx={{
							py: 6,
							px: 2,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
							transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
							bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.03) : alpha(theme.palette.background.default, 0.2),
							borderStyle: 'dashed',
							borderWidth: 2,
							borderColor: dragActive ? 'primary.main' : alpha(theme.palette.divider, 0.8),
							'&:hover': {
								borderColor: 'primary.main',
								bgcolor: alpha(theme.palette.primary.main, 0.02)
							}
						}}
					>
						<input
							ref={fileInputRef}
							type="file"
							accept={acceptedFiles}
							style={{ display: 'none' }}
							onChange={handleFileSelect}
						/>

						{selectedFile ? (
							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
								<DescriptionRounded sx={{ fontSize: 48, color: 'primary.main' }} />
								<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
									{selectedFile.name}
								</Typography>
								<Typography variant="caption" sx={{ color: 'text.secondary' }}>
									{(selectedFile.size / 1024).toFixed(1)} KB
								</Typography>
								<Button 
									size="small" 
									color="error" 
									onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
									sx={{ mt: 1, textTransform: 'none' }}
									startIcon={<CloseIcon fontSize="small" />}
								>
									Remove
								</Button>
							</Box>
						) : (
							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
								<Box sx={{ 
									p: 1.5, 
									borderRadius: '12px', 
									bgcolor: alpha(theme.palette.primary.main, 0.08),
									color: 'primary.main'
								}}>
									<CloudUploadRounded sx={{ fontSize: 32 }} />
								</Box>
								<Box sx={{ textAlign: 'center' }}>
									<Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
										Click or drag file to this area to upload
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Supported formats: {acceptedFiles} (Max 10MB)
									</Typography>
								</Box>
							</Box>
						)}
					</Paper>
				) : renderResult()}

				{loading && (
					<Box sx={{ mt: 3 }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
								Ingesting data stream...
							</Typography>
							<Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
								{loading ? 'Processing' : '100%'}
							</Typography>
						</Box>
						<LinearProgress 
							sx={{ 
								height: 6, 
								borderRadius: 3,
								bgcolor: alpha(theme.palette.primary.main, 0.1),
								'& .MuiLinearProgress-bar': { borderRadius: 3 }
							}} 
						/>
					</Box>
				)}
			</Box>
		</BaseDialog>
	);
};

export default ImportDialog;
