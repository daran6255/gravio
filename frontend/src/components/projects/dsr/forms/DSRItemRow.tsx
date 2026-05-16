import React from 'react';
import {
	Autocomplete,
	TextField,
	Typography,
	IconButton,
	Box,
	useTheme,
	useMediaQuery,
	Tooltip
} from '@mui/material';
import {
	Delete as DeleteIcon,
	Work as ProjectIcon,
	EditNote as EditIcon,
	AccessTime as TimeIcon,
	Description as DescriptionIcon,
	Timer as TimerIcon
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import type { DSRItem, DSRProject, DSRActivity, DSRActivityType } from '../../../../models/dsr';
import { GENERAL_PROJECT_ID } from '../hooks/useDSRSubmission';

interface DSRItemRowProps {
	index: number;
	item: Partial<DSRItem>;
	projects: DSRProject[];
	activityTypes: DSRActivityType[];
	activities: DSRActivity[];
	loading: boolean;
	onRowChange: (index: number, field: keyof DSRItem, value: any) => void;
	onRemoveRow: (index: number) => void;
	isDeleteDisabled: boolean;
	readOnly?: boolean;
	reportDate: string;
}

const OTHER_ID = '__other__';

const OTHER_ACTIVITY: Partial<DSRActivity> = {
	public_id: OTHER_ID,
	name: 'Other (Specify...)'
};

const DSRItemRow: React.FC<DSRItemRowProps> = ({
	index,
	item,
	projects,
	activityTypes,
	activities,
	onRowChange,
	onRemoveRow,
	isDeleteDisabled,
	readOnly = false,
	reportDate
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

	const isCategoryProject = item.project_public_id?.startsWith('category:');
	const categoryName = isCategoryProject ? item.project_public_id?.split(':')[1] : null;

	const activityOptions = React.useMemo(() => {
		if (isCategoryProject) {
			return activityTypes.filter(at => at.category === categoryName);
		}
		const filtered = activities.filter(a => {
			if (a.public_id === item.activity_public_id) return true;
			if (!a.is_active || a.status === 'cancelled') return false;
			if (a.start_date && a.start_date > reportDate) return false;
			if (a.status === 'completed') {
				const endDate = a.actual_end_date || a.end_date;
				if (endDate && reportDate > endDate) return false;
			}
			return true;
		});
		return [...filtered, OTHER_ACTIVITY as DSRActivity];
	}, [activities, reportDate, item.activity_public_id, isCategoryProject, categoryName, activityTypes]);

	const selectedProject = React.useMemo(() => {
		if (!item.project_public_id) return null;
		if (item.project_public_id === GENERAL_PROJECT_ID) {
			const project = projects.find(p => p.public_id === GENERAL_PROJECT_ID);
			if (project) return project;
			return { public_id: GENERAL_PROJECT_ID, name: 'General / Internal Work' } as DSRProject;
		}
		return projects.find(p => p.public_id === item.project_public_id) || null;
	}, [item.project_public_id, projects]);

	const isOtherActivity = (item.activity_name_other !== undefined && item.activity_name_other !== null);
	const isGeneralProject = item.project_public_id === GENERAL_PROJECT_ID;

	const selectedActivityOption = React.useMemo(() => {
		if (isCategoryProject) {
			return activityOptions.find(at => at.name === item.activity_type_name) || null;
		}
		if (isOtherActivity) return OTHER_ACTIVITY;
		return activities.find(a => a.public_id === item.activity_public_id) || null;
	}, [isCategoryProject, isOtherActivity, item.activity_type_name, item.activity_public_id, activityOptions, activities]);

	const textFieldStyles = {
		'& .MuiOutlinedInput-root': {
			borderRadius: '4px',
			bgcolor: readOnly ? '#f9fafb' : 'white',
			transition: 'all 0.2s',
			'&:hover .MuiOutlinedInput-notchedOutline': {
				borderColor: readOnly ? '#d1d5db' : '#9ca3af',
			},
			'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
				borderColor: '#ec7211',
				borderWidth: '1.5px'
			}
		},
		'& .MuiOutlinedInput-input': {
			fontSize: '0.875rem',
			py: '10px'
		}
	};

	const MobileLabel = ({ label, icon }: { label: string, icon: React.ReactNode }) => (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, color: '#4b5563' }}>
			{icon}
			<Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.025em' }}>{label}</Typography>
		</Box>
	);

	if (isMobile) {
		return (
			<Box sx={{ 
				p: { xs: 2.5, sm: 3 }, 
				borderBottom: '1px solid #e5e7eb',
				bgcolor: 'white',
				'&:hover': { bgcolor: '#f9fafb' }
			}}>
				{/* Context Selection - Stacked on Mobile */}
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 3 }}>
					<Box>
						<MobileLabel label="Project" icon={<ProjectIcon sx={{ fontSize: 16, color: '#6b7280' }} />} />
						{readOnly ? (
							<Typography variant="body2" sx={{ fontWeight: 600, py: 1, color: '#111827' }}>{selectedProject?.name || item.project_name || '-'}</Typography>
						) : (
							<Autocomplete
								options={projects}
								getOptionLabel={(option) => option.name || ''}
								groupBy={(option: any) => option.group}
								value={selectedProject}
								onChange={(_, val) => onRowChange(index, 'project_public_id', val?.public_id || null)}
								renderInput={(params) => <TextField {...params} size="small" placeholder="Select Project" sx={textFieldStyles} />}
							/>
						)}
					</Box>
					<Box>
						<MobileLabel label="Activity" icon={<EditIcon sx={{ fontSize: 16, color: '#6b7280' }} />} />
						{isGeneralProject ? (
							<Typography variant="body2" color="text.secondary" sx={{ py: 1, fontStyle: 'italic', fontSize: '0.875rem' }}>Not Applicable for General tasks</Typography>
						) : readOnly ? (
							<Typography variant="body2" sx={{ py: 1, color: '#111827' }}>{isOtherActivity ? item.activity_name_other : (selectedActivityOption?.name || '-')}</Typography>
						) : (
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
								<Autocomplete
									options={activityOptions as any[]}
									getOptionLabel={(option) => option.name || ''}
									value={selectedActivityOption as any}
									onChange={(_, val: any) => {
										if (isCategoryProject) {
											onRowChange(index, 'activity_type_name', val?.name || null);
											onRowChange(index, 'activity_public_id', null);
										} else {
											if (val?.public_id === OTHER_ID) {
												onRowChange(index, 'activity_public_id', null);
												onRowChange(index, 'activity_name_other', '');
											} else {
												onRowChange(index, 'activity_public_id', val?.public_id || null);
												onRowChange(index, 'activity_name_other', undefined);
											}
										}
									}}
									renderInput={(params) => <TextField {...params} size="small" placeholder="Select Activity" sx={textFieldStyles} />}
								/>
								{isOtherActivity && (
									<TextField
										size="small"
										fullWidth
										placeholder="Specify other activity details..."
										value={item.activity_name_other || ''}
										onChange={(e) => onRowChange(index, 'activity_name_other', e.target.value)}
										sx={{ ...textFieldStyles, '& .MuiOutlinedInput-root': { bgcolor: '#fffdfa' } }}
									/>
								)}
							</Box>
						)}
					</Box>
				</Box>

				{/* Work Done / Description */}
				<Box sx={{ mb: 3 }}>
					<MobileLabel label="Work Done" icon={<DescriptionIcon sx={{ fontSize: 16, color: '#6b7280' }} />} />
					{readOnly ? (
						<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', bgcolor: '#f9fafb', p: 2, borderRadius: '6px', border: '1px solid #f3f4f6', lineHeight: 1.6 }}>
							{item.description || '-'}
						</Typography>
					) : (
						<TextField
							fullWidth
							size="small"
							multiline
							minRows={2}
							maxRows={6}
							placeholder="Briefly describe what you did..."
							value={item.description}
							onChange={(e) => onRowChange(index, 'description', e.target.value)}
							sx={textFieldStyles}
						/>
					)}
				</Box>

				{/* Time & Duration Metrics - REBUILT FOR PRECISION */}
				<Box sx={{ 
					display: 'flex', 
					flexDirection: 'column',
					gap: 2,
					p: 2,
					bgcolor: '#f8fafc',
					borderRadius: '8px',
					border: '1px solid #e2e8f0'
				}}>
					{/* Time Picker Row */}
					<Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 2 }}>
						<Box>
							<MobileLabel label="Start" icon={<TimeIcon sx={{ fontSize: 15, color: '#64748b' }} />} />
							<TimePicker
								slotProps={{ 
									textField: { 
										size: 'small', 
										fullWidth: true, 
										sx: { 
											...textFieldStyles, 
											'& .MuiOutlinedInput-input': { p: '10px 8px', fontSize: '0.8rem' } 
										} 
									} 
								}}
								value={item.start_time ? dayjs(`2024-01-01T${item.start_time}`) : null}
								onChange={(v) => v && onRowChange(index, 'start_time', dayjs(v).format('HH:mm'))}
								readOnly={readOnly}
							/>
						</Box>
						<Box>
							<MobileLabel label="End" icon={<TimeIcon sx={{ fontSize: 15, color: '#64748b' }} />} />
							<TimePicker
								slotProps={{ 
									textField: { 
										size: 'small', 
										fullWidth: true, 
										sx: { 
											...textFieldStyles, 
											'& .MuiOutlinedInput-input': { p: '10px 8px', fontSize: '0.8rem' } 
										} 
									} 
								}}
								value={item.end_time ? dayjs(`2024-01-01T${item.end_time}`) : null}
								onChange={(v) => v && onRowChange(index, 'end_time', dayjs(v).format('HH:mm'))}
								readOnly={readOnly}
							/>
						</Box>
					</Box>

					{/* Duration & Delete Row */}
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: '1px dashed #e2e8f0' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
							<TimerIcon sx={{ fontSize: 18, color: '#ec7211' }} />
							<Box>
								<Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.65rem' }}>Duration</Typography>
								<Typography variant="body1" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
									{item.hours?.toFixed(1) || '0.0'} <Typography component="span" variant="caption" sx={{ fontWeight: 600 }}>hrs</Typography>
								</Typography>
							</Box>
						</Box>

						{!readOnly && (
							<IconButton
								onClick={() => onRemoveRow(index)}
								disabled={isDeleteDisabled}
								size="medium"
								sx={{ 
									color: '#9ca3af', 
									bgcolor: 'white',
									border: '1px solid #e5e7eb',
									'&:hover': { color: '#dc2626', bgcolor: '#fef2f2', borderColor: '#fecaca' },
									'&.Mui-disabled': { opacity: 0.3 }
								}}
							>
								<DeleteIcon fontSize="small" />
							</IconButton>
						)}
					</Box>
				</Box>
			</Box>
		);
	}

	// Desktop Layout
	return (
		<Box sx={{ 
			display: { xs: 'none', lg: 'grid' },
			gridTemplateColumns: 'minmax(120px, 1.2fr) minmax(120px, 1.2fr) minmax(150px, 2fr) 300px 40px',
			px: 2, 
			py: 1.5, 
			gap: 2, 
			alignItems: 'flex-start',
			transition: 'background-color 0.2s',
			borderBottom: '1px solid #f1f5f9',
			'&:hover': { bgcolor: '#f9fafb' }
		}}>
			<Box>
				{readOnly ? (
					<Typography variant="body2" sx={{ fontWeight: 600, py: 1.5, px: 1, color: '#111827' }}>{selectedProject?.name || item.project_name || '-'}</Typography>
				) : (
					<Autocomplete
						options={projects}
						getOptionLabel={(option) => option.name || ''}
						groupBy={(option: any) => option.group}
						value={selectedProject}
						onChange={(_, val) => onRowChange(index, 'project_public_id', val?.public_id || null)}
						sx={textFieldStyles}
						renderInput={(params) => <TextField {...params} size="small" placeholder="Project" />}
					/>
				)}
			</Box>

			<Box>
				{isGeneralProject ? (
					!readOnly && <Typography variant="body2" color="text.secondary" sx={{ py: 1.5, fontStyle: 'italic', fontSize: '0.8125rem' }}>N/A</Typography>
				) : (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
						{readOnly ? (
							<Typography variant="body2" sx={{ py: 1.5, color: '#111827' }}>{isOtherActivity ? item.activity_name_other : (selectedActivityOption?.name || '-')}</Typography>
						) : (
							<>
								<Autocomplete
									options={activityOptions as any[]}
									getOptionLabel={(option) => option.name || ''}
									value={selectedActivityOption as any}
									onChange={(_, val: any) => {
										if (isCategoryProject) {
											onRowChange(index, 'activity_type_name', val?.name || null);
											onRowChange(index, 'activity_public_id', null);
										} else {
											if (val?.public_id === OTHER_ID) {
												onRowChange(index, 'activity_public_id', null);
												onRowChange(index, 'activity_name_other', '');
											} else {
												onRowChange(index, 'activity_public_id', val?.public_id || null);
												onRowChange(index, 'activity_name_other', undefined);
											}
										}
									}}
									disabled={!item.project_public_id}
									sx={textFieldStyles}
									renderInput={(params) => <TextField {...params} size="small" placeholder="Activity" />}
								/>
								{isOtherActivity && (
									<TextField
										size="small"
										fullWidth
										autoFocus
										placeholder="Activity name..."
										value={item.activity_name_other || ''}
										onChange={(e) => onRowChange(index, 'activity_name_other', e.target.value)}
										sx={{ ...textFieldStyles, '& .MuiOutlinedInput-root': { bgcolor: '#fffdfa' } }}
									/>
								)}
							</>
						)}
					</Box>
				)}
			</Box>

			<Box>
				{readOnly ? (
					<Typography variant="body2" sx={{ py: 1.5, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#374151' }}>{item.description || '-'}</Typography>
				) : (
					<TextField
						fullWidth
						size="small"
						multiline
						maxRows={5}
						placeholder="Work details..."
						value={item.description}
						onChange={(e) => onRowChange(index, 'description', e.target.value)}
						sx={textFieldStyles}
					/>
				)}
			</Box>

			<Box sx={{ display: 'flex', width: '300px', gap: 1, alignItems: 'flex-start', justifyContent: 'flex-end' }}>
				<Box sx={{ width: '120px' }}>
					<TimePicker
						slotProps={{ 
							textField: { 
								size: 'small', 
								fullWidth: true, 
								sx: { ...textFieldStyles, '& .MuiOutlinedInput-input': { textAlign: 'center', p: '10px 12px', fontSize: '0.8rem' } } 
							} 
						}}
						value={item.start_time ? dayjs(`2024-01-01T${item.start_time}`) : null}
						onChange={(v) => v && onRowChange(index, 'start_time', dayjs(v).format('HH:mm'))}
						readOnly={readOnly}
					/>
				</Box>
				<Box sx={{ width: '120px' }}>
					<TimePicker
						slotProps={{ 
							textField: { 
								size: 'small', 
								fullWidth: true, 
								sx: { ...textFieldStyles, '& .MuiOutlinedInput-input': { textAlign: 'center', p: '10px 12px', fontSize: '0.8rem' } } 
							} 
						}}
						value={item.end_time ? dayjs(`2024-01-01T${item.end_time}`) : null}
						onChange={(v) => v && onRowChange(index, 'end_time', dayjs(v).format('HH:mm'))}
						readOnly={readOnly}
					/>
				</Box>
				<Box sx={{ width: '50px', textAlign: 'center', py: 1.5 }}>
					<Typography variant="body2" sx={{ fontWeight: 800, color: (item.hours || 0) > 0 ? '#1e293b' : '#9ca3af' }}>
						{item.hours?.toFixed(1) || '0.0'}
					</Typography>
				</Box>
			</Box>

			<Box sx={{ width: '40px', pt: 0.75, display: 'flex', justifyContent: 'center' }}>
				{!readOnly && (
					<Tooltip title="Remove activity">
						<IconButton
							onClick={() => onRemoveRow(index)}
							disabled={isDeleteDisabled}
							size="small"
							sx={{ 
								color: '#9ca3af', 
								'&:hover': { color: '#dc2626', bgcolor: '#fef2f2' },
								'&.Mui-disabled': { opacity: 0.3 }
							}}
						>
							<DeleteIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				)}
			</Box>
		</Box>
	);
};

export default DSRItemRow;
