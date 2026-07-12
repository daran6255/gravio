import React from 'react';
import {
	Box, Grid, Card, CardContent, Typography, Divider, Stack, Chip, useTheme, alpha
} from '@mui/material';
import {
	EmailOutlined as EmailIcon,
	PhoneOutlined as PhoneIcon,
	CalendarMonthOutlined as CalendarIcon,
	BusinessOutlined as DepartmentIcon,
	BadgeOutlined as DesignationIcon,
	LocationOnOutlined as LocationIcon,
	AccountBalanceOutlined as BankIcon,
	ContactPageOutlined as IDIcon,
	ContactPhoneOutlined as EmergencyIcon,
	TimerOutlined as StatusIcon,
} from '@mui/icons-material';
import type { HREmployeeResponse } from '../../../../models/hr';
import {
	EMPLOYEE_STATUS_LABELS,
	EMPLOYEE_STATUS_COLORS,
	EMPLOYMENT_TYPE_LABELS,
	WORK_LOCATION_LABELS
} from '../../../../models/hr';
import EnterpriseAvatar from '../../../common/avatar/Avatar';

interface EmployeeDetailsPanelProps {
	employee: HREmployeeResponse;
}

export const EmployeeDetailsPanel: React.FC<EmployeeDetailsPanelProps> = ({ employee }) => {
	const theme = useTheme();

	const detailItem = (icon: React.ReactNode, label: string, value: string | null) => (
		<Stack direction="row" spacing={1.5} alignItems="center">
			<Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
			<Box>
				<Typography variant="caption" color="text.secondary" display="block">
					{label}
				</Typography>
				<Typography variant="body2" fontWeight={600} color="text.primary">
					{value || '—'}
				</Typography>
			</Box>
		</Stack>
	);

	return (
		<Grid container spacing={3}>
			{/* Top Header Card */}
			<Grid size={12}>
				<Card
					sx={{
						background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary?.main || theme.palette.primary.light, 0.02)} 100%)`,
						border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
					}}
				>
					<CardContent sx={{ p: 3 }}>
						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
							<EnterpriseAvatar
								name={employee.full_name || ''}
								src={employee.avatar || ''}
								size={80}
								style={{
									border: `3px solid ${theme.palette.primary.main}`,
									boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
								}}
							/>
							<Box sx={{ textAlign: { xs: 'center', sm: 'left' }, flexGrow: 1 }}>
								<Typography variant="h5" fontWeight={700} gutterBottom>
									{employee.full_name}
								</Typography>
								<Stack
									direction="row"
									spacing={1}
									flexWrap="wrap"
									useFlexGap
									justifyContent={{ xs: 'center', sm: 'flex-start' }}
									sx={{ mb: 1.5 }}
								>
									<Chip
										icon={<DesignationIcon style={{ fontSize: '0.9rem' }} />}
										label={employee.designation_name || 'Designation Not Set'}
										size="small"
										variant="outlined"
									/>
									<Chip
										icon={<DepartmentIcon style={{ fontSize: '0.9rem' }} />}
										label={employee.department_name || 'Department Not Set'}
										size="small"
										variant="outlined"
									/>
									<Chip
										label={EMPLOYEE_STATUS_LABELS[employee.employee_status] || employee.employee_status}
										color={EMPLOYEE_STATUS_COLORS[employee.employee_status] || 'default'}
										size="small"
									/>
								</Stack>
								<Typography variant="body2" color="text.secondary">
									Employee ID: <strong>{employee.employee_id || 'Pending'}</strong>
								</Typography>
							</Box>
						</Stack>
					</CardContent>
				</Card>
			</Grid>

			{/* Main details Grid */}
			<Grid size={{ xs: 12, md: 6 }}>
				<Card sx={{ height: '100%' }}>
					<CardContent>
						<Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<DesignationIcon color="primary" /> Job Profile & Employment
						</Typography>
						<Divider sx={{ my: 1.5 }} />
						<Stack spacing={2.5}>
							<Grid container spacing={2}>
								<Grid size={{ xs: 12, sm: 6 }}>
									{detailItem(<StatusIcon />, 'Employment Type', EMPLOYMENT_TYPE_LABELS[employee.employment_type] || employee.employment_type)}
								</Grid>
								<Grid size={{ xs: 12, sm: 6 }}>
									{detailItem(<LocationIcon />, 'Work Location', WORK_LOCATION_LABELS[employee.work_location] || employee.work_location)}
								</Grid>
								<Grid size={{ xs: 12, sm: 6 }}>
									{detailItem(<CalendarIcon />, 'Date of Joining', employee.date_of_joining)}
								</Grid>
								<Grid size={{ xs: 12, sm: 6 }}>
									{detailItem(<StatusIcon />, 'Reporting Manager', employee.reporting_manager_name || 'Direct / None')}
								</Grid>
							</Grid>
						</Stack>
					</CardContent>
				</Card>
			</Grid>

			<Grid size={{ xs: 12, md: 6 }}>
				<Card sx={{ height: '100%' }}>
					<CardContent>
						<Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<EmailIcon color="primary" /> Contact Details
						</Typography>
						<Divider sx={{ my: 1.5 }} />
						<Stack spacing={2.5}>
							<Grid container spacing={2}>
								<Grid size={{ xs: 12, sm: 6 }}>
									{detailItem(<EmailIcon />, 'Work Email', employee.email)}
								</Grid>
								<Grid size={{ xs: 12, sm: 6 }}>
									{detailItem(<PhoneIcon />, 'Phone Number', employee.phone)}
								</Grid>
							</Grid>
						</Stack>
					</CardContent>
				</Card>
			</Grid>

			{/* Financials & Identity info */}
			<Grid size={{ xs: 12, md: 6 }}>
				<Card sx={{ height: '100%' }}>
					<CardContent>
						<Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<BankIcon color="primary" /> Bank Account Details
						</Typography>
						<Divider sx={{ my: 1.5 }} />
						<Stack spacing={2.5}>
							<Grid container spacing={2}>
								<Grid size={{ xs: 12, sm: 6 }}>
									{detailItem(<BankIcon />, 'Bank Name', employee.bank_name)}
								</Grid>
								<Grid size={{ xs: 12, sm: 6 }}>
									{detailItem(<BankIcon />, 'Account Number', employee.bank_account_number)}
								</Grid>
								<Grid size={12}>
									{detailItem(<BankIcon />, 'IFSC Code', employee.bank_ifsc)}
								</Grid>
							</Grid>
						</Stack>
					</CardContent>
				</Card>
			</Grid>

			<Grid size={{ xs: 12, md: 6 }}>
				<Card sx={{ height: '100%' }}>
					<CardContent>
						<Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<IDIcon color="primary" /> Statutory Identity Info
						</Typography>
						<Divider sx={{ my: 1.5 }} />
						<Stack spacing={2.5}>
							<Grid container spacing={2}>
								<Grid size={{ xs: 12, sm: 6 }}>
									{detailItem(<IDIcon />, 'PAN Number', employee.pan_number)}
								</Grid>
								<Grid size={{ xs: 12, sm: 6 }}>
									{detailItem(<IDIcon />, 'Aadhaar Number', employee.aadhaar_number)}
								</Grid>
							</Grid>
						</Stack>
					</CardContent>
				</Card>
			</Grid>

			{/* Emergency Contact */}
			{employee.emergency_contact && (
				<Grid size={12}>
					<Card>
						<CardContent>
							<Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<EmergencyIcon color="primary" /> Emergency Contact Info
							</Typography>
							<Divider sx={{ my: 1.5 }} />
							<Grid container spacing={2}>
								<Grid size={{ xs: 12, sm: 4 }}>
									{detailItem(<EmergencyIcon />, 'Emergency Contact Name', employee.emergency_contact.name)}
								</Grid>
								<Grid size={{ xs: 12, sm: 4 }}>
									{detailItem(<EmergencyIcon />, 'Relationship', employee.emergency_contact.relation)}
								</Grid>
								<Grid size={{ xs: 12, sm: 4 }}>
									{detailItem(<PhoneIcon />, 'Phone Number', employee.emergency_contact.phone)}
								</Grid>
							</Grid>
						</CardContent>
					</Card>
				</Grid>
			)}
		</Grid>
	);
};

export default EmployeeDetailsPanel;
