import React from 'react';
import { EventAvailableOutlined, GroupsOutlined, FactCheckOutlined } from '@mui/icons-material';
import { IrisContextPanel } from '../common/iris/IrisContextPanel';
import type { IrisQuickAction } from '../common/iris/IrisChatBody';

interface IrisLeavePanelProps {
	open: boolean;
	onClose: () => void;
	isManagerOrAdmin?: boolean;
	onActionConfirmed?: () => void;
}

/** Thin wrapper around the shared IrisContextPanel, scoped to this user's own "leave"
 * conversations (see AIChatSession.context_module) -- a real, persisted, multi-turn thread
 * instead of the old stateless preview/confirm flow. Manager-only chip is gated the same
 * inline way TimesheetPage/LeaveDashboardPage already gate their own manager-only UI. */
export const IrisLeavePanel: React.FC<IrisLeavePanelProps> = ({ open, onClose, isManagerOrAdmin, onActionConfirmed }) => {
	const quickActions: IrisQuickAction[] = [
		{ label: 'Check my leave balance', icon: <EventAvailableOutlined sx={{ fontSize: 15 }} />, message: 'What is my leave balance?' },
		{ label: 'Apply for leave', icon: <FactCheckOutlined sx={{ fontSize: 15 }} />, message: 'I want to apply for leave.' },
		{ label: "Who's on leave this week", icon: <GroupsOutlined sx={{ fontSize: 15 }} />, message: "Who's on leave this week?" },
		...(isManagerOrAdmin
			? [{ label: 'Review pending requests', icon: <FactCheckOutlined sx={{ fontSize: 15 }} />, message: 'Show me pending leave requests I need to review.' }]
			: []),
	];

	return (
		<IrisContextPanel
			open={open}
			onClose={onClose}
			subtitle="Leave assistant"
			contextModule="leave"
			quickActions={quickActions}
			emptySubtitle="Ask me about your leave balance, requests, or who's out this week."
			onActionCompleted={onActionConfirmed}
		/>
	);
};

export default IrisLeavePanel;
