import React from 'react';
import { TodayOutlined, CalendarViewWeekOutlined, TaskAltOutlined } from '@mui/icons-material';
import { IrisContextPanel } from '../common/iris/IrisContextPanel';
import type { IrisQuickAction } from '../common/iris/IrisChatBody';

interface IrisTimesheetPanelProps {
	open: boolean;
	onClose: () => void;
	onActionConfirmed?: () => void;
}

const QUICK_ACTIONS: IrisQuickAction[] = [
	{ label: "Log today's hours", icon: <TodayOutlined sx={{ fontSize: 15 }} />, message: 'Log my hours for today.' },
	{ label: 'Show my week', icon: <CalendarViewWeekOutlined sx={{ fontSize: 15 }} />, message: 'Show me what I logged this week.' },
	{ label: 'Submit this week', icon: <TaskAltOutlined sx={{ fontSize: 15 }} />, message: "Submit this week's timesheet." },
];

/** Thin wrapper around the shared IrisContextPanel, scoped to this user's own "timesheet"
 * conversations (see AIChatSession.context_module) -- a real, persisted, multi-turn thread
 * instead of the old stateless preview/confirm flow. */
export const IrisTimesheetPanel: React.FC<IrisTimesheetPanelProps> = ({ open, onClose, onActionConfirmed }) => (
	<IrisContextPanel
		open={open}
		onClose={onClose}
		subtitle="Timesheet assistant"
		contextModule="timesheet"
		quickActions={QUICK_ACTIONS}
		emptySubtitle="Ask me to log hours, check your week, or submit a timesheet."
		onActionCompleted={onActionConfirmed}
	/>
);

export default IrisTimesheetPanel;
