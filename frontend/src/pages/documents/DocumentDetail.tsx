import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Alert, Grid, useTheme, Container, alpha } from '@mui/material';
import { useDispatch } from 'react-redux';
import { clearError } from '../../store/slices/candidateSlice';
import type { AppDispatch } from '../../store/store';
import type { RequiredDocument } from '../../components/documents/forms/documentConfig';

// Modular Components & Hooks
import DocumentHeader from '../../components/documents/forms/DocumentHeader';
import DocumentProgressBar from '../../components/documents/progress/DocumentProgressBar';
import DocumentCard from '../../components/documents/forms/DocumentCard';
import { useDocumentDetail } from '../../components/documents/hooks/useDocumentDetail';
import ConfirmationDialog from '../../components/common/dialogbox/ConfirmationDialog';

/**
 * DocumentDetail - High-fidelity page for individual candidate document collection.
 * Standardized entry point mirroring the structure of DocumentList and other enterprise modules.
 */
const DocumentDetail: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const theme = useTheme();
	const dispatch = useDispatch<AppDispatch>();
	const {
		candidate,
		error,
		uploading,
		filteredRequiredDocs,
		uploadedCount,
		handleFileUpload,
		handleDelete,
		confirmDelete,
		cancelDelete,
		deleteDialogOpen,
		isDeleting,
		handlePreview,
		handleDownload,
		getDocumentForType
	} = useDocumentDetail(id);

	return (
		<Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			{/* High-fidelity Module Header */}
			<DocumentHeader candidate={candidate} onBack={() => navigate(-1)}>
				<DocumentProgressBar
					uploadedCount={uploadedCount}
					totalRequired={filteredRequiredDocs.length}
				/>
			</DocumentHeader>

			<Container maxWidth="xl" sx={{ mt: -5, pb: 6 }}>
				<Box sx={{ width: '100%' }}>
					{/* Error Notifications */}
					{error && (
						<Alert 
							severity="error" 
							sx={{ 
								mb: 3, 
								borderRadius: 1,
								bgcolor: alpha(theme.palette.error.main, 0.05),
								borderColor: alpha(theme.palette.error.main, 0.2),
								border: '1px solid'
							}} 
							onClose={() => dispatch(clearError())}
						>
							{error}
						</Alert>
					)}

					{/* Document Grid */}
					<Grid container spacing={3}>
						{filteredRequiredDocs.map((docType: RequiredDocument) => (
							<Grid size={{ xs: 12, md: 6, lg: 4 }} key={docType.type}>
								<DocumentCard
									docType={docType}
									existingDoc={getDocumentForType(docType.type)}
									uploading={uploading}
									onUpload={handleFileUpload}
									onPreview={handlePreview}
									onDelete={handleDelete}
									onDownload={handleDownload}
								/>
							</Grid>
						))}
					</Grid>
				</Box>
			</Container>

			<ConfirmationDialog
				open={deleteDialogOpen}
				onClose={cancelDelete}
				onConfirm={confirmDelete}
				title="Confirm Deletion"
				message="Are you sure you want to delete this document? This action cannot be undone."
				confirmLabel="Delete"
				severity="error"
				loading={isDeleting}
			/>
		</Box>
	);
};

export default DocumentDetail;
