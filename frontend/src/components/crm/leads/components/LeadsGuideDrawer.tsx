import React, { useState } from 'react';
import { Box, Typography, Stack, Tabs, Tab, useTheme } from '@mui/material';
import { HelpOutline, CheckCircleOutline, Call, Email, Groups, LightbulbOutlined, SettingsOutlined, ChevronRight } from '@mui/icons-material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';

interface LeadsGuideDrawerProps {
	open: boolean;
	onClose: () => void;
}

export const LeadsGuideDrawer: React.FC<LeadsGuideDrawerProps> = ({ open, onClose }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [activeTab, setActiveTab] = useState(0);

	const sectionTitleSx = {
		fontWeight: 800,
		fontSize: '0.7rem',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.08em',
		color: 'text.primary',
		mb: 1.5,
		mt: 1.5,
	};

	const stepCardSx = {
		p: 2,
		borderRadius: '12px',
		bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
		border: '1px solid',
		borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
		position: 'relative' as const,
		transition: 'all 0.2s',
		'&:hover': {
			borderColor: 'primary.main',
			bgcolor: isDark ? 'rgba(33, 150, 243, 0.04)' : 'rgba(33, 150, 243, 0.02)',
			transform: 'translateY(-2px)',
		}
	};

	return (
		<DetailDrawer
			open={open}
			onClose={onClose}
			width={520}
			hideDivider
			title={
				<Stack direction="row" spacing={1.5} alignItems="center">
					<Box
						sx={{
							width: 40,
							height: 40,
							borderRadius: '10px',
							bgcolor: 'primary.main',
							color: 'white',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							boxShadow: '0 4px 12px 0 rgba(33, 150, 243, 0.3)',
						}}
					>
						<HelpOutline sx={{ fontSize: 20 }} />
					</Box>
					<Box>
						<Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
							Leads Module Guide
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Master the leads lifecycle
						</Typography>
					</Box>
				</Stack>
			}
		>
			<Tabs
				value={activeTab}
				onChange={(_e, val) => setActiveTab(val)}
				sx={{
					mb: 2.5,
					minHeight: 36,
					borderBottom: '1px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
					'& .MuiTabs-indicator': { height: 2, bgcolor: 'primary.main', borderRadius: '2px 2px 0 0' },
					'& .MuiTab-root': {
						textTransform: 'none',
						fontWeight: 700,
						minHeight: 36,
						px: 2,
						py: 1,
						fontSize: '0.82rem',
						color: 'text.secondary',
						'&.Mui-selected': { color: 'primary.main' },
					},
				}}
			>
				<Tab label="Getting Started" />
				<Tab label="Interface Tour" />
				<Tab label="Pro Tips" />
			</Tabs>

			{/* Getting Started Tab */}
			<Box sx={{ display: activeTab === 0 ? 'flex' : 'none', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: 1, pr: 0.5 }}>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.6 }}>
					The **Leads** module captures initial recruitment/sales opportunities (e.g. candidate registrations) and qualifies them. Follow this standard 4-step lifecycle:
				</Typography>

				<Stack spacing={2}>
					<Box sx={stepCardSx}>
						<Stack direction="row" spacing={2} alignItems="flex-start">
							<Box
								sx={{
									width: 28,
									height: 28,
									borderRadius: '50%',
									bgcolor: 'rgba(33, 150, 243, 0.1)',
									color: 'primary.main',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontWeight: 800,
									fontSize: '0.85rem',
									flexShrink: 0,
								}}
							>
								1
							</Box>
							<Box>
								<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
									Capture Registrations
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
									Add new leads manually using the **Create Lead** button, or import registrations automatically. Each candidate starts as a **New** lead in the pipeline.
								</Typography>
							</Box>
						</Stack>
					</Box>

					<Box sx={stepCardSx}>
						<Stack direction="row" spacing={2} alignItems="flex-start">
							<Box
								sx={{
									width: 28,
									height: 28,
									borderRadius: '50%',
									bgcolor: 'rgba(33, 150, 243, 0.1)',
									color: 'primary.main',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontWeight: 800,
									fontSize: '0.85rem',
									flexShrink: 0,
								}}
							>
								2
							</Box>
							<Box>
								<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
									Qualify Candidate
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
									Click any lead row to open their drawer. Expand the **Contact** card to see their email and phone. Trigger direct communication actions or schedule follow-up activities.
								</Typography>
							</Box>
						</Stack>
					</Box>

					<Box sx={stepCardSx}>
						<Stack direction="row" spacing={2} alignItems="flex-start">
							<Box
								sx={{
									width: 28,
									height: 28,
									borderRadius: '50%',
									bgcolor: 'rgba(33, 150, 243, 0.1)',
									color: 'primary.main',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontWeight: 800,
									fontSize: '0.85rem',
									flexShrink: 0,
								}}
							>
								3
							</Box>
							<Box>
								<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
									Log Communications
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
									Use the **Notes Composer** to log calls (Connected, No Answer), email exchanges, and meetings. Document transcripts in the rich editor to keep the whole team synced on the Timeline.
								</Typography>
							</Box>
						</Stack>
					</Box>

					<Box sx={stepCardSx}>
						<Stack direction="row" spacing={2} alignItems="flex-start">
							<Box
								sx={{
									width: 28,
									height: 28,
									borderRadius: '50%',
									bgcolor: 'rgba(76, 175, 80, 0.1)',
									color: 'success.main',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontWeight: 800,
									fontSize: '0.85rem',
									flexShrink: 0,
								}}
							>
								✓
							</Box>
							<Box>
								<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
									Convert to Active Deal
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
									Once qualified, click the **Convert** button. This automatically creates an active **Deal** (for placement), constructs a **Company** profile, and migrates the lead to a structured **Contact**.
								</Typography>
							</Box>
						</Stack>
					</Box>
				</Stack>
			</Box>

			{/* Interface Tour Tab */}
			<Box sx={{ display: activeTab === 1 ? 'flex' : 'none', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: 1, pr: 0.5 }}>
				<Typography variant="body2" color="text.secondary">
					Understanding the key elements on your screen:
				</Typography>

				<Typography sx={sectionTitleSx}>Dashboard Analytics</Typography>
				<Stack spacing={1.5}>
					<Box sx={{ p: 1.75, borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff' }}>
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
							Conversion Metrics Panel
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
							The stats banner at the top tracks your active leads count, contacted leads, qualified percentages, and lead conversion rates. Ideal for keeping tab on operations.
						</Typography>
					</Box>
					<Box sx={{ p: 1.75, borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff' }}>
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
							Source Breakdown (Left Sidebar)
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
							Shows a graphical breakdown of where your leads originated (e.g. Website, Referral, Cold Outreach, Campaign). Helps optimize recruitment channels.
						</Typography>
					</Box>
				</Stack>

				<Typography sx={sectionTitleSx}>Activity & Attachments</Typography>
				<Stack spacing={1.5}>
					<Box sx={{ p: 1.75, borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff' }}>
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
							Notes Composer Tabs
						</Typography>
						<Stack direction="row" spacing={1.25} sx={{ my: 0.75 }}>
							<Call sx={{ fontSize: 16, color: 'primary.main' }} />
							<Email sx={{ fontSize: 16, color: 'primary.main' }} />
							<Groups sx={{ fontSize: 16, color: 'primary.main' }} />
							<CheckCircleOutline sx={{ fontSize: 16, color: 'primary.main' }} />
						</Stack>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
							Switch tabs to document different communication mediums. Supports rich-text descriptions, outcome flags, and schedules follow-up due dates.
						</Typography>
					</Box>
					<Box sx={{ p: 1.75, borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff' }}>
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
							Files Storage Manager
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
							Allows uploading resumes, transcripts, or profiles. Segmented securely in the backend by organization tenant ID and uploader user ID.
						</Typography>
					</Box>
				</Stack>
			</Box>

			{/* Pro Tips Tab */}
			<Box sx={{ display: activeTab === 2 ? 'flex' : 'none', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: 1, pr: 0.5 }}>
				<Typography variant="body2" color="text.secondary">
					Tips from expert CRM users to help you work faster and smarter:
				</Typography>

				<Stack spacing={2} sx={{ mt: 1 }}>
					<Box
						sx={{
							p: 2,
							borderRadius: '12px',
							borderLeft: '4px solid',
							borderLeftColor: 'primary.main',
							bgcolor: isDark ? 'rgba(33, 150, 243, 0.05)' : 'rgba(33, 150, 243, 0.02)',
						}}
					>
						<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
							<LightbulbOutlined color="primary" sx={{ fontSize: 20 }} />
							<Typography variant="body2" sx={{ fontWeight: 700 }}>
								Auto-Generated Subjects
							</Typography>
						</Stack>
						<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
							When logging calls, emails, or meetings in the composer, you can leave the subject line blank! The system will automatically build a descriptive subject like `Outbound Call - Connected` or `Meeting (Online) - Scheduled`.
						</Typography>
					</Box>

					<Box
						sx={{
							p: 2,
							borderRadius: '12px',
							borderLeft: '4px solid',
							borderLeftColor: 'success.main',
							bgcolor: isDark ? 'rgba(76, 175, 80, 0.05)' : 'rgba(76, 175, 80, 0.02)',
						}}
					>
						<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
							<SettingsOutlined color="success" sx={{ fontSize: 20 }} />
							<Typography variant="body2" sx={{ fontWeight: 700 }}>
								Pending vs Completed Dates
							</Typography>
						</Stack>
						<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
							Setting a Meeting outcome to `Scheduled` sets its date label to **Scheduled Meeting Time** and saves it as **Pending**. Once the meeting completes, update it to `Completed` to automatically label it **Meeting Time** and mark it as **Completed**.
						</Typography>
					</Box>

					<Box
						sx={{
							p: 2,
							borderRadius: '12px',
							borderLeft: '4px solid',
							borderLeftColor: 'warning.main',
							bgcolor: isDark ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.02)',
						}}
					>
						<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
							<ChevronRight color="warning" sx={{ fontSize: 20 }} />
							<Typography variant="body2" sx={{ fontWeight: 700 }}>
								Bulk Status Updating
							</Typography>
						</Stack>
						<Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
							Need to assign or change status for multiple leads at once? Click the bulk checkboxes on the left of the table. A bottom action bar will slide up, letting you update ownership or status in one single batch.
						</Typography>
					</Box>
				</Stack>
			</Box>
		</DetailDrawer>
	);
};

export default LeadsGuideDrawer;
