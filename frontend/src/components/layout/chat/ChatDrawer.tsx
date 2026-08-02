import React from 'react';
import {
	CalendarMonthOutlined,
	TodayOutlined,
	GroupsOutlined,
	TrendingUpOutlined,
} from '@mui/icons-material';
import { IrisContextPanel } from '../../common/iris/IrisContextPanel';
import type { IrisQuickAction } from '../../common/iris/IrisChatBody';

interface ChatDrawerProps {
	open: boolean;
	onClose: () => void;
}

// Tapping fills-and-sends immediately -- there's no preview step in this drawer's model
// (unlike IrisTaskPanel's older preview/confirm flow), so "send" is the direct equivalent.
const GLOBAL_QUICK_ACTIONS: IrisQuickAction[] = [
	{ label: "What's on my calendar this week?", icon: <CalendarMonthOutlined sx={{ fontSize: 15 }} />, message: "What's on my calendar this week?" },
	{ label: 'Log 2 hours on a project', icon: <TodayOutlined sx={{ fontSize: 15 }} />, message: 'Log 2 hours on a project for today.' },
	{ label: "Who's on leave today?", icon: <GroupsOutlined sx={{ fontSize: 15 }} />, message: "Who's on leave today?" },
	{ label: 'Show my open deals', icon: <TrendingUpOutlined sx={{ fontSize: 15 }} />, message: 'Show my open deals.' },
];

/** The global "AI co-worker" chat drawer, reachable from anywhere in the app -- a thin
 * wrapper around the shared IrisContextPanel (no contextModule, so its history is unfiltered
 * across every conversation, matching its role as the one always-available entry point).
 * The per-module panels (IrisLeavePanel, IrisTimesheetPanel, IrisMeetingPanel, IrisTaskPanel)
 * are the same underlying experience, just scoped to their own module's conversations. */
export const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onClose }) => (
	<IrisContextPanel open={open} onClose={onClose} subtitle="AI co-worker" quickActions={GLOBAL_QUICK_ACTIONS} />
);

export default ChatDrawer;
