import React from 'react';
import {
	Typography,
	Box,
	Dialog,
	DialogTitle,
	DialogContent,
	IconButton,
	Grid,
	Stack,
	Divider,
	Paper,
	Chip,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
	getActionColor,
	getRelativeTime,
	humanizeResourceType,
	getResourceName,
	formatValue,
	getActivityNarrative,
} from './ActivityHelpers';
import MetadataTable from './MetadataTable';
import type { ActivityLog } from '../../models/activitylogs';
import type { User } from '../../models/user';

interface ActivityModalProps {
	open: boolean;
	onClose: () => void;
	selectedLog: ActivityLog | null;
	getUserDisplay: (userId: number | null | undefined) => string;
	userCache: Record<number, User>;
}

const ActivityModal: React.FC<ActivityModalProps> = ({
	open,
	onClose,
	selectedLog,
	getUserDisplay,
}) => {
	if (!selectedLog) return null;

	const actionType = selectedLog.actionType.toUpperCase();

	// Logic to determine what details to show
	const renderDetails = () => {
		// Try to find structured changes (before/after)
		let data = selectedLog.metadata?.changes || (selectedLog as any).changes || selectedLog.metadata;

		if (typeof data === 'string') {
			try {
				data = JSON.parse(data);
			} catch (e) {
				// Not dynamic JSON
			}
		}

		// 1. Check for Before/After changes (Diff View)
		const hasDiff = data && typeof data === 'object' && ('before' in data || 'after' in data);

		if (hasDiff) {
			const before = (data as any).before as Record<string, any>;
			const after = (data as any).after as Record<string, any>;
			const allFields = [...new Set([...Object.keys(before || {}), ...Object.keys(after || {})])];

			if (allFields.length > 0) {
				return (
					<Box sx={{ mt: 2 }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
							Field Changes
						</Typography>

						<TableContainer sx={{ border: '1px solid #d5dbdb', borderRadius: 0 }}>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa', width: '30%', py: 1.5, borderBottom: '1px solid #d5dbdb' }}>
											Field
										</TableCell>
										<TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa', width: '35%', py: 1.5, borderBottom: '1px solid #d5dbdb' }}>
											Previous Value
										</TableCell>
										<TableCell sx={{ fontWeight: 600, bgcolor: '#fafafa', width: '35%', py: 1.5, borderBottom: '1px solid #d5dbdb' }}>
											Updated Value
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{allFields.map((field, index) => (
										<TableRow key={index} sx={{ '&:hover': { bgcolor: '#f5f8fa' }, '& td': { borderBottom: '1px solid #d5dbdb' }, '&:last-child td': { borderBottom: 0 } }}>
											<TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2, textTransform: 'capitalize' }}>
												{field.replace(/_/g, ' ')}
											</TableCell>
											<TableCell sx={{ py: 2, color: 'error.main', bgcolor: 'rgba(214, 51, 132, 0.04)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
												{formatValue(before?.[field])}
											</TableCell>
											<TableCell sx={{ py: 2, color: 'success.main', bgcolor: 'rgba(29, 129, 2, 0.04)', fontWeight: 500, fontFamily: 'monospace', fontSize: '0.875rem' }}>
												{formatValue(after?.[field])}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					</Box>
				);
			}
		}

		// 2. Generic Record Details (Flat View) - for CREATE, DELETE, LOGIN or simple UPDATEs
		const title = actionType === 'CREATE' ? 'New Record Details' :
			actionType === 'LOGIN' ? 'Login Details' :
				'Activity Details';

		return (
			<MetadataTable
				data={data || {}}
				title={title}
			/>
		);
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			scroll="paper"
			sx={{
				'& .MuiDialog-paper': {
					borderRadius: 0,
					border: '1px solid #d5dbdb',
					boxShadow: 'none',
				},
			}}
		>
			{/* Dialog Title/Header */}
			<DialogTitle sx={{ bgcolor: '#232f3e', color: '#ffffff', py: 2 }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<Box>
						<Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
							Activity Details
						</Typography>
						<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
							{getUserDisplay(selectedLog.userId)} • {getRelativeTime(selectedLog.createdAt)}
						</Typography>
					</Box>
					<IconButton onClick={onClose} size="small" sx={{ color: '#ffffff' }}>
						<CloseIcon />
					</IconButton>
				</Box>
			</DialogTitle>

			{/* Dialog Content */}
			<DialogContent sx={{ p: 0, bgcolor: '#f2f3f3' }}>
				<Box sx={{ p: 4 }}>
					{/* Activity Overview Card */}
					<Paper
						elevation={0}
						sx={{
							p: 3,
							mb: 4,
							borderRadius: 0,
							border: '1px solid #d5dbdb',
							bgcolor: '#ffffff'
						}}
					>
						<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#232f3e' }}>
							Activity Overview
						</Typography>
						<Typography variant="body2" sx={{ mb: 3, p: 2, bgcolor: '#f3faff', border: '1px solid #d0e7f9', borderRadius: 0, fontWeight: 500, color: '#005fb8' }}>
							{getActivityNarrative(selectedLog, getUserDisplay(selectedLog.userId))}
						</Typography>
						<Grid container spacing={3}>
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Stack spacing={0.5}>
									<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
										Performed By
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 500 }}>
										{getUserDisplay(selectedLog.userId)}
									</Typography>
								</Stack>
							</Grid>
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Stack spacing={0.5}>
									<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
										Action Type
									</Typography>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<Chip
											label={selectedLog.actionType}
											color={getActionColor(selectedLog.actionType)}
											size="small"
											sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
										/>
									</Box>
								</Stack>
							</Grid>
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Stack spacing={0.5}>
									<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
										Target Area
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 500 }}>
										{humanizeResourceType(selectedLog.resourceType)}
									</Typography>
								</Stack>
							</Grid>
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Stack spacing={0.5}>
									<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
										Record Reference
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
										{selectedLog.resourceId ? `#${selectedLog.resourceId}` : '—'}
									</Typography>
								</Stack>
							</Grid>
							{getResourceName(selectedLog) && (
								<Grid size={{ xs: 12, sm: 12, md: 6 }}>
									<Stack spacing={0.5}>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
											Affected Record
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
											{getResourceName(selectedLog)}
										</Typography>
									</Stack>
								</Grid>
							)}
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Stack spacing={0.5}>
									<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
										Method
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
										{selectedLog.method || '—'}
									</Typography>
								</Stack>
							</Grid>
							<Grid size={{ xs: 12, sm: 6, md: 3 }}>
								<Stack spacing={0.5}>
									<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
										Status
									</Typography>
									<Typography
										variant="body2"
										sx={{
											fontWeight: 600,
											color: selectedLog.statusCode && selectedLog.statusCode < 400 ? 'success.main' : 'error.main'
										}}
									>
										{selectedLog.statusCode || '—'} {selectedLog.statusCode && selectedLog.statusCode < 400 ? '(Success)' : '(Error)'}
									</Typography>
								</Stack>
							</Grid>
						</Grid>
					</Paper>

					<Divider sx={{ mb: 4 }} />

					{/* Detailed Information Section */}
					<Box sx={{ pb: 4 }}>
						{renderDetails()}
					</Box>
				</Box>
			</DialogContent>
		</Dialog>
	);
};

export default ActivityModal;
