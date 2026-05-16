import React from 'react';
import {
	Button,
	Box,
	Typography,
	Divider
} from '@mui/material';
import {
	Add as AddIcon
} from '@mui/icons-material';
import DSRItemRow from './DSRItemRow';
import type { DSRItem, DSRProject, DSRActivity, DSRActivityType } from '../../../../models/dsr';
import { GENERAL_PROJECT_ID } from '../hooks/useDSRSubmission';

interface SubmissionFormProps {
	items: Partial<DSRItem>[];
	projects: DSRProject[];
	activitiesByProject: Record<string, DSRActivity[]>;
	activityTypes: DSRActivityType[];
	loading: boolean;
	onRowChange: (index: number, field: keyof DSRItem, value: any) => void;
	onAddRow: () => void;
	onRemoveRow: (index: number) => void;
	showTitle?: boolean;
	readOnly?: boolean;
	reportDate: string;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({
	items,
	projects,
	activitiesByProject,
	activityTypes,
	loading,
	onRowChange,
	onAddRow,
	onRemoveRow,
	showTitle = true,
	readOnly = false,
	reportDate
}) => {
	const totalHours = items.reduce((acc, item) => acc + (item.hours || 0), 0);

	return (
		<Box>
			{showTitle && (
				<Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
					<Typography variant="h6" sx={{ fontWeight: 700, color: '#232f3e', letterSpacing: '-0.01em' }}>
						Activity Details
					</Typography>
					<Typography variant="caption" sx={{ fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
						Total: {totalHours.toFixed(1)} hrs
					</Typography>
				</Box>
			)}

			<Box sx={{
				borderRadius: '4px',
				border: '1px solid #d5dbdb',
				bgcolor: 'white',
				boxShadow: '0 1px 1px 0 rgba(0,0,0,0.05)',
				overflow: 'hidden'
			}}>
				{/* Desktop Header - Precision Logic */}
				<Box sx={{ 
					display: { xs: 'none', lg: 'grid' },
					gridTemplateColumns: 'minmax(120px, 1.2fr) minmax(120px, 1.2fr) minmax(150px, 2fr) 300px 40px',
					bgcolor: '#f3f3f3', 
					borderBottom: '1px solid #d5dbdb',
					px: 2,
					py: 1,
					gap: 2,
					alignItems: 'center'
				}}>
					<Typography sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#545b64' }}>Project</Typography>
					<Typography sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#545b64' }}>Activity</Typography>
					<Typography sx={{ fontWeight: 600, fontSize: '0.7rem', color: '#545b64' }}>Description</Typography>
					
					<Box sx={{ display: 'flex', width: '300px', gap: 1, justifyContent: 'space-between' }}>
						<Typography sx={{ fontWeight: 600, width: '120px', fontSize: '0.7rem', color: '#545b64', textAlign: 'center' }}>Start</Typography>
						<Typography sx={{ fontWeight: 600, width: '120px', fontSize: '0.7rem', color: '#545b64', textAlign: 'center' }}>End</Typography>
						<Typography sx={{ fontWeight: 600, width: '50px', fontSize: '0.7rem', color: '#545b64', textAlign: 'center' }}>Hrs</Typography>
					</Box>
					
					<Box sx={{ width: '40px' }} /> {/* Delete placeholder */}
				</Box>

				{/* Rows Container */}
				<Box sx={{
					display: 'flex',
					flexDirection: 'column'
				}}>
					{items.map((item, index) => (
						<React.Fragment key={index}>
							<DSRItemRow
								index={index}
								item={item}
								projects={projects}
								activityTypes={activityTypes}
								activities={item.project_public_id && item.project_public_id !== GENERAL_PROJECT_ID ? (activitiesByProject[item.project_public_id] || []) : []}
								loading={loading}
								onRowChange={onRowChange}
								onRemoveRow={onRemoveRow}
								isDeleteDisabled={items.length === 1}
								readOnly={readOnly}
								reportDate={reportDate}
							/>
							{index < items.length - 1 && <Divider sx={{ borderColor: '#f3f3f3' }} />}
						</React.Fragment>
					))}
				</Box>

				{/* Footer Actions */}
				<Box sx={{
					p: 1.5,
					bgcolor: '#fafafa',
					borderTop: '1px solid #d5dbdb'
				}}>
					{!readOnly && (() => {
						const lastItem = items[items.length - 1];
						const isGeneral = lastItem?.project_public_id === GENERAL_PROJECT_ID;
						const isCategory = lastItem?.project_public_id?.startsWith('category:');

						const hasProject = !!lastItem?.project_public_id;
						const hasDescription = !!lastItem?.description && lastItem.description.trim().length > 0;
						const hasTime = !!lastItem?.start_time && !!lastItem?.end_time && (lastItem.hours || 0) > 0;

						let isCategorized = false;
						if (isGeneral || isCategory) {
							isCategorized = !!lastItem?.activity_type_name;
						} else {
							isCategorized = !!lastItem?.activity_public_id || (!!lastItem?.activity_name_other && lastItem.activity_name_other.trim() !== '');
						}

						const isLastRowComplete = hasProject && isCategorized && hasDescription && hasTime;

						return (
							<Button
								startIcon={<AddIcon />}
								onClick={onAddRow}
								disabled={!isLastRowComplete}
								variant="text"
								sx={{
									color: isLastRowComplete ? '#ec7211' : '#aab7bd',
									fontWeight: 700,
									fontSize: '0.8125rem',
									textTransform: 'none',
									py: 0.5,
									px: 1.5,
									'&:hover': {
										bgcolor: 'rgba(236,114,17,0.05)',
										color: '#d4660f'
									},
									'&.Mui-disabled': { color: '#d5dbdb' }
								}}
							>
								Add Activity Row
							</Button>
						);
					})()}
				</Box>
			</Box>
			<Box sx={{ mt: 1 }} />
		</Box >
	);
};

export default SubmissionForm;
