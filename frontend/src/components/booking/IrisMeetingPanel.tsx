import React from 'react';
import { FreeBreakfastOutlined, CalendarViewWeekOutlined, UpdateOutlined } from '@mui/icons-material';
import { IrisContextPanel } from '../common/iris/IrisContextPanel';
import type { IrisQuickAction } from '../common/iris/IrisChatBody';

interface IrisMeetingPanelProps {
	open: boolean;
	onClose: () => void;
	onActionConfirmed?: () => void;
}

const QUICK_ACTIONS: IrisQuickAction[] = [
	{ label: 'Find me a free slot tomorrow', icon: <FreeBreakfastOutlined sx={{ fontSize: 15 }} />, message: 'When am I free tomorrow?' },
	{ label: "What's on my calendar this week", icon: <CalendarViewWeekOutlined sx={{ fontSize: 15 }} />, message: "What's on my calendar this week?" },
	{ label: 'Reschedule my next meeting', icon: <UpdateOutlined sx={{ fontSize: 15 }} />, message: 'I need to reschedule my next meeting.' },
];

/** Thin wrapper around the shared IrisContextPanel, scoped to this user's own "meeting"
 * conversations (see AIChatSession.context_module) -- a real, persisted, multi-turn thread
 * instead of the old stateless preview/confirm flow. */
export const IrisMeetingPanel: React.FC<IrisMeetingPanelProps> = ({ open, onClose, onActionConfirmed }) => (
	<IrisContextPanel
		open={open}
		onClose={onClose}
		subtitle="Meetings assistant"
		contextModule="meeting"
		quickActions={QUICK_ACTIONS}
		emptySubtitle="Ask me to find a free slot, check your calendar, or reschedule a meeting."
		onActionCompleted={onActionConfirmed}
	/>
);

export default IrisMeetingPanel;
