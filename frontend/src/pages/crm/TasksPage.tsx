import React, { useState, useEffect } from 'react';
import { Box, Container, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { ViewWeek, ViewList, TableChart } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import { ActivityFeedFilters, TaskKanbanBoard, TaskList, TaskTable, TasksStatsPanel, useActivityFeed } from '../../components/crm';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDeals, fetchAllDealTasks } from '../../store/slices/crmSlice';

/**
 * CRM Tasks Page — a unified page to manage tasks, calls, meetings, and to-dos
 * across every CRM entity in either a Kanban board view or list timeline view.
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
	const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'table'>('kanban');

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
			<Container maxWidth={false} sx={{ py: { xs: 2, sm: 4 }, px: { md: 4 } }}>
				<PageHeader
					title="Tasks"
					subtitle="Manage and track your CRM tasks, calls, meetings, and to-dos"
					action={
						<ToggleButtonGroup
							value={viewMode}
							exclusive
							onChange={(_, mode) => mode && setViewMode(mode)}
							size="small"
							sx={{
								bgcolor: 'background.paper',
								border: '1px solid',
								borderColor: 'divider',
								borderRadius: '10px',
								'& .MuiToggleButton-root': {
									textTransform: 'none',
									fontWeight: 700,
									px: 2,
									border: 'none',
									borderRadius: '8px',
									'&.Mui-selected': {
										bgcolor: 'primary.main',
										color: '#ffffff',
										'&:hover': {
											bgcolor: 'primary.dark',
										}
									}
								}
							}}
						>
							<ToggleButton value="kanban" aria-label="Kanban Board">
								<ViewWeek sx={{ mr: 1, fontSize: 16 }} />
								Kanban
							</ToggleButton>
							<ToggleButton value="list" aria-label="List Feed">
								<ViewList sx={{ mr: 1, fontSize: 16 }} />
								List
							</ToggleButton>
							<ToggleButton value="table" aria-label="Table View">
								<TableChart sx={{ mr: 1, fontSize: 16 }} />
								Table
							</ToggleButton>
						</ToggleButtonGroup>
					}
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

				{viewMode === 'kanban' ? (
					<TaskKanbanBoard
						tasks={filteredTasks}
						loading={allDealTasksLoading}
						owners={owners}
					/>
				) : viewMode === 'list' ? (
					<TaskList
						tasks={filteredTasks}
						loading={allDealTasksLoading}
						owners={owners}
					/>
				) : (
					<TaskTable
						tasks={filteredTasks}
						loading={allDealTasksLoading}
					/>
				)}
			</Container>
		</Box>
	);
};

export default TasksPage;
