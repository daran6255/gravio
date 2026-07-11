import React, { useState, useEffect } from 'react';
import {
	Box, Typography, Button, Card, CardContent, Grid, Chip,
	IconButton, TextField, Dialog, DialogTitle,
	DialogContent, DialogActions, Stack, Skeleton, Tab, Tabs,
	FormControl, InputLabel, Select, MenuItem, alpha, useTheme,
	Checkbox, CircularProgress, Paper, Divider
} from '@mui/material';
import {
	Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
	PlaylistAddCheck as ChecklistIcon, PlayArrow as LaunchIcon,
	CheckCircleOutline as CheckedIcon, RadioButtonUnchecked as UncheckedIcon,
	Person as PersonIcon, Assignment as TaskIcon, Schedule as TimeIcon
} from '@mui/icons-material';
import HRLayout from '../../components/hr/HRLayout';
import {
	hrChecklistTemplateApi,
	hrChecklistInstanceApi,
	hrEmployeeApi
} from '../../services/hrService';
import type {
	HRChecklistTemplate,
	HRChecklistInstance,
	HREmployeeListItem
} from '../../models/hr';
import useToast from '../../hooks/useToast';
import { useAppSelector } from '../../store/hooks';

const ChecklistPage: React.FC = () => {
	const theme = useTheme();
	const { success, error } = useToast();
	const currentUser = useAppSelector((state) => state.auth.user);
	const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr_admin';

	const [tab, setTab] = useState(0);
	const [templates, setTemplates] = useState<HRChecklistTemplate[]>([]);
	const [instances, setInstances] = useState<HRChecklistInstance[]>([]);
	const [employees, setEmployees] = useState<HREmployeeListItem[]>([]);
	const [loading, setLoading] = useState(true);

	// Dialog States
	const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
	const [editTemplate, setEditTemplate] = useState<HRChecklistTemplate | null>(null);
	const [templateName, setTemplateName] = useState('');
	const [templateType, setTemplateType] = useState<'onboarding' | 'offboarding'>('onboarding');
	const [templateTasks, setTemplateTasks] = useState<Array<{ id: string; title: string; role_required: string }>>([]);
	const [newTaskTitle, setNewTaskTitle] = useState('');
	const [newTaskRole, setNewTaskRole] = useState('hr_manager');

	const [launchDialogOpen, setLaunchDialogOpen] = useState(false);
	const [selectedEmployee, setSelectedEmployee] = useState<number | ''>('');
	const [selectedTemplate, setSelectedTemplate] = useState<number | ''>('');

	const [instanceDetailOpen, setInstanceDetailOpen] = useState(false);
	const [activeInstance, setActiveInstance] = useState<HRChecklistInstance | null>(null);
	// HRChecklistInstance only carries template_id/template_name -- the task list
	// itself lives on the template, so look it up from the templates already loaded.
	const activeTemplate = activeInstance ? templates.find(t => t.id === activeInstance.template_id) : undefined;

	const fetchData = async () => {
		setLoading(true);
		try {
			const tmpls = await hrChecklistTemplateApi.list();
			setTemplates(tmpls);

			const insts = await hrChecklistInstanceApi.list();
			setInstances(insts);

			// Load employees for launch dropdown
			const empData = await hrEmployeeApi.list({ limit: 100 });
			setEmployees(empData.items || []);
		} catch (e: any) {
			error('Failed to load checklist data');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	// Checklist Template Handlers
	const handleOpenTemplateDialog = (tmpl?: HRChecklistTemplate) => {
		if (tmpl) {
			setEditTemplate(tmpl);
			setTemplateName(tmpl.name);
			setTemplateType(tmpl.checklist_type);
			setTemplateTasks(tmpl.tasks);
		} else {
			setEditTemplate(null);
			setTemplateName('');
			setTemplateType('onboarding');
			setTemplateTasks([]);
		}
		setTemplateDialogOpen(true);
	};

	const handleAddTask = () => {
		if (!newTaskTitle.trim()) return;
		const id = `task_${Date.now()}`;
		setTemplateTasks([...templateTasks, { id, title: newTaskTitle.trim(), role_required: newTaskRole }]);
		setNewTaskTitle('');
	};

	const handleRemoveTask = (idx: number) => {
		setTemplateTasks(templateTasks.filter((_, i) => i !== idx));
	};

	const handleSaveTemplate = async () => {
		if (!templateName.trim()) return;
		try {
			const payload = {
				name: templateName.trim(),
				checklist_type: templateType,
				tasks: templateTasks,
				is_active: editTemplate ? editTemplate.is_active : true
			};

			if (editTemplate) {
				await hrChecklistTemplateApi.update(editTemplate.id, payload);
				success('Template updated successfully');
			} else {
				await hrChecklistTemplateApi.create(payload);
				success('Template created successfully');
			}
			setTemplateDialogOpen(false);
			fetchData();
		} catch (e: any) {
			error('Failed to save template');
		}
	};

	const handleDeleteTemplate = async (id: number) => {
		if (!window.confirm('Are you sure you want to delete this template?')) return;
		try {
			await hrChecklistTemplateApi.delete(id);
			success('Template deleted');
			fetchData();
		} catch (e: any) {
			error('Failed to delete template');
		}
	};

	// Checklist Launch Handlers
	const handleLaunchChecklist = async () => {
		if (!selectedEmployee || !selectedTemplate) return;
		try {
			await hrChecklistInstanceApi.launch({
				user_id: Number(selectedEmployee),
				template_id: Number(selectedTemplate)
			});
			success('Checklist launched successfully');
			setLaunchDialogOpen(false);
			setSelectedEmployee('');
			setSelectedTemplate('');
			fetchData();
		} catch (e: any) {
			error(e?.response?.data?.detail || 'Failed to launch checklist');
		}
	};

	// Task Progress Calculations
	const getProgress = (inst: HRChecklistInstance) => {
		const statuses = Object.values(inst.task_statuses);
		if (statuses.length === 0) return 0;
		const completed = statuses.filter(s => s.completed).length;
		return Math.round((completed / statuses.length) * 100);
	};

	const getProgressText = (inst: HRChecklistInstance) => {
		const statuses = Object.values(inst.task_statuses);
		const completed = statuses.filter(s => s.completed).length;
		return `${completed}/${statuses.length} Tasks`;
	};

	// Task Toggle Handler inside instance
	const handleToggleTask = async (taskId: string, currentlyCompleted: boolean) => {
		if (!activeInstance) return;
		try {
			const updated = await hrChecklistInstanceApi.toggleTask(
				activeInstance.id,
				taskId,
				!currentlyCompleted
			);
			// Refresh activeInstance in modal
			const cleanUpdated = {
				...updated,
				employee_name: activeInstance.employee_name,
				template_name: activeInstance.template_name,
				checklist_type: activeInstance.checklist_type
			};
			setActiveInstance(cleanUpdated);
			
			// Refresh instances list
			setInstances(instances.map(inst => inst.id === updated.id ? cleanUpdated : inst));
			success(currentlyCompleted ? 'Task marked incomplete' : 'Task completed!');
		} catch (e: any) {
			error('Failed to update task state');
		}
	};

	return (
		<HRLayout
			title="Lifecycle Checklists"
			subtitle="Track employee onboarding tasks and offboarding clearances."
			actions={
				<Stack direction="row" spacing={1.5}>
					<Button
						variant="outlined"
						color="primary"
						startIcon={<LaunchIcon />}
						onClick={() => setLaunchDialogOpen(true)}
						sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
					>
						Launch Checklist
					</Button>
					{isAdminOrHR && (
						<Button
							variant="contained"
							color="primary"
							startIcon={<AddIcon />}
							onClick={() => handleOpenTemplateDialog()}
							sx={{
								borderRadius: 2.5, px: 3, fontWeight: 700,
								boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`
							}}
						>
							New Template
						</Button>
					)}
				</Stack>
			}
		>
			<Box sx={{ pb: 5 }}>
				{/* Tabs Navigation */}
				<Tabs
					value={tab}
					onChange={(_, val) => setTab(val)}
					sx={{
						mb: 4,
						borderBottom: 1,
						borderColor: 'divider',
						'& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }
					}}
				>
					<Tab label="Active Trackers" />
					<Tab label="Checklist Templates" />
				</Tabs>

				{loading ? (
					<Grid container spacing={3}>
						{[1, 2, 3].map(i => (
							<Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
								<Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
							</Grid>
						))}
					</Grid>
				) : tab === 0 ? (
					/* ACTIVE TRACKERS TAB */
					instances.length === 0 ? (
						<Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: `1px dashed ${theme.palette.divider}` }}>
							<ChecklistIcon sx={{ fontSize: '3.5rem', color: 'text.disabled', mb: 2 }} />
							<Typography variant="h6" fontWeight={700}>No Active Checklists</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
								Launch an onboarding or offboarding tracker for any employee to begin.
							</Typography>
							<Button variant="contained" onClick={() => setLaunchDialogOpen(true)}>Launch Now</Button>
						</Paper>
					) : (
						<Grid container spacing={3}>
							{instances.map((inst) => {
								const progress = getProgress(inst);
								const isTypeOnboarding = inst.checklist_type === 'onboarding';
								return (
									<Grid size={{ xs: 12, sm: 6, md: 4 }} key={inst.id}>
										<Card
											onClick={() => {
												setActiveInstance(inst);
												setInstanceDetailOpen(true);
											}}
											sx={{
												borderRadius: 3.5,
												border: `1px solid ${alpha(theme.palette.divider, 0.75)}`,
												cursor: 'pointer',
												transition: 'all 0.2s ease',
												'&:hover': {
													boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.08)}`,
													borderColor: alpha(theme.palette.primary.main, 0.25),
													transform: 'translateY(-2px)'
												}
											}}
										>
											<CardContent sx={{ p: 3 }}>
												<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
													<Chip
														label={isTypeOnboarding ? 'Onboarding' : 'Offboarding'}
														size="small"
														sx={{
															fontWeight: 800,
															textTransform: 'uppercase',
															fontSize: '0.68rem',
															letterSpacing: '0.5px',
															background: isTypeOnboarding
																? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`
																: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.2)} 100%)`,
															color: isTypeOnboarding ? 'primary.main' : 'error.main'
														}}
													/>
													<Chip
														label={inst.status.toUpperCase()}
														size="small"
														color={inst.status === 'completed' ? 'success' : 'warning'}
														sx={{ fontWeight: 800, fontSize: '0.65rem' }}
													/>
												</Box>

												<Typography variant="h6" fontWeight={800} noWrap sx={{ letterSpacing: '-0.3px' }}>
													{inst.employee_name}
												</Typography>
												<Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5, mb: 2.5 }}>
													Template: {inst.template_name}
												</Typography>

												<Divider sx={{ my: 1.5 }} />

												<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
														<CircularProgress
															variant="determinate"
															value={progress}
															size={28}
															thickness={5}
															sx={{ color: inst.status === 'completed' ? 'success.main' : 'primary.main' }}
														/>
														<Typography variant="body2" fontWeight={700}>
															{progress}% Completed
														</Typography>
													</Box>
													<Typography variant="caption" color="text.secondary" fontWeight={600}>
														{getProgressText(inst)}
													</Typography>
												</Box>
											</CardContent>
										</Card>
									</Grid>
								);
							})}
						</Grid>
					)
				) : (
					/* CHECKLIST TEMPLATES TAB */
					templates.length === 0 ? (
						<Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: `1px dashed ${theme.palette.divider}` }}>
							<TaskIcon sx={{ fontSize: '3.5rem', color: 'text.disabled', mb: 2 }} />
							<Typography variant="h6" fontWeight={700}>No Checklist Templates</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
								Create templates outlining standard checklists for onboarding engineers, admins, exits, etc.
							</Typography>
							{isAdminOrHR && (
								<Button variant="contained" onClick={() => handleOpenTemplateDialog()}>Create Template</Button>
							)}
						</Paper>
					) : (
						<Grid container spacing={3}>
							{templates.map((tmpl) => (
								<Grid size={{ xs: 12, sm: 6, md: 4 }} key={tmpl.id}>
									<Card
										sx={{
											borderRadius: 3.5,
											border: `1px solid ${alpha(theme.palette.divider, 0.75)}`,
											height: '100%',
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'space-between'
										}}
									>
										<CardContent sx={{ p: 3 }}>
											<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
												<Chip
													label={tmpl.checklist_type.toUpperCase()}
													size="small"
													color={tmpl.checklist_type === 'onboarding' ? 'primary' : 'secondary'}
													sx={{ fontWeight: 800, fontSize: '0.65rem' }}
												/>
												{!tmpl.is_active && (
													<Chip label="INACTIVE" size="small" variant="outlined" />
												)}
											</Box>
											<Typography variant="h6" fontWeight={800} sx={{ mb: 1.5, letterSpacing: '-0.3px' }}>
												{tmpl.name}
											</Typography>

											<Stack spacing={1} sx={{ mt: 2 }}>
												{tmpl.tasks.slice(0, 3).map((task) => (
													<Box key={task.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
														<TaskIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
														<Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.85rem' }}>
															{task.title}
														</Typography>
													</Box>
												))}
												{tmpl.tasks.length > 3 && (
													<Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', pl: 2.5 }}>
														+ {tmpl.tasks.length - 3} more tasks
													</Typography>
												)}
											</Stack>
										</CardContent>
										<Box sx={{ px: 3, pb: 2.5, pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
											<Typography variant="caption" color="text.secondary" fontWeight={700}>
												{tmpl.tasks.length} Tasks defined
											</Typography>
											{isAdminOrHR && (
												<Box>
													<IconButton size="small" onClick={() => handleOpenTemplateDialog(tmpl)}>
														<EditIcon sx={{ fontSize: '1rem' }} />
													</IconButton>
													<IconButton size="small" color="error" onClick={() => handleDeleteTemplate(tmpl.id)}>
														<DeleteIcon sx={{ fontSize: '1rem' }} />
													</IconButton>
												</Box>
											)}
										</Box>
									</Card>
								</Grid>
							))}
						</Grid>
					)
				)}

				{/* 1. TEMPLATE CREATOR / EDITOR DIALOG */}
				<Dialog
					open={templateDialogOpen}
					onClose={() => setTemplateDialogOpen(false)}
					maxWidth="md"
					fullWidth
					PaperProps={{ sx: { borderRadius: 4 } }}
				>
					<DialogTitle sx={{ fontWeight: 800 }}>
						{editTemplate ? 'Edit Template' : 'New Checklist Template'}
					</DialogTitle>
					<DialogContent dividers>
						<Grid container spacing={3}>
							<Grid size={{ xs: 12, sm: 6 }}>
								<TextField
									label="Template Name"
									fullWidth
									value={templateName}
									onChange={(e) => setTemplateName(e.target.value)}
									placeholder="e.g. Software Engineer Onboarding"
									required
								/>
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<FormControl fullWidth>
									<InputLabel>Checklist Type</InputLabel>
									<Select
										value={templateType}
										label="Checklist Type"
										onChange={(e) => setTemplateType(e.target.value as any)}
									>
										<MenuItem value="onboarding">Onboarding</MenuItem>
										<MenuItem value="offboarding">Offboarding</MenuItem>
									</Select>
								</FormControl>
							</Grid>

							<Grid size={{ xs: 12 }}>
								<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
									Tasks List ({templateTasks.length} defined)
								</Typography>

								{/* Add Task Box */}
								<Paper sx={{ p: 2, mb: 2, background: alpha(theme.palette.background.default, 0.5) }}>
									<Grid container spacing={2} alignItems="center">
										<Grid size={{ xs: 12, sm: 6 }}>
											<TextField
												label="Task Description"
												fullWidth
												size="small"
												value={newTaskTitle}
												onChange={(e) => setNewTaskTitle(e.target.value)}
												placeholder="e.g. Collect Signatures, Setup IT Laptop"
											/>
										</Grid>
										<Grid size={{ xs: 12, sm: 4 }}>
											<FormControl fullWidth size="small">
												<InputLabel>Role Required</InputLabel>
												<Select
													value={newTaskRole}
													label="Role Required"
													onChange={(e) => setNewTaskRole(e.target.value)}
												>
													<MenuItem value="hr_admin">HR Admin</MenuItem>
													<MenuItem value="hr_manager">HR Manager</MenuItem>
													<MenuItem value="admin">System Admin</MenuItem>
													<MenuItem value="manager">Reporting Manager</MenuItem>
												</Select>
											</FormControl>
										</Grid>
										<Grid size={{ xs: 12, sm: 2 }}>
											<Button
												variant="contained"
												fullWidth
												startIcon={<AddIcon />}
												onClick={handleAddTask}
											>
												Add
											</Button>
										</Grid>
									</Grid>
								</Paper>

								{/* Tasks List Table/Grid */}
								<Stack spacing={1}>
									{templateTasks.map((t, idx) => (
										<Paper
											key={t.id}
											variant="outlined"
											sx={{
												p: 1.5,
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												borderRadius: 2
											}}
										>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
												<Chip label={idx + 1} size="small" sx={{ fontWeight: 800 }} />
												<Typography variant="body2" fontWeight={600}>{t.title}</Typography>
												<Chip
													label={`Role: ${t.role_required}`}
													size="small"
													variant="outlined"
													sx={{ height: 20, fontSize: '0.65rem' }}
												/>
											</Box>
											<IconButton size="small" color="error" onClick={() => handleRemoveTask(idx)}>
												<DeleteIcon sx={{ fontSize: '0.9rem' }} />
											</IconButton>
										</Paper>
									))}
								</Stack>
							</Grid>
						</Grid>
					</DialogContent>
					<DialogActions sx={{ p: 3 }}>
						<Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
						<Button variant="contained" onClick={handleSaveTemplate} disabled={!templateName.trim()}>
							Save Template
						</Button>
					</DialogActions>
				</Dialog>

				{/* 2. LAUNCH CHECKLIST DIALOG */}
				<Dialog
					open={launchDialogOpen}
					onClose={() => setLaunchDialogOpen(false)}
					maxWidth="sm"
					fullWidth
					PaperProps={{ sx: { borderRadius: 4 } }}
				>
					<DialogTitle sx={{ fontWeight: 800 }}>Launch Employee Checklist</DialogTitle>
					<DialogContent sx={{ pt: 1 }}>
						<Stack spacing={3} sx={{ mt: 1.5 }}>
							<FormControl fullWidth>
								<InputLabel>Select Employee</InputLabel>
								<Select
									value={selectedEmployee}
									label="Select Employee"
									onChange={(e) => setSelectedEmployee(e.target.value as number)}
								>
									{employees.map((emp) => (
										<MenuItem key={emp.user_id} value={emp.user_id}>
											{emp.full_name} ({emp.employee_id})
										</MenuItem>
									))}
								</Select>
							</FormControl>

							<FormControl fullWidth>
								<InputLabel>Select Checklist Template</InputLabel>
								<Select
									value={selectedTemplate}
									label="Select Checklist Template"
									onChange={(e) => setSelectedTemplate(e.target.value as number)}
								>
									{templates.filter(t => t.is_active).map((tmpl) => (
										<MenuItem key={tmpl.id} value={tmpl.id}>
											{tmpl.name} ({tmpl.checklist_type.toUpperCase()})
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Stack>
					</DialogContent>
					<DialogActions sx={{ p: 3 }}>
						<Button onClick={() => setLaunchDialogOpen(false)}>Cancel</Button>
						<Button
							variant="contained"
							onClick={handleLaunchChecklist}
							disabled={!selectedEmployee || !selectedTemplate}
						>
							Launch Tracker
						</Button>
					</DialogActions>
				</Dialog>

				{/* 3. ACTIVE TRACKER DETAIL DIALOG */}
				<Dialog
					open={instanceDetailOpen}
					onClose={() => setInstanceDetailOpen(false)}
					maxWidth="md"
					fullWidth
					PaperProps={{ sx: { borderRadius: 4 } }}
				>
					{activeInstance && (
						<>
							<DialogTitle sx={{ fontWeight: 800 }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Box>
										<Typography variant="h6" fontWeight={800}>{activeInstance.employee_name}</Typography>
										<Typography variant="caption" color="text.secondary">
											Template: {activeInstance.template_name}
										</Typography>
									</Box>
									<Chip
										label={activeInstance.status.toUpperCase()}
										color={activeInstance.status === 'completed' ? 'success' : 'warning'}
										sx={{ fontWeight: 800 }}
									/>
								</Box>
							</DialogTitle>
							<DialogContent dividers>
								<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
									Checklist Tasks Progress:
								</Typography>

								<Stack spacing={2}>
									{(activeTemplate?.tasks || []).map((task) => {
										const taskState = activeInstance.task_statuses[task.id] || {
											completed: false,
											completed_by_id: null,
											completed_at: null
										};

										return (
											<Paper
												key={task.id}
												variant="outlined"
												sx={{
													p: 2,
													borderRadius: 3,
													borderColor: taskState.completed ? alpha(theme.palette.success.main, 0.4) : 'divider',
													background: taskState.completed ? alpha(theme.palette.success.main, 0.02) : 'inherit',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between'
												}}
											>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
													<Checkbox
														icon={<UncheckedIcon />}
														checkedIcon={<CheckedIcon color="success" />}
														checked={taskState.completed}
														onChange={() => handleToggleTask(task.id, taskState.completed)}
													/>
													<Box>
														<Typography
															variant="body2"
															fontWeight={700}
															sx={{
																textDecoration: taskState.completed ? 'line-through' : 'none',
																color: taskState.completed ? 'text.secondary' : 'text.primary'
															}}
														>
															{task.title}
														</Typography>
														<Chip
															label={`Requires: ${task.role_required.toUpperCase()}`}
															size="small"
															variant="outlined"
															sx={{ height: 18, fontSize: '0.6rem', mt: 0.5 }}
														/>
													</Box>
												</Box>

												{taskState.completed && (
													<Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
														<Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
															<PersonIcon sx={{ fontSize: '0.8rem' }} /> Marked done
														</Typography>
														{taskState.completed_at && (
															<Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
																<TimeIcon sx={{ fontSize: '0.8rem' }} />
																{new Date(taskState.completed_at).toLocaleString()}
															</Typography>
														)}
													</Box>
												)}
											</Paper>
										);
									})}
								</Stack>
							</DialogContent>
							<DialogActions sx={{ p: 3 }}>
								<Button onClick={() => setInstanceDetailOpen(false)}>Close</Button>
							</DialogActions>
						</>
					)}
				</Dialog>
			</Box>
		</HRLayout>
	);
};

export default ChecklistPage;
