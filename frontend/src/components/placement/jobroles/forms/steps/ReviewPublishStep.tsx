import React from 'react';
import { 
	Box, 
	Typography, 
	Paper, 
	Stack, 
	Divider, 
	Button, 
	Alert,
	alpha,
	useTheme
} from '@mui/material';
import {
	AutoAwesome as MagicIcon,
	CloudUpload as UploadIcon,
	AssignmentTurnedIn as VerifiedIcon,
} from '@mui/icons-material';
import GeneralInfoTab from '../tabs/GeneralInfoTab';
import JobDescriptionTab from '../tabs/JobDescriptionTab';
import LocationWorkplaceTab from '../tabs/LocationWorkplaceTab';
import RequirementsCompensationTab from '../tabs/RequirementsCompensationTab';
import { WORKPLACE_TYPES, JOB_TYPES } from '../../../../../data/jobRoleData';
import type { JobRole } from '../../../../../models/jobRole';
import type { Company } from '../../../../../models/company';
import type { Contact } from '../../../../../models/contact';

interface ReviewPublishStepProps {
	formData: Partial<JobRole>;
	handleChange: (field: string, value: unknown) => void;
	handleNestedChange: (parent: string, field: string, value: unknown) => void;
	companies: Company[];
	contacts: Contact[];
	suggestions: any;
	pendingEntities: any;
	setPendingEntities: any;
	validation: any;
	reviewTabValue: number;
	setReviewTabValue: (val: number) => void;
	showSource: boolean;
	setShowSource: (val: boolean) => void;
}

const ReviewPublishStep: React.FC<ReviewPublishStepProps> = ({
	formData,
	handleChange,
	handleNestedChange,
	companies,
	contacts,
	suggestions,
	pendingEntities,
	setPendingEntities,
	validation,
	reviewTabValue,
	setReviewTabValue,
	showSource,
	setShowSource
}) => {
	const theme = useTheme();

	const tabs = [
		{ label: 'General', icon: <MagicIcon sx={{ fontSize: 16 }} />, valid: validation.basicInfo },
		{ label: 'Job Narrative', icon: <UploadIcon sx={{ fontSize: 16 }} />, valid: validation.description },
		{ label: 'Location', icon: <VerifiedIcon sx={{ fontSize: 16 }} />, valid: validation.location },
		{ label: 'Requirements', icon: <VerifiedIcon sx={{ fontSize: 16 }} />, valid: validation.requirements }
	];

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
			{/* Sub-Header Area within the Step */}
			<Paper 
				elevation={0} 
				sx={{ 
					mb: 3, 
					borderRadius: '8px', 
					border: `1px solid ${theme.palette.divider}`,
					overflow: 'hidden'
				}}
			>
				<Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff' }}>
					<Stack spacing={0.5}>
						<Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
							Data Consistency Review
						</Typography>
						<Typography variant="caption" sx={{ color: 'text.secondary' }}>
							Verify the extracted and manual attributes before publishing.
						</Typography>
					</Stack>

					<Stack direction="row" spacing={2} alignItems="center">
						<Box sx={{ textAlign: 'right' }}>
							<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', textTransform: 'uppercase', fontSize: '0.6rem' }}>
								Status
							</Typography>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: validation.isValid ? 'success.main' : 'warning.main' }} />
								<Typography variant="caption" sx={{ fontWeight: 800, color: validation.isValid ? 'success.main' : 'warning.main' }}>
									{validation.isValid ? 'Ready to Publish' : 'Missing Information'}
								</Typography>
							</Box>
						</Box>
						<Divider orientation="vertical" flexItem sx={{ height: 24, my: 'auto' }} />
						<Button
							size="small"
							variant="text"
							color="primary"
							onClick={() => setShowSource(!showSource)}
							sx={{ fontWeight: 700, textTransform: 'none' }}
						>
							{showSource ? 'Hide Source' : 'Peek Source'}
						</Button>
					</Stack>
				</Box>

				{/* Tab Navigation Area */}
				<Box sx={{ p: 1, bgcolor: '#f8fafc', borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'center' }}>
					<Paper 
						elevation={0} 
						sx={{ 
							p: 0.5, 
							bgcolor: '#e2e8f0', 
							borderRadius: '10px', 
							display: 'inline-flex', 
							gap: 0.5 
						}}
					>
						{tabs.map((tab, idx) => (
							<Button
								key={tab.label}
								onClick={() => setReviewTabValue(idx)}
								variant="text"
								size="small"
								sx={{
									px: 2.5,
									py: 0.5,
									borderRadius: '8px',
									color: reviewTabValue === idx ? '#fff' : 'text.secondary',
									bgcolor: reviewTabValue === idx ? 'secondary.main' : 'transparent',
									fontWeight: 700,
									fontSize: '0.75rem',
									'&:hover': {
										bgcolor: reviewTabValue === idx ? 'secondary.main' : 'rgba(15, 23, 42, 0.08)'
									}
								}}
							>
								{tab.label}
								{!tab.valid && (
									<Box sx={{ width: 6, height: 6, bgcolor: 'error.main', borderRadius: '50%', ml: 1 }} />
								)}
							</Button>
						))}
					</Paper>
				</Box>
			</Paper>

			{/* Form Fields Area */}
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				{!validation.isValid && (
					<Alert
						severity="warning"
						sx={{ mb: 3, width: '100%', borderRadius: '8px', border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}
					>
						<Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
							Incomplete Requisition:
						</Typography>
						<Typography variant="caption">
							Please complete the mandatory fields in sections marked with a red dot before publishing.
						</Typography>
					</Alert>
				)}
				
				<Box sx={{ width: '100%' }}>
					{reviewTabValue === 0 && (
						<GeneralInfoTab
							formData={formData}
							handleChange={handleChange}
							handleNestedChange={handleNestedChange}
							companies={companies}
							contacts={contacts}
							suggestions={suggestions}
							pendingEntities={pendingEntities}
							setPendingEntities={setPendingEntities}
							highlightMissing={true}
						/>
					)}
					{reviewTabValue === 1 && (
						<JobDescriptionTab
							formData={formData}
							handleChange={handleChange}
							highlightMissing={true}
						/>
					)}
					{reviewTabValue === 2 && (
						<LocationWorkplaceTab
							formData={formData}
							handleNestedChange={handleNestedChange}
							workplaceTypes={WORKPLACE_TYPES}
							jobTypes={JOB_TYPES}
							highlightMissing={true}
						/>
					)}
					{reviewTabValue === 3 && (
						<RequirementsCompensationTab
							formData={formData}
							handleNestedChange={handleNestedChange}
							highlightMissing={true}
						/>
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default ReviewPublishStep;
