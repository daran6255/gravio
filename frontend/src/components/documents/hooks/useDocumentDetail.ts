import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
	fetchCandidateById,
	fetchDocuments, 
	uploadDocument, 
	deleteDocument,
	downloadDocument
} from '../../../store/slices/candidateSlice';
import { REQUIRED_DOCUMENTS, type RequiredDocument } from '../forms/documentConfig';
import type { CandidateDocument } from '../../../models/candidate';

/**
 * useDocumentDetail - Modular hook for managing candidate document collection.
 * Powered by Redux store slices for state management, avoiding direct service dependencies.
 */
export const useDocumentDetail = (id?: string) => {
	const dispatch = useAppDispatch();
	
	// State from Candidate Slice
	const { selectedCandidate: candidate, error } = useAppSelector((state) => state.candidates);
	const documents = candidate?.documents || [];
	
	const [uploading, setUploading] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchInitialData = useCallback(() => {
		if (id) {
			dispatch(fetchCandidateById({ publicId: id }));
			dispatch(fetchDocuments(id));
		}
	}, [id, dispatch]);

	useEffect(() => {
		fetchInitialData();
	}, [fetchInitialData]);

	// Logic: Compliance Filtering
	const filteredRequiredDocs = REQUIRED_DOCUMENTS.filter((doc: RequiredDocument) => {
		if (doc.roles?.includes('disabled') && candidate?.disability_details?.disability_type === 'None') return false;
		return true;
	});

	const uploadedCount = filteredRequiredDocs.filter((req: RequiredDocument) => {
		if (req.type === 'trainer_resume') {
			return documents.some((d: CandidateDocument) => d.document_type === 'resume' && d.document_source === 'trainer');
		}
		if (req.type === 'resume') {
			return documents.some((d: CandidateDocument) => d.document_type === 'resume' && d.document_source === 'candidate');
		}
		return documents.some((d: CandidateDocument) => d.document_type === req.type);
	}).length;

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
		const file = event.target.files?.[0];
		if (file && id) {
			setUploading(type);
			try {
				const documentSource = type === 'trainer_resume' ? 'trainer' : 'candidate';
				const backendType = type === 'trainer_resume' ? 'resume' : type;
				
				await dispatch(uploadDocument({ 
					publicId: id, 
					documentType: backendType as any, 
					file, 
					description: '',
					documentSource 
				})).unwrap();
			} catch (err) {
				console.error('Upload failed:', err);
			} finally {
				setUploading(null);
			}
		}
	};

	const handleDelete = (documentId: number) => {
		setDeletingDocumentId(documentId);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (deletingDocumentId && id) {
			setIsDeleting(true);
			try {
				await dispatch(deleteDocument({ publicId: id, documentId: deletingDocumentId })).unwrap();
				setDeleteDialogOpen(false);
				setDeletingDocumentId(null);
			} catch (err) {
				console.error('Delete failed:', err);
			} finally {
				setIsDeleting(false);
			}
		}
	};

	const cancelDelete = () => {
		setDeleteDialogOpen(false);
		setDeletingDocumentId(null);
	};

	/**
	 * handlePreview - Generates an authenticated preview URL using state-managed tokens.
	 */
	const handlePreview = async (documentId: number) => {
		try {
			const blob = await dispatch(downloadDocument({ documentId })).unwrap();
			const url = window.URL.createObjectURL(blob as any);
			window.open(url, '_blank');
			setTimeout(() => window.URL.revokeObjectURL(url), 1000);
		} catch (error) {
			console.error('Failed to preview document:', error);
		}
	};

	/**
	 * handleDownload - Generates an authenticated download link using state-managed tokens.
	 */
	const handleDownload = async (documentId: number) => {
		try {
			const blob = await dispatch(downloadDocument({ documentId })).unwrap();
			const url = window.URL.createObjectURL(blob as any);
			const doc = documents.find(d => d.id === documentId);
			
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', doc?.document_name || `document_${documentId}.pdf`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Failed to download document:', error);
		}
	};

	const getDocumentForType = (type: string) => {
		if (type === 'trainer_resume') {
			return documents.find((d: CandidateDocument) => d.document_type === 'resume' && d.document_source === 'trainer');
		}
		if (type === 'resume') {
			return documents.find((d: CandidateDocument) => d.document_type === 'resume' && d.document_source === 'candidate');
		}
		return documents.find((d: CandidateDocument) => d.document_type === type);
	};

	return {
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
	};
};
