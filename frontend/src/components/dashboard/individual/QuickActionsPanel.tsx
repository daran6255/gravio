import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, Typography, Box, useTheme, ButtonBase, alpha } from '@mui/material';
import {
	FlashOnOutlined,
	FolderOpenOutlined,
	AccessTimeOutlined,
	GroupsOutlined,
	ChevronRight,
} from '@mui/icons-material';

interface QuickAction {
	label: string;
	desc: string;
	to: string;
	icon: React.ReactElement;
	color: string;
}

const ACTIONS: QuickAction[] = [
	{ label: 'Start a Project', desc: 'Spin up a new project to track work', to: '/projects', icon: <FolderOpenOutlined sx={{ fontSize: 20 }} />, color: '#8B7CF6' },
	{ label: 'Log Time', desc: "Record today's hours", to: '/timesheets', icon: <AccessTimeOutlined sx={{ fontSize: 20 }} />, color: '#4EA8FF' },
	{ label: 'Convert to Team', desc: 'Bring collaborators onto your workspace', to: '/settings', icon: <GroupsOutlined sx={{ fontSize: 20 }} />, color: '#10B981' },
];

export const QuickActionsPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Card
			sx={{
				borderRadius: '16px',
				height: '100%',
				background: isDark
					? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
					: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)',
				backdropFilter: 'blur(20px)',
				border: `1px solid ${theme.palette.divider}`,
				boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 8px 32px 0 rgba(139, 124, 246, 0.04)',
			}}
		>
			<CardContent sx={{ p: 2.5 }}>
				<Box display="flex" alignItems="center" gap={1.25} sx={{ mb: 2 }}>
					<FlashOnOutlined color="primary" sx={{ fontSize: 20 }} />
					<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
						Quick Actions
					</Typography>
				</Box>

				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
					{ACTIONS.map((action) => (
						<ButtonBase
							key={action.label}
							component={RouterLink}
							to={action.to}
							sx={{
								display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '12px',
								justifyContent: 'flex-start', textAlign: 'left', width: '100%',
								bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
								border: `1px solid ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}`,
								transition: 'all 0.2s ease',
								'&:hover': { bgcolor: alpha(action.color, 0.06), borderColor: alpha(action.color, 0.3) },
							}}
						>
							<Box sx={{ width: 38, height: 38, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(action.color, 0.12), color: action.color, flexShrink: 0 }}>
								{action.icon}
							</Box>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{action.label}</Typography>
								<Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{action.desc}</Typography>
							</Box>
							<ChevronRight sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
						</ButtonBase>
					))}
				</Box>
			</CardContent>
		</Card>
	);
};

export default QuickActionsPanel;
