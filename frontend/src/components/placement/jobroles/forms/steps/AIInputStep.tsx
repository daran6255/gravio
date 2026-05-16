import React from 'react';
import {
	Box,
	Typography,
	Paper,
	Divider,
	TextField,
	Button,
	alpha,
	CircularProgress,
	useTheme
} from '@mui/material';
import {
	CloudUpload as UploadIcon,
	AssignmentTurnedIn as VerifiedIcon,
} from '@mui/icons-material';

interface AIInputStepProps {
	jdText: string;
	setJdText: (text: string) => void;
	selectedFile: File | null;
	setSelectedFile: (file: File | null) => void;
	dragActive: boolean;
	handleDrag: (e: React.DragEvent) => void;
	handleDrop: (e: React.DragEvent) => void;
	handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	isExtracting?: boolean;
}

const AIInputStep: React.FC<AIInputStepProps> = ({
	jdText,
	setJdText,
	selectedFile,
	setSelectedFile,
	dragActive,
	handleDrag,
	handleDrop,
	handleFileChange,
	isExtracting = false
}) => {
	const theme = useTheme();

	return (
		<Box sx={{ p: 4, position: 'relative' }}>
			{isExtracting && (
				<Box sx={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					zIndex: 20,
					bgcolor: alpha(theme.palette.background.paper, 0.8),
					backdropFilter: 'blur(4px)',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					borderRadius: '8px',
					animation: 'fadeIn 0.3s ease-out'
				}}>
					<Box sx={{ mb: 3, position: 'relative', display: 'flex' }}>
						<CircularProgress size={64} thickness={2} sx={{ color: theme.palette.primary.main }} />
						<UploadIcon sx={{
							position: 'absolute',
							top: '50%',
							left: '50%',
							transform: 'translate(-50%, -50%)',
							color: theme.palette.primary.main,
							animation: 'pulse 1.5s infinite ease-in-out'
						}} />
					</Box>
					<Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
						AI Architect is Analyzing...
					</Typography>
					<Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 300, textAlign: 'center' }}>
						Extracting skills, qualifications, and company details to build your talent requisition.
					</Typography>

					<style>
						{`
							@keyframes fadeIn {
								from { opacity: 0; }
								to { opacity: 1; }
							}
							@keyframes pulse {
								0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
								50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
								100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
							}
						`}
					</style>
				</Box>
			)}
			<Box sx={{ maxWidth: 800, mx: 'auto' }}>
				<Typography
					variant="h6"
					sx={{
						mb: 1,
						display: 'flex',
						alignItems: 'center',
						gap: 1.5,
						color: 'text.primary',
						fontWeight: 700
					}}
				>
					<Box sx={{
						p: 1,
						bgcolor: alpha(theme.palette.primary.main, 0.1),
						color: theme.palette.primary.main,
						borderRadius: '8px',
						display: 'flex'
					}}>
						<UploadIcon fontSize="small" />
					</Box>
					Attach Source Document
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 4, ml: 6 }}>
					Accelerate your workflow with AI-assisted data mapping by providing a job description.
				</Typography>

				<Paper
					elevation={0}
					sx={{
						p: 4,
						border: `1px solid ${theme.palette.divider}`,
						borderRadius: '12px',
						bgcolor: '#fff'
					}}
				>
					<Box
						onDragEnter={handleDrag}
						onDragLeave={handleDrag}
						onDragOver={handleDrag}
						onDrop={handleDrop}
						sx={{
							p: 5,
							mb: 4,
							border: '2px dashed',
							borderColor: dragActive ? 'primary.main' : theme.palette.divider,
							borderRadius: '8px',
							bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.02) : '#f8fafc',
							textAlign: 'center',
							transition: 'all 0.2s',
							cursor: 'pointer',
							'&:hover': {
								borderColor: theme.palette.primary.main,
								bgcolor: alpha(theme.palette.primary.main, 0.02)
							}
						}}
						onClick={() => !selectedFile && document.querySelector('input[type="file"]')?.dispatchEvent(new MouseEvent('click'))}
					>
						{selectedFile ? (
							<Box sx={{ py: 1 }}>
								<VerifiedIcon sx={{ color: 'success.main', fontSize: 40, mb: 1 }} />
								<Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
									{selectedFile.name}
								</Typography>
								<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
									PDF Document Ready for Analysis
								</Typography>
								<Button
									size="small"
									variant="text"
									color="error"
									onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
									sx={{ mt: 2, fontWeight: 700 }}
								>
									Replace Document
								</Button>
							</Box>
						) : (
							<Box>
								<UploadIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 2 }} />
								<Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
									Drag & Drop PDF or click to browse
								</Typography>
								<Typography variant="caption" color="text.secondary">Support PDF only (max 10MB)</Typography>
								<input type="file" hidden accept=".pdf" onChange={handleFileChange} />
							</Box>
						)}
					</Box>

					<Divider sx={{ mb: 4 }}>
						<Typography
							variant="caption"
							sx={{
								color: 'text.secondary',
								fontWeight: 700,
								letterSpacing: '0.1em'
							}}
						>
							OR PASTE JOB DESCRIPTION
						</Typography>
					</Divider>

					<Typography
						variant="caption"
						sx={{
							display: 'block',
							mb: 1,
							fontWeight: 700,
							color: 'text.secondary',
							textTransform: 'uppercase'
						}}
					>
						Raw Content
					</Typography>
					<TextField
						multiline
						rows={10}
						fullWidth
						placeholder="Paste the job description text here for extraction..."
						value={jdText}
						onChange={(e) => { setJdText(e.target.value); if (e.target.value) setSelectedFile(null); }}
						sx={{
							'& .MuiInputBase-root': { bgcolor: '#fff', borderRadius: '8px' },
							'& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }
						}}
					/>
				</Paper>
			</Box>
		</Box>
	);
};

export default AIInputStep;
