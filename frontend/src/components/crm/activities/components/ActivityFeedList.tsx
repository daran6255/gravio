import React from 'react';
import { Paper, Box } from '@mui/material';
import CustomTablePagination from '../../../common/table/CustomTablePagination';
import { ActivityTimeline } from '../../shared';
import type { CRMActivity } from '../../../../models/crm/crmActivity';

interface ActivityFeedListProps {
	activities: CRMActivity[];
	loading: boolean;
	totalCount: number;
	page: number;
	rowsPerPage: number;
	onPageChange: (event: unknown, newPage: number) => void;
	onRowsPerPageChange: (newRowsPerPage: number) => void;
}

export const ActivityFeedList: React.FC<ActivityFeedListProps> = ({
	activities,
	loading,
	totalCount,
	page,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
}) => {
	return (
		<Paper sx={{ borderRadius: '20px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
			<Box sx={{ p: 2 }}>
				<ActivityTimeline activities={activities} loading={loading} showEntityType />
			</Box>
			<CustomTablePagination
				count={totalCount}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={onPageChange}
				onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
				onRowsPerPageSelectChange={onRowsPerPageChange}
			/>
		</Paper>
	);
};

export default ActivityFeedList;
