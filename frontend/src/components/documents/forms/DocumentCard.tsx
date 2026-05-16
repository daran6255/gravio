import React from 'react';
import { Card, CardContent, CardActions, Box, Typography, Chip, Button, CircularProgress, alpha, useTheme } from '@mui/material';
import { CheckCircle as CheckCircleIcon, CloudUpload as UploadIcon, FileDownload as MetaIcon } from '@mui/icons-material';
import type { RequiredDocument } from './documentConfig';
import type { CandidateDocument } from '../../../models/candidate';
import FileStatusBox from './FileStatusBox';

interface DocumentCardProps {
	docType: RequiredDocument;
	existingDoc?: CandidateDocument;
	uploading: string | null;
	onUpload: (e: React.ChangeEvent<HTMLInputElement>, type: string) => void;
	onPreview: (id: number) => void;
	onDelete: (id: number) => void;
	onDownload: (id: number) => void;
}

/**
 * DocumentCard - High-fidelity card for individual document collection.
 * Fully theme-aligned with zero hardcoded colors.
 */
const DocumentCard: React.FC<DocumentCardProps> = ({
	docType,
	existingDoc,
	uploading,
	onUpload,
	onPreview,
	onDelete,
	onDownload
}) => {
	const theme = useTheme();

	return (
		<Card sx={{
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			borderRadius: 2,
			border: '1px solid',
			borderColor: 'divider',
			transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
			'&:hover': {
				transform: 'translateY(-4px)',
				boxShadow: theme.shadows[4],
				borderColor: 'primary.main'
			}
		}}>
			<CardContent sx={{ flexGrow: 1, p: 3 }}>
				<Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 2, alignItems: 'flex-start', mb: 2 }}>
					<Box sx={{
						p: 1.25,
						bgcolor: alpha(theme.palette.secondary.main, 0.05),
						borderRadius: 1.25,
						display: 'flex',
						color: 'secondary.main',
						mt: 0.5
					}}>
						{React.cloneElement(docType.icon as React.ReactElement<any>, { sx: { fontSize: 24 } })}
					</Box>
					
					<Box sx={{ minWidth: 0 }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'secondary.main', mb: 0.25, lineHeight: 1.2 }}>
							{docType.label}
						</Typography>
						<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.3, display: 'block' }}>
							{docType.description}
						</Typography>
					</Box>

					<Box sx={{ pt: 0.5 }}>
						{!existingDoc ? (
							<Chip
								label="Pending"
								size="small"
								variant="outlined"
								sx={{
									bgcolor: alpha(theme.palette.warning.main, 0.05),
									color: 'warning.main',
									borderColor: alpha(theme.palette.warning.main, 0.2),
									fontWeight: 800,
									fontSize: '0.6rem',
									height: 18,
									textTransform: 'uppercase'
								}}
							/>
						) : (
							<Chip
								icon={<CheckCircleIcon style={{ fontSize: 12, color: theme.palette.success.main }} />}
								label="Verified"
								size="small"
								sx={{
									bgcolor: alpha(theme.palette.success.main, 0.05),
									color: 'success.main',
									borderColor: alpha(theme.palette.success.main, 0.2),
									fontWeight: 800,
									fontSize: '0.6rem',
									height: 18,
									textTransform: 'uppercase'
								}}
							/>
						)}
					</Box>
				</Box>
				
				{existingDoc && (
					<FileStatusBox 
						document={existingDoc} 
						onPreview={onPreview} 
						onDelete={onDelete} 
					/>
				)}
			</CardContent>

			<CardActions sx={{ p: 3, pt: 0 }}>
				{!existingDoc ? (
					<Button
						component="label"
						variant="contained"
						startIcon={uploading === docType.type ? <CircularProgress size={18} color="inherit" /> : <UploadIcon />}
						disabled={uploading === docType.type}
						fullWidth
						sx={{
							borderRadius: 1.25,
							py: 1.25,
							fontWeight: 800,
							textTransform: 'none',
							boxShadow: 'none',
							'&:hover': { boxShadow: 'none' }
						}}
					>
						{uploading === docType.type ? 'Uploading...' : `Upload ${docType.label}`}
						<input
							type="file"
							hidden
							onChange={(e) => onUpload(e, docType.type)}
							accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
						/>
					</Button>
				) : (
					<Button
						fullWidth
						variant="outlined"
						startIcon={<MetaIcon />}
						onClick={() => onDownload(existingDoc.id)}
						sx={{
							borderRadius: 1.25,
							py: 1.25,
							fontWeight: 700,
							textTransform: 'none',
							color: 'text.secondary',
							borderColor: 'divider',
							'&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04), borderColor: 'primary.light' }
						}}
					>
						Download Receipt
					</Button>
				)}
			</CardActions>
		</Card>
	);
};

export default DocumentCard;
