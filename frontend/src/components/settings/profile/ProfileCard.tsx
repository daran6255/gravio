import React, { useState } from 'react';
import { Box, Typography, Stack, Avatar, Chip, IconButton, CircularProgress, TextField, alpha } from '@mui/material';
import {
	PhotoCamera as PhotoCameraIcon,
	VerifiedUser as VerifiedIcon,
	Edit as EditIcon,
	Check as SaveIcon,
} from '@mui/icons-material';
import type { HREmployeeResponse } from '../../../models/hr';

interface ProfileCardProps {
	avatar: string | null;
	fullName: string;
	setFullName: (v: string) => void;
	username: string;
	role: string;
	isVerified: boolean;
	employee: HREmployeeResponse | null;
	avatarSaving: boolean;
	handleAvatarClick: () => void;
	handleRemoveAvatar: () => void;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	userInitials: string;
	cardBg: string;
	cardBorder: string;
	mutedColor: string;
	isDark: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
	avatar,
	fullName,
	setFullName,
	username,
	role,
	isVerified,
	employee,
	avatarSaving,
	handleAvatarClick,
	handleRemoveAvatar,
	fileInputRef,
	handleAvatarChange,
	userInitials,
	cardBg,
	cardBorder,
	mutedColor,
	isDark,
}) => {
	const [isEditingName, setIsEditingName] = useState(false);

	return (
		<Box
			sx={{
				bgcolor: cardBg,
				border: `1px solid ${cardBorder}`,
				borderRadius: 4,
				boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.25)' : '0 8px 32px rgba(15,23,42,0.06)',
				p: 3.5,
				textAlign: 'center',
			}}
		>
			<Stack alignItems="center" spacing={1.5}>
				<Box sx={{ position: 'relative' }}>
					<Avatar
						src={avatar || undefined}
						sx={{
							width: 108,
							height: 108,
							bgcolor: alpha('#8B7CF6', 0.2),
							color: '#8B7CF6',
							fontSize: '2rem',
							fontWeight: 800,
							border: `3px solid ${alpha('#8B7CF6', 0.3)}`,
							boxShadow: `0 8px 24px ${alpha('#8B7CF6', isDark ? 0.35 : 0.22)}`,
						}}
					>
						{!avatar && userInitials}
					</Avatar>
					<IconButton
						onClick={handleAvatarClick}
						disabled={avatarSaving}
						aria-label="Change profile photo"
						sx={{
							position: 'absolute',
							bottom: 0,
							right: 0,
							width: 34,
							height: 34,
							bgcolor: '#8B7CF6',
							color: '#ffffff',
							border: `2px solid ${cardBg}`,
							boxShadow: `0 2px 8px ${alpha('#8B7CF6', 0.4)}`,
							'&:hover': { bgcolor: '#7a6ae6' },
							'&.Mui-disabled': { bgcolor: alpha('#8B7CF6', 0.5), color: '#ffffff' },
						}}
					>
						{avatarSaving ? <CircularProgress size={16} color="inherit" /> : <PhotoCameraIcon sx={{ fontSize: 16 }} />}
					</IconButton>
					<input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
				</Box>
				{avatar && (
					<Typography
						variant="caption"
						onClick={avatarSaving ? undefined : handleRemoveAvatar}
						sx={{
							color: '#ef4444',
							fontWeight: 600,
							cursor: avatarSaving ? 'default' : 'pointer',
							opacity: avatarSaving ? 0.5 : 1,
							'&:hover': avatarSaving ? undefined : { textDecoration: 'underline' },
						}}
					>
						Remove photo
					</Typography>
				)}

				<Box sx={{ width: '100%', overflow: 'hidden' }}>
					{isEditingName ? (
						<Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ width: '100%', mb: 0.5 }}>
							<TextField
								size="small"
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
								autoFocus
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										setIsEditingName(false);
									}
								}}
								sx={{
									'& .MuiOutlinedInput-root': {
										bgcolor: isDark ? '#1a1e28' : '#f8fafc',
										borderRadius: 2,
										maxHeight: '34px',
									},
									'& .MuiInputBase-input': {
										color: isDark ? '#F4F5F7' : '#1e293b',
										fontWeight: 800,
										textAlign: 'center',
										py: 0.75,
										fontSize: '0.95rem',
									},
								}}
							/>
							<IconButton size="small" onClick={() => setIsEditingName(false)} sx={{ color: '#10b981' }}>
								<SaveIcon sx={{ fontSize: 18 }} />
							</IconButton>
						</Stack>
					) : (
						<Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ mb: 0.5 }}>
							<Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#F4F5F7' : '#1e293b' }} noWrap>
								{fullName || username}
							</Typography>
							<IconButton size="small" onClick={() => setIsEditingName(true)} sx={{ color: mutedColor }}>
								<EditIcon sx={{ fontSize: 16 }} />
							</IconButton>
						</Stack>
					)}
					<Typography variant="caption" sx={{ color: mutedColor }}>
						@{username}
					</Typography>
				</Box>

				<Stack direction="row" spacing={1} justifyContent="center" useFlexGap flexWrap="wrap">
					<Chip
						label={role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Member'}
						size="small"
						sx={{ bgcolor: alpha('#8B7CF6', isDark ? 0.18 : 0.12), color: '#8B7CF6', fontWeight: 700, fontSize: '0.7rem' }}
					/>
					{isVerified ? (
						<Chip
							icon={<VerifiedIcon sx={{ fontSize: '0.9rem !important' }} />}
							label="Verified"
							size="small"
							sx={{ bgcolor: alpha('#10b981', 0.15), color: '#10b981', fontWeight: 700, fontSize: '0.7rem' }}
						/>
					) : (
						<Chip
							label="Unverified"
							size="small"
							sx={{ bgcolor: alpha('#f59e0b', 0.15), color: '#f59e0b', fontWeight: 700, fontSize: '0.7rem' }}
						/>
					)}
				</Stack>

				{employee?.employee_id && (
					<Typography
						variant="caption"
						sx={{
							display: 'inline-block',
							bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
							border: `1px solid ${cardBorder}`,
							borderRadius: '6px',
							px: 1.5,
							py: 0.5,
							fontWeight: 700,
							color: isDark ? '#F4F5F7' : '#1e293b',
							mt: 0.5,
						}}
					>
						ID: {employee.employee_id}
					</Typography>
				)}
			</Stack>
		</Box>
	);
};

export default ProfileCard;
