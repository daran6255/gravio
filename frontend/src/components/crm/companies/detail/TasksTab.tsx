import React from 'react';
import { Box, TableRow, TableCell, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createCRMTask, updateCRMTask } from '../../../../store/slices/crmTaskSlice';
import { fetchCompanyById } from '../../../../store/slices/companySlice';
import DataTable from '../../../common/table/DataTable';
import CRMTaskFormDialog from '../../tasks/CRMTaskFormDialog';
import type { Company } from '../../../../models/company';
import type { CRMTask } from '../../../../models/crmTask';

interface TasksTabProps {
	company: Company;
	columns: any[];
}

const TasksTab: React.FC<TasksTabProps> = ({ company, columns }) => {
	const dispatch = useAppDispatch();
	const { publicId } = useParams<{ publicId: string }>();
	const { loading } = useAppSelector((state) => state.crmTasks);

	const [dialogOpen, setDialogOpen] = React.useState(false);
	const [selectedTask, setSelectedTask] = React.useState<CRMTask | null>(null);

	const handleAddTask = () => {
		setSelectedTask(null);
		setDialogOpen(true);
	};

	const handleEditTask = (task: CRMTask) => {
		setSelectedTask(task);
		setDialogOpen(true);
	};

	const handleDialogSubmit = async (data: any) => {
		try {
			if (selectedTask) {
				await dispatch(updateCRMTask({ publicId: selectedTask.public_id, task: data })).unwrap();
			} else {
				// Pre-fill association if creating from company tab
				const taskData = {
					...data,
					related_to_type: 'company',
					related_to_id: company.id
				};
				await dispatch(createCRMTask(taskData)).unwrap();
			}
			setDialogOpen(false);
			// Refresh company to show new task
			if (publicId) dispatch(fetchCompanyById(publicId));
		} catch (error) {
			console.error('Failed to save task:', error);
		}
	};

	return (
		<Box>
			<DataTable
				columns={columns}
				data={company.tasks || []}
				totalCount={company.tasks?.length || 0}
				page={0}
				rowsPerPage={100}
				onPageChange={() => { }}
				onRowsPerPageChange={() => { }}
				searchTerm=""
				onCreateClick={handleAddTask}
				createButtonText="Add New Task"
				canCreate={true}
				emptyMessage="No tasks associated with this company."
				headerActions={
					<Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
						Tasks ({company.tasks?.length || 0})
					</Typography>
				}
				renderRow={(row: any) => (
					<TableRow 
						key={row.id || row.public_id}
						onClick={() => handleEditTask(row)}
						sx={{ cursor: 'pointer' }}
					>
						{columns.map((col: any) => (
							<TableCell key={col.id} align={col.align}>
								{col.format ? col.format(row[col.id], row) : (row[col.id] || '—')}
							</TableCell>
						))}
					</TableRow>
				)}
			/>

			<CRMTaskFormDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onSubmit={handleDialogSubmit}
				task={selectedTask}
				initialData={{
					related_to_type: 'company',
					related_to_id: company.id
				}}
				loading={loading}
			/>
		</Box>
	);
};

export default TasksTab;
