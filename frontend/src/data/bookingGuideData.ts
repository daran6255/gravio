import { CalendarMonthOutlined, LinkOutlined, VideocamOutlined, EventBusyOutlined, ScheduleOutlined, LightbulbOutlined, WarningAmberOutlined } from '@mui/icons-material';
import type { HelpGuideContent } from '../components/common/guide/HelpGuideDrawer';

export const BOOKING_GUIDE_CONTENT: HelpGuideContent = {
	icon: CalendarMonthOutlined,
	title: 'Booking Page Guide',
	subtitle: 'Let clients schedule time with you automatically',
	banner: {
		title: 'New to the Booking Scheduler?',
		description: 'Set up one link clients use to book a meeting with you directly — no back-and-forth emails. This guide walks through every setting on this page.',
	},
	tabs: [
		{
			label: 'Getting Started',
			intro: 'Set up your booking page in four steps:',
			steps: [
				{
					marker: '1',
					title: 'Name your page & pick a link',
					description: 'Give the meeting a title (e.g. "30 Minute Discovery Call") and choose the web link clients will visit. The link can\'t be changed once saved, so pick something memorable.',
				},
				{
					marker: '2',
					title: 'Choose how the meeting happens',
					description: 'Google Meet generates a video link automatically for every booking. In Person shows your address with a map link. Phone Call just needs a number.',
				},
				{
					marker: '3',
					title: 'Set your weekly hours',
					description: 'Turn on the days you\'re available and set a time range for each. Clients can only pick slots inside these hours.',
				},
				{
					marker: '✓',
					accent: 'success',
					title: 'Save and share your link',
					description: 'Once saved, copy your link from the General Information card and share it anywhere — email signature, website, WhatsApp. Clients pick a time and you both get a calendar invite automatically.',
				},
			],
		},
		{
			label: 'Interface Tour',
			intro: 'What each card on this page controls:',
			infoSections: [
				{
					heading: 'Left column',
					cards: [
						{
							title: 'General Information',
							icons: [LinkOutlined],
							description: 'The basics: your public link, meeting title, description, how long meetings last, and whether they\'re online, in-person, or a phone call.',
						},
						{
							title: 'Location Details',
							icons: [VideocamOutlined],
							description: 'Connect Google Calendar here so meetings get a real Meet link automatically. Not connected yet? Clients still get a working calendar invite by email — this just adds the automatic video link.',
						},
						{
							title: 'Scheduling Controls',
							icons: [ScheduleOutlined],
							description: 'Fine-tune the booking experience: padding time around meetings, how much advance notice you need, and a daily booking cap.',
						},
					],
				},
				{
					heading: 'Right column',
					cards: [
						{
							title: 'Weekly Hours',
							description: 'Your recurring availability, day by day. "Copy to All" applies Monday\'s hours to every day in one click.',
						},
						{
							title: 'PTO & Exceptions',
							icons: [EventBusyOutlined],
							description: 'Block a specific date entirely (holiday, day off) or give it different hours than usual — without touching your regular weekly schedule.',
						},
						{
							title: 'Public Preview',
							description: 'A live look at exactly what a client sees when they open your link, updated as you make changes.',
						},
					],
				},
			],
		},
		{
			label: 'Tips',
			tips: [
				{
					icon: LightbulbOutlined,
					accent: 'info',
					title: 'Minimum notice avoids last-minute surprises',
					description: 'Setting "Minimum Notice" to 60 minutes (default) means clients can\'t book a slot starting in the next hour — enough time for you to be ready.',
				},
				{
					icon: LightbulbOutlined,
					accent: 'info',
					title: 'Buffers protect your calendar',
					description: 'A 15-minute buffer before/after each meeting keeps back-to-back bookings from happening, so you always have breathing room.',
				},
				{
					icon: WarningAmberOutlined,
					accent: 'warning',
					title: 'Deactivating pauses new bookings only',
					description: 'Turning your page to "Inactive" stops new bookings immediately, but any meetings already scheduled are unaffected — you don\'t need to cancel them separately.',
				},
			],
		},
	],
};

export default BOOKING_GUIDE_CONTENT;
