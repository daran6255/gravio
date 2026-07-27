import React, { useRef, useState } from 'react';
import { Box, Button, CircularProgress, Container, Stack, TextField, Typography, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
	MailOutline as MailIcon,
	PhoneInTalkOutlined as PhoneIcon,
	CheckCircleOutline as CheckCircleIcon,
	ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import Reveal from './Reveal';
import contactService from '../../services/contactService';

// Both options resolve to a real mailbox today — "book a call" is framed as a
// reply-with-a-time request rather than a live calendar link, since wiring a
// bare scheduling link needs a host's Gravit booking share link (see /book),
// which doesn't exist for the marketing team yet.
const CONTACT_OPTIONS = [
	{
		icon: MailIcon,
		label: 'Email us directly',
		value: 'hello@gravit.taydens.com',
		description: "We read every message ourselves — usually a reply within one business day.",
		href: 'mailto:hello@gravit.taydens.com',
	},
	{
		icon: PhoneIcon,
		label: 'Prefer to talk it through?',
		value: 'Ask for a call back',
		description: "Tell us a good time to reach you and we'll set up a short call — no sales script.",
		href: 'mailto:hello@gravit.taydens.com?subject=Could%20we%20set%20up%20a%20call%3F',
	},
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
	name: string;
	email: string;
	company: string;
	message: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = { name: '', email: '', company: '', message: '' };

const validate = (form: FormState): FieldErrors => {
	const errors: FieldErrors = {};
	if (!form.name.trim()) errors.name = 'Please enter your name';
	if (!form.email.trim()) errors.email = 'Please enter your work email';
	else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address';
	if (!form.message.trim()) errors.message = "Let us know what you'd like to ask";
	return errors;
};

const ContactSection: React.FC = () => {
	const theme = useTheme();
	const [form, setForm] = useState<FormState>(initialForm);
	const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
	const [submitAttempted, setSubmitAttempted] = useState(false);
	const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

	const nameRef = useRef<HTMLInputElement>(null);
	const emailRef = useRef<HTMLInputElement>(null);
	const messageRef = useRef<HTMLInputElement>(null);

	const errors = validate(form);
	const showError = (field: keyof FormState) => ((touched[field] || submitAttempted) ? errors[field] : undefined);

	const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setForm((f) => ({ ...f, [field]: e.target.value }));
		if (status === 'error') setStatus('idle');
	};

	const handleBlur = (field: keyof FormState) => () => setTouched((t) => ({ ...t, [field]: true }));

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitAttempted(true);
		const currentErrors = validate(form);
		if (Object.keys(currentErrors).length > 0) {
			if (currentErrors.name) nameRef.current?.focus();
			else if (currentErrors.email) emailRef.current?.focus();
			else if (currentErrors.message) messageRef.current?.focus();
			return;
		}

		setStatus('submitting');
		try {
			await contactService.submit({
				name: form.name.trim(),
				email: form.email.trim(),
				company: form.company.trim() || undefined,
				message: form.message.trim(),
			});
			setStatus('success');
			setForm(initialForm);
			setTouched({});
			setSubmitAttempted(false);
		} catch {
			setStatus('error');
		}
	};

	return (
		<Box component="section" id="contact" sx={{ bgcolor: theme.palette.background.paper, py: { xs: 9, md: 12 } }}>
			<Container maxWidth="lg">
				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.95fr 1.05fr' }, gap: { xs: 6, md: 8 }, alignItems: 'start' }}>
					<Reveal>
						<Box>
							<Typography sx={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.accent.dark, mb: 1.5 }}>
								Get In Touch
							</Typography>
							<Typography component="h2" variant="h2" sx={{ color: theme.palette.text.primary, mb: 2 }}>
								Have questions before you start?
							</Typography>
							<Typography sx={{ color: theme.palette.text.secondary, fontSize: '1.05rem', lineHeight: 1.65, mb: 5, maxWidth: 440 }}>
								No sales pitch, no pressure. Ask us anything about Gravit and a real person on the team
								will get back to you — no account required.
							</Typography>

							<Stack spacing={2}>
								{CONTACT_OPTIONS.map((opt) => (
									<Stack
										key={opt.label}
										component="a"
										href={opt.href}
										direction="row"
										spacing={2}
										alignItems="flex-start"
										sx={{
											p: 2.5,
											borderRadius: theme.layout.radius.card,
											border: `1px solid ${theme.palette.divider}`,
											textDecoration: 'none',
											transition: 'border-color 200ms ease-out, background-color 200ms ease-out, transform 200ms ease-out',
											'&:hover': {
												borderColor: alpha(theme.palette.primary.main, 0.4),
												bgcolor: alpha(theme.palette.primary.main, 0.03),
												transform: 'translateY(-2px)',
											},
										}}
									>
										<Box
											sx={{
												width: 44,
												height: 44,
												flexShrink: 0,
												borderRadius: '12px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												bgcolor: alpha(theme.palette.primary.main, 0.1),
											}}
										>
											<opt.icon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
										</Box>
										<Box>
											<Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: theme.palette.text.primary }}>
												{opt.label}
											</Typography>
											<Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: theme.palette.primary.main, mb: 0.25 }}>
												{opt.value}
											</Typography>
											<Typography sx={{ fontSize: '0.82rem', color: theme.palette.text.secondary, lineHeight: 1.5 }}>
												{opt.description}
											</Typography>
										</Box>
									</Stack>
								))}
							</Stack>
						</Box>
					</Reveal>

					<Reveal delay={100}>
						<Box
							component="form"
							noValidate
							onSubmit={handleSubmit}
							sx={{
								p: { xs: 3, sm: 4 },
								borderRadius: theme.layout.radius.card,
								border: `1px solid ${theme.palette.divider}`,
								bgcolor: theme.palette.background.default,
							}}
						>
							<Stack spacing={2.5}>
								<TextField
									label="Name"
									required
									fullWidth
									autoComplete="name"
									inputRef={nameRef}
									value={form.name}
									onChange={handleChange('name')}
									onBlur={handleBlur('name')}
									error={Boolean(showError('name'))}
									helperText={showError('name')}
									disabled={status === 'submitting'}
								/>
								<TextField
									label="Work Email"
									type="email"
									required
									fullWidth
									autoComplete="email"
									inputRef={emailRef}
									value={form.email}
									onChange={handleChange('email')}
									onBlur={handleBlur('email')}
									error={Boolean(showError('email'))}
									helperText={showError('email')}
									disabled={status === 'submitting'}
								/>
								<TextField
									label="Company Name"
									fullWidth
									autoComplete="organization"
									helperText="Optional"
									value={form.company}
									onChange={handleChange('company')}
									disabled={status === 'submitting'}
								/>
								<TextField
									label="Message"
									required
									fullWidth
									multiline
									minRows={4}
									inputRef={messageRef}
									value={form.message}
									onChange={handleChange('message')}
									onBlur={handleBlur('message')}
									error={Boolean(showError('message'))}
									helperText={showError('message')}
									disabled={status === 'submitting'}
								/>

								{status === 'success' && (
									<Stack
										direction="row"
										spacing={1.25}
										alignItems="center"
										role="status"
										sx={{ p: 1.75, borderRadius: theme.layout.radius.card, bgcolor: alpha(theme.palette.success.main, 0.1) }}
									>
										<CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 20, flexShrink: 0 }} />
										<Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: theme.palette.text.primary }}>
											Thanks — we've got your message and will reply within one business day.
										</Typography>
									</Stack>
								)}
								{status === 'error' && (
									<Stack
										direction="row"
										spacing={1.25}
										alignItems="center"
										role="alert"
										sx={{ p: 1.75, borderRadius: theme.layout.radius.card, bgcolor: alpha(theme.palette.error.main, 0.1) }}
									>
										<ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 20, flexShrink: 0 }} />
										<Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: theme.palette.text.primary }}>
											Something went wrong sending that. Please try again, or email us directly at hello@gravit.taydens.com.
										</Typography>
									</Stack>
								)}

								<Button
									type="submit"
									size="large"
									variant="contained"
									disabled={status === 'submitting'}
									sx={{
										bgcolor: theme.palette.primary.main,
										color: '#ffffff',
										fontWeight: 700,
										fontSize: '1rem',
										py: 1.4,
										borderRadius: theme.layout.radius.button,
										'&:hover': { bgcolor: theme.palette.primary.dark },
									}}
								>
									{status === 'submitting' ? <CircularProgress size={22} sx={{ color: '#ffffff' }} /> : 'Send Message'}
								</Button>
							</Stack>
						</Box>
					</Reveal>
				</Box>
			</Container>
		</Box>
	);
};

export default ContactSection;
