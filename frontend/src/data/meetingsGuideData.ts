import {
	HelpOutline, EventRepeatOutlined, PublicOutlined, VideoCallOutlined,
	GroupsOutlined, NotesOutlined, HistoryOutlined, UpdateOutlined,
	SettingsOutlined, ChevronRight,
} from '@mui/icons-material';
import type { HelpGuideContent } from '../components/common/guide/HelpGuideDrawer';

export const MEETINGS_GUIDE_CONTENT: HelpGuideContent = {
	icon: HelpOutline,
	title: 'Meetings Module Guide',
	subtitle: 'Schedule and manage client meetings',
	banner: {
		title: 'New to the Meetings Module?',
		description: 'Learn how to book a meeting, invite teammates and guests, set up recurring series, and manage the full lifecycle from reschedule to completion.',
	},
	tabs: [
		{
			label: 'Getting Started',
			intro: 'The Meetings module lets you book client meetings directly — the client always gets a calendar invite automatically. Follow this standard workflow:',
			steps: [
				{
					marker: '1',
					title: 'Create a Meeting',
					description: 'Click + New Meeting or click a slot on the Calendar tab. Search your CRM contacts or type a brand-new client\'s name and email.',
				},
				{
					marker: '2',
					title: 'Set the Schedule',
					description: 'Pick the date, start time, and duration. Set a repeat rule for recurring series, and confirm the timezone the client should see times in.',
				},
				{
					marker: '3',
					title: 'Add Location & Guests',
					description: 'Choose video call, in person, or phone, then optionally invite teammates (they get their own invite too) and additional guests by email.',
				},
				{
					marker: '✓',
					accent: 'success',
					title: 'Track It Through',
					description: 'From the Calendar, reschedule, cancel, or mark a meeting completed with private outcome notes — everything lands in the History tab.',
				},
			],
		},
		{
			label: 'Interface Tour',
			intro: 'Understanding the key elements on your screen:',
			infoSections: [
				{
					heading: 'Calendar Tab',
					cards: [
						{
							title: 'Week Calendar & Upcoming Panel',
							description: 'The week grid shows all scheduled meetings and lets you drag a card to a new slot to reschedule instantly. The side panel lists what\'s coming up next.',
						},
						{
							title: 'Click-to-Create',
							description: 'Click any empty slot on the calendar to open New Meeting pre-filled with that date and time.',
						},
					],
				},
				{
					heading: 'History Tab',
					cards: [
						{
							title: 'Search, Filter & Review',
							icons: [HistoryOutlined],
							description: 'Every past and cancelled meeting lives here — search by client, filter by status, and review outcome notes your team logged.',
						},
					],
				},
			],
		},
		{
			label: 'Pro Tips',
			intro: 'Tips to help you schedule with confidence:',
			tips: [
				{
					icon: PublicOutlined,
					accent: 'primary',
					title: 'Client Timezone Matters',
					description: 'You always enter times in your own timezone — pick the client\'s timezone in the Schedule step so their invite shows the correct local time.',
				},
				{
					icon: EventRepeatOutlined,
					accent: 'success',
					title: 'Recurring Series',
					description: 'Setting a Repeat rule creates one occurrence per date up to the end date you choose — the client receives a separate invite for each one.',
				},
				{
					icon: VideoCallOutlined,
					accent: 'info',
					title: 'Instant Video Links',
					description: 'For video calls, click Generate to create an instant, keyless meeting link — no account or sign-in required for either side.',
				},
				{
					icon: GroupsOutlined,
					accent: 'warning',
					title: 'Teammates vs. Guests',
					description: 'Teammates you invite get their own calendar invite; additional guest emails just receive the meeting details — use whichever fits.',
				},
				{
					icon: NotesOutlined,
					accent: 'primary',
					title: 'Notes Go On the Invite',
					description: 'Anything typed in the Notes step is embedded in the calendar invite sent to the client and guests — great for an agenda or prep instructions.',
				},
				{
					icon: UpdateOutlined,
					accent: 'success',
					title: 'Reschedule Without Losing Context',
					description: 'Rescheduling keeps the meeting\'s original length and all its guests — only the start time changes, and everyone is notified.',
				},
				{
					icon: SettingsOutlined,
					accent: 'warning',
					title: 'Cancel a Whole Series',
					description: 'Cancelling a recurring meeting gives you the option to cancel just that occurrence, or it and every occurrence after it.',
				},
				{
					icon: ChevronRight,
					accent: 'info',
					title: 'Outcome Notes Stay Internal',
					description: 'When you mark a meeting completed, the outcome notes you add are only visible to your team — never sent to the client.',
				},
			],
		},
	],
};
