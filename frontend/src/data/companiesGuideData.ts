import { HelpOutline, Language, Phone, Email, Room, LightbulbOutlined, SettingsOutlined, ChevronRight } from '@mui/icons-material';
import type { HelpGuideContent } from '../components/common/guide/HelpGuideDrawer';

export const COMPANIES_GUIDE_CONTENT: HelpGuideContent = {
	icon: HelpOutline,
	title: 'Companies Module Guide',
	subtitle: 'Manage your account records',
	banner: {
		title: 'New to the Companies Module?',
		description: 'Learn how to record account profiles, link contacts and deals to a company, track engagement, and keep account status current across your pipeline.',
	},
	tabs: [
		{
			label: 'Getting Started',
			intro: 'The Companies module tracks account records for your sales pipeline, linking contacts and deals to a single organization profile. Follow this standard workflow:',
			steps: [
				{
					marker: '1',
					title: 'Add a Company',
					description: 'Click New Company to record a profile with its industry, size, status, and location. Location search is powered by live geocoding, so you can just start typing a city.',
				},
				{
					marker: '2',
					title: 'Link Contacts & Deals',
					description: 'Open a company\'s drawer and use the Contacts and Deals tabs to see everyone and every opportunity tied to this account. New contacts/deals created against this company appear here automatically.',
				},
				{
					marker: '3',
					title: 'Track Engagement',
					description: 'Use the Notes tab to log calls, emails, and meetings against the company itself (not just individual contacts) to keep a shared account-level history.',
				},
				{
					marker: '✓',
					accent: 'success',
					title: 'Keep Status Current',
					description: 'Move a company through Prospect, Customer, Partner, or Churned as the relationship evolves, so pipeline reporting and filters stay accurate.',
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
							title: 'Stats Panel',
							description: 'The banner at the top summarizes total companies, and breakdowns by status, so you can gauge account health at a glance.',
						},
						{
							title: 'Industry Breakdown (Left Sidebar)',
							description: 'Shows a graphical breakdown of companies by industry, helping you spot which verticals make up most of your pipeline.',
						},
					],
				},
				{
					heading: 'Company Details Drawer',
					cards: [
						{
							title: 'Contact Information Card',
							icons: [Language, Phone, Email, Room],
							description: 'Shows website, phone, email, location, and full address at a glance, each pulled directly from the company profile.',
						},
						{
							title: 'Quick Stat Tiles',
							description: 'The Deals and Contacts tiles at the top of the drawer jump straight to those tabs, so you can navigate without hunting through menus.',
						},
					],
				},
			],
		},
		{
			label: 'Pro Tips',
			intro: 'Tips to help you manage account records faster and smarter:',
			tips: [
				{
					icon: LightbulbOutlined,
					accent: 'primary',
					title: 'Location Autocomplete',
					description: 'The Location field on the company form suggests real places as you type (e.g. `Bangalore, Karnataka`) using live geocoding — no need to type a full formatted address.',
				},
				{
					icon: SettingsOutlined,
					accent: 'success',
					title: 'Owner Assignment',
					description: 'Assign an Owner to a company so the right teammate is accountable for the account. Owners can be bulk-reassigned from the table using the checkbox selection bar.',
				},
				{
					icon: ChevronRight,
					accent: 'warning',
					title: 'Bulk Status Updating',
					description: 'Need to update status or ownership for multiple companies at once? Select rows with the checkboxes on the left of the table — a bottom action bar lets you batch update them in one go.',
				},
			],
		},
	],
};
