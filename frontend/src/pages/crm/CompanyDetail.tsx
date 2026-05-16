import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	Box,
	Container,
	Typography,
	Stack,
	Button,
	Tabs,
	Tab,
	useTheme,
	useMediaQuery
} from '@mui/material';
import {
	ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCompanyById, updateCompany } from '../../store/slices/companySlice';
import StatusBadge from '../../components/common/badge/StatusBadge';
import CompanyFormDialog from '../../components/crm/companies/form/CompanyFormDialog';
import { useSnackbar } from 'notistack';
import type { CompanyUpdate } from '../../models/company';

// Extracted Components
import CompanyDetailHeader from '../../components/crm/companies/detail/CompanyDetailHeader';
import OverviewTab from '../../components/crm/companies/detail/OverviewTab';
import ContactsTab from '../../components/crm/companies/detail/ContactsTab';
import LeadsTab from '../../components/crm/companies/detail/LeadsTab';
import DealsTab from '../../components/crm/companies/detail/DealsTab';
import TasksTab from '../../components/crm/companies/detail/TasksTab';
function getInitials(name: string) {
	return name.split(' ').map((n) => n[0]).join('').toUpperCase();
}

const CompanyDetail: React.FC = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const { publicId } = useParams<{ publicId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { enqueueSnackbar } = useSnackbar();
	const { selectedCompany: company, loading } = useAppSelector((state) => state.companies);

	const [tabIndex, setTabIndex] = useState(0);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [formLoading, setFormLoading] = useState(false);

	useEffect(() => {
		if (publicId) {
			dispatch(fetchCompanyById(publicId));
		}
	}, [publicId, dispatch]);

	const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
		setTabIndex(newValue);
	};

	const handleEditSubmit = async (data: any) => {
		if (!publicId) return;
		setFormLoading(true);
		try {
			await dispatch(updateCompany({ publicId, company: data as CompanyUpdate })).unwrap();
			enqueueSnackbar('Company updated successfully', { variant: 'success' });
			setEditDialogOpen(false);
			dispatch(fetchCompanyById(publicId));
		} catch (error: any) {
			enqueueSnackbar(error || 'Failed to update company', { variant: 'error' });
		} finally {
			setFormLoading(false);
		}
	};


	if (loading && !company) {
		return <Box sx={{ p: 4, textAlign: 'center' }}>Loading company details...</Box>;
	}

	if (!company) {
		return (
			<Container sx={{ py: 8, textAlign: 'center' }}>
				<Typography variant="h5" color="textSecondary">Company not found</Typography>
				<Button
					variant="text"
					startIcon={<ArrowBackIcon />}
					onClick={() => navigate('/crm/companies')}
					sx={{ mt: 2 }}
				>
					Back to Companies
				</Button>
			</Container>
		);
	}

	const contactColumns = [
		{
			id: 'name',
			label: 'Full Name',
			minWidth: 150,
			format: (_: any, row: any) => (
				<Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
					{row.first_name} {row.last_name}
				</Typography>
			)
		},
		{ id: 'designation', label: 'Designation', minWidth: 150 },
		{ id: 'email', label: 'Email', minWidth: 200 },
		{ id: 'mobile', label: 'Mobile', minWidth: 120 },
		{
			id: 'is_primary',
			label: 'Primary',
			minWidth: 100,
			format: (val: boolean) => val ? <StatusBadge label="Primary" status="active" /> : '-'
		}
	];

	const leadColumns = [
		{
			id: 'title',
			label: 'Lead Title',
			minWidth: 200,
			format: (_: any, row: any) => (
				<Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
					{row.title}
				</Typography>
			)
		},
		{
			id: 'lead_status',
			label: 'Status',
			minWidth: 120,
			format: (val: string) => <StatusBadge label={val} status={val} type="lead" />
		},
		{
			id: 'lead_score',
			label: 'Score',
			minWidth: 100,
			format: (val: number) => (
				<Stack direction="row" spacing={1} alignItems="center">
					<Box sx={{ width: '100%', mr: 1 }}>
						<Box sx={{ height: 4, bgcolor: '#f2f3f3', borderRadius: 2, width: '60px', position: 'relative' }}>
							<Box sx={{
								height: '100%',
								bgcolor: val > 70 ? '#1d8102' : val > 40 ? '#ff9900' : '#d13212',
								borderRadius: 2,
								width: `${val}%`
							}} />
						</Box>
					</Box>
					<Typography variant="caption" sx={{ fontWeight: 700 }}>{val}%</Typography>
				</Stack>
			)
		},
		{
			id: 'assigned_user',
			label: 'Owner',
			minWidth: 150,
			format: (val: any) => val ? (
				<Stack direction="row" spacing={1} alignItems="center">
					<Box sx={{
						width: 24,
						height: 24,
						bgcolor: '#ec7211',
						borderRadius: '50%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: 'white',
						fontSize: '0.7rem',
						fontWeight: 700
					}}>
						{getInitials(val.full_name)}
					</Box>
					<Typography variant="body2">{val.full_name}</Typography>
				</Stack>
			) : '-'
		},
		{
			id: 'expected_close_date',
			label: 'Target Date',
			minWidth: 120,
			format: (val: string) => val ? new Date(val).toLocaleDateString() : '-'
		},
		{
			id: 'estimated_value',
			label: 'Value',
			minWidth: 120,
			format: (val: number, row: any) => val ? `${row.currency} ${val.toLocaleString()}` : '-'
		},
		{
			id: 'created_at',
			label: 'Created',
			minWidth: 120,
			format: (val: string) => new Date(val).toLocaleDateString()
		}
	];

	const dealColumns = [
		{
			id: 'title',
			label: 'Deal Title',
			minWidth: 200,
			format: (_: any, row: any) => (
				<Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
					{row.title}
				</Typography>
			)
		},
		{
			id: 'deal_stage',
			label: 'Stage',
			minWidth: 150,
			format: (val: string) => <StatusBadge label={val} status={val} type="deal" />
		},
		{
			id: 'assigned_user',
			label: 'Owner',
			minWidth: 150,
			format: (val: any) => val ? (
				<Stack direction="row" spacing={1} alignItems="center">
					<Box sx={{
						width: 24,
						height: 24,
						bgcolor: '#1d8102',
						borderRadius: '50%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: 'white',
						fontSize: '0.7rem',
						fontWeight: 700
					}}>
						{getInitials(val.full_name)}
					</Box>
					<Typography variant="body2">{val.full_name}</Typography>
				</Stack>
			) : '-'
		},
		{
			id: 'expected_close_date',
			label: 'Target Date',
			minWidth: 150,
			format: (val: string) => val ? new Date(val).toLocaleDateString() : '-'
		},
		{
			id: 'deal_value',
			label: 'Value',
			minWidth: 150,
			format: (val: number, row: any) => `${row.currency} ${val.toLocaleString()}`
		},
		{
			id: 'win_probability',
			label: 'Probability',
			minWidth: 120,
			format: (val: number) => `${val}%`
		}
	];

	const taskColumns = [
		{
			id: 'title',
			label: 'Task',
			minWidth: 200,
			format: (_: any, row: any) => (
				<Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
					{row.title}
				</Typography>
			)
		},
		{
			id: 'task_type',
			label: 'Type',
			minWidth: 100,
			format: (val: string) => <StatusBadge label={val} status={val} type="task" />
		},
		{
			id: 'priority',
			label: 'Priority',
			minWidth: 100,
			format: (val: string) => (
				<Typography
					variant="caption"
					sx={{
						px: 1,
						py: 0.5,
						borderRadius: 1,
						bgcolor: val === 'high' || val === 'urgent' ? '#fde7e9' : '#f2f3f3',
						color: val === 'high' || val === 'urgent' ? '#d13212' : '#545b64',
						fontWeight: 700,
						textTransform: 'uppercase'
					}}
				>
					{val}
				</Typography>
			)
		},
		{
			id: 'status',
			label: 'Status',
			minWidth: 120,
			format: (val: string) => <StatusBadge label={val} status={val} type="task" />
		},
		{
			id: 'assigned_user',
			label: 'Owner',
			minWidth: 150,
			format: (val: any) => val ? (
				<Stack direction="row" spacing={1} alignItems="center">
					<Box sx={{
						width: 24,
						height: 24,
						bgcolor: '#007eb9',
						borderRadius: '50%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: 'white',
						fontSize: '0.7rem',
						fontWeight: 700
					}}>
						{getInitials(val.full_name)}
					</Box>
					<Typography variant="body2">{val.full_name}</Typography>
				</Stack>
			) : '-'
		},
		{
			id: 'due_date',
			label: 'Due Date',
			minWidth: 150,
			format: (val: string) => new Date(val).toLocaleDateString()
		}
	];

	return (
		<Box sx={{ bgcolor: '#f2f3f3', minHeight: '100vh' }}>
			{/* Professional AWS Service Header */}
			<CompanyDetailHeader
				company={company}
				onEdit={() => setEditDialogOpen(true)}
				isMobile={isMobile}
			/>

			{/* Custom Tabs Bar */}
			<Box sx={{ bgcolor: 'white', borderBottom: '1px solid #d5dbdb' }}>
				<Container maxWidth="xl">
					<Tabs
						value={tabIndex}
						onChange={handleTabChange}
						sx={{
							'& .MuiTabs-indicator': { bgcolor: '#ec7211', height: 3 },
							'& .MuiTab-root': {
								textTransform: 'none',
								fontWeight: 700,
								minWidth: 100,
								fontSize: '0.9rem',
								color: '#545b64',
								py: 2,
								'&.Mui-selected': { color: '#16191f' }
							}
						}}
					>
						<Tab label="Overview" />
						<Tab label="Contacts" />
						<Tab label="Leads" />
						<Tab label="Deals" />
						<Tab label="Tasks" />
					</Tabs>
				</Container>
			</Box>

			<Container maxWidth="xl" sx={{ py: 4 }}>
				{tabIndex === 0 && <OverviewTab company={company} />}
				{tabIndex === 1 && <ContactsTab company={company} columns={contactColumns} />}
				{tabIndex === 2 && <LeadsTab company={company} columns={leadColumns} />}
				{tabIndex === 3 && <DealsTab company={company} columns={dealColumns} />}
				{tabIndex === 4 && <TasksTab company={company} columns={taskColumns} />}
			</Container>

			<CompanyFormDialog
				open={editDialogOpen}
				onClose={() => setEditDialogOpen(false)}
				onSubmit={handleEditSubmit}
				company={company}
				loading={formLoading}
			/>
		</Box>
	);
};

export default CompanyDetail;
