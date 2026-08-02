import React from 'react';
import { Drawer, Box, useTheme } from '@mui/material';
import { IrisPanelHeader } from './IrisPanelHeader';
import { IrisChatBody, type IrisQuickAction } from './IrisChatBody';
import { useIrisChatPanel } from './useIrisChatPanel';

interface IrisContextPanelProps {
	open: boolean;
	onClose: () => void;
	/** e.g. "AI co-worker" (global drawer), "Leave assistant", "Timesheet assistant". */
	subtitle: string;
	/** Scopes this panel's session history to its own conversations and grounds the planner
	 * with a one-line "opened from the X module" note. Omit for the global chat drawer (shows
	 * every conversation, no grounding note) -- see AIChatSession.context_module. */
	contextModule?: string;
	contextEntityId?: string;
	quickActions: IrisQuickAction[];
	emptyGreeting?: string;
	emptySubtitle?: string;
	/** Fires after a message finishes streaming and after an approve/reject decision resolves
	 * -- lets the calling page refresh its own data (e.g. reload the timesheet grid) the same
	 * way the old preview/confirm panels' onActionConfirmed did. */
	onActionCompleted?: () => void;
}

/** A fully self-contained IRIS chat surface: Drawer + header + session history/thread + input.
 * Used by the global ChatDrawer and the three simple per-module panels (Timesheet/Leave/
 * Meeting). IrisTaskPanel does NOT use this directly -- it has its own Drawer with extra
 * Insights/Estimate sections, so it calls `useIrisChatPanel` + renders `IrisPanelHeader`/
 * `IrisChatBody` itself instead (see that file for why). */
export const IrisContextPanel: React.FC<IrisContextPanelProps> = ({
	open, onClose, subtitle, contextModule, contextEntityId, quickActions, emptyGreeting, emptySubtitle, onActionCompleted,
}) => {
	const theme = useTheme();
	const panel = useIrisChatPanel(open, contextModule, contextEntityId, onActionCompleted);
	const { showSessions, setShowSessions, expanded, setExpanded, handleNewChat, reducedMotion } = panel;

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: {
					width: { xs: '100%', sm: expanded ? 560 : 420 },
					maxWidth: '100%',
					// The app's global MuiDrawer override hardcodes a dark paper background/text
					// color regardless of light/dark mode -- override back to real theme colors,
					// same as every other drawer in the app (IrisTaskPanel, ProjectTaskDetailDrawer).
					bgcolor: theme.palette.background.paper,
					color: theme.palette.text.primary,
					boxShadow: 'none',
					transition: reducedMotion ? 'none' : 'width 200ms ease',
				},
			}}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
				<IrisPanelHeader
					subtitle={subtitle}
					onClose={onClose}
					showSessions={showSessions}
					onBack={() => setShowSessions(false)}
					onNewChat={handleNewChat}
					onShowHistory={() => setShowSessions(true)}
					expanded={expanded}
					onExpandToggle={() => setExpanded((v) => !v)}
				/>
				<IrisChatBody panel={panel} quickActions={quickActions} emptyGreeting={emptyGreeting} emptySubtitle={emptySubtitle} />
			</Box>
		</Drawer>
	);
};

export default IrisContextPanel;
