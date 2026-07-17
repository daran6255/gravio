import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
	CheckCircle as CheckCircleIcon,
	RadioButtonUnchecked as PendingIcon,
} from '@mui/icons-material';
import { authPanelContent, type AuthBrandVariant } from '../../data/authPanelData';

interface AuthBrandPanelProps {
	variant?: AuthBrandVariant;
}

const AuthBrandPanel: React.FC<AuthBrandPanelProps> = ({ variant = 'register' }) => {
	const navigate = useNavigate();
	const { title, description, features, steps } = authPanelContent[variant];

	return (
		<Box
			sx={{
				position: 'relative',
				flex: { md: '0 0 50%' },
				display: { xs: 'none', md: 'flex' },
				flexDirection: 'column',
				justifyContent: 'center',
				px: { md: 6, lg: 8 },
				py: 8,
				overflow: 'hidden',
				borderRight: '1px solid rgba(255, 255, 255, 0.07)',
				background: 'linear-gradient(160deg, #141622 0%, #0c0e17 55%, #0a0b12 100%)',
				backgroundImage:
					'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(160deg, #141622 0%, #0c0e17 55%, #0a0b12 100%)',
				backgroundSize: '22px 22px, 100% 100%',
			}}
		>
			{/* Decorative gradient glows */}
			<Box
				sx={{
					position: 'absolute',
					top: '-10%',
					left: '-15%',
					width: 360,
					height: 360,
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(139, 124, 246, 0.22) 0%, rgba(139, 124, 246, 0) 70%)',
					pointerEvents: 'none',
				}}
			/>
			<Box
				sx={{
					position: 'absolute',
					bottom: '-15%',
					right: '-15%',
					width: 420,
					height: 420,
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(78, 168, 255, 0.18) 0%, rgba(78, 168, 255, 0) 70%)',
					pointerEvents: 'none',
				}}
			/>

			<Box sx={{ position: 'relative', maxWidth: 420 }}>
				<Box
					component="img"
					src="/assets/img/logo/gravit-dark.svg"
					alt="Gravit"
					sx={{ height: 60, cursor: 'pointer', mb: 5 }}
					onClick={() => navigate('/')}
				/>

				<Typography component="h2" variant="h4" sx={{ fontWeight: 800, color: '#F4F5F7', mb: 2, lineHeight: 1.25 }}>
					{title}
				</Typography>
				<Typography variant="body1" sx={{ color: '#94A3B8', mb: 6, lineHeight: 1.6 }}>
					{description}
				</Typography>

				{steps ? (
					<Box sx={{ display: 'flex', flexDirection: 'column' }}>
						{steps.map((step, index) => (
							<Box key={step.label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
								<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
									{step.status === 'done' ? (
										<CheckCircleIcon sx={{ color: '#10b981', fontSize: 24 }} />
									) : step.status === 'current' ? (
										<Box
											sx={{
												width: 24,
												height: 24,
												borderRadius: '50%',
												border: '2px solid #8B7CF6',
												bgcolor: 'rgba(139, 124, 246, 0.15)',
											}}
										/>
									) : (
										<PendingIcon sx={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: 24 }} />
									)}
									{index < steps.length - 1 && (
										<Box
											sx={{
												width: '2px',
												flex: 1,
												minHeight: 28,
												my: 0.5,
												bgcolor:
													step.status === 'upcoming' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(139, 124, 246, 0.4)',
											}}
										/>
									)}
								</Box>
								<Box sx={{ pb: 3.5 }}>
									<Typography
										variant="subtitle2"
										sx={{
											fontWeight: 700,
											color: step.status === 'upcoming' ? '#64748b' : '#F4F5F7',
											mb: 0.25,
										}}
									>
										{step.label}
									</Typography>
									<Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.5 }}>
										{step.description}
									</Typography>
								</Box>
							</Box>
						))}
					</Box>
				) : (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
						{(features ?? []).map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
							<Box key={itemTitle} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
								<Box
									sx={{
										flexShrink: 0,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										width: 40,
										height: 40,
										borderRadius: 1.5,
										bgcolor: 'rgba(139, 124, 246, 0.1)',
										border: '1px solid rgba(139, 124, 246, 0.15)',
									}}
								>
									<Icon sx={{ color: '#8B7CF6', fontSize: 20 }} />
								</Box>
								<Box>
									<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 0.25 }}>
										{itemTitle}
									</Typography>
									<Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.5 }}>
										{itemDescription}
									</Typography>
								</Box>
							</Box>
						))}
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default AuthBrandPanel;
