import { HelpOutline, NoteAlt, History, Checklist, AttachFile, LightbulbOutlined, SettingsOutlined, ChevronRight } from '@mui/icons-material';
import type { HelpGuideContent } from '../components/common/guide/HelpGuideDrawer';

export const DEALS_GUIDE_CONTENT: HelpGuideContent = {
	icon: HelpOutline,
	title: 'Deals Module Guide',
	subtitle: 'Run your sales pipeline visually',
	tabs: [
		{
			label: 'Getting Started',
			intro: 'The Deals module is a drag-and-drop Kanban board tracking opportunities through your sales pipeline. Follow this standard workflow:',
			steps: [
				{
					marker: '1',
					title: 'Create a Deal',
					description: 'Click New Deal to add an opportunity with its value, description, and associated company/contact. It lands in the first stage of the active pipeline.',
				},
				{
					marker: '2',
					title: 'Move Through Stages',
					description: 'Drag a deal card between columns as it progresses. Dropping into a Won or Lost stage prompts a reason/confirmation before the move is applied.',
				},
				{
					marker: '3',
					title: 'Track Activity',
					description: 'Open a deal\'s drawer to log Notes, manage Tasks, review the History timeline, and attach Files — everything about the deal lives in one place.',
				},
				{
					marker: '✓',
					accent: 'success',
					title: 'Convert on Win',
					description: 'Once a deal is Won, use Convert to Project to automatically spin up a project from it, carrying over the company and contact links.',
				},
			],
		},
		{
			label: 'Interface Tour',
			intro: 'Understanding the key elements on your screen:',
			infoSections: [
				{
					heading: 'Pipeline Board',
					cards: [
						{
							title: 'Pipeline Switcher',
							description: 'If your organization has multiple pipelines, use the dropdown in the header to switch between them — each keeps its own stages and deals.',
						},
						{
							title: 'Manage Stages',
							description: 'Admins and managers can rename, reorder, add, or remove pipeline stages from the Manage Stages button, without losing deals already in progress.',
						},
					],
				},
				{
					heading: 'Deal Drawer Tabs',
					cards: [
						{
							title: 'Notes, History, Tasks & Attachments',
							icons: [NoteAlt, History, Checklist, AttachFile],
							description: 'Each deal drawer has dedicated tabs to log communication notes, review a full change history, manage follow-up tasks, and store related files.',
						},
					],
				},
			],
		},
		{
			label: 'Pro Tips',
			intro: 'Tips to help you run your pipeline faster and smarter:',
			tips: [
				{
					icon: LightbulbOutlined,
					accent: 'primary',
					title: 'Filter by Owner',
					description: 'Use the Owner filter above the board to quickly see only the deals assigned to a specific teammate, without switching pipelines.',
				},
				{
					icon: SettingsOutlined,
					accent: 'success',
					title: 'Won/Lost Reasons',
					description: 'Dropping a card into a Lost stage prompts for a reason — capture it consistently so pipeline reports can show why deals are being lost.',
				},
				{
					icon: ChevronRight,
					accent: 'warning',
					title: 'Search Before You Scroll',
					description: 'With large pipelines, use the Search box above the board to filter cards by name instead of scrolling through every stage column.',
				},
			],
		},
	],
};
