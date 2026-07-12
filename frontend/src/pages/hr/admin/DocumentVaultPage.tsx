import React, { useState, useEffect } from 'react';
import { Box, Container, Stack, Skeleton, Button, alpha, useTheme } from '@mui/material';
import { CloudUploadOutlined as UploadIcon } from '@mui/icons-material';
import PageHeader from '../../../components/common/page-header';
import { responsiveStyles } from '../../../theme';
import { fetchDocuments, fetchEmployees } from '../../../store/slices/hrSlice';
import useToast from '../../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
	DocumentStatsBar,
	ExpiringSoonBanner,
	DocumentsTable,
	UploadDocumentDialog,
} from '../../../components/hr/admin/documents';

const DocumentVaultPage: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { error } = useToast();
	const currentUser = useAppSelector((state) => state.auth.user);
	const isHRManager = currentUser?.role === 'admin' || currentUser?.role === 'hr_admin' || currentUser?.role === 'hr_manager';
	const isHRViewer = isHRManager || currentUser?.role === 'leadership';

	const { documents, documentsLoading: loading, employees } = useAppSelector((state) => state.hr);

	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

	const loadDocuments = () => {
		dispatch(fetchDocuments(undefined)).unwrap().catch(() => error('Failed to load documents'));
		if (isHRViewer) {
			dispatch(fetchEmployees({ limit: 100 }));
		}
	};

	useEffect(() => {
		loadDocuments();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<Stack spacing={3}>
					<PageHeader
						title="Document Vault"
						subtitle="Securely store, verify, and track employee identity and compliance documents."
						action={
							<Button
								variant="contained"
								startIcon={<UploadIcon />}
								onClick={() => setUploadDialogOpen(true)}
								sx={{
									borderRadius: '10px', px: 2.5, fontWeight: 700, textTransform: 'none', color: 'white',
									boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
									background: theme.gradients.brand,
									'&:hover': { boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.35)}` },
								}}
							>
								Upload Document
							</Button>
						}
					/>

					{loading ? (
						<Stack spacing={3}>
							<Skeleton variant="rounded" height={120} />
							<Skeleton variant="rounded" height={320} />
						</Stack>
					) : (
						<Stack spacing={3}>
							<DocumentStatsBar documents={documents} />
							<ExpiringSoonBanner documents={documents} />
							<DocumentsTable
								documents={documents}
								loading={loading}
								canManage={isHRManager}
								onUploadClick={() => setUploadDialogOpen(true)}
							/>
						</Stack>
					)}

					<UploadDocumentDialog
						open={uploadDialogOpen}
						onClose={() => setUploadDialogOpen(false)}
						onUploaded={loadDocuments}
						employees={employees}
						canUploadForOthers={isHRManager}
					/>
				</Stack>
			</Container>
		</Box>
	);
};

export default DocumentVaultPage;
