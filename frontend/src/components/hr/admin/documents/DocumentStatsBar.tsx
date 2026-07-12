import React, { useMemo } from 'react';
import { Grid } from '@mui/material';
import {
	FolderOpenOutlined as TotalIcon,
	VerifiedOutlined as VerifiedIcon,
	PendingActionsOutlined as PendingIcon,
	EventBusyOutlined as ExpiringIcon,
} from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';
import type { HREmployeeDocument } from '../../../../models/hr';

interface DocumentStatsBarProps {
	documents: HREmployeeDocument[];
}

const DocumentStatsBar: React.FC<DocumentStatsBarProps> = ({ documents }) => {
	const statsCards = useMemo(() => {
		const total = documents.length;
		const verified = documents.filter((d) => d.is_verified).length;
		const pending = total - verified;

		const today = new Date();
		const in30Days = new Date();
		in30Days.setDate(today.getDate() + 30);
		const expiringSoon = documents.filter((d) => {
			if (!d.expiry_date) return false;
			const exp = new Date(d.expiry_date);
			return exp >= today && exp <= in30Days;
		}).length;

		return [
			{
				title: 'TOTAL DOCUMENTS',
				value: `${total}`,
				subtitle: 'Across all employees',
				icon: <TotalIcon sx={{ color: '#8B7CF6', fontSize: 26 }} />,
				color: '#8B7CF6',
				tooltip: 'Every document currently stored in the vault.',
			},
			{
				title: 'VERIFIED',
				value: `${verified}`,
				subtitle: total ? `${Math.round((verified / total) * 100)}% of vault` : 'No documents yet',
				icon: <VerifiedIcon sx={{ color: '#10B981', fontSize: 26 }} />,
				color: '#10B981',
				tooltip: 'Documents an HR admin/manager has confirmed as verified.',
			},
			{
				title: 'PENDING VERIFICATION',
				value: `${pending}`,
				subtitle: 'Awaiting HR review',
				icon: <PendingIcon sx={{ color: '#F59E0B', fontSize: 26 }} />,
				color: '#F59E0B',
				tooltip: 'Documents uploaded but not yet verified.',
			},
			{
				title: 'EXPIRING SOON',
				value: `${expiringSoon}`,
				subtitle: 'Within the next 30 days',
				icon: <ExpiringIcon sx={{ color: '#EF4444', fontSize: 26 }} />,
				color: '#EF4444',
				tooltip: 'Documents with an expiry date in the next 30 days that need renewal.',
			},
		];
	}, [documents]);

	return (
		<Grid container spacing={3}>
			{statsCards.map((card, idx) => (
				<Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
					<StatCard {...card} />
				</Grid>
			))}
		</Grid>
	);
};

export default DocumentStatsBar;
