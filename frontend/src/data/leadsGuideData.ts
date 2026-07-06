import { HelpOutline, CheckCircleOutline, Call, Email, Groups, LightbulbOutlined, SettingsOutlined, ChevronRight } from '@mui/icons-material';
import type { HelpGuideContent } from '../components/common/guide/HelpGuideDrawer';

export const LEADS_GUIDE_CONTENT: HelpGuideContent = {
	icon: HelpOutline,
	title: 'Leads Module Guide',
	subtitle: 'Master the leads lifecycle',
	banner: {
		title: 'New to the Leads Module?',
		description: 'Learn how to track candidate lifecycles, log communications (Calls, Emails, Meetings), manage files/resumes, and convert qualified profiles into active deals.',
	},
	tabs: [
		{
			label: 'Getting Started',
			intro: 'The Leads module captures initial recruitment/sales opportunities (e.g. candidate registrations) and qualifies them. Follow this standard 4-step lifecycle:',
			steps: [
				{
					marker: '1',
					title: 'Capture Registrations',
					description: 'Add new leads manually using the Create Lead button, or import registrations automatically. Each candidate starts as a New lead in the pipeline.',
				},
				{
					marker: '2',
					title: 'Qualify Candidate',
					description: 'Click any lead row to open their drawer. Expand the Contact card to see their email and phone. Trigger direct communication actions or schedule follow-up activities.',
				},
				{
					marker: '3',
					title: 'Log Communications',
					description: 'Use the Notes Composer to log calls (Connected, No Answer), email exchanges, and meetings. Document transcripts in the rich editor to keep the whole team synced on the Timeline.',
				},
				{
					marker: '✓',
					accent: 'success',
					title: 'Convert to Active Deal',
					description: 'Once qualified, click the Convert button. This automatically creates an active Deal (for placement), constructs a Company profile, and migrates the lead to a structured Contact.',
				},
			],
		},
		{
			label: 'Interface Tour',
			intro: 'Understanding the key elements on your screen:',
			infoSections: [
				{
					heading: 'Dashboard Analytics',
					cards: [
						{
							title: 'Conversion Metrics Panel',
							description: 'The stats banner at the top tracks your active leads count, contacted leads, qualified percentages, and lead conversion rates. Ideal for keeping tab on operations.',
						},
						{
							title: 'Source Breakdown (Left Sidebar)',
							description: 'Shows a graphical breakdown of where your leads originated (e.g. Website, Referral, Cold Outreach, Campaign). Helps optimize recruitment channels.',
						},
					],
				},
				{
					heading: 'Activity & Attachments',
					cards: [
						{
							title: 'Notes Composer Tabs',
							icons: [Call, Email, Groups, CheckCircleOutline],
							description: 'Switch tabs to document different communication mediums. Supports rich-text descriptions, outcome flags, and schedules follow-up due dates.',
						},
						{
							title: 'Files Storage Manager',
							description: 'Allows uploading resumes, transcripts, or profiles. Segmented securely in the backend by organization tenant ID and uploader user ID.',
						},
					],
				},
			],
		},
		{
			label: 'Pro Tips',
			intro: 'Tips from expert CRM users to help you work faster and smarter:',
			tips: [
				{
					icon: LightbulbOutlined,
					accent: 'primary',
					title: 'Auto-Generated Subjects',
					description: 'When logging calls, emails, or meetings in the composer, you can leave the subject line blank! The system will automatically build a descriptive subject like `Outbound Call - Connected` or `Meeting (Online) - Scheduled`.',
				},
				{
					icon: SettingsOutlined,
					accent: 'success',
					title: 'Pending vs Completed Dates',
					description: 'Setting a Meeting outcome to `Scheduled` sets its date label to Scheduled Meeting Time and saves it as Pending. Once the meeting completes, update it to `Completed` to automatically label it Meeting Time and mark it as Completed.',
				},
				{
					icon: ChevronRight,
					accent: 'warning',
					title: 'Bulk Status Updating',
					description: 'Need to assign or change status for multiple leads at once? Click the bulk checkboxes on the left of the table. A bottom action bar will slide up, letting you update ownership or status in one single batch.',
				},
			],
		},
	],
};
