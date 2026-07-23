import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography, Switch, TextField, InputAdornment, IconButton, Button, CircularProgress, Tooltip, alpha, useTheme } from '@mui/material';
import { ContentCopyOutlined, RefreshOutlined, OpenInNewOutlined, PublicOutlined, LockOutlined } from '@mui/icons-material';
import BaseDialog from '../../../common/dialogbox/BaseDialog';
import useToast from '../../../../hooks/useToast';
import projectService from '../../../../services/projectService';
import type { Project, ProjectShareLink } from '../../../../models/projects/project';

interface ProjectShareDialogProps {
	open: boolean;
	onClose: () => void;
	project: Project;
}

const shareUrlFor = (token: string) => `${window.location.origin}/projects/status?token=${token}`;

export const ProjectShareDialog: React.FC<ProjectShareDialogProps> = ({ open, onClose, project }) => {
	const theme = useTheme();
	const toast = useToast();
	const [link, setLink] = useState<ProjectShareLink | null>(null);
	const [loading, setLoading] = useState(false);
	const [toggling, setToggling] = useState(false);
	const [regenerating, setRegenerating] = useState(false);

	useEffect(() => {
		if (!open) return;
		setLoading(true);
		projectService.getShareLink(project.public_id)
			.then(setLink)
			.catch(() => toast.error("Couldn't load this project's share link"))
			.finally(() => setLoading(false));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, project.public_id]);

	const handleToggle = async (checked: boolean) => {
		setToggling(true);
		try {
			const result = checked
				? await projectService.enableShareLink(project.public_id)
				: await projectService.disableShareLink(project.public_id);
			setLink(result);
			toast.success(checked ? 'Client link is live' : 'Client link disabled');
		} catch {
			toast.error('Failed to update sharing');
		} finally {
			setToggling(false);
		}
	};

	const handleRegenerate = async () => {
		setRegenerating(true);
		try {
			const result = await projectService.regenerateShareLink(project.public_id);
			setLink(result);
			toast.success('New link generated — the old link no longer works');
		} catch {
			toast.error('Failed to regenerate the link');
		} finally {
			setRegenerating(false);
		}
	};

	const handleCopy = async () => {
		if (!link?.share_token) return;
		try {
			await navigator.clipboard.writeText(shareUrlFor(link.share_token));
			toast.success('Link copied to clipboard');
		} catch {
			toast.error('Failed to copy link');
		}
	};

	const url = link?.share_token ? shareUrlFor(link.share_token) : '';

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Share with client"
			subtitle="A read-only status page — no login, no budget or internal notes, just progress and task status."
			maxWidth="sm"
		>
			{loading ? (
				<Stack alignItems="center" sx={{ py: 3 }}>
					<CircularProgress size={28} />
				</Stack>
			) : (
				<Stack spacing={2.5}>
					<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.5, borderRadius: '10px', bgcolor: alpha(theme.palette.text.secondary, 0.05) }}>
						<Stack direction="row" spacing={1.25} alignItems="center">
							{link?.share_enabled ? (
								<PublicOutlined sx={{ color: 'success.main', fontSize: 20 }} />
							) : (
								<LockOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
							)}
							<Box>
								<Typography variant="body2" sx={{ fontWeight: 700 }}>
									{link?.share_enabled ? 'Sharing is on' : 'Sharing is off'}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{link?.share_enabled ? 'Anyone with the link can view this status page' : 'Turn on to generate a client-facing link'}
								</Typography>
							</Box>
						</Stack>
						<Switch checked={!!link?.share_enabled} disabled={toggling} onChange={(e) => handleToggle(e.target.checked)} />
					</Stack>

					{link?.share_enabled && link.share_token && (
						<Stack spacing={1}>
							<TextField
								value={url}
								size="small"
								fullWidth
								InputProps={{
									readOnly: true,
									endAdornment: (
										<InputAdornment position="end">
											<Tooltip title="Copy link">
												<IconButton size="small" onClick={handleCopy}>
													<ContentCopyOutlined fontSize="small" />
												</IconButton>
											</Tooltip>
											<Tooltip title="Open in new tab">
												<IconButton size="small" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
													<OpenInNewOutlined fontSize="small" />
												</IconButton>
											</Tooltip>
										</InputAdornment>
									),
								}}
							/>
							<Button
								size="small"
								startIcon={regenerating ? <CircularProgress size={14} /> : <RefreshOutlined fontSize="small" />}
								disabled={regenerating}
								onClick={handleRegenerate}
								sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 600 }}
							>
								Regenerate link
							</Button>
							<Typography variant="caption" color="text.secondary">
								Regenerating invalidates the current link — anyone who had it will lose access.
							</Typography>
						</Stack>
					)}
				</Stack>
			)}
		</BaseDialog>
	);
};

export default ProjectShareDialog;
