import React, { useEffect } from 'react';
import { Box, Container } from '@mui/material';
import { responsiveStyles } from '../../theme';
import PageHeader from '../../components/common/page-header';
import { ActivityFeedFilters, TaskKanbanBoard, TasksStatsPanel, useActivityFeed } from '../../components/crm';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDeals, fetchAllDealTasks } from '../../store/slices/crmSlice';

/**
 * CRM Tasks Page — a unified page to manage tasks, calls, meetings, and to-dos
 * across every CRM entity in a Kanban board view.
 */
const TasksPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const {
		owners,
		ownerId,
		dateFrom,
		dateTo,
		handleOwnerChange,
		handleDateFromChange,
		handleDateToChange,
	} = useActivityFeed();

	const { deals, allDealTasks, allDealTasksLoading } = useAppSelector((state) => state.crm);

	// Load all deals on mount
	useEffect(() => {
		dispatch(fetchDeals());
	}, [dispatch]);

	// When deals are loaded, fetch tasks for each deal in parallel
	useEffect(() => {
		if (deals.length > 0) {
			dispatch(fetchAllDealTasks(deals));
		}
	}, [dispatch, deals]);

	// Filter tasks on client-side based on the header filters selection
	const filteredTasks = allDealTasks.filter((task) => {
		// Filter by owner (assignee_id)
		if (ownerId !== '' && task.assignee_id !== ownerId) {
			return false;
		}
		// Filter by Date range
		if (task.due_date) {
			const taskDate = new Date(task.due_date);
			if (dateFrom && taskDate < new Date(dateFrom)) {
				return false;
			}
			if (dateTo) {
				// Set dateTo to end of day to include all tasks due on that day
				const endOfToDate = new Date(dateTo);
				endOfToDate.setHours(23, 59, 59, 999);
				if (taskDate > endOfToDate) {
					return false;
				}
			}
		} else if (dateFrom || dateTo) {
			return false;
		}
		return true;
	});

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<PageHeader
					title="Tasks"
					subtitle="Manage and track your CRM tasks, calls, meetings, and to-dos"
				/>

				<TasksStatsPanel tasks={allDealTasks} />

				<ActivityFeedFilters
					type="" // Type selection not needed as these are all tasks
					onTypeChange={() => {}}
					ownerId={ownerId}
					onOwnerChange={handleOwnerChange}
					owners={owners}
					dateFrom={dateFrom}
					onDateFromChange={handleDateFromChange}
					dateTo={dateTo}
					onDateToChange={handleDateToChange}
					hideType={true}
				/>

				<TaskKanbanBoard
					tasks={filteredTasks}
					loading={allDealTasksLoading}
					owners={owners}
				/>
			</Container>
		</Box>
	);
};

export default TasksPage;
