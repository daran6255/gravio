import React from 'react';
import { 
	Paper, 
	Grid, 
	Typography, 
	Chip, 
	Box, 
	Button, 
	Stack, 
	alpha, 
	useTheme, 
	Avatar,
	IconButton,
	Tooltip,
	Divider
} from '@mui/material';
import { 
	Description as DescriptionIcon, 
	UploadFile as UploadFileIcon,
	Download as DownloadIcon,
	Visibility as ViewIcon,
	InsertDriveFile as FileIcon,
	PictureAsPdf as PdfIcon,
	AudioFile as AudioIcon,
	VideoFile as VideoIcon,
	Image as ImageIcon,
	CheckCircle as VerifiedIcon,
	CloudDone as CloudIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SectionHeader, SectionCard } from '../DetailedViewCommon';
import type { Candidate } from '../../../../models/candidate';

interface DocumentsTabProps {
	candidate: Candidate;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ candidate }) => {
	const navigate = useNavigate();
	const theme = useTheme();

	if (!candidate.documents || candidate.documents.length === 0) {
		return (
			<SectionCard sx={{ textAlign: 'center', py: 10, bgcolor: alpha(theme.palette.background.default, 0.4), borderRadius: 4 }}>
				<Box sx={{ maxWidth: 450, mx: 'auto' }}>
					<Avatar sx={{ 
						width: 100, 
						height: 100, 
						bgcolor: alpha(theme.palette.primary.main, 0.05), 
						color: 'primary.main',
						mx: 'auto',
						mb: 3
					}}>
						<CloudIcon sx={{ fontSize: 50 }} />
					</Avatar>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>Document Vault Empty</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
						No professional documents, resumes, or academic certificates have been uploaded for this candidate yet.
					</Typography>
					<Button
						variant="contained"
						size="large"
						startIcon={<UploadFileIcon />}
						sx={{ 
							borderRadius: 2, 
							px: 4, 
							py: 1.5,
							fontWeight: 700,
							boxShadow: theme.shadows[4]
						}}
						onClick={() => navigate(`/candidates/documents/${candidate.public_id}`)}
					>
						Upload Documents
					</Button>
				</Box>
			</SectionCard>
		);
	}

	const getFileIcon = (fileName: string) => {
		const ext = fileName.split('.').pop()?.toLowerCase();
		if (ext === 'pdf') return <PdfIcon sx={{ color: '#F44336' }} />;
		if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <ImageIcon sx={{ color: '#4CAF50' }} />;
		if (['mp4', 'mov', 'avi'].includes(ext || '')) return <VideoIcon sx={{ color: '#2196F3' }} />;
		if (['mp3', 'wav'].includes(ext || '')) return <AudioIcon sx={{ color: '#9C27B0' }} />;
		return <FileIcon sx={{ color: '#FF9800' }} />;
	};

	return (
		<SectionCard sx={{ bgcolor: alpha(theme.palette.background.default, 0.4) }}>
			<SectionHeader title="Document Repository" icon={<DescriptionIcon />}>
				<Chip 
					label={`${candidate.documents?.length || 0} Files Total`} 
					size="small" 
					variant="filled" 
					color="primary"
					sx={{ fontWeight: 800, borderRadius: 1.5 }}
				/>
			</SectionHeader>

			<Grid container spacing={3}>
				{candidate.documents.map((doc) => (
					<Grid size={{ xs: 12, sm: 6, lg: 4 }} key={doc.id}>
						<Paper 
							elevation={0}
							variant="outlined" 
							sx={{ 
								p: 0, 
								borderRadius: 3,
								overflow: 'hidden',
								transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
								'&:hover': { 
									borderColor: 'primary.main',
									transform: 'translateY(-4px)',
									boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
									'& .action-overlay': { opacity: 1 }
								} 
							}}
						>
							<Box sx={{ p: 2.5 }}>
								<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
									<Avatar sx={{ 
										bgcolor: alpha(theme.palette.background.default, 0.8), 
										borderRadius: 2,
										width: 48,
										height: 48,
										border: '1px solid',
										borderColor: 'divider'
									}}>
										{getFileIcon(doc.document_name)}
									</Avatar>
									<Box sx={{ minWidth: 0, flex: 1 }}>
										<Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25, color: 'text.primary' }} noWrap>
											{doc.document_name}
										</Typography>
										<Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
											{doc.document_type.replace(/_/g, ' ')}
										</Typography>
										
										<Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
											<Chip
												label={doc.document_source === 'trainer' ? 'TRAINER' : 'CANDIDATE'}
												size="small"
												sx={{
													height: 18,
													fontSize: '0.6rem',
													fontWeight: 800,
													bgcolor: doc.document_source === 'trainer' ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.info.main, 0.1),
													color: doc.document_source === 'trainer' ? 'primary.main' : 'info.main',
													border: '1px solid',
													borderColor: 'transparent'
												}}
											/>
											{doc.is_active && (
												<Chip
													icon={<VerifiedIcon sx={{ fontSize: '10px !important' }} />}
													label="ACTIVE"
													size="small"
													color="success"
													sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }}
												/>
											)}
										</Stack>
									</Box>
								</Box>
							</Box>
							
							<Divider />
							
							<Box sx={{ 
								px: 2, 
								py: 1, 
								bgcolor: 'background.paper', 
								display: 'flex', 
								justifyContent: 'space-between', 
								alignItems: 'center' 
							}}>
								<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled' }}>
									{doc.file_size ? (doc.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Size N/A'}
								</Typography>
								<Stack direction="row" spacing={0.5}>
									<Tooltip title="View Document">
										<IconButton 
											size="small" 
											color="primary"
											onClick={async () => {
												try {
													const { documentService } = await import('../../../../services/candidateService');
													const blob = await documentService.download(doc.id);
													const url = window.URL.createObjectURL(blob);
													window.open(url, '_blank');
													// Clean up the URL after a delay
													setTimeout(() => window.URL.revokeObjectURL(url), 1000);
												} catch (error) {
													console.error('Failed to view document:', error);
												}
											}}
										>
											<ViewIcon fontSize="small" />
										</IconButton>
									</Tooltip>
									<Tooltip title="Download">
										<IconButton 
											size="small"
											onClick={async () => {
												try {
													const { documentService } = await import('../../../../services/candidateService');
													const blob = await documentService.download(doc.id);
													const url = window.URL.createObjectURL(blob);
													const link = document.createElement('a');
													link.href = url;
													link.download = doc.document_name || `document_${doc.id}.pdf`;
													document.body.appendChild(link);
													link.click();
													document.body.removeChild(link);
													window.URL.revokeObjectURL(url);
												} catch (error) {
													console.error('Failed to download document:', error);
												}
											}}
										>
											<DownloadIcon fontSize="small" />
										</IconButton>
									</Tooltip>
								</Stack>
							</Box>
						</Paper>
					</Grid>
				))}
			</Grid>
		</SectionCard>
	);
};

export default DocumentsTab;
